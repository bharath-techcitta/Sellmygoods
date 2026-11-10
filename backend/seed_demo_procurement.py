"""Demo procurement catalogue + ready-to-start auctions for the two steel plants
(Vijayawada AP and Chityala, Hyderabad).

Creates (idempotently, keyed by SKU / auction title):
  * Categories + item master entries for the raw materials and the scrap streams
  * 1 reverse auction  - structural steel raw materials (11 lines, INR)   -> status "Scheduled"
  * 3 forward auctions - MS Heavy Melting / GI Sheeting / MS Boring scrap  -> status "Scheduled"

Nothing is started: use "Go live" in the admin Live Auctions page when you want to run one.

    python -m backend.seed_demo_procurement
"""
import datetime

from .database import SessionLocal
from .models import Auction, AuctionLineItem, Category, Item

RAW_CAT = ("CAT-STL", "Structural Steel — Raw Materials", "Angles, channels (ISMC) and beams (ISMB) as per IS 2062 E250A")
SCRAP_CAT = ("CAT-SCR", "Scrap Disposal", "Ferrous scrap generated at the Vijayawada and Chityala plants")

# (sku, name, description, uom, indicative ₹/MT, qty MT for the auction)
RAW_ITEMS = [
    ("STL-ANG-75X75X6", "Angle 75 x 75 x 6 mm", "Angles 75 x 75 x 6 mm as per IS 2062 E250A Grade", 56500, 40),
    ("STL-ANG-100X100X6", "Angle 100 x 100 x 6 mm", "Angles 100 x 100 x 6 mm as per IS 2062 E250A Grade", 57000, 30),
    ("STL-ANG-50X50X6", "Angle 50 x 50 x 6 mm", "Angles 50 x 50 x 6 mm as per IS 2062 E250A Grade", 56000, 25),
    ("STL-ISMC-75", "ISMC 75", "Indian Standard Medium Channel ISMC 75, IS 2062 E250A", 59500, 15),
    ("STL-ISMC-100", "ISMC 100", "Indian Standard Medium Channel ISMC 100, IS 2062 E250A", 59500, 20),
    ("STL-ISMC-150", "ISMC 150", "Indian Standard Medium Channel ISMC 150, IS 2062 E250A", 60000, 20),
    ("STL-ISMC-200", "ISMC 200", "Indian Standard Medium Channel ISMC 200, IS 2062 E250A", 60500, 25),
    ("STL-ISMC-250", "ISMC 250", "Indian Standard Medium Channel ISMC 250, IS 2062 E250A", 61000, 20),
    ("STL-ISMB-150", "ISMB 150", "Indian Standard Medium Beam ISMB 150, IS 2062 E250A", 60500, 20),
    ("STL-ISMB-200", "ISMB 200", "Indian Standard Medium Beam ISMB 200, IS 2062 E250A", 61000, 25),
    ("STL-ISMB-250", "ISMB 250", "Indian Standard Medium Beam ISMB 250, IS 2062 E250A", 61500, 30),
]

# (sku, name, description, ₹/MT starting price, qty MT, min raise ₹, location)
SCRAP_ITEMS = [
    ("SCR-MS-HMS", "MS Heavy Melting Scrap", "Mild steel heavy melting scrap (HMS)", 36000, 150, 10000, "Chityala plant yard, Hyderabad"),
    ("SCR-GI-SHEET", "GI Sheeting Scrap", "Galvanised iron sheeting scrap", 31000, 40, 5000, "Vijayawada plant yard, AP"),
    ("SCR-MS-BORING", "MS Boring Scrap", "Mild steel boring / turning scrap", 27000, 60, 5000, "Vijayawada plant yard, AP"),
]

FREIGHT = 45000.0   # fixed delivery to the two plants
GST = 18.0
NOW = datetime.datetime.utcnow()


def _category(db, code, name, desc):
    c = db.query(Category).filter(Category.code == code).first()
    if not c:
        c = Category(code=code, name=name, description=desc, is_active=True)
        db.add(c)
        db.flush()
    return c


def _next_numbers(db, count):
    prefix = f"AUC_{NOW.year}_"
    seq = 0
    for (n,) in db.query(Auction.auction_number).filter(Auction.auction_number.like(f"{prefix}%")).all():
        try:
            seq = max(seq, int(n.rsplit("_", 1)[1]))
        except ValueError:
            pass
    return [f"{prefix}{seq + i:03d}" for i in range(1, count + 1)]


