"""Demo catalogue + ready-to-start FORWARD DISPOSAL auctions for the two steel plants
(Vijayawada AP and Chityala, Hyderabad). Highest bid wins; every lot is created as "Scheduled"
so nothing runs until an admin clicks "Go live".

Idempotent - keyed by SKU / auction title:
    python -m backend.seed_demo_procurement
"""
import datetime

from .database import SessionLocal
from .models import Auction, AuctionLineItem, Category, Item

RAW_CAT = ("CAT-STL", "Structural Steel — Raw Materials", "Angles, channels (ISMC) and beams (ISMB) as per IS 2062 E250A")
SCRAP_CAT = ("CAT-SCR", "Scrap Disposal", "Ferrous scrap generated at the Vijayawada and Chityala plants")

# (sku, name, description, uom, indicative ₹/MT)
RAW_ITEMS = [
    ("STL-ANG-75X75X6", "Angle 75 x 75 x 6 mm", "Angles 75 x 75 x 6 mm as per IS 2062 E250A Grade", 56500),
    ("STL-ANG-100X100X6", "Angle 100 x 100 x 6 mm", "Angles 100 x 100 x 6 mm as per IS 2062 E250A Grade", 57000),
    ("STL-ANG-50X50X6", "Angle 50 x 50 x 6 mm", "Angles 50 x 50 x 6 mm as per IS 2062 E250A Grade", 56000),
    ("STL-ISMC-75", "ISMC 75", "Indian Standard Medium Channel ISMC 75, IS 2062 E250A", 59500),
    ("STL-ISMC-100", "ISMC 100", "Indian Standard Medium Channel ISMC 100, IS 2062 E250A", 59500),
    ("STL-ISMC-150", "ISMC 150", "Indian Standard Medium Channel ISMC 150, IS 2062 E250A", 60000),
    ("STL-ISMC-200", "ISMC 200", "Indian Standard Medium Channel ISMC 200, IS 2062 E250A", 60500),
    ("STL-ISMC-250", "ISMC 250", "Indian Standard Medium Channel ISMC 250, IS 2062 E250A", 61000),
    ("STL-ISMB-150", "ISMB 150", "Indian Standard Medium Beam ISMB 150, IS 2062 E250A", 60500),
    ("STL-ISMB-200", "ISMB 200", "Indian Standard Medium Beam ISMB 200, IS 2062 E250A", 61000),
    ("STL-ISMB-250", "ISMB 250", "Indian Standard Medium Beam ISMB 250, IS 2062 E250A", 61500),
]
RAW = {sku: (name, desc, rate) for sku, name, desc, rate in RAW_ITEMS}

# (sku, name, description, starting ₹/MT, qty MT, min raise ₹, location)
SCRAP_ITEMS = [
    ("SCR-MS-HMS", "MS Heavy Melting Scrap", "Mild steel heavy melting scrap (HMS)", 36000, 150, 10000, "Chityala plant yard, Hyderabad"),
    ("SCR-GI-SHEET", "GI Sheeting Scrap", "Galvanised iron sheeting scrap", 31000, 40, 5000, "Vijayawada plant yard, AP"),
    ("SCR-MS-BORING", "MS Boring Scrap", "Mild steel boring / turning scrap", 27000, 60, 5000, "Vijayawada plant yard, AP"),
]
SCRAP = {sku: (name, desc, rate) for sku, name, desc, rate, *_ in SCRAP_ITEMS}

V, C = "Vijayawada plant yard, AP", "Chityala plant yard, Hyderabad"

# Surplus stock for sale: (location, [(sku, qty MT, starting ₹/MT)]).  Starting rates sit a little below the
# purchase rates above (surplus / second sale).
FORWARD_LOTS = [
    (V, [("STL-ANG-75X75X6", 25, 52500)]),
    (C, [("STL-ANG-100X100X6", 18, 53000)]),
    (V, [("STL-ANG-50X50X6", 20, 52000)]),
    (C, [("STL-ISMC-75", 12, 55000), ("STL-ISMC-100", 15, 55000)]),
    (V, [("STL-ISMC-150", 14, 55500), ("STL-ISMC-200", 16, 56000)]),
    (C, [("STL-ISMC-250", 15, 56500)]),
    (V, [("STL-ISMB-150", 14, 56000), ("STL-ISMB-200", 18, 56500)]),
    (C, [("STL-ISMB-250", 22, 57000)]),
    (V, [("SCR-MS-HMS", 60, 36000), ("SCR-GI-SHEET", 20, 31000), ("SCR-MS-BORING", 30, 27000)]),
]

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


