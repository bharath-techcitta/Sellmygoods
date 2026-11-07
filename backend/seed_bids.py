"""Demo bid data for Bids & Sourcing (sourcing events + supplier bid responses).

Idempotent: every row is keyed by its unique code, so re-running never duplicates anything.
Run from the project root:   python -m backend.seed_bids
"""
import datetime

from .database import SessionLocal
from .models import BidLine, BidResponse, SourcingEvent, Supplier
from .calculations import calculate_quote_line

NOW = datetime.datetime.utcnow()

# New events (existing RFQ_2026_091 / RFQ_2026_092 / RFP_2026_015 are kept as they are)
NEW_EVENTS = [
    dict(code="RFQ_2026_093", title="Industrial Lubricants & Hydraulic Fluids — Annual Supply", event_type="RFQ",
         status="Published", stage="Published", open_date=NOW - datetime.timedelta(days=2),
         close_date=NOW + datetime.timedelta(days=5), currency="USD", budget=42000.0,
         department="Plant Operations", requester_name="Mike Alvarez", linked_pr_number="PR_00085"),
    dict(code="RFQ_2026_094", title="Ergonomic Office Furniture — Head Office Refit", event_type="RFQ",
         status="Commercial Review", stage="Commercial Review", open_date=NOW - datetime.timedelta(days=14),
         close_date=NOW - datetime.timedelta(days=3), currency="USD", budget=26000.0,
         department="Facilities", requester_name="Priya Nair", linked_pr_number=None),
    dict(code="RFP_2026_016", title="Managed Cloud Hosting & Disaster Recovery Services", event_type="RFP",
         status="Technical Review", stage="Technical Review", open_date=NOW - datetime.timedelta(days=10),
         close_date=NOW - datetime.timedelta(days=1), currency="USD", budget=95000.0,
         department="Information Technology", requester_name="Sarah Jenkins", linked_pr_number=None),
]

# (event code, supplier code, status, tech, comm, freight, remarks, [(desc, qty, uom, price, discount, tax, delivery)])
BIDS = [
    # RFQ_2026_091 — Cisco switches (already has Precision + Apex)
    ("RFQ_2026_091", "SUP_00103", "Submitted", 88.0, 79.0, 900.0, "Meets spec; longer lead time on optics.",
     [("Cisco Catalyst 9300 48-Port Switch", 10, "Unit", 3150, 150, 0.20, "2026-11-28")]),
    ("RFQ_2026_091", "SUP_00105", "Submitted", 81.0, 90.0, 750.0, "Lowest price, partial support SLA.",
     [("Cisco Catalyst 9300 48-Port Switch", 10, "Unit", 2980, 100, 0.20, "2026-12-02")]),
    # RFQ_2026_092 — ball valves (Live)
    ("RFQ_2026_092", "SUP_00105", "Submitted", 90.0, 86.0, 420.0, "ASME certified, stock available.",
     [("High Pressure Ball Valve 4in Class 600", 12, "Unit", 1180, 40, 0.18, "2026-12-01"),
      ("Gasket & Fastener Kit", 12, "Kit", 95, 0, 0.18, "2026-12-01")]),
    ("RFQ_2026_092", "SUP_00101", "Submitted", 93.0, 80.0, 380.0, "Premium alloy; 2-year warranty.",
     [("High Pressure Ball Valve 4in Class 600", 12, "Unit", 1260, 60, 0.18, "2026-12-03"),
      ("Gasket & Fastener Kit", 12, "Kit", 105, 5, 0.18, "2026-12-03")]),
    ("RFQ_2026_092", "SUP_00102", "Draft", 0.0, 0.0, 450.0, "Draft — pricing pending approval.",
     [("High Pressure Ball Valve 4in Class 600", 12, "Unit", 1210, 0, 0.18, "2026-12-05")]),
    # RFP_2026_015 — freight master lot (Awarded)
    ("RFP_2026_015", "SUP_00102", "Awarded", 94.0, 88.0, 0.0, "Best overall coverage and transit times.",
     [("Domestic FTL freight — per lane", 60, "Lane", 1450, 50, 0.0, "2026-10-15"),
      ("International air freight — per kg block", 40, "Block", 880, 20, 0.0, "2026-10-15")]),
    ("RFP_2026_015", "SUP_00101", "Rejected", 82.0, 74.0, 0.0, "Limited international network.",
     [("Domestic FTL freight — per lane", 60, "Lane", 1520, 0, 0.0, "2026-10-20"),
      ("International air freight — per kg block", 40, "Block", 940, 0, 0.0, "2026-10-20")]),
    ("RFP_2026_015", "SUP_00105", "Rejected", 78.0, 83.0, 0.0, "Lower price but weak SLA.",
     [("Domestic FTL freight — per lane", 60, "Lane", 1400, 0, 0.0, "2026-10-25"),
      ("International air freight — per kg block", 40, "Block", 910, 0, 0.0, "2026-10-25")]),
    # RFQ_2026_093 — lubricants (Published, early bids)
    ("RFQ_2026_093", "SUP_00105", "Submitted", 0.0, 0.0, 300.0, "Bulk tote pricing, 12-month hold.",
     [("Synthetic Hydraulic Fluid ISO 46 — tote", 80, "Tote", 215, 10, 0.18, "2026-12-10"),
      ("Food-grade Compressor Oil — 208L drum", 60, "Drum", 190, 5, 0.18, "2026-12-10")]),
    ("RFQ_2026_093", "SUP_00102", "Submitted", 0.0, 0.0, 260.0, "Includes on-site delivery scheduling.",
     [("Synthetic Hydraulic Fluid ISO 46 — tote", 80, "Tote", 225, 20, 0.18, "2026-12-08"),
      ("Food-grade Compressor Oil — 208L drum", 60, "Drum", 185, 0, 0.18, "2026-12-08")]),
    # RFQ_2026_094 — furniture (Commercial Review)
    ("RFQ_2026_094", "SUP_00101", "Under Evaluation", 90.0, 85.0, 600.0, "Ergonomic certification attached.",
     [("Ergonomic Task Chair", 80, "Unit", 185, 10, 0.18, "2026-11-30"),
      ("Height-adjustable Desk", 40, "Unit", 320, 15, 0.18, "2026-11-30")]),
    ("RFQ_2026_094", "SUP_00105", "Under Evaluation", 84.0, 92.0, 550.0, "Competitive price; standard warranty.",
     [("Ergonomic Task Chair", 80, "Unit", 170, 5, 0.18, "2026-12-05"),
      ("Height-adjustable Desk", 40, "Unit", 305, 10, 0.18, "2026-12-05")]),
    ("RFQ_2026_094", "SUP_00102", "Under Evaluation", 79.0, 78.0, 650.0, "Delivery in two tranches.",
     [("Ergonomic Task Chair", 80, "Unit", 199, 0, 0.18, "2026-12-12"),
      ("Height-adjustable Desk", 40, "Unit", 335, 0, 0.18, "2026-12-12")]),
    # RFP_2026_016 — cloud hosting (Technical Review)
    ("RFP_2026_016", "SUP_00103", "Under Evaluation", 91.0, 82.0, 0.0, "Tier-3 DC, 99.99% SLA, 4h RTO.",
     [("Managed hosting — monthly (24 months)", 24, "Month", 2650, 100, 0.0, "2027-01-15"),
      ("Disaster recovery replication — monthly", 24, "Month", 1150, 0, 0.0, "2027-01-15")]),
    ("RFP_2026_016", "SUP_00101", "Under Evaluation", 76.0, 91.0, 0.0, "Lower price; RTO 12h.",
     [("Managed hosting — monthly (24 months)", 24, "Month", 2400, 0, 0.0, "2027-02-01"),
      ("Disaster recovery replication — monthly", 24, "Month", 1000, 0, 0.0, "2027-02-01")]),
]


