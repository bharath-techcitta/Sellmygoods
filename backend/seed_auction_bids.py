"""Demo bid history for a live reverse auction (default: AUC_2026_013, HMS scrap lot).

Adds 10 bids from 5 suppliers, each valid under the auction's own rules (a supplier's bids must keep
improving on their previous bid, line rates reproduce the evaluated total, rank is computed from every
supplier's best bid). Idempotent: receipts are keyed BID-<auction id>-D01..D10 and never duplicated.

    python -m backend.seed_auction_bids               # AUC_2026_013
    python -m backend.seed_auction_bids AUC_2026_014
"""
import datetime
import sys

from .database import SessionLocal
from .models import Auction, AuctionBidReceipt, AuctionLineItem, Supplier

# (supplier code, bid as a fraction of the starting price) - chronological, lowest evaluated total wins.
PATTERN = [
    ("SUP_00103", 0.975), ("SUP_00105", 0.968), ("SUP_00106", 0.960), ("SUP_00103", 0.950), ("SUP_00105", 0.944),
    ("SUP_00106", 0.938), ("SUP_00102", 0.930), ("SUP_00103", 0.926), ("SUP_00101", 0.920), ("SUP_00106", 0.915),
]


def seed_auction_bids(auction_number: str = "AUC_2026_013") -> dict:
    db = SessionLocal()
    try:
        auc = db.query(Auction).filter(Auction.auction_number == auction_number).first()
        if not auc:
            return {"error": f"{auction_number} not found"}
        if auc.auction_type != "Reverse Sourcing":
            return {"error": "Only reverse auctions are supported by this seed"}
        lines = db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == auc.id).order_by(AuctionLineItem.id).all()
        if not lines:
            return {"error": "Auction has no line items"}
        sup = {s.code: s.id for s in db.query(Supplier).all()}

        reserve = float(auc.reserve_price)
        freight = float(auc.freight_fixed or 0)
        tax = float(auc.tax_rate_pct if auc.tax_rate_pct is not None else 18.0)
        min_imp = float(auc.min_bid_improvement or auc.min_decrement or 0)
        base_material = sum(float(l.quantity) * float(l.last_rate) for l in lines)

        # Keep the demo auction open so the bids are visible/live
        now = datetime.datetime.utcnow()
        if not auc.end_time or auc.end_time < now + datetime.timedelta(hours=3):
            auc.end_time = now + datetime.timedelta(hours=3)
        if auc.status == "Live" and (not auc.start_time or auc.start_time > now):
            auc.start_time = now - datetime.timedelta(hours=1)

        existing = db.query(AuctionBidReceipt).filter(AuctionBidReceipt.auction_id == auc.id).all()
        best = {}  # supplier -> best (lowest) evaluated total so far
        for r in existing:
            best[r.supplier_id] = min(best.get(r.supplier_id, r.evaluated_total), r.evaluated_total)
        have = {r.receipt_id for r in existing}

        added = 0
        start = now - datetime.timedelta(minutes=50)
        for i, (code, frac) in enumerate(PATTERN, start=1):
            rid = f"BID-{auc.id}-D{i:02d}"
            sid = sup.get(code)
            total = round(reserve * frac, 2)
            if sid is None:
                continue
            # the bid is "chronologically" part of history even if it already exists: keep the ranking state in sync
            if rid in have:
                best[sid] = min(best.get(sid, total), total)
                continue
            if sid in best and total > best[sid] - min_imp:
                continue  # would break the supplier's own-improvement rule
            scale = ((total / (1 + tax / 100.0)) - freight) / base_material
            if scale <= 0:
                continue
            best[sid] = total
            rank = 1 + sum(1 for v in best.values() if v < total)
            db.add(AuctionBidReceipt(
                auction_id=auc.id, supplier_id=sid, receipt_id=rid, evaluated_total=total,
                rank_at_acceptance=rank, outcome="Accepted",
                line_rates=[{"line_code": l.line_code, "new_rate": round(float(l.last_rate) * scale, 2)} for l in lines],
                created_at=start + datetime.timedelta(minutes=5 * (i - 1)),
            ))
            added += 1
            auc.total_bids_placed = int(auc.total_bids_placed or 0) + 1

        if best:
            lead_sid = min(best, key=best.get)
            if best[lead_sid] < float(auc.current_best_bid or reserve):
                auc.current_best_bid = best[lead_sid]
                auc.best_bidder_id = lead_sid
        db.commit()
        return {"auction": auction_number, "bids_added": added, "total_receipts":
                db.query(AuctionBidReceipt).filter(AuctionBidReceipt.auction_id == auc.id).count(),
                "current_best_bid": auc.current_best_bid, "end_time": auc.end_time.isoformat() + "Z"}
    finally:
        db.close()


if __name__ == "__main__":
    print(seed_auction_bids(sys.argv[1] if len(sys.argv) > 1 else "AUC_2026_013"))
