import os
import datetime
import hashlib
from contextvars import ContextVar
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .database import get_db, engine, Base
from .models import (
    User, Category, Item, Supplier, SupplierContact, SupplierBank, SupplierDoc,
    Requisition, RequisitionLine, SourcingEvent, BidResponse, BidLine,
    PurchaseOrder, POLine, GoodsReceipt, Invoice, Contract, Clause,
    Auction, AuctionLineItem, AuctionBidReceipt, Budget, ApprovalWorkflow, ApprovalTask, Notification
)
from .calculations import calculate_quote_line, calculate_budget_balance, calculate_composite_score

from .database import run_with_db_retry
try:
    run_with_db_retry(lambda: Base.metadata.create_all(bind=engine), what="create tables")
except Exception as _exc:  # do not crash the whole API at import time; start-up will retry and /health still answers
    print(f"[db] Could not create tables at import ({_exc.__class__.__name__}); will retry at startup.", flush=True)

app = FastAPI(
    title="Procurio Enterprise Procurement API",
    description="Backend API for Procurio Dual-Portal Procurement Application",
    version="1.0.0"
)

# Dynamic CORS setup for Vercel and local development
allowed_origins_env = os.getenv("CORS_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

# Browsers reject credentials + Allow-Origin: * — breaks cross-origin POST/preflight from Vercel.
_use_wildcard_cors = origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not _use_wildcard_cors,
    allow_methods=["*"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Demo-Role",
        "X-Demo-Portal",
        "X-Demo-Supplier-Id",
    ],
    expose_headers=["*"],
)

_request_session: ContextVar[Optional[dict]] = ContextVar("_request_session", default=None)

ALLOWED_SWITCH_ROLES = frozenset({"procurement_buyer", "supplier_user"})

# In-memory fallback when demo headers are not sent (local single-process dev)
active_session = {
    "user_id": 1,
    "email": "marcus.vance@procurio.com",
    "full_name": "Marcus Vance",
    "role": "procurement_buyer",
    "portal": "admin",
    "supplier_id": None,
    "avatar_initials": "MV",
}


_identity_cache: dict = {}


def _supplier_identity(supplier_id: int) -> dict:
    """Name/company of the supplier user for a demo login (primary contact of an ACTIVE supplier). Cached 60s."""
    import time
    hit = _identity_cache.get(supplier_id)
    if hit and time.time() - hit[0] < 60:
        return hit[1]
    ident = None
    try:
        from .database import SessionLocal
        db = SessionLocal()
        try:
            sup = db.query(Supplier).filter(Supplier.id == supplier_id).first()
            if sup:
                con = (db.query(SupplierContact).filter(SupplierContact.supplier_id == supplier_id)
                       .order_by(SupplierContact.is_primary.desc(), SupplierContact.id).first())
                person = (con.name if con else None) or (sup.trading_name or sup.legal_name)
                ident = {
                    "full_name": person,
                    "email": (con.email if con and con.email else sup.email) or "",
                    "company": sup.trading_name or sup.legal_name,
                }
        finally:
            db.close()
    except Exception:
        ident = None
    if ident is None:
        ident = {"full_name": "Elena Rostova", "email": "elena.rostova@precisioncomponents.com", "company": "Precision Components"}
    _identity_cache[supplier_id] = (time.time(), ident)
    return ident


def _initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    return ("".join(p[0] for p in parts[:2]) or "SU").upper()


def build_demo_session(role: str, portal: str, supplier_id: Optional[int] = None) -> dict:
    if role == "supplier_user":
        sid = supplier_id or 1
        ident = _supplier_identity(sid)
        return {
            "user_id": 100 + sid,
            "email": ident["email"],
            "full_name": ident["full_name"],
            "company": ident["company"],
            "role": "supplier_user",
            "portal": "buyer",
            "supplier_id": sid,
            "avatar_initials": _initials(ident["full_name"]),
        }
    return {
        "user_id": 1,
        "email": "marcus.vance@procurio.com",
        "full_name": "Marcus Vance",
        "role": "procurement_buyer",
        "portal": "admin",
        "supplier_id": None,
        "avatar_initials": "MV",
    }


def get_demo_session() -> dict:
    ctx = _request_session.get()
    if ctx is not None:
        return ctx
    return active_session


def apply_demo_session(role: str, portal: str, supplier_id: Optional[int] = None) -> dict:
    session = build_demo_session(role, portal, supplier_id)
    active_session.clear()
    active_session.update(session)
    return session


@app.middleware("http")
async def attach_demo_session(request: Request, call_next):
    role = request.headers.get("x-demo-role")
    portal = request.headers.get("x-demo-portal")
    sup_raw = request.headers.get("x-demo-supplier-id")
    sup_id: Optional[int] = None
    if sup_raw and str(sup_raw).isdigit():
        sup_id = int(sup_raw)

    if role in ALLOWED_SWITCH_ROLES and portal in ("admin", "buyer"):
        session = build_demo_session(role, portal, sup_id)
    else:
        session = dict(active_session)

    token = _request_session.set(session)
    try:
        return await call_next(request)
    finally:
        _request_session.reset(token)


def _startup_seed_with_retries(attempts: int = 3) -> None:
    import time
    from .seed import seed_database

    for attempt in range(1, attempts + 1):
        try:
            seed_database()
            return
        except Exception as e:
            print(f"Startup seed attempt {attempt}/{attempts} failed: {e}", flush=True)
            if attempt < attempts:
                time.sleep(5 * attempt)
    print("Startup seed failed after retries — check DATABASE_URL and Render logs.", flush=True)


@app.on_event("startup")
def on_startup():
    from .database import DATABASE_URL
    if not os.getenv("DATABASE_URL"):
        print("WARNING: DATABASE_URL unset — using local fallback DB (deploy will have no Neon data).", flush=True)
    elif DATABASE_URL.startswith("sqlite"):
        print("WARNING: SQLite in use — set DATABASE_URL to Neon on Render.", flush=True)
    else:
        print("Startup: PostgreSQL configured.", flush=True)
    from .schema_migrate import ensure_postgres_schema
    try:
        run_with_db_retry(ensure_postgres_schema, what="schema migrate")
    except Exception as exc:
        print(f"[db] Schema migrate failed: {exc.__class__.__name__}: {str(exc)[:160]}", flush=True)
    _startup_seed_with_retries()

# ----------------- AUTH & SESSION -----------------

def _available_roles() -> list:
    roles = [{"role": "procurement_buyer", "portal": "admin", "supplier_id": None, "name": "Marcus Vance (Supplier)",
              "person": "Marcus Vance", "company": "Procurement Buyer", "initials": "MV"}]
    try:
        from .database import SessionLocal
        db = SessionLocal()
        try:
            for sup in db.query(Supplier).filter(Supplier.status == "Active").order_by(Supplier.id).all():
                ident = _supplier_identity(sup.id)
                roles.append({
                    "role": "supplier_user", "portal": "buyer", "supplier_id": sup.id,
                    "name": f"{ident['full_name']} ({ident['company']} - Buyer)",
                    "person": ident["full_name"], "company": ident["company"], "initials": _initials(ident["full_name"]),
                })
        finally:
            db.close()
    except Exception:
        roles.append({"role": "supplier_user", "portal": "buyer", "supplier_id": 1, "name": "Elena Rostova (Precision Components - Buyer)",
                      "person": "Elena Rostova", "company": "Precision Components", "initials": "ER"})
    return roles


@app.get("/api/v1/auth/me")
def get_current_user():
    user = get_demo_session()
    return {
        "user": user,
        "available_portals": [
            {"id": "admin", "title": "Admin Portal", "context": "Internal Procurement Workspace"},
            {"id": "buyer", "title": "Buyer Portal", "context": "Supplier Workspace"}
        ],
        "available_roles": _available_roles()
    }

class RoleSwitchRequest(BaseModel):
    role: str
    portal: str
    supplier_id: Optional[int] = 1

@app.post("/api/v1/auth/switch-role")
def switch_role(req: RoleSwitchRequest):
    if req.role not in ALLOWED_SWITCH_ROLES:
        raise HTTPException(status_code=400, detail="Only procurement buyer and supplier user roles are enabled in this demo.")

    user = apply_demo_session(req.role, req.portal, req.supplier_id)
    return {"status": "success", "user": user}


@app.get("/api/v1/health")
def health_check():
    """Lightweight probe for Render / uptime checks (no DB round-trip)."""
    return {"status": "ok", "service": "procurio-api"}


@app.get("/api/v1/health/db")
def health_db(db: Session = Depends(get_db)):
    """Deploy diagnostic: confirms Neon/Postgres connectivity and demo row counts."""
    from .database import DATABASE_URL
    from .models import Supplier, Requisition, Auction, PurchaseOrder, Budget

    backend = "sqlite" if DATABASE_URL.startswith("sqlite") else "postgresql"
    try:
        live_auctions = db.query(Auction).filter(Auction.status == "Live").count()
        sample = (
            db.query(Auction.auction_number, Auction.status, Auction.title)
            .order_by(Auction.id.desc())
            .limit(5)
            .all()
        )
        counts = {
            "suppliers": db.query(Supplier).count(),
            "requisitions": db.query(Requisition).count(),
            "auctions": db.query(Auction).count(),
            "live_auctions": live_auctions,
            "purchase_orders": db.query(PurchaseOrder).count(),
            "budgets": db.query(Budget).count(),
        }
        seeded = counts["suppliers"] > 0
        return {
            "status": "ok" if seeded else "empty",
            "database_backend": backend,
            "database_url_configured": bool(os.getenv("DATABASE_URL")),
            "counts": counts,
            "sample_auctions": [
                {"auction_number": n, "status": s, "title": t} for n, s, t in sample
            ],
            "auctions_api": "/api/v1/auctions",
            "hint": None if seeded else "Run push_to_neon.py locally or set DATABASE_URL on Render and redeploy.",
        }
    except Exception as e:
        return {
            "status": "error",
            "database_backend": backend,
            "database_url_configured": bool(os.getenv("DATABASE_URL")),
            "error": str(e),
        }


# ----------------- DASHBOARD & METRICS -----------------

