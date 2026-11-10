import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    role = Column(String, default="procurement_buyer") # internal_user, procurement_buyer, supplier_user, tenant_admin, finance_approver
    portal = Column(String, default="admin") # "admin" or "buyer"
    supplier_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    avatar_initials = Column(String, default="SM")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    uom = Column(String, default="Unit")
    unit_price = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    preferred_supplier_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    legal_name = Column(String)
    trading_name = Column(String)
    status = Column(String, default="Pending Approval") # Draft, Pending Approval, Active, More Info Required, Pending + Info, Changes in Draft, Rejected
    type = Column(String, default="Manufacturer") # Manufacturer, Distributor, Service Provider
    country = Column(String, default="United States")
    email = Column(String, index=True)
    contact_no = Column(String)
    created_by = Column(String, default="System")
    current_approver = Column(String, default="Finance Reviewer")
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Detailed fields from screenshots
    license_no = Column(String, nullable=True)
    place_of_issue = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    legal_entity_type = Column(String, default="Corporation")
    tax_identifier = Column(String, nullable=True) # PAN / Tax ID / GSTIN
    incorporation_date = Column(String, nullable=True)
    annual_turnover = Column(Float, default=1000000.0)
    transaction_currency = Column(String, default="INR")
    working_hours = Column(String, default="Mon-Fri 09:00 - 18:00")
    payment_terms = Column(String, default="Net 30 Days")
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Scoring & Performance
    performance_score = Column(Float, default=94.5)
    on_time_delivery_rate = Column(Float, default=98.2)
    quality_acceptance_rate = Column(Float, default=99.0)
    risk_level = Column(String, default="Low")

class SupplierContact(Base):
    __tablename__ = "supplier_contacts"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    name = Column(String)
    designation = Column(String)
    email = Column(String)
    mobile = Column(String)
    is_primary = Column(Boolean, default=False)
    is_signatory = Column(Boolean, default=False)

class SupplierBank(Base):
    __tablename__ = "supplier_banks"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    bank_name = Column(String)
    account_holder = Column(String)
    account_number_masked = Column(String)
    routing_swift = Column(String)
    currency = Column(String, default="INR")
    is_verified = Column(Boolean, default=False)

class SupplierDoc(Base):
    __tablename__ = "supplier_docs"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    title = Column(String)
    doc_type = Column(String) # Certificate, Tax, License
    file_name = Column(String)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Verified") # Uploaded, Quarantined, Verified, Rejected

class Requisition(Base):
    __tablename__ = "requisitions"
    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String, unique=True, index=True)
    description = Column(String)
    pr_type = Column(String, default="Goods") # Goods, Services, Subscriptions
    status = Column(String, default="Draft") # Draft, Pending Approval, Approved, Complete, More Info Required, Rejected, Cancelled
    requester_name = Column(String)
    requester_email = Column(String)
    buyer_name = Column(String)
    department = Column(String)
    business_entity = Column(String, default="Procurio Corp US")
    currency = Column(String, default="INR")
    total_amount = Column(Float, default=0.0)
    delivery_date = Column(String)
    destination = Column(String)
    is_budgeted = Column(Boolean, default=True)
    budget_allocated = Column(Float, default=50000.0)
    budget_available = Column(Float, default=32000.0)
    current_approver = Column(String, default="Dept Head")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # NetSuite synchronisation metadata (NULL for PRs created locally)
    netsuite_internal_id = Column(String, nullable=True, unique=True, index=True)
    netsuite_status = Column(String, nullable=True)     # raw NetSuite status code/text
    subsidiary = Column(String, nullable=True)
    source = Column(String, default="local")            # local | netsuite
    sync_status = Column(String, default="Local")       # Local | Synced | Error
    last_synced_at = Column(DateTime, nullable=True)

    # downstream references
    bid_id = Column(Integer, nullable=True)
    po_id = Column(Integer, nullable=True)
    contract_id = Column(Integer, nullable=True)

class RequisitionLine(Base):
    __tablename__ = "requisition_lines"
    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"))
    line_number = Column(Integer)
    item_id = Column(Integer, nullable=True)
    description = Column(String)
    category = Column(String)
    quantity = Column(Float, default=1.0)
    uom = Column(String, default="Unit")
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    status = Column(String, default="Pending")
    netsuite_line_id = Column(String, nullable=True)
    item_name = Column(String, nullable=True)
    delivery_requirement = Column(String, nullable=True)