def _lookup(sku):
    return RAW.get(sku) or SCRAP.get(sku)


def _lot_title(location, parts):
    names = [_lookup(sku)[0] for sku, _q, _r in parts]
    total = sum(q for _s, q, _r in parts)
    label = names[0] if len(names) == 1 else (" & ".join(names) if len(names) == 2 else "Mixed scrap — " + ", ".join(names))
    return f"Surplus {label} — {total} MT disposal · {location}"


def _auction(number, title, reserve, step, start, pr_no):
    return Auction(
        auction_number=number, title=title, auction_type="Forward Disposal", status="Scheduled",
        pr_number=pr_no, current_approver="Disposal Officer",
        start_time=start, end_time=start + datetime.timedelta(hours=2),
        reserve_price=float(reserve), min_decrement=float(step), min_bid_improvement=float(step),
        current_best_bid=float(reserve), best_bidder_id=None, total_bids_placed=0,
        freight_fixed=0.0, tax_rate_pct=0.0, currency="INR", visibility="own_rank_only",
        extensions_used=0, max_extensions=5,
    )


def seed_demo_procurement() -> dict:
    db = SessionLocal()
    out = {"items_added": 0, "auctions_added": []}
    try:
        raw_cat = _category(db, *RAW_CAT)
        scrap_cat = _category(db, *SCRAP_CAT)
        for sku, name, desc, rate in RAW_ITEMS:
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

        # work out which lots are missing first, then number them
        base_start = (NOW + datetime.timedelta(days=1)).replace(hour=4, minute=30, second=0, microsecond=0)  # 10:00 IST
        pending = []   # (title, reserve, step, start, pr_no, [lines])

        # --- single-product scrap lots (AUC_2026_020/021/022 originally)
        for n, (sku, name, desc, price, qty, step, loc) in enumerate(SCRAP_ITEMS, start=2):
            title = f"{name} — {qty} MT disposal · {loc}"
            existing = db.query(Auction).filter(Auction.title == title).first()
            if existing:
                existing.tax_rate_pct = 0.0
                existing.freight_fixed = 0.0
                if db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == existing.id).count() == 0:
                    db.add(AuctionLineItem(auction_id=existing.id, line_code=f"SC-{n - 1:02d}", description=desc,
                                           quantity=float(qty), uom="MT", last_rate=float(price)))
                continue
            pending.append((title, price * qty, step, base_start, f"PR_0020{n}",
                            [(f"SC-{n - 1:02d}", desc, qty, price)]))

        # --- surplus raw-material lots + a mixed scrap lot
        for i, (loc, parts) in enumerate(FORWARD_LOTS):
            title = _lot_title(loc, parts)
            if db.query(Auction).filter(Auction.title == title).first():
                continue
            lines = [(f"ST-{k:02d}", _lookup(sku)[1], qty, rate) for k, (sku, qty, rate) in enumerate(parts, start=1)]
            reserve = sum(q * r for _c, _d, q, r in lines)
            step = 10000 if reserve >= 1000000 else 5000
            start = base_start + datetime.timedelta(minutes=30 * (i + 1))
            pending.append((title, reserve, step, start, f"PR_0021{i}", lines))

        for number, (title, reserve, step, start, pr_no, lines) in zip(_next_numbers(db, len(pending)), pending):
            auc = _auction(number, title, reserve, step, start, pr_no)
            db.add(auc)
            db.flush()
            for code, desc, qty, rate in lines:
                db.add(AuctionLineItem(auction_id=auc.id, line_code=code, description=desc,
                                       quantity=float(qty), uom="MT", last_rate=float(rate)))
            out["auctions_added"].append((number, round(reserve), title[:70]))
        db.commit()
        return out
    finally:
        db.close()


if __name__ == "__main__":
    r = seed_demo_procurement()
    print({"items_added": r["items_added"], "auctions_added": len(r["auctions_added"])})
    for a in r["auctions_added"]:
        print("  ", a)