@app.get("/api/v1/dashboard/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_users = db.query(User).count() + 1242 # matching image 1
    active_org_users = 842
    supplier_users = 406
    
    pending_tasks = db.query(ApprovalTask).filter(ApprovalTask.status == "Pending").count()
    total_suppliers = db.query(Supplier).count()
    active_suppliers = db.query(Supplier).filter(Supplier.status == "Active").count()
    total_prs = db.query(Requisition).count()
    approved_prs = db.query(Requisition).filter(Requisition.status == "Approved").count()
    total_pos = db.query(PurchaseOrder).count()
    open_rfqs = db.query(SourcingEvent).count()
    live_auctions = db.query(Auction).filter(Auction.status == "Live").count()
    
    return {
        "top_metrics": {
            "total_users": total_users,
            "active_org_users": active_org_users,
            "supplier_users": supplier_users
        },
        "pending_approvals": {
            "supplier_registrations": db.query(Supplier).filter(Supplier.status == "Pending Approval").count(),
            "purchase_requests": db.query(Requisition).filter(Requisition.status == "Pending Approval").count(),
            "purchase_orders": db.query(PurchaseOrder).filter(PurchaseOrder.approval_status == "Pending").count(),
            "invoices": db.query(Invoice).filter(Invoice.status == "Pending Approval").count(),
            "budgets": 1,
            "contracts": 1
        },
        "my_requests": {
            "draft_prs": db.query(Requisition).filter(Requisition.status == "Draft").count(),
            "approved_prs": approved_prs,
            "draft_pos": 0,
            "approved_pos": total_pos,
            "pending_invoices": 1
        },
        "supplier_counts": {
            "total": total_suppliers,
            "active": active_suppliers
        }
    }

@app.get("/api/v1/dashboard/tasks")
def get_dashboard_tasks(db: Session = Depends(get_db)):
    tasks = db.query(ApprovalTask).order_by(ApprovalTask.id.desc()).all()
    return tasks

def _task_route(module: str) -> str:
    routes = {
        "Supplier Registration": "suppliers",
        "Purchase Request": "requisitions",
        "Purchase Order": "purchase-orders",
        "Invoice": "invoices",
        "Bid Award": "bids",
        "Budget": "budgets",
        "Contracts": "contracts",
        "Auction": "auctions",
    }
    return routes.get(module, "dashboard")


def _ago(ts) -> str:
    if not ts:
        return ""
    secs = max(0, int((datetime.datetime.utcnow() - ts).total_seconds()))
    if secs < 60:
        return "Just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        return f"{secs // 3600} h ago"
    return f"{secs // 86400} d ago"


def _notify_suppliers_auction_live(db: Session, auc: Auction) -> int:
    """Bell notification for every ACTIVE supplier when a buyer starts (goes live with) an auction.
    De-duplicated: a supplier is not notified twice about the same auction within 10 minutes."""
    now = datetime.datetime.utcnow()
    recent = {
        row[0] for row in db.query(Notification.supplier_id).filter(
            Notification.auction_id == auc.id, Notification.kind == "auction_live",
            Notification.created_at >= now - datetime.timedelta(minutes=10))
    }
    kind = "reverse" if auc.auction_type == "Reverse Sourcing" else "forward"
    closes = ""
    if auc.end_time:
        ist = auc.end_time + datetime.timedelta(hours=5, minutes=30)
        closes = f" Closes {ist.strftime('%d %b, %I:%M %p')} IST."
    sent = 0
    for sup in db.query(Supplier).filter(Supplier.status == "Active").all():
        if sup.id in recent:
            continue
        db.add(Notification(
            supplier_id=sup.id, kind="auction_live", auction_id=auc.id, priority="Urgent", module="Auction",
            title=f"Auction is LIVE: {auc.auction_number}",
            message=f"{auc.title} - {kind} auction is now open for bidding.{closes}",
            route="buyer-auction-console",
        ))
        sent += 1
    return sent


@app.post("/api/v1/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    sup_id = get_demo_session().get("supplier_id") or 1
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.supplier_id == sup_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "ok"}


@app.post("/api/v1/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    sup_id = get_demo_session().get("supplier_id") or 1
    db.query(Notification).filter(Notification.supplier_id == sup_id, Notification.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"status": "ok"}


@app.get("/api/v1/notifications")
def get_notifications(db: Session = Depends(get_db)):
    """Role-aware notification feed for the header bell."""
    session = get_demo_session()
    role = session.get("role", "procurement_buyer")
    sup_id = session.get("supplier_id") or 1
    items: List[dict] = []

    unread_db = 0
    if role == "supplier_user":
        own = (db.query(Notification).filter(Notification.supplier_id == sup_id)
               .order_by(Notification.created_at.desc(), Notification.id.desc()).limit(10).all())
        for n in own:
            if not n.is_read:
                unread_db += 1
            items.append({
                "id": f"n-{n.id}", "db_id": n.id, "auction_id": n.auction_id, "unread": not n.is_read,
                "title": n.title, "message": n.message, "time": _ago(n.created_at),
                "priority": n.priority or "Urgent", "route": n.route, "module": n.module,
            })
        events = db.query(SourcingEvent).order_by(SourcingEvent.id.desc()).all()
        for ev in events:
            resp = db.query(BidResponse).filter(
                BidResponse.event_id == ev.id,
                BidResponse.supplier_id == sup_id,
            ).first()
            if not resp:
                items.append({
                    "id": f"bid-invite-{ev.id}",
                    "title": f"RFQ invitation: {ev.code}",
                    "message": ev.title,
                    "time": "Awaiting your response",
                    "priority": "High",
                    "route": "buyer-bids",
                    "module": "Bid",
                })
            elif ev.status in ("Live", "Technical Review", "Commercial Review"):
                items.append({
                    "id": f"bid-update-{ev.id}",
                    "title": f"Quote under review — {ev.code}",
                    "message": f"Your submission status: {resp.status}. Net quote ${resp.net_quote:,.2f}.",
                    "time": "Updated recently",
                    "priority": "Medium",
                    "route": "buyer-bids",
                    "module": "Bid",
                })

        live_auctions = db.query(Auction).filter(Auction.status == "Live").count()
        if live_auctions:
            items.append({
                "id": "auction-live",
                "title": "Live auction lot open",
                "message": f"{live_auctions} auction(s) accepting competitive bids now.",
                "time": "Live now",
                "priority": "Urgent",
                "route": "buyer-auctions",
                "module": "Auction",
            })

        ctr_count = db.query(Contract).filter(Contract.supplier_id == sup_id, Contract.status == "Active").count()
        if ctr_count:
            items.append({
                "id": "contracts-active",
                "title": "Active master agreement on file",
                "message": f"You have {ctr_count} active contract(s) with Procurio Corp US.",
                "time": "Current",
                "priority": "Low",
                "route": "buyer-contracts",
                "module": "Contracts",
            })

        items.append({
            "id": "profile-banking",
            "title": "Verify banking & tax documents",
            "message": "Complete profile and banking details to receive PO payments.",
            "time": "Recommended",
            "priority": "Medium",
            "route": "buyer-profile",
            "module": "Supplier",
        })
    else:
        tasks = (
            db.query(ApprovalTask)
            .filter(ApprovalTask.status == "Pending")
            .order_by(ApprovalTask.id.desc())
            .limit(8)
            .all()
        )
        for t in tasks:
            items.append({
                "id": f"task-{t.id}",
                "title": t.title,
                "message": f"{t.module} • {t.record_code} • Due {t.due_date}",
                "time": t.due_date or "Pending",
                "priority": t.priority or "Medium",
                "route": _task_route(t.module),
                "module": t.module,
            })

        pending_sup = db.query(Supplier).filter(Supplier.status == "Pending Approval").count()
        if pending_sup:
            items.append({
                "id": "sup-onboard",
                "title": "Supplier onboarding queue",
                "message": f"{pending_sup} supplier registration(s) awaiting compliance review.",
                "time": "Today",
                "priority": "High",
                "route": "suppliers",
                "module": "Supplier Registration",
            })

        pending_inv = db.query(Invoice).filter(Invoice.status == "Pending Approval").count()
        if pending_inv:
            items.append({
                "id": "inv-ap",
                "title": "Invoices pending AP approval",
                "message": f"{pending_inv} invoice(s) require 3-way match sign-off.",
                "time": "Today",
                "priority": "Urgent",
                "route": "invoices",
                "module": "Invoice",
            })

        live_rfqs = db.query(SourcingEvent).filter(SourcingEvent.status.in_(["Live", "Technical Review"])).count()
        if live_rfqs:
            items.append({
                "id": "rfq-eval",
                "title": "Sourcing events in evaluation",
                "message": f"{live_rfqs} RFQ/RFP event(s) need buyer or commercial action.",
                "time": "This week",
                "priority": "Medium",
                "route": "bids",
                "module": "Bid",
            })

        draft_contracts = db.query(Contract).filter(Contract.status.in_(["Draft", "In Review"])).count()
        if draft_contracts:
            items.append({
                "id": "ctr-legal",
                "title": "Contracts awaiting legal review",
                "message": f"{draft_contracts} agreement(s) in draft or in review.",
                "time": "This week",
                "priority": "Medium",
                "route": "contracts",
                "module": "Contracts",
            })

    priority_order = {"Urgent": 0, "High": 1, "Medium": 2, "Low": 3}
    items.sort(key=lambda x: priority_order.get(x.get("priority", "Medium"), 2))

    static_count = len([i for i in items if not i.get("db_id")])
    # stored notifications stay visible (read or not); badge = standing alerts + unread stored ones
    return {"unread_count": static_count + unread_db, "items": items[:14]}


@app.get("/api/v1/dashboard/recent-activity")
def get_recent_activity():
    return [
        {"id": 1, "actor": "Sarah Jenkins", "action": "Submitted PR_00084 for IT Core Switches", "time": "15 mins ago", "type": "PR"},
        {"id": 2, "actor": "Precision Components", "action": "Submitted quote for RFQ_2026_091 ($36,000.00)", "time": "45 mins ago", "type": "Bid"},
        {"id": 3, "actor": "Marcus Vance", "action": "Issued PO_2026_0142 to Precision Components Ltd", "time": "2 hours ago", "type": "PO"},
        {"id": 4, "actor": "TechVibe Cloud", "action": "Completed Step 5 of Supplier Onboarding Wizard", "time": "4 hours ago", "type": "Supplier"},
        {"id": 5, "actor": "David Chen", "action": "Approved budget allocation for Plant Operations ($15,500.00)", "time": "Yesterday", "type": "Budget"}
    ]

# ----------------- SUPPLIERS (E02, E03) -----------------

@app.get("/api/v1/suppliers")
def get_suppliers(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Supplier)
    if status and status != "Total":
        if status == "Pending + Info":
            query = query.filter(Supplier.status.in_(["Pending Approval", "More Info Required"]))
        else:
            query = query.filter(Supplier.status == status)
    if search:
        query = query.filter(
            (Supplier.legal_name.ilike(f"%{search}%")) |
            (Supplier.code.ilike(f"%{search}%")) |
            (Supplier.email.ilike(f"%{search}%")) |
            (Supplier.country.ilike(f"%{search}%"))
        )
    suppliers = query.order_by(Supplier.id.asc()).all()

    # Metric counts for top filters
    counts = {
        "Total": db.query(Supplier).count(),
        "Active": db.query(Supplier).filter(Supplier.status == "Active").count(),
        "Draft": db.query(Supplier).filter(Supplier.status == "Draft").count(),
        "Pending Approval": db.query(Supplier).filter(Supplier.status == "Pending Approval").count(),
        "More Info Required": db.query(Supplier).filter(Supplier.status == "More Info Required").count(),
        "Pending + Info": db.query(Supplier).filter(Supplier.status.in_(["Pending Approval", "More Info Required"])).count(),
        "Changes in Draft": db.query(Supplier).filter(Supplier.status == "Changes in Draft").count(),
        "Rejected": db.query(Supplier).filter(Supplier.status == "Rejected").count()
    }

    return {"items": suppliers, "counts": counts, "total": len(suppliers)}

@app.get("/api/v1/suppliers/{id}")
def get_supplier_detail(id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    contacts = db.query(SupplierContact).filter(SupplierContact.supplier_id == id).all()
    banks = db.query(SupplierBank).filter(SupplierBank.supplier_id == id).all()
    docs = db.query(SupplierDoc).filter(SupplierDoc.supplier_id == id).all()
    
    return {
        "supplier": supplier,
        "contacts": contacts,
        "banks": banks,
        "documents": docs,
        "approval_history": [
            {"step": "Initial Registration", "reviewer": "Marcus Vance", "decision": "Verified", "date": "2026-10-12", "comment": "All corporate filing docs verified."},
            {"step": "Banking Audit", "reviewer": "David Chen", "decision": "Approved", "date": "2026-10-15", "comment": "JPMorgan Chase routing confirmed via trusted vendor line."}
        ]
    }

class InviteSupplierRequest(BaseModel):
    legal_name: str
    contact_email: str
    categories: List[str]
    country: str = "United States"

@app.post("/api/v1/suppliers/invite")
def invite_supplier(req: InviteSupplierRequest, db: Session = Depends(get_db)):
    code = f"SUP_{100 + db.query(Supplier).count() + 1}"
    new_sup = Supplier(
        code=code,
        legal_name=req.legal_name,
        trading_name=req.legal_name,
        status="Pending Approval",
        type="Service Provider",
        country=req.country,
        email=req.contact_email,
        contact_no="+1 (555) 000-0000",
        created_by=get_demo_session()["full_name"],
        current_approver="Compliance Reviewer"
    )
    db.add(new_sup)
    db.commit()
    db.refresh(new_sup)
    return {"status": "success", "message": f"Invitation link generated and sent to {req.contact_email}", "supplier": new_sup}

# ----------------- CATEGORIES & ITEMS (Image 12) -----------------

@app.get("/api/v1/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    res = []
    for c in cats:
        item_count = db.query(Item).filter(Item.category_id == c.id).count()
        parent = db.query(Category).filter(Category.id == c.parent_id).first() if c.parent_id else None
        res.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "parent_id": c.parent_id,
            "parent_name": parent.name if parent else "None (Top Level)",
            "description": c.description,
            "is_active": c.is_active,
            "items_count": item_count
        })
    return res

@app.get("/api/v1/items")
def get_items(category_id: Optional[int] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Item)
    if category_id:
        query = query.filter(Item.category_id == category_id)
    if search:
        query = query.filter(
            (Item.sku.ilike(f"%{search}%")) |
            (Item.name.ilike(f"%{search}%")) |
            (Item.description.ilike(f"%{search}%"))
        )
    items = query.all()
    res = []
    for itm in items:
        cat = db.query(Category).filter(Category.id == itm.category_id).first()
        sup = db.query(Supplier).filter(Supplier.id == itm.preferred_supplier_id).first() if itm.preferred_supplier_id else None
        res.append({
            "id": itm.id,
            "sku": itm.sku,
            "name": itm.name,
            "description": itm.description,
            "category_id": itm.category_id,
            "category_name": cat.name if cat else "General",
            "uom": itm.uom,
            "unit_price": itm.unit_price,
            "currency": itm.currency,
            "preferred_supplier": sup.legal_name if sup else "Precision Components Ltd",
            "is_active": itm.is_active
        })
    return res

class CreateCategoryRequest(BaseModel):
    code: Optional[str] = None
    name: str
    parent_id: Optional[int] = None
    description: Optional[str] = ""

@app.post("/api/v1/categories")
def create_category(req: CreateCategoryRequest, db: Session = Depends(get_db)):
    code = (req.code or "").strip() or f"CAT-GEN-{db.query(Category).count() + 1:03d}"
    if db.query(Category).filter(Category.code == code).first():
        raise HTTPException(status_code=400, detail="Category code already exists")
    cat = Category(
        code=code,
        name=req.name,
        parent_id=req.parent_id,
        description=req.description or "",
        is_active=True,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"status": "success", "category": cat}

class CreateItemRequest(BaseModel):
    sku: Optional[str] = None
    name: str
    category_id: int
    description: Optional[str] = ""
    uom: Optional[str] = "Unit"
    unit_price: Optional[float] = 0.0
    currency: Optional[str] = "USD"

@app.post("/api/v1/items")
def create_item(req: CreateItemRequest, db: Session = Depends(get_db)):
    if not db.query(Category).filter(Category.id == req.category_id).first():
        raise HTTPException(status_code=400, detail="Category not found")
    sku = (req.sku or "").strip() or f"SKU-{db.query(Item).count() + 1:04d}"
    if db.query(Item).filter(Item.sku == sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    itm = Item(
        sku=sku,
        name=req.name,
        description=req.description or req.name,
        category_id=req.category_id,
        uom=req.uom or "Unit",
        unit_price=float(req.unit_price or 0),
        currency=req.currency or "USD",
        is_active=True,
    )
    db.add(itm)
    db.commit()
    db.refresh(itm)
    return {"status": "success", "item": itm}

# ----------------- REQUISITIONS (E07, E08) -----------------

@app.get("/api/v1/requisitions")
def get_requisitions(status: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Requisition)
    if status and status != "Total":
        query = query.filter(Requisition.status == status)
    if search:
        query = query.filter(
            (Requisition.pr_number.ilike(f"%{search}%")) |
            (Requisition.description.ilike(f"%{search}%")) |
            (Requisition.requester_name.ilike(f"%{search}%")) |
            (Requisition.department.ilike(f"%{search}%"))
        )
    prs = query.order_by(Requisition.id.desc()).all()

    counts = {
        "Total": db.query(Requisition).count(),
        "Draft": db.query(Requisition).filter(Requisition.status == "Draft").count(),
        "Pending Approval": db.query(Requisition).filter(Requisition.status == "Pending Approval").count(),
        "Approved": db.query(Requisition).filter(Requisition.status == "Approved").count(),
        "Complete": db.query(Requisition).filter(Requisition.status == "Complete").count(),
        "More Info Required": db.query(Requisition).filter(Requisition.status == "More Info Required").count(),
        "Rejected": db.query(Requisition).filter(Requisition.status == "Rejected").count(),
        "Cancelled": db.query(Requisition).filter(Requisition.status == "Cancelled").count()
    }
    return {"items": prs, "counts": counts, "total": len(prs)}

@app.get("/api/v1/requisitions/{id}")
def get_requisition_detail(id: int, db: Session = Depends(get_db)):
    pr = db.query(Requisition).filter(Requisition.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    lines = db.query(RequisitionLine).filter(RequisitionLine.requisition_id == id).all()
    return {
        "requisition": pr,
        "lines": lines,
        "allocations": [
            {"cost_centre": "CC-1020-IT", "percentage": 100.0, "amount": pr.total_amount, "gl_account": "6100-Equipment"}
        ],
        "approval_history": [
            {"step": "Department Review", "actor": "Sarah Jenkins", "decision": "Submitted", "timestamp": "2026-11-01 09:30", "comments": "Urgent datacenter refresh requirement."},
            {"step": "Finance Allocation Check", "actor": "David Chen", "decision": "Approved", "timestamp": "2026-11-02 14:15", "comments": "Budget headroom validated against FY26 Q4 IT pool."}
        ]
    }

# ----------------- NETSUITE PURCHASE REQUESTS (sync + auction eligibility) -----------------

from . import netsuite as ns


@app.get("/api/v1/netsuite/status")
def netsuite_status(db: Session = Depends(get_db)):
    """Connection/config state. Never returns credentials."""
    last = (db.query(Requisition.last_synced_at)
            .filter(Requisition.source == "netsuite", Requisition.last_synced_at.isnot(None))
            .order_by(Requisition.last_synced_at.desc()).first())
    return {
        "configured": ns.is_configured(),
        "missing_env": ns.missing_config(),
        "eligible_statuses": ns.eligible_statuses(),
        "allow_multiple_auctions_per_pr": ns.allow_multiple_auctions_per_pr(),
        "netsuite_pr_count": db.query(Requisition).filter(Requisition.source == "netsuite").count(),
        "last_synced_at": (last[0].isoformat() + "Z") if last and last[0] else None,
    }


class SyncPRRequest(BaseModel):
    full: bool = False


@app.post("/api/v1/purchase-requests/sync")
def sync_purchase_requests_endpoint(req: Optional[SyncPRRequest] = None, db: Session = Depends(get_db)):
    try:
        return ns.sync_purchase_requests(db, full=bool(req and req.full))
    except ns.NetSuiteNotConfigured as e:
        raise HTTPException(status_code=503, detail={"code": "netsuite_not_configured", "message": str(e), "missing_env": e.missing})
    except ns.NetSuiteError as e:
        raise HTTPException(status_code=502, detail={"code": "netsuite_error", "message": str(e)})


def _pr_auction_eligibility(db: Session, pr: Requisition) -> dict:
    reasons = []
    allowed = ns.eligible_statuses()
    if pr.status not in allowed:
        reasons.append(f"PR status is '{pr.status}'; eligible statuses: {', '.join(allowed)}.")
    lines = db.query(RequisitionLine).filter(RequisitionLine.requisition_id == pr.id).count()
    if lines == 0:
        reasons.append("PR has no item lines.")
    if not (pr.total_amount or 0) > 0:
        reasons.append("PR has no estimated amount.")
    if not ns.allow_multiple_auctions_per_pr():
        existing = (db.query(Auction)
                    .filter(Auction.requisition_id == pr.id, Auction.status.notin_(["Closed"]))
                    .first())
        if existing:
            reasons.append(f"Auction {existing.auction_number} already exists for this PR.")
    return {"eligible": not reasons, "reasons": reasons, "eligible_statuses": allowed}


@app.get("/api/v1/purchase-requests/{id}/auction-eligibility")
def pr_auction_eligibility(id: int, db: Session = Depends(get_db)):
    pr = db.query(Requisition).filter(Requisition.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return _pr_auction_eligibility(db, pr)


class CreateAuctionFromPRRequest(BaseModel):
    title: Optional[str] = None
    duration_hours: float = 2.0
    status: str = "Scheduled"
    min_decrement: Optional[float] = None
    min_bid_improvement: Optional[float] = None
    reserve_price: Optional[float] = None


@app.post("/api/v1/purchase-requests/{id}/create-auction")
def create_auction_from_pr(id: int, req: CreateAuctionFromPRRequest, db: Session = Depends(get_db)):
    pr = db.query(Requisition).filter(Requisition.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    elig = _pr_auction_eligibility(db, pr)
    if not elig["eligible"]:
        raise HTTPException(status_code=409, detail={"code": "pr_not_eligible", "reasons": elig["reasons"]})
    lines = (db.query(RequisitionLine).filter(RequisitionLine.requisition_id == pr.id)
             .order_by(RequisitionLine.line_number, RequisitionLine.id).all())
    reserve = req.reserve_price if req.reserve_price is not None else float(pr.total_amount)
    dec = req.min_decrement if req.min_decrement is not None else max(1.0, round(reserve * 0.005, 2))
    payload = CreateAuctionRequest(
        title=(req.title or f"{pr.pr_number} - {pr.description or 'Reverse auction'}")[:200],
        auction_type="Reverse Sourcing",
        status=req.status if req.status in ("Scheduled", "Live") else "Scheduled",
        pr_number=pr.pr_number,
        reserve_price=reserve,
        min_decrement=dec,
        min_bid_improvement=req.min_bid_improvement if req.min_bid_improvement is not None else dec,
        freight_fixed=0.0,
        tax_rate_pct=0.0,
        currency="INR",
        duration_hours=req.duration_hours,
        lines=[
            CreateAuctionLineRequest(
                line_code=f"L{(l.line_number or i):02d}",
                description=(l.item_name or l.description or "Item")[:200],
                quantity=float(l.quantity or 1),
                uom=l.uom or "Unit",
                last_rate=float(l.unit_price or 0),
            )
            for i, l in enumerate(lines, start=1)
        ],
    )
    result = create_auction(payload, db)
    auc = db.query(Auction).filter(Auction.id == result["id"]).first()
    auc.requisition_id = pr.id
    db.commit()
    return {**result, "requisition_id": pr.id}


class CreatePRRequest(BaseModel):
    description: str
    department: str
    delivery_date: str
    destination: str
    lines: List[dict]

@app.post("/api/v1/requisitions")
def create_requisition(req: CreatePRRequest, db: Session = Depends(get_db)):
    total = sum(l.get("quantity", 1) * l.get("unit_price", 0) for l in req.lines)
    pr_num = f"PR_000{80 + db.query(Requisition).count() + 1}"
    
    new_pr = Requisition(
        pr_number=pr_num,
        description=req.description,
        pr_type="Goods",
        status="Draft",
        requester_name=get_demo_session()["full_name"],
        requester_email=get_demo_session()["email"],
        buyer_name="Marcus Vance",
        department=req.department,
        total_amount=total,
        delivery_date=req.delivery_date,
        destination=req.destination,
        current_approver="Dept Head",
        budget_allocated=total * 1.5,
        budget_available=total * 1.2
    )
    db.add(new_pr)
    db.commit()
    db.refresh(new_pr)

    for idx, l in enumerate(req.lines):
        line = RequisitionLine(
            requisition_id=new_pr.id,
            line_number=idx + 1,
            description=l.get("description", "Item Line"),
            category=l.get("category", "General"),
            quantity=float(l.get("quantity", 1)),
            uom=l.get("uom", "Unit"),
            unit_price=float(l.get("unit_price", 0)),
            amount=float(l.get("quantity", 1)) * float(l.get("unit_price", 0)),
            status="Draft"
        )
        db.add(line)
    db.commit()
    return {"status": "success", "requisition": new_pr}

@app.post("/api/v1/requisitions/{id}/submit")
def submit_requisition(id: int, db: Session = Depends(get_db)):
    pr = db.query(Requisition).filter(Requisition.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    pr.status = "Pending Approval"
    pr.current_approver = "David Chen (Finance Controller)"
    
    task = ApprovalTask(
        module="Purchase Request",
        record_id=pr.id,
        record_code=pr.pr_number,
        title=f"Review PR: {pr.description}",
        requested_by=pr.requester_name,
        assignee_role="Finance Controller",
        amount=pr.total_amount,
        priority="Medium",
        due_date=(datetime.datetime.utcnow() + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
    )
    db.add(task)
    db.commit()
    return {"status": "success", "message": "PR successfully submitted for approval", "requisition": pr}

class ConvertPRRequest(BaseModel):
    conversion_type: str # "rfq", "po", "contract"
    supplier_id: Optional[int] = 1

@app.post("/api/v1/requisitions/{id}/convert")
def convert_requisition(id: int, req: ConvertPRRequest, db: Session = Depends(get_db)):
    pr = db.query(Requisition).filter(Requisition.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Requisition not found")
    
    if req.conversion_type == "rfq":
        rfq_code = f"RFQ_2026_0{db.query(SourcingEvent).count() + 91}"
        rfq = SourcingEvent(
            code=rfq_code,
            title=f"Sourcing for {pr.description}",
            event_type="RFQ",
            status="Prepare Bid",
            stage="Prepare Bid",
            open_date=datetime.datetime.utcnow(),
            close_date=datetime.datetime.utcnow() + datetime.timedelta(days=10),
            currency=pr.currency,
            delivery_location=pr.destination,
            buyer_name=get_demo_session()["full_name"],
            requester_name=pr.requester_name,
            department=pr.department,
            linked_pr_number=pr.pr_number,
            budget=pr.total_amount
        )
        db.add(rfq)
        pr.bid_id = rfq.id
        db.commit()
        return {"status": "success", "converted_to": "rfq", "event_code": rfq_code, "id": rfq.id}

    elif req.conversion_type == "po":
        po_num = f"PO_2026_0{db.query(PurchaseOrder).count() + 142}"
        po = PurchaseOrder(
            po_number=po_num,
            supplier_id=req.supplier_id or 1,
            source_pr=pr.pr_number,
            status="Issued",
            approval_status="Approved",
            delivery_date=pr.delivery_date,
            buyer_name=get_demo_session()["full_name"],
            department=pr.department,
            gross_amount=pr.total_amount,
            tax_amount=pr.total_amount * 0.2,
            net_amount=pr.total_amount * 1.2
        )
        db.add(po)
        db.flush()
        lines = db.query(RequisitionLine).filter(RequisitionLine.requisition_id == pr.id).all()
        if lines:
            for idx, ln in enumerate(lines):
                db.add(POLine(
                    po_id=po.id,
                    line_number=idx + 1,
                    description=ln.description,
                    ordered_qty=float(ln.quantity),
                    received_qty=0.0,
                    accepted_qty=0.0,
                    rejected_qty=0.0,
                    uom=ln.uom,
                    unit_price=float(ln.unit_price),
                    net_amount=float(ln.amount or ln.quantity * ln.unit_price),
                ))
        else:
            db.add(POLine(
                po_id=po.id,
                line_number=1,
                description=pr.description or "Converted from PR",
                ordered_qty=1.0,
                received_qty=0.0,
                accepted_qty=0.0,
                rejected_qty=0.0,
                uom="Unit",
                unit_price=float(pr.total_amount or 0),
                net_amount=float(pr.total_amount or 0) * 1.2,
            ))
        pr.po_id = po.id
        pr.status = "Complete"
        db.commit()
        return {"status": "success", "converted_to": "po", "po_number": po_num, "id": po.id}

    return {"status": "error", "message": "Unknown conversion type"}

# ----------------- SOURCING & BID COMPARISON (E09, E10, E11) -----------------

@app.get("/api/v1/sourcing-events")
def get_sourcing_events(db: Session = Depends(get_db)):
    events = db.query(SourcingEvent).order_by(SourcingEvent.id.desc()).all()
    return events

@app.get("/api/v1/sourcing-events/{id}")
def get_sourcing_event_detail(id: int, db: Session = Depends(get_db)):
    event = db.query(SourcingEvent).filter(SourcingEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sourcing event not found")
    
    responses = db.query(BidResponse).filter(BidResponse.event_id == id).all()
    resp_data = []
    for r in responses:
        sup = db.query(Supplier).filter(Supplier.id == r.supplier_id).first()
        lines = db.query(BidLine).filter(BidLine.response_id == r.id).all()
        resp_data.append({
            "response": r,
            "supplier": sup,
            "lines": lines
        })

    return {
        "event": event,
        "evaluation_team": [
            {"role": "Procurement Buyer", "name": event.buyer_name, "status": "Review Completed"},
            {"role": "Technical Evaluator", "name": "James Thorne (Lead Architect)", "status": "Scores Submitted"},
            {"role": "Commercial Reviewer", "name": "David Chen (Finance)", "status": "Analysis Ready"}
        ],
        "responses": resp_data,
        "stages": ["Prepare Bid", "Publish", "Closed", "Technical Review", "Commercial Review", "Prepare Award", "Award Approval", "Awarded"]
    }

@app.get("/api/v1/sourcing-events/{id}/comparison")
def get_bid_comparison(id: int, db: Session = Depends(get_db)):
    """
    Detailed technical and financial bid comparison overlay matching Images 15 & 16
    and Section I1 & I2 of SellMyGoods spec.
    """
    event = db.query(SourcingEvent).filter(SourcingEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sourcing event not found")
    
    responses = db.query(BidResponse).filter(BidResponse.event_id == id).all()
    suppliers_comp = []
    
    for r in responses:
        sup = db.query(Supplier).filter(Supplier.id == r.supplier_id).first()
        lines = db.query(BidLine).filter(BidLine.response_id == r.id).all()
        suppliers_comp.append({
            "supplier_id": sup.id if sup else 0,
            "supplier_name": sup.legal_name if sup else "Unknown",
            "country": sup.country if sup else "US",
            "response_code": r.response_code,
            "technical_score": r.technical_score,
            "commercial_score": r.commercial_score,
            "total_score": r.total_score,
            "gross_amount": r.gross_amount,
            "discount_amount": r.discount_amount,
            "taxable_base": r.taxable_base,
            "tax_amount": r.tax_amount,
            "net_quote": r.net_quote,
            "lines": [
                {
                    "item": l.item_description,
                    "qty": l.quantity,
                    "uom": l.uom,
                    "unit_price": l.unit_price,
                    "unit_discount": l.unit_discount,
                    "gross": l.gross,
                    "discount": l.discount,
                    "taxable_base": l.taxable_base,
                    "tax": l.tax,
                    "net": l.net,
                    "promised_date": l.promised_delivery_date
                } for l in lines
            ],
            "technical_criteria": [
                {"criterion": "IEEE 802.3 Ethernet Compliance", "result": "Pass", "score": 100},
                {"criterion": "Dual Redundant Hot-Swappable Power Supplies", "result": "Pass", "score": 95},
                {"criterion": "24/7 Advance Hardware Replacement SLA", "result": "Pass", "score": 90},
                {"criterion": "Manufacturer Warranty Duration", "result": "5 Years", "score": 95}
            ]
        })

    return {
        "event_code": event.code,
        "event_title": event.title,
        "currency": event.currency,
        "suppliers": suppliers_comp,
        "best_recommendation": {
            "supplier_name": "Precision Components Ltd",
            "rationale": "Lowest evaluated total cost of ownership ($36,000.00 net inclusive of 5-year hardware SLA), highest technical compliance score (92.0%).",
            "proposed_award_amount": 36000.0
        }
    }

class AwardBidRequest(BaseModel):
    winning_supplier_id: int
    award_notes: str

@app.post("/api/v1/sourcing-events/{id}/award")
def award_bid(id: int, req: AwardBidRequest, db: Session = Depends(get_db)):
    event = db.query(SourcingEvent).filter(SourcingEvent.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sourcing event not found")
    
    event.status = "Awarded"
    event.stage = "Awarded"
    event.winning_supplier_id = req.winning_supplier_id
    event.award_status = "Approved"

    sup = db.query(Supplier).filter(Supplier.id == req.winning_supplier_id).first()
    
    # Auto-generate draft Purchase Order from approved award
    po_num = f"PO_2026_0{db.query(PurchaseOrder).count() + 142}"
    po = PurchaseOrder(
        po_number=po_num,
        supplier_id=sup.id,
        source_rfq=event.code,
        source_pr=event.linked_pr_number,
        status="Issued",
        approval_status="Approved",
        delivery_date="2026-11-20",
        buyer_name=event.buyer_name,
        department=event.department,
        gross_amount=32000.0,
        tax_amount=6000.0,
        net_amount=36000.0
    )
    db.add(po)
    db.commit()
    
    return {"status": "success", "message": f"Event awarded to {sup.legal_name}. PO {po_num} created.", "po_number": po_num}

# ----------------- EXTERNAL SUPPLIER BID RESPONSE (E11, Images 18, 22, 23) -----------------

@app.get("/api/v1/supplier/events")
def get_supplier_events(db: Session = Depends(get_db)):
    events = db.query(SourcingEvent).all()
    items = []
    for e in events:
        resp = db.query(BidResponse).filter(
            BidResponse.event_id == e.id,
            BidResponse.supplier_id == get_demo_session().get("supplier_id", 1)
        ).first()
        items.append({
            "id": e.id,
            "code": e.code,
            "title": e.title,
            "type": e.event_type,
            "delivery_location": e.delivery_location,
            "close_date": e.close_date.strftime("%Y-%m-%d %H:%M UTC") if e.close_date else "",
            "response_status": resp.status if resp else "Awaiting Participation",
            "response_code": resp.response_code if resp else "—",
            "net_quote": resp.net_quote if resp else None
        })
    return items

class SubmitBidResponseRequest(BaseModel):
    event_id: int
    quantity: float = 10.0
    unit_price: float = 3200.0
    unit_discount: float = 200.0
    tax_rate: float = 0.20
    is_tax_inclusive: bool = False
    promised_delivery_date: str = "2026-11-20"
    technical_remarks: str = "Compliant with all requested hardware specifications."

@app.post("/api/v1/supplier/responses/submit")
def submit_bid_response(req: SubmitBidResponseRequest, db: Session = Depends(get_db)):
    """
    Submits structured supplier bid, calculates totals according to Section I1:
    gross = q * p
    discount = q * d
    taxable_base = gross - discount
    net = taxable_base + tax
    """
    calc = calculate_quote_line(
        quantity=req.quantity,
        unit_price=req.unit_price,
        unit_discount=req.unit_discount,
        tax_rate=req.tax_rate,
        is_tax_inclusive=req.is_tax_inclusive
    )

    sup_id = get_demo_session().get("supplier_id", 1)
    sup = db.query(Supplier).filter(Supplier.id == sup_id).first()
    
    resp_code = f"RSP_{req.event_id}_{sup.code if sup else 'SUP'}"
    existing = db.query(BidResponse).filter(BidResponse.response_code == resp_code).first()
    
    if not existing:
        existing = BidResponse(
            event_id=req.event_id,
            supplier_id=sup_id,
            response_code=resp_code,
            status="Submitted",
            version=1
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    
    existing.gross_amount = calc["gross"]
    existing.discount_amount = calc["discount"]
    existing.taxable_base = calc["taxable_base"]
    existing.tax_amount = calc["tax"]
    existing.net_quote = calc["net"]
    existing.status = "Submitted"
    existing.version += 1
    existing.evaluator_remarks = req.technical_remarks
    
    # Generate receipt hash
    receipt_data = f"{resp_code}-{calc['net']}-{datetime.datetime.utcnow().isoformat()}"
    receipt_hash = hashlib.sha256(receipt_data.encode()).hexdigest()[:16].upper()

    db.commit()

    return {
        "status": "success",
        "message": "Bid response submitted successfully and frozen for evaluation.",
        "receipt": {
            "receipt_id": f"REC-{receipt_hash}",
            "response_code": resp_code,
            "version": existing.version,
            "calculated_financials": calc,
            "submitted_at": datetime.datetime.utcnow().isoformat()
        }
    }

# ----------------- PURCHASE ORDERS & RECEIVING (E13, Image 25) -----------------

@app.get("/api/v1/purchase-orders")
def get_purchase_orders(db: Session = Depends(get_db)):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).all()
    res = []
    for p in pos:
        sup = db.query(Supplier).filter(Supplier.id == p.supplier_id).first()
        res.append({
            "po": p,
            "supplier_name": sup.legal_name if sup else "Unknown"
        })
    return res

@app.get("/api/v1/purchase-orders/{id}")
def get_purchase_order_detail(id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    sup = db.query(Supplier).filter(Supplier.id == po.supplier_id).first()
    lines = db.query(POLine).filter(POLine.po_id == id).all()
    receipts = db.query(GoodsReceipt).filter(GoodsReceipt.po_id == id).all()
    invoices = db.query(Invoice).filter(Invoice.po_id == id).all()

    return {
        "po": po,
        "supplier": sup,
        "lines": lines,
        "receipts": receipts,
        "invoices": invoices,
        "approval_history": [
            {"actor": "Marcus Vance (Buyer)", "action": "Created Draft PO from Award", "date": "2026-11-03 10:00"},
            {"actor": "David Chen (Finance Approver)", "action": "Approved PO Budget Commitment", "date": "2026-11-03 11:30"}
        ]
    }

class ReceiveGoodsRequest(BaseModel):
    accepted_qty: float
    rejected_qty: float = 0.0
    inspection_notes: str = "Passed incoming quality inspection without defects."

@app.post("/api/v1/purchase-orders/{id}/receive")
def receive_po_goods(id: int, req: ReceiveGoodsRequest, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    rcpt_num = f"GRN_2026_0{db.query(GoodsReceipt).count() + 1}"
    receipt = GoodsReceipt(
        receipt_number=rcpt_num,
        po_id=id,
        receiver_name=get_demo_session()["full_name"],
        accepted_qty=req.accepted_qty,
        rejected_qty=req.rejected_qty,
        status="Accepted",
        inspection_notes=req.inspection_notes
    )
    db.add(receipt)
    
    # Update line received qtys
    poline = db.query(POLine).filter(POLine.po_id == id).first()
    if poline:
        poline.received_qty += (req.accepted_qty + req.rejected_qty)
        poline.accepted_qty += req.accepted_qty
        poline.rejected_qty += req.rejected_qty

    po.receipt_status = "Fully Received" if req.accepted_qty >= (poline.ordered_qty if poline else 0) else "Partially Received"
    db.commit()
    
    return {"status": "success", "message": f"Goods receipt {rcpt_num} recorded.", "receipt": receipt}

# ----------------- INVOICES (E14) -----------------

@app.get("/api/v1/invoices")
def get_invoices(db: Session = Depends(get_db)):
    invs = db.query(Invoice).order_by(Invoice.id.desc()).all()
    res = []
    for i in invs:
        sup = db.query(Supplier).filter(Supplier.id == i.supplier_id).first()
        res.append({
            "invoice": i,
            "supplier_name": sup.legal_name if sup else "Unknown"
        })
    return res

@app.get("/api/v1/invoices/{id}")
def get_invoice_detail(id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    sup = db.query(Supplier).filter(Supplier.id == inv.supplier_id).first()
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == inv.po_id).first() if inv.po_id else None
    
    return {
        "invoice": inv,
        "supplier": sup,
        "po": po,
        "matching_comparison": {
            "po_amount": po.net_amount if po else 0,
            "receipt_accepted_qty": 10,
            "invoice_qty": 10,
            "variance_amount": 0.0,
            "tolerance_status": "Within Zero-Tolerance Limit"
        }
    }

@app.post("/api/v1/invoices/{id}/approve")
def approve_invoice(id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "Approved"
    
    # Update linked PO invoice status
    if inv.po_id:
        po = db.query(PurchaseOrder).filter(PurchaseOrder.id == inv.po_id).first()
        if po:
            po.invoice_status = "Fully Invoiced"
    
    db.commit()
    return {"status": "success", "message": f"Invoice {inv.invoice_number} approved for payment release."}

# ----------------- AUCTIONS (E12, Image 14) -----------------

def _auction_currency(a: Auction) -> str:
    """All auctions are presented in rupees (override with AUCTION_CURRENCY)."""
    return os.getenv("AUCTION_CURRENCY", "INR").strip().upper() or "INR"


def _serialize_auction(a: Auction) -> dict:
    return {
        "id": a.id,
        "auction_number": a.auction_number,
        "title": a.title,
        "auction_type": a.auction_type,
        "status": a.status,
        "pr_number": a.pr_number,
        "current_approver": a.current_approver,
        "start_time": a.start_time.isoformat() + "Z" if a.start_time else None,
        "end_time": a.end_time.isoformat() + "Z" if a.end_time else None,
        "reserve_price": float(a.reserve_price or 0),
        "min_decrement": float(a.min_decrement or 0),
        "min_bid_improvement": float(getattr(a, "min_bid_improvement", None) or a.min_decrement or 5000),
        "current_best_bid": float(a.current_best_bid or 0),
        "best_bidder_id": a.best_bidder_id,
        "total_bids_placed": int(a.total_bids_placed or 0),
        "freight_fixed": float(getattr(a, "freight_fixed", None) or 0),
        "tax_rate_pct": float(a.tax_rate_pct) if getattr(a, "tax_rate_pct", None) is not None else 18.0,
        "visibility": getattr(a, "visibility", None) or "own_rank_only",
        "terms_version": getattr(a, "terms_version", None) or "3",
        "extensions_used": int(getattr(a, "extensions_used", None) or 0),
        "max_extensions": int(getattr(a, "max_extensions", None) or 5),
        "currency": _auction_currency(a),
    }


def _compute_auction_evaluated_total(auc: Auction, line_items: List[AuctionLineItem], rates_by_id: dict) -> tuple:
    material = 0.0
    for ln in line_items:
        rate = float(rates_by_id.get(ln.id, ln.last_rate))
        material += float(ln.quantity) * rate
    freight = float(getattr(auc, "freight_fixed", None) or 0)
    tax_pct = float(auc.tax_rate_pct) if getattr(auc, "tax_rate_pct", None) is not None else 18.0
    tax = (material + freight) * (tax_pct / 100.0)
    return material, freight, tax, material + freight + tax


@app.get("/api/v1/auctions/{id}/live-console")
def get_auction_live_console(id: int, db: Session = Depends(get_db)):
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    _close_if_expired(db, auc)
    supplier_id = get_demo_session().get("supplier_id") or 1
    lines = db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == id).order_by(AuctionLineItem.id).all()
    if not lines and auc.auction_number == "AUC_2026_013":
        lines = [
            AuctionLineItem(id=-1, auction_id=id, line_code="SCR-01", description="HMS 1", quantity=60, uom="MT", last_rate=48500),
            AuctionLineItem(id=-2, auction_id=id, line_code="SCR-02", description="HMS 2", quantity=40, uom="MT", last_rate=46200),
        ]
    my_receipts = (
        db.query(AuctionBidReceipt)
        .filter(AuctionBidReceipt.auction_id == id, AuctionBidReceipt.supplier_id == supplier_id)
        .order_by(AuctionBidReceipt.created_at.desc(), AuctionBidReceipt.id.desc())
        .all()
    )
    last_accepted = my_receipts[0] if my_receipts else None
    my_last_rates = {
        x.get("line_code"): float(x.get("new_rate"))
        for x in ((last_accepted.line_rates or []) if last_accepted else [])
        if isinstance(x, dict) and x.get("new_rate") is not None
    }
    line_payload = [
        {
            "id": ln.id,
            "line_code": ln.line_code,
            "description": ln.description,
            "quantity": float(ln.quantity),
            "uom": ln.uom,
            "last_rate": my_last_rates.get(ln.line_code, float(ln.last_rate)),
        }
        for ln in lines
    ]
    history = [
        {
            "receipt_id": r.receipt_id,
            "accepted_at": r.created_at.isoformat() + "Z" if r.created_at else None,
            "evaluated_total": float(r.evaluated_total),
            "rank_at_acceptance": r.rank_at_acceptance,
            "outcome": r.outcome,
        }
        for r in my_receipts
    ]
    my_rank = _rank_supplier_on_auction(db, auc, supplier_id)
    best_map = _supplier_best_totals(db, auc)
    fwd = _is_forward(auc)
    min_imp = float(getattr(auc, "min_bid_improvement", None) or auc.min_decrement or 0)
    my_best = best_map.get(supplier_id)
    ahead = sorted([v for v in best_map.values() if my_best is None or (v > my_best if fwd else v < my_best)], reverse=fwd)
    leader_val = (max(best_map.values()) if fwd else min(best_map.values())) if best_map else None
    # Bid required to beat the supplier directly above (next rank) / the leader (rank 1)
    next_rank_target = None
    if ahead:
        rival = ahead[-1]  # sorted best-first, so the last entry is the rival directly above me
        next_rank_target = rival + min_imp if fwd else rival - min_imp
    lead_target = None
    if leader_val is not None and my_rank != 1:
        lead_target = leader_val + min_imp if fwd else leader_val - min_imp
    visibility_label = "Own rank only" if (getattr(auc, "visibility", None) or "own_rank_only") == "own_rank_only" else "Full leaderboard"
    return {
        "auction": _serialize_auction(auc),
        "bidding_allowed": auc.status == "Live",
        "lines": line_payload,
        "commercial_conditions": {
            "freight_fixed": float(getattr(auc, "freight_fixed", None) or 0),
            "delivery_terms": "Plant gate delivery within 7 calendar days of award",
            "tax_note": f"GST {float(getattr(auc, 'tax_rate_pct', None) or 18):.0f}% on material + freight (illustrative)",
            "payment_terms": "Net 30 days from GRN (fixed)",
            "terms_version": getattr(auc, "terms_version", None) or "3",
            "terms_accepted": True,
        },
        "session": {
            "your_last_accepted_total": float(last_accepted.evaluated_total) if last_accepted else None,
            "your_last_receipt_id": last_accepted.receipt_id if last_accepted else None,
            "your_last_accepted_at": last_accepted.created_at.isoformat() + "Z" if last_accepted and last_accepted.created_at else None,
            "your_current_rank": my_rank,
            "total_bidders": len(best_map),
            "your_best_total": my_best,
            "leader_total": leader_val,
            "bid_to_take_lead": lead_target,
            "bid_to_gain_one_rank": next_rank_target,
            "visibility": visibility_label,
            "online": True,
        },
        "bid_history": history,
    }


def _ist_time_label(dt: Optional[datetime.datetime]) -> str:
    if not dt:
        return "—"
    return dt.strftime("%H:%M:%S") + " IST"


def _leaderboard_from_receipts(db: Session, auc: Auction, all_receipts: list) -> list:
    """Build supplier leaderboard from stored bid receipts (no synthetic rows)."""
    best_by_supplier: dict = {}
    bids_count: dict = {}
    last_bid_at: dict = {}
    for r in sorted(all_receipts, key=lambda x: x.created_at or datetime.datetime.min):
        sid = r.supplier_id
        val = float(r.evaluated_total)
        bids_count[sid] = bids_count.get(sid, 0) + 1
        last_bid_at[sid] = r.created_at
        prev = best_by_supplier.get(sid)
        if prev is None:
            best_by_supplier[sid] = val
        elif auc.auction_type == "Forward Disposal":
            best_by_supplier[sid] = max(prev, val)
        else:
            best_by_supplier[sid] = min(prev, val)

    rows = []
    for sid, total in best_by_supplier.items():
        sup = db.query(Supplier).filter(Supplier.id == sid).first()
        name = (sup.trading_name or sup.legal_name) if sup else f"Supplier #{sid}"
        erp = (sup.code if sup and sup.code else f"SUP_{sid:05d}")
        rows.append({
            "supplier_id": sid,
            "supplier_name": name,
            "erp_code": erp,
            "evaluated_total": total,
            "bids_count": bids_count.get(sid, 0),
            "last_bid_at": _ist_time_label(last_bid_at.get(sid)),
        })

    if auc.auction_type == "Forward Disposal":
        rows.sort(key=lambda x: x["evaluated_total"], reverse=True)
    else:
        rows.sort(key=lambda x: x["evaluated_total"])

    best = float(auc.current_best_bid or 0)
    leaderboard = []
    for idx, row in enumerate(rows):
        if idx == 0:
            gap = 0.0
        elif auc.auction_type == "Forward Disposal":
            gap = max(0.0, best - row["evaluated_total"])
        else:
            gap = max(0.0, row["evaluated_total"] - best)
        is_leader = auc.best_bidder_id == row["supplier_id"] and idx == 0
        leaderboard.append({
            "rank": idx + 1,
            "supplier_name": row["supplier_name"],
            "erp_code": row["erp_code"],
            "evaluated_total": row["evaluated_total"],
            "gap_to_best": gap,
            "bids_count": row["bids_count"],
            "last_bid_at": row["last_bid_at"],
            "status": "Leading" if is_leader or idx == 0 else "Eligible",
        })
    return leaderboard


def _price_history_from_receipts(auc: Auction, all_receipts: list, baseline: float, best_total: float) -> list:
    if not all_receipts:
        return [
            {"label": "Opening", "value": float(baseline)},
            {"label": "Now", "value": float(best_total)},
        ]
    chrono = sorted(all_receipts, key=lambda r: r.created_at or datetime.datetime.min)
    points = [{"label": "Opening", "value": float(baseline)}]
    for r in chrono[-12:]:
        points.append({
            "label": _ist_time_label(r.created_at),
            "value": float(r.evaluated_total),
        })
    if points[-1]["value"] != best_total:
        points.append({"label": "Now", "value": float(best_total)})
    return points[-10:]


@app.get("/api/v1/auctions/{id}/monitor")
def get_auction_monitor(id: int, db: Session = Depends(get_db)):
    """Procurement buyer live auction console — leaderboard, lots, metrics, activity."""
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    _close_if_expired(db, auc)

    cur = _auction_currency(auc)
    best_total = float(auc.current_best_bid or 0)
    baseline = float(auc.reserve_price or 3500000.0)
    savings_amt = max(0.0, baseline - best_total)
    savings_pct = round((savings_amt / baseline) * 100, 2) if baseline else 0.0

    best_sup = db.query(Supplier).filter(Supplier.id == auc.best_bidder_id).first() if auc.best_bidder_id else None
    best_name = (best_sup.trading_name or best_sup.legal_name) if best_sup else "—"

    all_receipts = (
        db.query(AuctionBidReceipt)
        .filter(AuctionBidReceipt.auction_id == id)
        .order_by(AuctionBidReceipt.created_at.desc())
        .all()
    )
    last_accepted = all_receipts[0] if all_receipts else None
    leaderboard = _leaderboard_from_receipts(db, auc, all_receipts)
    distinct_bidders = len({r.supplier_id for r in all_receipts})

    ext_used = int(getattr(auc, "extensions_used", None) or 0)
    ext_max = int(getattr(auc, "max_extensions", None) or 5)
    next_skip = auc.end_time + datetime.timedelta(minutes=13) if auc.end_time else None

    auc_lines = db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == id).all()
    line_count = len(auc_lines)
    qty_label = f"{int(sum(float(l.quantity) for l in auc_lines))} units · {line_count} items" if line_count else "1 lot · open bid"
    lot_title = (auc.title or "Live lot")[:56]
    lots = [
        {
            "lot_code": "LOT-1",
            "status": "LIVE" if auc.status == "Live" else auc.status.upper(),
            "title": lot_title,
            "quantity_label": qty_label,
            "best_total": best_total,
            "currency": cur,
        },
    ]
    price_history = _price_history_from_receipts(auc, all_receipts, baseline, best_total)

    activity = []
    for r in all_receipts[:12]:
        sup = db.query(Supplier).filter(Supplier.id == r.supplier_id).first()
        name = sup.trading_name or sup.legal_name if sup else "Supplier"
        activity.append({
            "time": _ist_time_label(r.created_at),
            "message": f"{name} — {r.receipt_id} accepted · {cur} {r.evaluated_total:,.2f}",
        })
    if auc.status == "Live" and int(auc.extensions_used or 0) > 0:
        activity.insert(0, {
            "time": _ist_time_label(datetime.datetime.utcnow()),
            "message": f"Close extended — extension {auc.extensions_used} active",
        })
    activity = activity[:8]

    pr_label = auc.pr_number or "—"
    category = "Forward disposal" if auc.auction_type == "Forward Disposal" else "Reverse procurement"
    lot_banner = (
        "Forward auction · LOT-1 (Higher bid ranks better)"
        if auc.auction_type == "Forward Disposal"
        else "Reverse auction · LOT-1 (Lower evaluated total ranks better)"
    )

    return {
        "auction": _serialize_auction(auc),
        "header": {
            "title": "Live auction console",
            "subtitle": f"{auc.auction_number.replace('_', '-')} / {pr_label} / {category}",
            "lot_banner": lot_banner,
            "closes_at": _ist_time_label(auc.end_time),
            "extension_label": f"Extension {ext_used} of {ext_max} · Next skip {_ist_time_label(next_skip)}",
            "connected": True,
        },
        "metrics": {
            "current_best_evaluated": best_total,
            "current_best_supplier": (
                f"{leaderboard[0]['supplier_name']} · Rank 1" if leaderboard else (f"{best_name} · Rank 1" if best_name != "—" else "No bids yet")
            ),
            "provisional_savings_pct": savings_pct,
            "provisional_savings_amount": savings_amt,
            "baseline_total": baseline,
            "participation_bidding": distinct_bidders,
            "participation_invited": max(distinct_bidders, 1),
            "participation_admitted": max(distinct_bidders, 1),
            "accepted_bids_count": len(all_receipts),
            "last_accepted_at": _ist_time_label(last_accepted.created_at if last_accepted else None),
            "live_health": "Up to date",
            "sequence": len(all_receipts),
            "currency": cur,
        },
        "lots": lots,
        "leaderboard": leaderboard,
        "price_history": price_history,
        "activity": activity,
    }


def _next_auction_number(db: Session) -> str:
    year = datetime.datetime.utcnow().year
    prefix = f"AUC_{year}_"
    existing = (
        db.query(Auction.auction_number)
        .filter(Auction.auction_number.like(f"{prefix}%"))
        .all()
    )
    seq = 0
    for (num,) in existing:
        try:
            seq = max(seq, int(str(num).split("_")[-1]))
        except ValueError:
            continue
    return f"{prefix}{seq + 1:03d}"


def _is_forward(auc: Auction) -> bool:
    return auc.auction_type == "Forward Disposal"


def _supplier_best_totals(db: Session, auc: Auction) -> dict:
    """Best bid per supplier (reverse: lowest, forward: highest) from stored receipts."""
    best: dict = {}
    rows = db.query(AuctionBidReceipt).filter(AuctionBidReceipt.auction_id == auc.id).all()
    for r in rows:
        v = float(r.evaluated_total)
        prev = best.get(r.supplier_id)
        if prev is None or (v > prev if _is_forward(auc) else v < prev):
            best[r.supplier_id] = v
    return best


def _rank_supplier_on_auction(db: Session, auc: Auction, supplier_id: int, new_total: Optional[float] = None) -> Optional[int]:
    """1 = leading. Uses each supplier's best bid; optional new_total simulates a pending bid."""
    best = _supplier_best_totals(db, auc)
    if new_total is not None:
        prev = best.get(supplier_id)
        v = float(new_total)
        if prev is None or (v > prev if _is_forward(auc) else v < prev):
            best[supplier_id] = v
    if supplier_id not in best:
        return None
    mine = best[supplier_id]
    better = sum(1 for v in best.values() if (v > mine if _is_forward(auc) else v < mine))
    return better + 1


def _close_if_expired(db: Session, auc: Auction) -> Auction:
    """Auto-close a Live auction whose timer has run out."""
    if auc.status == "Live" and auc.end_time and auc.end_time <= datetime.datetime.utcnow():
        auc.status = "Award Under Process" if (auc.total_bids_placed or 0) > 0 else "Closed"
        db.commit()
        db.refresh(auc)
    return auc


def _anon_label(idx: int) -> str:
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return f"Bidder {letters[idx % 26]}" + (str(idx // 26 + 1) if idx >= 26 else "")


@app.get("/api/v1/auctions/{id}/analytics")
def get_auction_analytics(id: int, view: str = "buyer", db: Session = Depends(get_db)):
    """Bar-chart analytics: rank ladder, bids per supplier, bid-by-bid timeline.
    view=supplier anonymises competitors (sealed bid)."""
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    _close_if_expired(db, auc)
    me = get_demo_session().get("supplier_id") or 1
    receipts = (
        db.query(AuctionBidReceipt)
        .filter(AuctionBidReceipt.auction_id == id)
        .order_by(AuctionBidReceipt.created_at.asc(), AuctionBidReceipt.id.asc())
        .all()
    )
    best = _supplier_best_totals(db, auc)
    ordered = sorted(best.items(), key=lambda kv: kv[1], reverse=_is_forward(auc))
    counts: dict = {}
    for r in receipts:
        counts[r.supplier_id] = counts.get(r.supplier_id, 0) + 1
    anonymise = view == "supplier"
    bars = []
    for idx, (sid, total) in enumerate(ordered):
        sup = db.query(Supplier).filter(Supplier.id == sid).first()
        real = (sup.trading_name or sup.legal_name) if sup else f"Supplier #{sid}"
        is_me = sid == me
        label = "You" if (anonymise and is_me) else (_anon_label(idx) if anonymise else real)
        bars.append({
            "rank": idx + 1,
            "label": label,
            "supplier_id": sid if (not anonymise or is_me) else None,
            "value": total,
            "bids": counts.get(sid, 0),
            "is_me": is_me,
        })
    timeline = []
    for i, r in enumerate(receipts[-20:], start=max(1, len(receipts) - 19)):
        timeline.append({
            "seq": i,
            "label": f"#{i}",
            "value": float(r.evaluated_total),
            "time": _ist_time_label(r.created_at),
            "is_me": r.supplier_id == me,
        })
    leader = ordered[0][1] if ordered else None
    my_best = best.get(me)
    return {
        "auction_id": id,
        "currency": _auction_currency(auc),
        "auction_type": auc.auction_type,
        "status": auc.status,
        "reserve_price": float(auc.reserve_price or 0),
        "leader_value": leader,
        "my_best": my_best,
        "my_rank": _rank_supplier_on_auction(db, auc, me),
        "total_bidders": len(best),
        "total_bids": len(receipts),
        "rank_bars": bars,
        "timeline_bars": timeline,
    }


@app.get("/api/v1/auctions")
def get_auctions(db: Session = Depends(get_db)):
    aucs = db.query(Auction).all()
    for a in aucs:
        _close_if_expired(db, a)
    status_order = {"Live": 0, "Scheduled": 1, "Award Under Process": 2, "Closed": 3}
    aucs.sort(key=lambda a: (status_order.get(a.status, 9), -(a.id or 0)))
    return [_serialize_auction(a) for a in aucs]


class CreateAuctionLineRequest(BaseModel):
    line_code: str
    description: str
    quantity: float = 1.0
    uom: str = "Unit"
    last_rate: float


class CreateAuctionRequest(BaseModel):
    title: str
    auction_type: str = "Reverse Sourcing"
    status: str = "Live"
    pr_number: Optional[str] = None
    current_approver: Optional[str] = "Marcus Vance"
    reserve_price: Optional[float] = None
    min_decrement: Optional[float] = None
    min_bid_improvement: Optional[float] = None
    freight_fixed: Optional[float] = 0.0
    tax_rate_pct: Optional[float] = 18.0
    currency: Optional[str] = "INR"
    duration_hours: float = 2.0
    lines: Optional[List[CreateAuctionLineRequest]] = None


@app.post("/api/v1/auctions")
def create_auction(req: CreateAuctionRequest, db: Session = Depends(get_db)):
    if req.auction_type not in ("Reverse Sourcing", "Forward Disposal"):
        raise HTTPException(status_code=400, detail="auction_type must be Reverse Sourcing or Forward Disposal")
    status = req.status if req.status in ("Scheduled", "Live") else "Live"
    now = datetime.datetime.utcnow()
    start = now if status == "Live" else now + datetime.timedelta(minutes=5)
    end = start + datetime.timedelta(hours=max(0.5, float(req.duration_hours or 2)))

    currency = _auction_currency(None)
    min_dec = float(req.min_decrement or (500 if req.auction_type == "Forward Disposal" else 2500))
    min_imp = float(req.min_bid_improvement or min_dec)
    freight = float(req.freight_fixed or 0)
    tax_pct = float(req.tax_rate_pct) if req.tax_rate_pct is not None else 18.0

    line_items: List[AuctionLineItem] = []
    if req.lines:
        for ln in req.lines:
            line_items.append(
                AuctionLineItem(
                    line_code=ln.line_code.strip(),
                    description=ln.description.strip(),
                    quantity=float(ln.quantity),
                    uom=ln.uom or "Unit",
                    last_rate=float(ln.last_rate),
                )
            )

    if req.auction_type == "Reverse Sourcing" and not line_items:
        raise HTTPException(status_code=400, detail="Reverse auctions require at least one line item.")

    reserve = float(req.reserve_price) if req.reserve_price is not None else None
    if reserve is None:
        if line_items:
            material = sum(float(ln.quantity) * float(ln.last_rate) for ln in line_items)
            tax = (material + freight) * (tax_pct / 100.0)
            reserve = material + freight + tax
        else:
            reserve = 50000.0 if req.auction_type == "Forward Disposal" else 100000.0

    auc = Auction(
        auction_number=_next_auction_number(db),
        title=req.title.strip(),
        auction_type=req.auction_type,
        status=status,
        pr_number=req.pr_number,
        current_approver=req.current_approver or "Marcus Vance",
        start_time=start,
        end_time=end,
        reserve_price=reserve,
        min_decrement=min_dec,
        min_bid_improvement=min_imp,
        current_best_bid=reserve,
        best_bidder_id=None,
        total_bids_placed=0,
        freight_fixed=freight,
        tax_rate_pct=tax_pct,
        currency=currency,
        extensions_used=0,
        max_extensions=5,
    )
    db.add(auc)
    db.flush()
    for ln in line_items:
        ln.auction_id = auc.id
        db.add(ln)
    if status == "Live":
        _notify_suppliers_auction_live(db, auc)
    db.commit()
    db.refresh(auc)
    return _serialize_auction(auc)


class UpdateAuctionRequest(BaseModel):
    status: Optional[str] = None
    duration_hours: Optional[float] = None


@app.patch("/api/v1/auctions/{id}")
def update_auction(id: int, req: UpdateAuctionRequest, db: Session = Depends(get_db)):
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    now = datetime.datetime.utcnow()
    went_live = False
    if req.status:
        if req.status not in ("Scheduled", "Live", "Closed", "Award Under Process"):
            raise HTTPException(status_code=400, detail="Invalid status")
        went_live = req.status == "Live" and auc.status != "Live"
        auc.status = req.status
        if req.status == "Live":
            if not auc.start_time or auc.start_time > now:
                auc.start_time = now
            hours = float(req.duration_hours or 2)
            auc.end_time = now + datetime.timedelta(hours=max(0.5, hours))
    elif req.duration_hours and auc.status == "Live":
        auc.end_time = now + datetime.timedelta(hours=max(0.5, float(req.duration_hours)))
    if went_live:
        _notify_suppliers_auction_live(db, auc)
    db.commit()
    db.refresh(auc)
    return _serialize_auction(auc)


@app.get("/api/v1/auctions/{id}")
def get_auction(id: int, db: Session = Depends(get_db)):
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    return _serialize_auction(auc)

class AuctionLineRateInput(BaseModel):
    line_id: int
    new_rate: float

class PlaceAuctionBidRequest(BaseModel):
    bid_amount: Optional[float] = None
    line_rates: Optional[List[AuctionLineRateInput]] = None

@app.post("/api/v1/auctions/{id}/bid")
def place_auction_bid(id: int, req: PlaceAuctionBidRequest, db: Session = Depends(get_db)):
    auc = db.query(Auction).filter(Auction.id == id).first()
    if not auc:
        raise HTTPException(status_code=404, detail="Auction not found")
    _close_if_expired(db, auc)
    if auc.status != "Live":
        raise HTTPException(status_code=400, detail="This auction is not open for bidding (Live lots only).")

    supplier_id = get_demo_session().get("supplier_id") or 1
    line_items = db.query(AuctionLineItem).filter(AuctionLineItem.auction_id == id).order_by(AuctionLineItem.id).all()
    cur = _auction_currency(auc)

    evaluated_total = req.bid_amount
    rates_snapshot = []
    rates_by_id: dict = {}
    if req.line_rates and line_items:
        valid_rates = [lr for lr in req.line_rates if lr.line_id > 0]
        rates_by_id = {lr.line_id: lr.new_rate for lr in valid_rates} if valid_rates else {}
        if not rates_by_id and req.bid_amount is not None:
            evaluated_total = req.bid_amount
        elif rates_by_id:
            material, freight, tax, evaluated_total = _compute_auction_evaluated_total(auc, line_items, rates_by_id)
            for ln in line_items:
                rates_snapshot.append({
                    "line_code": ln.line_code,
                    "new_rate": float(rates_by_id.get(ln.id, ln.last_rate)),
                })
        else:
            raise HTTPException(status_code=400, detail="Provide bid_amount or valid line_rates")
    elif evaluated_total is None:
        raise HTTPException(status_code=400, detail="Provide bid_amount or line_rates")

    min_improve = float(getattr(auc, "min_bid_improvement", None) or auc.min_decrement or 5000)
    last_receipt = (
        db.query(AuctionBidReceipt)
        .filter(AuctionBidReceipt.auction_id == id, AuctionBidReceipt.supplier_id == supplier_id)
        .order_by(AuctionBidReceipt.created_at.desc())
        .first()
    )
    evaluated_total = float(evaluated_total)
    if evaluated_total <= 0:
        raise HTTPException(status_code=400, detail="Bid must be greater than zero.")
    fwd = _is_forward(auc)
    opening = float(auc.reserve_price or 0)

    # A supplier may re-bid any time, as long as each bid improves on their OWN previous bid.
    # They do not have to beat the current leader in one step - that is how rank climbs.
    if last_receipt:
        own = float(last_receipt.evaluated_total)
        if fwd and evaluated_total < own + min_improve:
            raise HTTPException(status_code=400, detail=f"Raise your own bid by at least {cur} {min_improve:,.0f} (your last bid: {cur} {own:,.2f}).")
        if not fwd and evaluated_total > own - min_improve:
            raise HTTPException(status_code=400, detail=f"Lower your own bid by at least {cur} {min_improve:,.0f} (your last bid: {cur} {own:,.2f}).")
    else:
        if fwd and evaluated_total <= opening:
            raise HTTPException(status_code=400, detail=f"Opening bid must be higher than the starting price {cur} {opening:,.2f}.")
        if not fwd and opening and evaluated_total >= opening:
            raise HTTPException(status_code=400, detail=f"Opening bid must be lower than the starting price {cur} {opening:,.2f}.")

    current_best = float(auc.current_best_bid or 0)
    is_new_best = (evaluated_total > current_best) if fwd else (evaluated_total < current_best)
    if is_new_best:
        auc.current_best_bid = evaluated_total
        auc.best_bidder_id = supplier_id

    auc.total_bids_placed = int(auc.total_bids_placed or 0) + 1
    rank = _rank_supplier_on_auction(db, auc, supplier_id, evaluated_total)
    if auc.end_time and (auc.end_time - datetime.datetime.utcnow()).total_seconds() < 120:
        ext_used = int(getattr(auc, "extensions_used", None) or 0)
        ext_max = int(getattr(auc, "max_extensions", None) or 5)
        if ext_used < ext_max:
            auc.extensions_used = ext_used + 1
            auc.end_time = auc.end_time + datetime.timedelta(minutes=2)

    receipt_id = f"BID-{id}-{int(auc.total_bids_placed or 0)}"
    db.add(
        AuctionBidReceipt(
            auction_id=id,
            supplier_id=supplier_id,
            receipt_id=receipt_id,
            evaluated_total=evaluated_total,
            rank_at_acceptance=rank,
            outcome="Accepted",
            line_rates=rates_snapshot or None,
        )
    )
    db.commit()
    db.refresh(auc)

    return {
        "status": "success",
        "message": f"Bid accepted — {cur} {evaluated_total:,.2f} · you are now rank {rank} (receipt {receipt_id})",
        "rank": rank,
        "receipt_id": receipt_id,
        "evaluated_total": evaluated_total,
        "current_best": auc.current_best_bid,
        "auction": _serialize_auction(auc),
    }

# ----------------- CONTRACTS & CLAUSES (E15, Image 29) -----------------

@app.get("/api/v1/contracts")
def get_contracts(db: Session = Depends(get_db)):
    ctrs = db.query(Contract).all()
    res = []
    for c in ctrs:
        sup = db.query(Supplier).filter(Supplier.id == c.supplier_id).first()
        res.append({
            "contract": c,
            "supplier_name": sup.legal_name if sup else "Unknown"
        })
    return res

@app.get("/api/v1/clauses")
def get_clauses(clause_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Clause)
    if clause_type and clause_type != "All":
        query = query.filter(Clause.clause_type == clause_type)
    return query.all()

class CreateClauseRequest(BaseModel):
    name: str
    clause_type: str
    description: str

@app.post("/api/v1/clauses")
def create_clause(req: CreateClauseRequest, db: Session = Depends(get_db)):
    code = f"CLS-{req.clause_type[:3].upper()}-0{db.query(Clause).count() + 1}"
    clause = Clause(
        code=code,
        name=req.name,
        clause_type=req.clause_type,
        description=req.description,
        is_standard=True
    )
    db.add(clause)
    db.commit()
    return {"status": "success", "clause": clause}

# ----------------- BUDGETS & SPEND (E16) -----------------

@app.get("/api/v1/budgets")
def get_budgets(db: Session = Depends(get_db)):
    return db.query(Budget).all()

@app.get("/api/v1/analytics/spend")
def get_spend_analytics():
    return {
        "categories": [
            {"category": "IT & Networking Hardware", "spend": 420000.0, "share": 38.5},
            {"category": "Logistics & Freight Services", "spend": 280000.0, "share": 25.7},
            {"category": "Plant & Industrial Machinery", "spend": 195000.0, "share": 17.9},
            {"category": "Corporate Facilities & Admin", "spend": 110000.0, "share": 10.1},
            {"category": "Professional Consulting", "spend": 85000.0, "share": 7.8}
        ],
        "supplier_concentration": [
            {"supplier": "Precision Components Ltd", "annual_spend": 310000.0, "status": "Strategic Preferred"},
            {"supplier": "Apex Global Logistics", "annual_spend": 245000.0, "status": "Approved Carrier"},
            {"supplier": "Vertex Industrial Tools", "annual_spend": 160000.0, "status": "Tier-1 Vendor"}
        ],
        "savings_summary": {
            "identified": 128000.0,
            "negotiated": 84500.0,
            "contracted": 72000.0,
            "realized": 61400.0
        }
    }

# ----------------- WORKFLOWS & ERP SETTINGS (Images 10, 13) -----------------

@app.get("/api/v1/workflows")
def get_workflows(db: Session = Depends(get_db)):
    return db.query(ApprovalWorkflow).all()

@app.get("/api/v1/integrations/erp")
def get_erp_connection():
    return {
        "system_type": "SAP S/4HANA Cloud",
        "connection_name": "Production Corporate ERP Connector",
        "api_url": "https://api.s4hana.enterprise.corp/odata/v4/procurement",
        "auth_method": "OAuth 2.0 mTLS",
        "status": "Connected & Synchronized",
        "last_sync": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "entity_mappings": [
            {"entity": "Supplier Master", "direction": "Bidirectional", "sync_state": "Synced"},
            {"entity": "Purchase Orders", "direction": "Export to ERP", "sync_state": "Synced"},
            {"entity": "Invoices", "direction": "Import for 3-Way Match", "sync_state": "Synced"}
        ]
    }

@app.post("/api/v1/integrations/erp/test")
def test_erp_connection():
    return {
        "status": "success",
        "tested_at": datetime.datetime.utcnow().isoformat(),
        "latency_ms": 42,
        "message": "Connection handshake verified. SAP OData gateway endpoints responding with HTTP 200."
    }

# ----------------- AI COPILOT & PROPOSALS (Images 27, 28) -----------------

class AiNegotiationRequest(BaseModel):
    event_id: int
    supplier_id: int

@app.post("/api/v1/ai/negotiation-proposal")
def generate_ai_negotiation_proposal(req: AiNegotiationRequest, db: Session = Depends(get_db)):
    """
    Produces market intelligence, benchmark comparison, and talking points
    matching Images 27 & 28 of SellMyGoods spec.
    """
    sup = db.query(Supplier).filter(Supplier.id == req.supplier_id).first()
    return {
        "supplier_name": sup.legal_name if sup else "Precision Components Ltd",
        "market_price_intelligence": {
            "current_quote": 36000.0,
            "historical_po_benchmark": 33200.0,
            "regional_market_median": 34100.0,
            "suggested_target_price": 33500.0,
            "estimated_savings_potential": 2500.0,
            "confidence_score": 92.4
        },
        "quality_scores": {
            "technical_compliance": 92.0,
            "on_time_delivery_record": 98.2,
            "warranty_terms": "5-Year Full Replacement (Exceeds 3-Year RFP Requirement)"
        },
        "talking_points": [
            "Leverage historical volume commitment across PR_00084 and pending Q1 demand to request an additional 4% unit discount.",
            "Highlight competitive quote from alternative tier-1 distributor offering $3,100 unit pricing with 48-hour delivery.",
            "Propose accelerated Net 15 payment terms in exchange for waiving initial warranty surcharge."
        ]
    }

class AiPrDraftRequest(BaseModel):
    prompt: str

@app.post("/api/v1/ai/pr-assistant")
def ai_draft_pr(req: AiPrDraftRequest):
    return {
        "suggested_title": "Enterprise Cloud & Network Infrastructure Expansion",
        "suggested_department": "Information Technology",
        "suggested_category": "Networking Hardware",
        "proposed_lines": [
            {"description": "Cisco Catalyst 9300 48-Port Switch", "quantity": 10, "uom": "Unit", "estimated_unit_price": 3200.0},
            {"description": "10G SFP+ Optical Transceiver Modules", "quantity": 20, "uom": "Piece", "estimated_unit_price": 180.0}
        ],
        "estimated_total": 35600.0,
        "currency": "USD",
        "confidence_reasoning": "Synthesized from historical purchase records in CAT-IT-NET and current supplier catalog agreements."
    }

# ----------------- STATIC FILES & FRONTEND SPA -----------------

# Mount static files if directory exists
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=static_dir), name="assets")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # If API route, don't serve SPA
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Procurio API is active. React frontend is building..."}
