"""
SellMyGoods Direct Function Verification Suite
Directly tests calculations, database models, and FastAPI route handlers.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.database import SessionLocal
from backend.seed import seed_database
from backend.calculations import calculate_quote_line, calculate_composite_score, calculate_budget_balance
from backend.main import (
    get_current_user, switch_role, get_dashboard_metrics, get_suppliers,
    get_sourcing_event_detail, get_bid_comparison, award_bid,
    get_purchase_orders, get_invoices, get_budgets, get_clauses,
    RoleSwitchRequest, AwardBidRequest
)

def run_tests():
    print("Running SellMyGoods Verification Tests...\n")
    
    # 1. Test Financial Formula (Section I1 of Build Spec)
    calc = calculate_quote_line(quantity=10, unit_price=3200.0, unit_discount=200.0, tax_rate=0.20, is_tax_inclusive=False)
    assert calc["gross"] == 32000.0
    assert calc["discount"] == 2000.0
    assert calc["taxable_base"] == 30000.0
    assert calc["tax"] == 6000.0
    assert calc["net"] == 36000.0
    print("[OK] [TEST 1 PASS] Section I1 Financial Formula: 10 x 3,200 - 2,000 + 6,000 = $36,000.00 Net verified.")

    # 2. Test Composite Scoring (Section I2)
    score = calculate_composite_score(92.0, 88.0, 0.5, 0.5)
    assert score == 90.0
    print("[OK] [TEST 2 PASS] Section I2 Composite Scoring: (92*0.5 + 88*0.5) = 90.0 pts verified.")

    # 3. Test Budget Headroom (Section I3)
    avail = calculate_budget_balance(approved_budget=350000.0, adjustments=0.0, pr_reserved=32000.0, po_committed=85000.0, invoiced_actuals=64000.0)
    assert avail == 169000.0
    print("[OK] [TEST 3 PASS] Section I3 Budget Headroom: $350k - $32k - $85k - $64k = $169,000.00 verified.")

    # 4. Initialize Database
    seed_database()
    db = SessionLocal()

    # 5. Auth / Me
    me = get_current_user()
    assert me["user"]["full_name"] == "Marcus Vance"
    print("[OK] [TEST 4 PASS] get_current_user() returned Procurement Buyer.")

    # 6. Switch Role to Supplier
    sw = switch_role(RoleSwitchRequest(role="supplier_user", portal="buyer", supplier_id=1))
    assert sw["user"]["portal"] == "buyer"
    assert sw["user"]["full_name"] == "Elena Rostova"
    print("[OK] [TEST 5 PASS] switch_role() switched to Buyer Portal (Elena Rostova - Precision Components).")

    # Switch back to admin
    switch_role(RoleSwitchRequest(role="procurement_buyer", portal="admin", supplier_id=1))

    # 7. Dashboard Metrics
    metrics = get_dashboard_metrics(db)
    assert metrics["top_metrics"]["active_org_users"] == 842
    print("[OK] [TEST 6 PASS] get_dashboard_metrics() returned 842 active org users.")

    # 8. Suppliers
    sups = get_suppliers(status="Total", search=None, db=db)
    assert len(sups["items"]) >= 7
    print(f"[OK] [TEST 7 PASS] get_suppliers() returned {len(sups['items'])} vendors.")

    # 9. Sourcing & Bid Comparison Matrix (Section E10 & Images 15, 16)
    comp = get_bid_comparison(1, db=db)
    assert comp["event_code"] == "RFQ_2026_091"
    assert comp["suppliers"][0]["net_quote"] == 36000.0
    assert comp["suppliers"][0]["total_score"] == 90.0
    print("[OK] [TEST 8 PASS] get_bid_comparison() verified (Precision Components Net Quote: $36,000.00).")

    # 10. Purchase Orders
    pos = get_purchase_orders(db=db)
    assert len(pos) >= 1
    print(f"[OK] [TEST 9 PASS] get_purchase_orders() returned {len(pos)} issued orders.")

    # 11. Invoices
    invs = get_invoices(db=db)
    assert len(invs) >= 1
    print(f"[OK] [TEST 10 PASS] get_invoices() returned {len(invs)} 3-way matched invoices.")

    # 12. Budgets & Clauses
    bgs = get_budgets(db=db)
    assert len(bgs) >= 3
    cls = get_clauses(clause_type="All", db=db)
    assert len(cls) >= 6
    print(f"[OK] [TEST 11 PASS] get_budgets() ({len(bgs)} budgets) and get_clauses() ({len(cls)} clauses) verified.")

    db.close()
    print("\n=======================================================")
    print("  ALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!       ")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