def seed_demo_procurement() -> dict:
    db = SessionLocal()
    out = {"items_added": 0, "auctions_added": []}
    try:
        raw_cat = _category(db, *RAW_CAT)
        scrap_cat = _category(db, *SCRAP_CAT)

        for sku, name, desc, rate, _qty in RAW_ITEMS:
            if not db.query(Item).filter(Item.sku == sku).first():
                db.add(Item(sku=sku, name=name, description=desc, category_id=raw_cat.id, uom="MT",
                            unit_price=float(rate), currency="INR"))
                out["items_added"] += 1
        for sku, name, desc, rate, _q, _s, _loc in SCRAP_ITEMS:
            if not db.query(Item).filter(Item.sku == sku).first():
                db.add(Item(sku=sku, name=name, description=desc, category_id=scrap_cat.id, uom="MT",
                            unit_price=float(rate), currency="INR"))
                out["items_added"] += 1
        db.commit()

        numbers = iter(_next_numbers(db, 4))
        start = (NOW + datetime.timedelta(days=1)).replace(minute=0, second=0, microsecond=0)

        # ---- Reverse auction: raw materials -------------------------------------------------
        title = "Structural Steel Raw Materials — Angles, ISMC & ISMB (IS 2062 E250A) · Vijayawada & Chityala plants"
        if not db.query(Auction).filter(Auction.title == title).first():
            material = sum(q * r for *_h, r, q in RAW_ITEMS)
            reserve = round((material + FREIGHT) * (1 + GST / 100.0), 2)
            auc = Auction(
                auction_number=next(numbers), title=title, auction_type="Reverse Sourcing", status="Scheduled",
                pr_number="PR_00201", current_approver="Procurement Lead",
                start_time=start, end_time=start + datetime.timedelta(hours=2),
                reserve_price=reserve, min_decrement=10000.0, min_bid_improvement=10000.0,
                current_best_bid=reserve, best_bidder_id=None, total_bids_placed=0,
                freight_fixed=FREIGHT, tax_rate_pct=GST, currency="INR", visibility="own_rank_only",
                extensions_used=0, max_extensions=5,
            )
            db.add(auc)
            db.flush()
            for i, (sku, name, desc, rate, qty) in enumerate(RAW_ITEMS, start=1):
                db.add(AuctionLineItem(auction_id=auc.id, line_code=f"RM-{i:02d}", description=desc,
                                       quantity=float(qty), uom="MT", last_rate=float(rate)))
            out["auctions_added"].append((auc.auction_number, "Reverse", reserve))

        # ---- Forward auctions: scrap disposal ----------------------------------------------
        for n, (sku, name, desc, price, qty, step, loc) in enumerate(SCRAP_ITEMS, start=2):
            title = f"{name} — {qty} MT disposal · {loc}"
            existing = db.query(Auction).filter(Auction.title == title).first()
            if existing:
                # make older rows match: the sale value has no GST/freight, and the lot carries its item line
                existing.tax_rate_pct = 0.0
                existing.freight_fixed = 0.0
                if db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == existing.id).count() == 0:
                    db.add(AuctionLineItem(auction_id=existing.id, line_code=f"SC-{n - 1:02d}", description=desc,
                                           quantity=float(qty), uom="MT", last_rate=float(price)))
                continue
            reserve = float(price * qty)
            auc = Auction(
                auction_number=next(numbers), title=title, auction_type="Forward Disposal", status="Scheduled",
                pr_number=f"PR_0020{n}", current_approver="Disposal Officer",
                start_time=start, end_time=start + datetime.timedelta(hours=2),
                reserve_price=reserve, min_decrement=float(step), min_bid_improvement=float(step),
                current_best_bid=reserve, best_bidder_id=None, total_bids_placed=0,
                freight_fixed=0.0, tax_rate_pct=0.0, currency="INR", visibility="own_rank_only",
                extensions_used=0, max_extensions=5,
            )
            db.add(auc)
            db.flush()
            db.add(AuctionLineItem(auction_id=auc.id, line_code=f"SC-{n - 1:02d}", description=desc,
                                   quantity=float(qty), uom="MT", last_rate=float(price)))
            out["auctions_added"].append((auc.auction_number, "Forward", reserve))
        db.commit()
        return out
    finally:
        db.close()


if __name__ == "__main__":
    print(seed_demo_procurement())