def _round(v):
    return round(float(v), 2)


def seed_bids() -> dict:
    db = SessionLocal()
    stats = {"events_added": 0, "responses_added": 0, "responses_skipped": 0}
    try:
        for ev in NEW_EVENTS:
            if not db.query(SourcingEvent).filter(SourcingEvent.code == ev["code"]).first():
                db.add(SourcingEvent(**ev))
                stats["events_added"] += 1
        db.commit()

        events = {e.code: e for e in db.query(SourcingEvent).all()}
        suppliers = {s.code: s for s in db.query(Supplier).all()}

        for ev_code, sup_code, status, tech, comm, freight, remarks, lines in BIDS:
            ev, sup = events.get(ev_code), suppliers.get(sup_code)
            if not ev or not sup:
                continue
            code = f"RSP_{ev_code.split('_', 1)[1]}_{sup_code[-3:]}"
            if db.query(BidResponse).filter(BidResponse.response_code == code).first():
                stats["responses_skipped"] += 1
                continue

            calcs = [calculate_quote_line(q, p, d, t) for (_, q, _, p, d, t, _) in lines]
            gross = sum(c["gross"] for c in calcs)
            discount = sum(c["discount"] for c in calcs)
            base = sum(c["taxable_base"] for c in calcs)
            tax = sum(c["tax"] for c in calcs)
            net = _round(base + tax + freight)
            total = _round(tech * 0.6 + comm * 0.4)

            resp = BidResponse(
                event_id=ev.id, supplier_id=sup.id, response_code=code, status=status, version=1,
                submission_date=(ev.open_date or NOW) + datetime.timedelta(days=1, hours=len(code) % 7),
                gross_amount=_round(gross), discount_amount=_round(discount), taxable_base=_round(base),
                tax_amount=_round(tax), freight_amount=_round(freight), net_quote=net,
                technical_score=tech, commercial_score=comm, total_score=total, evaluator_remarks=remarks,
            )
            db.add(resp)
            db.flush()
            for i, ((desc, q, uom, p, d, t, delivery), c) in enumerate(zip(lines, calcs), start=1):
                db.add(BidLine(
                    response_id=resp.id, line_number=i, item_description=desc, quantity=q, uom=uom,
                    unit_price=p, unit_discount=d, tax_rate=t, is_tax_inclusive=False,
                    gross=c["gross"], discount=c["discount"], taxable_base=c["taxable_base"],
                    tax=c["tax"], net=c["net"], promised_delivery_date=delivery,
                ))
            stats["responses_added"] += 1

            # Keep the awarded event consistent with its winning response
            if ev_code == "RFP_2026_015" and status == "Awarded":
                ev.winning_supplier_id = sup.id
                ev.award_status = "Awarded"
        db.commit()
        return stats
    finally:
        db.close()


if __name__ == "__main__":
    print(seed_bids())
