"""Demo supplier logins: makes sure there are several ACTIVE suppliers (each with a named contact) that can
bid from the supplier ("Buyer Portal") side.

Idempotent - keyed by supplier code / contact email. Called at startup by seed_database(), or run:
    python -m backend.seed_suppliers
"""
import datetime

from .database import SessionLocal
from .models import Supplier, SupplierContact

# New supplier added for the steel demo (Vijayawada, AP)
NEW_SUPPLIERS = [
    dict(
        code="SUP_00108", legal_name="Sri Lakshmi Steels Pvt Ltd", trading_name="Sri Lakshmi Steels",
        status="Active", type="Manufacturer", country="India", email="sales@srilakshmisteels.example.com",
        contact_no="+91 98480 12345", created_by="Procurement Team", current_approver="Finance Reviewer",
        legal_entity_type="Private Limited", tax_identifier="37AABCS1234F1Z5", transaction_currency="INR",
        payment_terms="Net 30 Days", address="Autonagar Industrial Estate", city="Vijayawada",
        postal_code="520007", website="https://srilakshmisteels.example.com", annual_turnover=250000000.0,
        performance_score=92.0, on_time_delivery_rate=96.5, quality_acceptance_rate=98.4, risk_level="Low",
    ),
    # Extra bidding parties for the scrap-sale demo (they bid as BUYERS on the company's disposal auctions)
    dict(
        code="SUP_00109", legal_name="Krishna Metal Recyclers Pvt Ltd", trading_name="Krishna Metal Recyclers",
        status="Active", type="Scrap Buyer", country="India", email="purchase@krishnametals.example.com",
        contact_no="+91 99890 22110", created_by="Procurement Team", current_approver="Finance Reviewer",
        legal_entity_type="Private Limited", tax_identifier="37AAECK5678L1Z2", transaction_currency="INR",
        payment_terms="Advance / 100% before lifting", address="Gollapudi Industrial Area", city="Vijayawada",
        postal_code="521225", website="https://krishnametals.example.com", annual_turnover=90000000.0,
        performance_score=90.0, on_time_delivery_rate=95.0, quality_acceptance_rate=97.0, risk_level="Low",
    ),
    dict(
        code="SUP_00110", legal_name="Deccan Ferro Traders LLP", trading_name="Deccan Ferro Traders",
        status="Active", type="Scrap Buyer", country="India", email="trade@deccanferro.example.com",
        contact_no="+91 98660 44556", created_by="Procurement Team", current_approver="Finance Reviewer",
        legal_entity_type="LLP", tax_identifier="36AAFFD9012M1Z8", transaction_currency="INR",
        payment_terms="Advance / 100% before lifting", address="Medchal Industrial Park", city="Hyderabad",
        postal_code="501401", website="https://deccanferro.example.com", annual_turnover=140000000.0,
        performance_score=91.0, on_time_delivery_rate=96.0, quality_acceptance_rate=97.5, risk_level="Low",
    ),
    dict(
        code="SUP_00111", legal_name="Godavari Steel Re-rollers Ltd", trading_name="Godavari Re-rollers",
        status="Active", type="Scrap Buyer", country="India", email="scrap@godavarirerollers.example.com",
        contact_no="+91 97010 77889", created_by="Procurement Team", current_approver="Finance Reviewer",
        legal_entity_type="Public Limited", tax_identifier="37AABCG3456P1Z1", transaction_currency="INR",
        payment_terms="Advance / 100% before lifting", address="Kakinada Industrial Estate", city="Kakinada",
        postal_code="533003", website="https://godavarirerollers.example.com", annual_turnover=320000000.0,
        performance_score=93.0, on_time_delivery_rate=97.0, quality_acceptance_rate=98.0, risk_level="Low",
    ),
]

# (supplier code, name, designation, email, mobile)
CONTACTS = [
    ("SUP_00101", "Elena Rostova", "Sales Director", "elena.rostova@precisioncomponents.com", "+1 (555) 201-1100"),
    ("SUP_00102", "Daniel Brooks", "Account Manager", "daniel.brooks@apexlogistics.example.com", "+1 (555) 871-3345"),
    ("SUP_00108", "Ravi Teja", "Business Head", "ravi.teja@srilakshmisteels.example.com", "+91 98480 12345"),
    ("SUP_00109", "Suresh Kumar", "Purchase Manager", "suresh.kumar@krishnametals.example.com", "+91 99890 22110"),
    ("SUP_00110", "Anitha Reddy", "Head of Trading", "anitha.reddy@deccanferro.example.com", "+91 98660 44556"),
    ("SUP_00111", "Mohan Rao", "Procurement Head", "mohan.rao@godavarirerollers.example.com", "+91 97010 77889"),
]


def ensure_demo_suppliers(db) -> dict:
    added_s = added_c = 0
    for row in NEW_SUPPLIERS:
        if not db.query(Supplier).filter(Supplier.code == row["code"]).first():
            db.add(Supplier(**row, registered_at=datetime.datetime.utcnow()))
            added_s += 1
    db.flush()
    by_code = {s.code: s for s in db.query(Supplier).all()}
    for code, name, desig, email, mobile in CONTACTS:
        sup = by_code.get(code)
        if not sup:
            continue
        if db.query(SupplierContact).filter(SupplierContact.supplier_id == sup.id).count() == 0:
            db.add(SupplierContact(supplier_id=sup.id, name=name, designation=desig, email=email,
                                   mobile=mobile, is_primary=True, is_signatory=True))
            added_c += 1
    db.commit()
    return {"suppliers_added": added_s, "contacts_added": added_c}


if __name__ == "__main__":
    s = SessionLocal()
    try:
        print(ensure_demo_suppliers(s))
    finally:
        s.close()