class SourcingEvent(Base):
    __tablename__ = "sourcing_events"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g. RFQ_2026_091
    title = Column(String)
    event_type = Column(String, default="RFQ") # RFI, RFQ, RFP
    status = Column(String, default="Published") # Prepare Bid, Published, Closed, Technical Review, Commercial Review, Prepare Award, Award Approval, Awarded
    stage = Column(String, default="Published")
    open_date = Column(DateTime)
    close_date = Column(DateTime)
    currency = Column(String, default="INR")
    payment_terms = Column(String, default="Net 30 Days")
    delivery_location = Column(String, default="Central Logistics Hub, Dallas TX")
    buyer_name = Column(String, default="Marcus Vance")
    requester_name = Column(String, default="Sarah Jenkins")
    department = Column(String, default="Information Technology")
    linked_pr_number = Column(String, nullable=True)
    budget = Column(Float, default=60000.0)
    is_sealed = Column(Boolean, default=True)
    award_status = Column(String, default="Pending")
    winning_supplier_id = Column(Integer, nullable=True)

class BidResponse(Base):
    __tablename__ = "bid_responses"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("sourcing_events.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    response_code = Column(String, unique=True, index=True)
    status = Column(String, default="Submitted") # Draft, Submitted, Under Evaluation, Awarded, Rejected
    version = Column(Integer, default=1)
    submission_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Financial breakdown
    gross_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    taxable_base = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    freight_amount = Column(Float, default=0.0)
    net_quote = Column(Float, default=0.0) # Canonical calculated net
    
    # Scores
    technical_score = Column(Float, default=0.0)
    commercial_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    evaluator_remarks = Column(Text, nullable=True)

class BidLine(Base):
    __tablename__ = "bid_lines"
    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("bid_responses.id"))
    line_number = Column(Integer)
    item_description = Column(String)
    quantity = Column(Float, default=1.0)
    uom = Column(String, default="Unit")
    unit_price = Column(Float, default=0.0)
    unit_discount = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.20) # e.g. 0.20 for 20%
    is_tax_inclusive = Column(Boolean, default=False)
    gross = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    taxable_base = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    net = Column(Float, default=0.0)
    promised_delivery_date = Column(String, nullable=True)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    source_pr = Column(String, nullable=True)
    source_rfq = Column(String, nullable=True)
    status = Column(String, default="Issued") # Draft, Issued, Acknowledged, Fulfilled, Invoiced, Cancelled
    approval_status = Column(String, default="Approved")
    receipt_status = Column(String, default="Pending Receipt") # Pending Receipt, Partially Received, Fully Received
    invoice_status = Column(String, default="Not Invoiced") # Not Invoiced, Partially Invoiced, Fully Invoiced
    payment_status = Column(String, default="Unpaid") # Unpaid, Scheduled, Paid
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    delivery_date = Column(String)
    buyer_name = Column(String)
    entity_name = Column(String, default="Procurio Corp US")
    department = Column(String)
    payment_terms = Column(String, default="Net 30 Days")
    currency = Column(String, default="INR")
    gross_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)

class POLine(Base):
    __tablename__ = "po_lines"
    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))
    line_number = Column(Integer)
    description = Column(String)
    ordered_qty = Column(Float, default=1.0)
    received_qty = Column(Float, default=0.0)
    accepted_qty = Column(Float, default=0.0)
    rejected_qty = Column(Float, default=0.0)
    uom = Column(String, default="Unit")
    unit_price = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)

class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))
    received_date = Column(DateTime, default=datetime.datetime.utcnow)
    receiver_name = Column(String)
    accepted_qty = Column(Float, default=0.0)
    rejected_qty = Column(Float, default=0.0)
    status = Column(String, default="Accepted")
    inspection_notes = Column(Text, nullable=True)

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    invoice_date = Column(String)
    due_date = Column(String)
    status = Column(String, default="Pending Approval") # Received/Review, Exception, Approved, Posted, Paid
    match_status = Column(String, default="3-Way Matched") # 2-Way Matched, 3-Way Matched, Quantity Discrepancy, Price Variance
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    currency = Column(String, default="INR")

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String, unique=True, index=True)
    title = Column(String)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    status = Column(String, default="Active") # Draft, In Review, Negotiation, Pending Signature, Active, Expired
    contract_type = Column(String, default="Master Services Agreement")
    start_date = Column(String)
    end_date = Column(String)
    total_value = Column(Float, default=150000.0)
    currency = Column(String, default="INR")
    owner_name = Column(String, default="Rachel Adams")

