import datetime
from .database import engine, Base, SessionLocal
from .models import (
    User, Category, Item, Supplier, SupplierContact, SupplierBank, SupplierDoc,
    Requisition, RequisitionLine, SourcingEvent, BidResponse, BidLine,
    PurchaseOrder, POLine, Invoice, Contract, Clause, Auction, Budget,
    ApprovalWorkflow, ApprovalTask
)
from .calculations import calculate_quote_line, calculate_composite_score

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Supplier).first():
        db.close()
        return

    print("Seeding SellMyGoods database...")

    # Users
    users = [
        User(email="marcus.vance@sellmygoods.com", full_name="Marcus Vance", role="procurement_buyer", portal="admin", avatar_initials="MV"),
        User(email="elena.rostova@precisioncomponents.com", full_name="Elena Rostova", role="supplier_user", portal="buyer", supplier_id=1, avatar_initials="ER"),
        User(email="sarah.jenkins@sellmygoods.com", full_name="Sarah Jenkins", role="requester", portal="admin", avatar_initials="SJ"),
        User(email="david.chen@sellmygoods.com", full_name="David Chen", role="finance_approver", portal="admin", avatar_initials="DC"),
        User(email="rachel.adams@sellmygoods.com", full_name="Rachel Adams", role="legal_reviewer", portal="admin", avatar_initials="RA"),
        User(email="admin@sellmygoods.com", full_name="System Administrator", role="tenant_admin", portal="admin", avatar_initials="SA"),
    ]
    db.add_all(users)
    db.commit()

    # Categories
    cat_it = Category(code="CAT-IT", name="IT & Telecom Equipment", description="Enterprise networking, computing and peripheral devices")
    cat_log = Category(code="CAT-LOG", name="Logistics & Warehousing", description="Global freight forwarding and regional fulfilment")
    cat_ind = Category(code="CAT-IND", name="Industrial Machinery & Tools", description="Plant tooling, valves, robotics, and replacement parts")
    cat_fac = Category(code="CAT-FAC", name="Facilities & Supplies", description="Corporate facilities, furniture, and maintenance")
    cat_srv = Category(code="CAT-SRV", name="Professional & Consulting Services", description="Advisory, audit, implementation, and engineering retainers")
    db.add_all([cat_it, cat_log, cat_ind, cat_fac, cat_srv])
    db.commit()

    # Subcategories
    cat_net = Category(code="CAT-IT-NET", name="Networking Hardware", parent_id=cat_it.id, description="Switches, routers, enterprise Wi-Fi")
    cat_comp = Category(code="CAT-IT-COMP", name="Computing & Laptops", parent_id=cat_it.id, description="Laptops, workstations, server blades")
    db.add_all([cat_net, cat_comp])
    db.commit()

    # Items
    item1 = Item(sku="IT-NET-012", name="Cisco Catalyst 9300 48-Port Switch", description="Enterprise layer-3 stackable managed gigabit switch with PoE+", category_id=cat_net.id, uom="Unit", unit_price=3200.0, currency="USD")
    item2 = Item(sku="IT-NB-001", name="Dell XPS Developer Workstation 32GB", description="16-inch high performance developer edition with 1TB NVMe SSD", category_id=cat_comp.id, uom="Unit", unit_price=1850.0, currency="USD")
    item3 = Item(sku="IND-VLV-22", name="Stainless Steel Industrial Flanged Ball Valve 2\"", description="High pressure 1000 WOG rating with PTFE seals", category_id=cat_ind.id, uom="Piece", unit_price=310.0, currency="USD")
    item4 = Item(sku="FAC-DS-04", name="Ergonomic Heavy-Duty Dual-Arm Monitor Mount", description="Gas spring counter-balanced desktop mount with cable channels", category_id=cat_fac.id, uom="Set", unit_price=145.0, currency="USD")
    db.add_all([item1, item2, item3, item4])
    db.commit()

    # Suppliers
    s1 = Supplier(
        code="SUP_00101",
        legal_name="Precision Components Ltd",
        trading_name="Precision Components",
        status="Active",
        type="Manufacturer",
        country="United States",
        email="contact@precisioncomponents.com",
        contact_no="+1 (555) 234-8900",
        created_by="Marcus Vance",
        current_approver="Finance Director",
        license_no="US-MFG-99214-B",
        place_of_issue="Delaware, USA",
        expiry_date="2029-12-31",
        legal_entity_type="Corporation",
        tax_identifier="US-EIN-88492019",
        incorporation_date="2014-06-15",
        annual_turnover=8500000.0,
        transaction_currency="USD",
        payment_terms="Net 30 Days",
        address="104 Industrial Parkway, Suite 400",
        city="Austin, TX",
        postal_code="78701",
        website="https://www.precisioncomponents.example.com",
        performance_score=94.5,
        on_time_delivery_rate=98.2,
        quality_acceptance_rate=99.1,
        risk_level="Low"
    )
    s2 = Supplier(
        code="SUP_00102",
        legal_name="Apex Global Logistics Inc",
        trading_name="Apex Global Logistics",
        status="Active",
        type="Service Provider",
        country="United States",
        email="ops@apexlogistics.example.com",
        contact_no="+1 (555) 871-3344",
        created_by="Sarah Jenkins",
        current_approver="Logistics Manager",
        license_no="DOT-FF-44019",
        place_of_issue="California, USA",
        expiry_date="2028-08-30",
        tax_identifier="US-EIN-77281099",
        performance_score=91.0,
        risk_level="Low"
    )
    s3 = Supplier(
        code="SUP_00103",
        legal_name="TechVibe Cloud Systems Corp",
        trading_name="TechVibe Solutions",
        status="Pending Approval",
        type="Distributor",
        country="Canada",
        email="partnerships@techvibe.example.ca",
        contact_no="+1 (416) 902-1188",
        created_by="System Invitation",
        current_approver="Compliance Reviewer",
        performance_score=87.5,
        risk_level="Medium"
    )
    s4 = Supplier(
        code="SUP_00104",
        legal_name="Nordic Paper & Pulp AB",
        trading_name="Nordic Pulp",
        status="More Info Required",
        type="Manufacturer",
        country="Sweden",
        email="nordic@pulp.example.se",
        contact_no="+46 8 123 4567",
        created_by="Marcus Vance",
        current_approver="Elena Rostova",
        risk_level="Low"
    )
    s5 = Supplier(
        code="SUP_00105",
        legal_name="Vertex Industrial Tools Inc",
        trading_name="Vertex Tools",
        status="Changes in Draft",
        type="Manufacturer",
        country="Germany",
        email="info@vertextools.example.de",
        contact_no="+49 30 998877",
        created_by="David Chen",
        current_approver="Senior Buyer",
        risk_level="Low"
    )
    s6 = Supplier(
        code="SUP_00106",
        legal_name="OmniSource Supplies Group",
        trading_name="OmniSource",
        status="Draft",
        type="Distributor",
        country="United Kingdom",
        email="sales@omnisource.example.co.uk",
        contact_no="+44 20 7946 0912",
        created_by="Sarah Jenkins",
        current_approver="None",
        risk_level="Medium"
    )
    s7 = Supplier(
        code="SUP_00107",
        legal_name="Zenith Automation & Robotics",
        trading_name="Zenith Robotics",
        status="Rejected",
        type="Manufacturer",
        country="Japan",
        email="contact@zenith-robotics.example.jp",
        contact_no="+81 3 5555 0143",
        created_by="Marcus Vance",
        current_approver="Executive Board",
        risk_level="High"
    )
    db.add_all([s1, s2, s3, s4, s5, s6, s7])
    db.commit()

    # Supplier Contacts & Banking & Docs for Precision Components
    c1 = SupplierContact(supplier_id=s1.id, name="Elena Rostova", designation="Director of Strategic Accounts", email="elena.rostova@precisioncomponents.com", mobile="+1 (555) 234-8901", is_primary=True, is_signatory=True)
    c2 = SupplierContact(supplier_id=s1.id, name="James Thorne", designation="Head of Engineering & QA", email="jthorne@precisioncomponents.com", mobile="+1 (555) 234-8905", is_primary=False, is_signatory=False)
    b1 = SupplierBank(supplier_id=s1.id, bank_name="JPMorgan Chase Bank, N.A.", account_holder="Precision Components Ltd", account_number_masked="••••••••9942", routing_swift="CHASUS33XXX", currency="USD", is_verified=True)
    d1 = SupplierDoc(supplier_id=s1.id, title="ISO 9001:2015 Quality Management Certificate", doc_type="Certificate", file_name="ISO_9001_Precision_2026.pdf", status="Verified")
    d2 = SupplierDoc(supplier_id=s1.id, title="Certificate of Incorporation & Good Standing", doc_type="License", file_name="Cert_Incorporation_DE.pdf", status="Verified")
    d3 = SupplierDoc(supplier_id=s1.id, title="W-9 Federal Tax Certification", doc_type="Tax", file_name="W9_Signed_2026.pdf", status="Verified")
    db.add_all([c1, c2, b1, d1, d2, d3])
    db.commit()

    # Purchase Requisitions
    pr1 = Requisition(
        pr_number="PR_00084",
        description="Enterprise Core Network Switch Upgrade for Dallas Logistics Datacenter",
        pr_type="Goods",
        status="Approved",
        requester_name="Sarah Jenkins",
        requester_email="sarah.jenkins@sellmygoods.com",
        buyer_name="Marcus Vance",
        department="Information Technology",
        business_entity="SellMyGoods Corp US",
        currency="USD",
        total_amount=32000.0,
        delivery_date="2026-11-20",
        destination="Central Logistics Hub, Dallas TX",
        is_budgeted=True,
        budget_allocated=50000.0,
        budget_available=32000.0,
        current_approver="Finance Director"
    )
    pr2 = Requisition(
        pr_number="PR_00085",
        description="High Pressure Industrial Ball Valves Replacement for Processing Unit 4",
        pr_type="Goods",
        status="Pending Approval",
        requester_name="Mike Alvarez",
        requester_email="mike.alvarez@sellmygoods.com",
        buyer_name="Marcus Vance",
        department="Plant Operations",
        business_entity="SellMyGoods Corp US",
        currency="USD",
        total_amount=15500.0,
        delivery_date="2026-12-05",
        destination="Plant Facility #2, Ohio",
        is_budgeted=True,
        budget_allocated=25000.0,
        budget_available=18000.0,
        current_approver="David Chen"
    )
    pr3 = Requisition(
        pr_number="PR_00086",
        description="Developer High Performance Workstations Q4 Batch",
        pr_type="Goods",
        status="Draft",
        requester_name="Sarah Jenkins",
        requester_email="sarah.jenkins@sellmygoods.com",
        buyer_name="Marcus Vance",
        department="Information Technology",
        business_entity="SellMyGoods Corp US",
        currency="USD",
        total_amount=18500.0,
        delivery_date="2026-12-15",
        destination="Headquarters, Austin TX",
        is_budgeted=True,
        budget_allocated=40000.0,
        budget_available=35000.0,
        current_approver="Marcus Vance"
    )
    db.add_all([pr1, pr2, pr3])
    db.commit()

    # Requisition Lines for PR_00084
    pr1_line1 = RequisitionLine(
        requisition_id=pr1.id,
        line_number=1,
        item_id=item1.id,
        description="Cisco Catalyst 9300 48-Port Switch",
        category="Networking Hardware",
        quantity=10.0,
        uom="Unit",
        unit_price=3200.0,
        amount=32000.0,
        status="Approved"
    )
    db.add(pr1_line1)
    db.commit()

    # Sourcing Event (RFQ) matching Screenshots 15, 16, 17, 24, 26
    now = datetime.datetime.utcnow()
    rfq1 = SourcingEvent(
        code="RFQ_2026_091",
        title="Procurement of Enterprise Managed Core Switches (Cisco Catalyst)",
        event_type="RFQ",
        status="Technical Review",
        stage="Technical Review",
        open_date=now - datetime.timedelta(days=7),
        close_date=now + datetime.timedelta(days=3),
        currency="USD",
        payment_terms="Net 30 Days",
        delivery_location="Central Logistics Hub, Dallas TX",
        buyer_name="Marcus Vance",
        requester_name="Sarah Jenkins",
        department="Information Technology",
        linked_pr_number="PR_00084",
        budget=60000.0,
        is_sealed=True
    )
    rfq2 = SourcingEvent(
        code="RFQ_2026_092",
        title="High Pressure Industrial Ball Valves Replacement",
        event_type="RFQ",
        status="Live",
        stage="Live",
        open_date=now - datetime.timedelta(days=1),
        close_date=now + datetime.timedelta(days=6),
        currency="USD",
        payment_terms="Net 30 Days",
        delivery_location="Plant Facility #2, Ohio",
        buyer_name="Marcus Vance",
        requester_name="Mike Alvarez",
        department="Plant Operations",
        linked_pr_number="PR_00085",
        budget=18000.0,
        is_sealed=True
    )
    rfp1 = SourcingEvent(
        code="RFP_2026_015",
        title="Global Logistics Freight Forwarding Master Lot",
        event_type="RFP",
        status="Awarded",
        stage="Awarded",
        open_date=now - datetime.timedelta(days=20),
        close_date=now - datetime.timedelta(days=5),
        currency="USD",
        payment_terms="Net 45 Days",
        delivery_location="Global Logistics Hubs",
        buyer_name="Marcus Vance",
        requester_name="Sarah Jenkins",
        department="Logistics",
        linked_pr_number="PR_00084",
        budget=120000.0,
        is_sealed=False
    )
    db.add_all([rfq1, rfq2, rfp1])
    db.commit()

    # Bid Response 1: Precision Components Ltd (matching calculation test case in Section I1!)
    # 10 units * 3,200 = 32,000 gross; 200 unit discount = 2,000 discount; taxable base 30,000; 20% tax = 6,000; net 36,000
    calc1 = calculate_quote_line(quantity=10, unit_price=3200.0, unit_discount=200.0, tax_rate=0.20, is_tax_inclusive=False)
    resp1 = BidResponse(
        event_id=rfq1.id,
        supplier_id=s1.id,
        response_code="RSP_091_PRECISION",
        status="Submitted",
        version=1,
        gross_amount=calc1["gross"],
        discount_amount=calc1["discount"],
        taxable_base=calc1["taxable_base"],
        tax_amount=calc1["tax"],
        freight_amount=0.0,
        net_quote=calc1["net"], # 36,000.00
        technical_score=92.0,
        commercial_score=88.0,
        total_score=calculate_composite_score(92.0, 88.0, 0.5, 0.5), # 90.0
        evaluator_remarks="Fully compliant with technical IEEE specs, provides 5-year hardware replacement SLA."
    )
    db.add(resp1)
    db.commit()

    line1 = BidLine(
        response_id=resp1.id,
        line_number=1,
        item_description="Cisco Catalyst 9300 48-Port Switch",
        quantity=10.0,
        uom="Unit",
        unit_price=3200.0,
        unit_discount=200.0,
        tax_rate=0.20,
        is_tax_inclusive=False,
        gross=calc1["gross"],
        discount=calc1["discount"],
        taxable_base=calc1["taxable_base"],
        tax=calc1["tax"],
        net=calc1["net"],
        promised_delivery_date="2026-11-20"
    )
    db.add(line1)

    # Bid Response 2: Apex Global Logistics
    calc2 = calculate_quote_line(quantity=10, unit_price=3450.0, unit_discount=150.0, tax_rate=0.20, is_tax_inclusive=False)
    resp2 = BidResponse(
        event_id=rfq1.id,
        supplier_id=s2.id,
        response_code="RSP_091_APEX",
        status="Submitted",
        version=1,
        gross_amount=calc2["gross"],
        discount_amount=calc2["discount"],
        taxable_base=calc2["taxable_base"],
        tax_amount=calc2["tax"],
        freight_amount=500.0,
        net_quote=calc2["net"] + 500.0,
        technical_score=85.0,
        commercial_score=82.0,
        total_score=calculate_composite_score(85.0, 82.0, 0.5, 0.5),
        evaluator_remarks="Standard 3-year warranty, slightly higher unit cost and delivery timeline."
    )
    db.add(resp2)
    db.commit()

    # Purchase Orders (Image 25)
    po1 = PurchaseOrder(
        po_number="PO_2026_0142",
        supplier_id=s1.id,
        source_pr="PR_00084",
        source_rfq="RFQ_2026_091",
        status="Issued",
        approval_status="Approved",
        receipt_status="Pending Receipt",
        invoice_status="Not Invoiced",
        payment_status="Unpaid",
        delivery_date="2026-11-20",
        buyer_name="Marcus Vance",
        entity_name="SellMyGoods Corp US",
        department="Information Technology",
        gross_amount=32000.0,
        tax_amount=6000.0,
        net_amount=36000.0
    )
    po2 = PurchaseOrder(
        po_number="PO_2026_0143",
        supplier_id=s2.id,
        source_pr="PR_00085",
        source_rfq="RFQ_2026_092",
        status="Approved",
        approval_status="Approved",
        receipt_status="Fully Received",
        invoice_status="Invoiced",
        payment_status="Paid",
        delivery_date="2026-12-05",
        buyer_name="Marcus Vance",
        entity_name="SellMyGoods Corp US",
        department="Logistics",
        gross_amount=22000.0,
        tax_amount=2500.0,
        net_amount=24500.0
    )
    po3 = PurchaseOrder(
        po_number="PO_2026_0144",
        supplier_id=s5.id,
        source_pr="PR_00086",
        source_rfq="RFQ_2026_090",
        status="Complete",
        approval_status="Approved",
        receipt_status="Fully Invoiced",
        invoice_status="Paid",
        payment_status="Paid",
        delivery_date="2026-10-15",
        buyer_name="Marcus Vance",
        entity_name="SellMyGoods Corp US",
        department="Plant Operations",
        gross_amount=11000.0,
        tax_amount=1800.0,
        net_amount=12800.0
    )
    db.add_all([po1, po2, po3])
    db.commit()

    poline1 = POLine(
        po_id=po1.id,
        line_number=1,
        description="Cisco Catalyst 9300 48-Port Switch",
        ordered_qty=10.0,
        received_qty=0.0,
        accepted_qty=0.0,
        rejected_qty=0.0,
        uom="Unit",
        unit_price=3000.0,
        net_amount=36000.0
    )
    db.add(poline1)
    db.commit()

    # Invoices (Section E14 & Appendix)
    inv1 = Invoice(
        invoice_number="INV_99214",
        po_id=po1.id,
        supplier_id=s1.id,
        invoice_date="2026-11-03",
        due_date="2026-12-03",
        status="Pending Approval",
        match_status="3-Way Matched",
        subtotal=30000.0,
        tax_amount=6000.0,
        total_amount=36000.0,
        paid_amount=0.0,
        currency="USD"
    )
    inv2 = Invoice(
        invoice_number="INV_99215",
        po_id=po2.id,
        supplier_id=s2.id,
        invoice_date="2026-10-28",
        due_date="2026-11-28",
        status="Verified",
        match_status="3-Way Matched",
        subtotal=22000.0,
        tax_amount=2500.0,
        total_amount=24500.0,
        paid_amount=24500.0,
        currency="USD"
    )
    inv3 = Invoice(
        invoice_number="INV_99216",
        po_id=po3.id,
        supplier_id=s5.id,
        invoice_date="2026-10-18",
        due_date="2026-11-18",
        status="Approved",
        match_status="3-Way Matched",
        subtotal=11000.0,
        tax_amount=1800.0,
        total_amount=12800.0,
        paid_amount=12800.0,
        currency="USD"
    )
    db.add_all([inv1, inv2, inv3])
    db.commit()

    # Contracts & Clauses (Image 29)
    clauses = [
        Clause(code="CLS-OPS-01", name="Force Majeure & Unforeseen Circumstances", clause_type="Operational", description="Defines performance suspension relief under severe geopolitical, weather, or regulatory disruption exceeding 14 calendar days."),
        Clause(code="CLS-CMP-02", name="Comprehensive Data Privacy & Security (GDPR/CCPA)", clause_type="Compliance", description="Binds supplier to rigorous encryption at rest and in transit, 72-hour breach notification, and strict data processing boundaries."),
        Clause(code="CLS-LEG-03", name="Mutual Non-Disclosure & Proprietary Rights", clause_type="Legal", description="Ensures absolute commercial secrecy of pricing, architecture diagrams, and internal roadmaps."),
        Clause(code="CLS-LEG-04", name="Limitation of Liability & Mutual Indemnification", clause_type="Legal", description="Caps aggregate direct damages at 2x annual contract fees while maintaining uncapped indemnity for IP infringement."),
        Clause(code="CLS-FIN-05", name="Payment Terms, Milestones & Audit Rights", clause_type="Financial", description="Standard Net 30 day settlement upon formal milestone sign-off, with annual non-intrusive accounting audit provisions."),
        Clause(code="CLS-OPS-06", name="Termination for Convenience & Transition Services", clause_type="Operational", description="Allows 30-day notice termination by the buyer with mandatory 60-day migration support at agreed rate cards.")
    ]
    db.add_all(clauses)
    db.commit()

    ctr1 = Contract(
        contract_number="CTR_2026_004",
        title="Enterprise Master IT Equipment & Maintenance Agreement",
        supplier_id=s1.id,
        status="Active",
        contract_type="Master Services Agreement",
        start_date="2026-01-01",
        end_date="2028-12-31",
        total_value=250000.0,
        currency="USD",
        owner_name="Rachel Adams"
    )
    ctr2 = Contract(
        contract_number="CTR_2026_005",
        title="Global Express Freight & Regional Fulfilment SLA",
        supplier_id=s2.id,
        status="Active",
        contract_type="Logistics Framework Agreement",
        start_date="2026-02-01",
        end_date="2027-01-31",
        total_value=180000.0,
        currency="USD",
        owner_name="Marcus Vance"
    )
    ctr3 = Contract(
        contract_number="CTR_2026_006",
        title="Plant Tooling & Mechanical Maintenance Master Agreement",
        supplier_id=s5.id,
        status="Draft",
        contract_type="Maintenance Service Agreement",
        start_date="2026-12-01",
        end_date="2027-11-30",
        total_value=95000.0,
        currency="USD",
        owner_name="Rachel Adams"
    )
    db.add_all([ctr1, ctr2, ctr3])

    # Auctions (Image 14)
    auc1 = Auction(
        auction_number="AUC_2026_011",
        title="Surplus Automated Factory Machining Center & Robotic Arms",
        auction_type="Forward Disposal",
        status="Live",
        pr_number="PR_00078",
        current_approver="Disposal Officer",
        start_time=now - datetime.timedelta(hours=2),
        end_time=now + datetime.timedelta(hours=4),
        reserve_price=45000.0,
        min_decrement=500.0,
        current_best_bid=52000.0,
        best_bidder_id=s5.id,
        total_bids_placed=18
    )
    auc2 = Auction(
        auction_number="AUC_2026_012",
        title="Bulk Packaging Cardboard Corrugated Boxes Q1 Lot",
        auction_type="Reverse Sourcing",
        status="Scheduled",
        pr_number="PR_00080",
        current_approver="Marcus Vance",
        start_time=now + datetime.timedelta(days=2),
        end_time=now + datetime.timedelta(days=3),
        reserve_price=28000.0,
        min_decrement=200.0,
        current_best_bid=28000.0,
        best_bidder_id=None,
        total_bids_placed=0
    )
    db.add_all([auc1, auc2])

    # Budgets (Image 1 & Section E16)
    b_it = Budget(fiscal_period="FY 2026-2027", department="Information Technology", cost_centre="CC-1020-IT", approved_budget=350000.0, adjustments=0.0, pr_reserved=32000.0, po_committed=85000.0, invoiced_actuals=64000.0, available_balance=169000.0)
    b_ops = Budget(fiscal_period="FY 2026-2027", department="Plant Operations", cost_centre="CC-2040-OPS", approved_budget=500000.0, adjustments=15000.0, pr_reserved=15500.0, po_committed=140000.0, invoiced_actuals=120000.0, available_balance=239500.0)
    b_fac = Budget(fiscal_period="FY 2026-2027", department="Facilities & Admin", cost_centre="CC-3010-FAC", approved_budget=180000.0, adjustments=0.0, pr_reserved=8000.0, po_committed=42000.0, invoiced_actuals=35000.0, available_balance=95000.0)
    db.add_all([b_it, b_ops, b_fac])

    # Workflows (Image 10)
    wf_pr = ApprovalWorkflow(
        module="Purchase Request",
        name="Standard Tiered PR Approval Workflow",
        is_active=True,
        steps_count=3,
        definition=[
            {"step": 1, "title": "Department Head Review", "approver_role": "Department Head", "sla_hours": 24, "condition": "Amount > $0"},
            {"step": 2, "title": "Finance Budget Check & Allocation", "approver_role": "Finance Controller", "sla_hours": 48, "condition": "Amount >= $10,000"},
            {"step": 3, "title": "CFO / Executive Sign-off", "approver_role": "CFO", "sla_hours": 72, "condition": "Amount >= $50,000"}
        ]
    )
    wf_sup = ApprovalWorkflow(
        module="Supplier Registration",
        name="Supplier Onboarding Compliance Workflow",
        is_active=True,
        steps_count=2,
        definition=[
            {"step": 1, "title": "Document & Tax ID Review", "approver_role": "Compliance Reviewer", "sla_hours": 48, "condition": "All Registrations"},
            {"step": 2, "title": "Bank Account Verification & Master Sign-off", "approver_role": "Treasury Officer", "sla_hours": 48, "condition": "Mandatory before PO"}
        ]
    )
    db.add_all([wf_pr, wf_sup])

    # Approval Tasks (Image 1 Dashboard Pending Approvals)
    tasks = [
        ApprovalTask(module="Supplier Registration", record_id=s3.id, record_code="SUP_00103", title="Review Onboarding: TechVibe Cloud Systems Corp", requested_by="System Invitation", assignee_role="Compliance Reviewer", amount=None, priority="High", due_date="2026-11-05"),
        ApprovalTask(module="Purchase Request", record_id=pr2.id, record_code="PR_00085", title="Approve PR: High Pressure Ball Valves", requested_by="Mike Alvarez", assignee_role="Finance Controller", amount=15500.0, priority="Medium", due_date="2026-11-06"),
        ApprovalTask(module="Invoice", record_id=inv1.id, record_code="INV_99214", title="3-Way Matched Invoice Review: Precision Components Ltd", requested_by="Accounts Payable", assignee_role="AP Lead", amount=36000.0, priority="Urgent", due_date="2026-11-04"),
        ApprovalTask(module="Bid Award", record_id=rfq1.id, record_code="RFQ_2026_091", title="Award Evaluation & Commercial Recommendation", requested_by="Marcus Vance", assignee_role="Procurement Lead", amount=36000.0, priority="High", due_date="2026-11-07")
    ]
    db.add_all(tasks)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
