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
]

# (supplier code, name, designation, email, mobile)
CONTACTS = [
    ("SUP_00101", "Elena Rostova", "Sales Director", "elena.rostova@precisioncomponents.com", "+1 (555) 201-1100"),
    ("SUP_00102", "Daniel Brooks", "Account Manager", "daniel.brooks@apexlogistics.example.com", "+1 (555) 871-3345"),
    ("SUP_00108", "Ravi Teja", "Business Head", "ravi.teja@srilakshmisteels.example.com", "+91 98480 12345"),
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