class Clause(Base):
    __tablename__ = "clauses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    clause_type = Column(String) # Legal, Operational, Compliance, Financial
    description = Column(Text)
    is_standard = Column(Boolean, default=True)

class Auction(Base):
    __tablename__ = "auctions"
    id = Column(Integer, primary_key=True, index=True)
    auction_number = Column(String, unique=True, index=True)
    title = Column(String)
    auction_type = Column(String, default="Reverse Sourcing") # Reverse Sourcing, Forward Disposal
    status = Column(String, default="Scheduled") # Scheduled, Live, Closed, Award Under Process, Awarded
    pr_number = Column(String, nullable=True)
    current_approver = Column(String, default="Procurement Lead")
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    reserve_price = Column(Float, default=50000.0)
    min_decrement = Column(Float, default=250.0)
    current_best_bid = Column(Float, default=48500.0)
    best_bidder_id = Column(Integer, nullable=True)
    total_bids_placed = Column(Integer, default=14)
    freight_fixed = Column(Float, default=0.0)
    tax_rate_pct = Column(Float, default=18.0)
    min_bid_improvement = Column(Float, default=5000.0)
    visibility = Column(String, default="own_rank_only")
    terms_version = Column(String, default="v3")
    currency = Column(String, default="INR")
    extensions_used = Column(Integer, default=0)
    max_extensions = Column(Integer, default=5)
    requisition_id = Column(Integer, nullable=True, index=True)   # source PR (NetSuite-synced or local)

class AuctionLineItem(Base):
    __tablename__ = "auction_line_items"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), index=True)
    line_code = Column(String)
    description = Column(String)
    quantity = Column(Float, default=1.0)
    uom = Column(String, default="MT")
    last_rate = Column(Float, default=0.0)

class AuctionBidReceipt(Base):
    __tablename__ = "auction_bid_receipts"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), index=True)
    supplier_id = Column(Integer, index=True)
    receipt_id = Column(String, unique=True, index=True)
    evaluated_total = Column(Float)
    rank_at_acceptance = Column(Integer, default=1)
    outcome = Column(String, default="Accepted")
    line_rates = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    fiscal_period = Column(String, default="FY 2026-2027")
    department = Column(String)
    cost_centre = Column(String)
    approved_budget = Column(Float, default=250000.0)
    adjustments = Column(Float, default=0.0)
    pr_reserved = Column(Float, default=32000.0)
    po_committed = Column(Float, default=85000.0)
    invoiced_actuals = Column(Float, default=64000.0)
    available_balance = Column(Float, default=69000.0)

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"
    id = Column(Integer, primary_key=True, index=True)
    module = Column(String) # Supplier Registration, Purchase Request, Purchase Order, Invoice, Budget, Bid, Contracts, Auction
    name = Column(String)
    is_active = Column(Boolean, default=True)
    steps_count = Column(Integer, default=3)
    definition = Column(JSON) # Step definitions, approvers, criteria, thresholds

class ApprovalTask(Base):
    __tablename__ = "approval_tasks"
    id = Column(Integer, primary_key=True, index=True)
    module = Column(String)
    record_id = Column(Integer)
    record_code = Column(String)
    title = Column(String)
    requested_by = Column(String)
    assignee_role = Column(String)
    amount = Column(Float, nullable=True)
    currency = Column(String, default="INR")
    priority = Column(String, default="Medium") # Low, Medium, High, Urgent
    due_date = Column(String)
    status = Column(String, default="Pending") # Pending, Approved, Rejected, Clarification Requested
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    """Per-user bell notifications (currently: a supplier is told when a buyer starts an auction)."""
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, index=True)           # recipient supplier
    kind = Column(String, default="auction_live")
    auction_id = Column(Integer, nullable=True, index=True)
    title = Column(String)
    message = Column(String)
    priority = Column(String, default="Urgent")
    module = Column(String, default="Auction")
    route = Column(String, default="buyer-auctions")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
