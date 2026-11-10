"""Run: python -m pytest tests -q   (uses a throw-away SQLite DB; NetSuite HTTP is mocked)."""
import os, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
_db = os.path.join(tempfile.mkdtemp(), "t.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db}"
for k in ("NETSUITE_ACCOUNT_ID", "NETSUITE_CONSUMER_KEY", "NETSUITE_CONSUMER_SECRET", "NETSUITE_TOKEN_ID", "NETSUITE_TOKEN_SECRET"):
    os.environ.pop(k, None)

import pytest
from fastapi.testclient import TestClient
from backend.database import Base, engine
from backend import netsuite as ns
from backend.main import app

Base.metadata.create_all(bind=engine)
client = TestClient(app)


def rec(ns_id="101", tranid="PR-1001", status="B", total="500000", lines=None):
    return {"ns_id": ns_id, "tranid": tranid, "trandate": "2026-11-01", "status": status,
            "requester": "A. Kumar", "department": "Plant", "subsidiary": "Procurio India",
            "currency": "INR", "total": total, "memo": "Industrial chemical",
            "lines": lines if lines is not None else [
                {"line_id": 1, "line_no": 1, "item_name": "Industrial Chemical", "quantity": 1000,
                 "unit": "KG", "rate": 500, "amount": 500000, "expected_date": "2026-12-01"}]}


def sync(monkeypatch, records):
    monkeypatch.setattr(ns, "fetch_purchase_requests", lambda since=None: records)
    return client.post("/api/v1/purchase-requests/sync", json={"full": True})


def test_not_configured_reports_exact_missing_vars():
    r = client.post("/api/v1/purchase-requests/sync", json={})
    assert r.status_code == 503
    assert "NETSUITE_ACCOUNT_ID" in r.json()["detail"]["missing_env"]
    st = client.get("/api/v1/netsuite/status").json()
    assert st["configured"] is False and "NETSUITE_TOKEN_SECRET" in st["missing_env"]


def test_sync_creates_then_updates_without_duplicates(monkeypatch):
    r = sync(monkeypatch, [rec()]).json()
    assert r["created"] == 1 and r["fetched"] == 1
    r = sync(monkeypatch, [rec()]).json()
    assert r["created"] == 0 and r["unchanged"] == 1
    r = sync(monkeypatch, [rec(status="C", total="450000")]).json()
    assert r["updated"] == 1
    items = [p for p in client.get("/api/v1/requisitions").json()["items"] if p["netsuite_internal_id"] == "101"]
    assert len(items) == 1
    assert items[0]["status"] == "Rejected" and items[0]["total_amount"] == 450000
    assert items[0]["sync_status"] == "Synced" and items[0]["last_synced_at"]


def test_lines_preserved_and_replaced(monkeypatch):
    sync(monkeypatch, [rec(ns_id="102", tranid="PR-1002")])
    pid = [p for p in client.get("/api/v1/requisitions").json()["items"] if p["netsuite_internal_id"] == "102"][0]["id"]
    d = client.get(f"/api/v1/requisitions/{pid}").json()
    assert len(d["lines"]) == 1 and d["lines"][0]["quantity"] == 1000 and d["lines"][0]["netsuite_line_id"] == "1"
    two = rec(ns_id="102", tranid="PR-1002", lines=[
        {"line_id": 2, "line_no": 1, "item_name": "Solvent", "quantity": 10, "unit": "L", "rate": 5, "amount": 50}])
    sync(monkeypatch, [two])
    d = client.get(f"/api/v1/requisitions/{pid}").json()
    assert [l["netsuite_line_id"] for l in d["lines"]] == ["2"]


def test_unknown_status_ineligible(monkeypatch):
    sync(monkeypatch, [rec(ns_id="103", tranid="PR-1003", status="ZZ")])
    pid = [p for p in client.get("/api/v1/requisitions").json()["items"] if p["netsuite_internal_id"] == "103"][0]["id"]
    e = client.get(f"/api/v1/purchase-requests/{pid}/auction-eligibility").json()
    assert e["eligible"] is False
    assert client.post(f"/api/v1/purchase-requests/{pid}/create-auction", json={}).status_code == 409


def test_create_auction_from_approved_pr_and_block_duplicate(monkeypatch):
    sync(monkeypatch, [rec(ns_id="104", tranid="PR-1004", status="B")])
    pid = [p for p in client.get("/api/v1/requisitions").json()["items"] if p["netsuite_internal_id"] == "104"][0]["id"]
    assert client.get(f"/api/v1/purchase-requests/{pid}/auction-eligibility").json()["eligible"] is True
    r = client.post(f"/api/v1/purchase-requests/{pid}/create-auction", json={"duration_hours": 1})
    assert r.status_code == 200, r.text
    a = r.json()
    assert a["pr_number"] == "PR-1004" and a["reserve_price"] == 500000 and a["currency"] == "INR"
    assert a["requisition_id"] == pid and a["status"] == "Scheduled"
    lines = client.get(f"/api/v1/auctions/{a['id']}/live-console").json()["lines"]
    assert lines[0]["quantity"] == 1000 and lines[0]["last_rate"] == 500
    r2 = client.post(f"/api/v1/purchase-requests/{pid}/create-auction", json={})
    assert r2.status_code == 409 and "already exists" in r2.json()["detail"]["reasons"][0]


def test_oauth_signature_is_deterministic(monkeypatch):
    for k in ns.REQUIRED_ENV:
        monkeypatch.setenv(k, "x" + k[-3:])
    monkeypatch.setenv("NETSUITE_ACCOUNT_ID", "1234567_SB1")
    h1 = ns.build_auth_header("POST", "https://h/x", {"limit": "1"}, nonce="n", timestamp="1")
    h2 = ns.build_auth_header("POST", "https://h/x", {"limit": "1"}, nonce="n", timestamp="1")
    assert h1 == h2 and 'realm="1234567_SB1"' in h1 and "oauth_signature=" in h1
    assert "SECRET" not in h1 and "xRET" not in h1.split("oauth_signature")[0]


def test_supplier_bell_notified_when_buyer_starts_auction():
    from backend.database import SessionLocal
    from backend.models import Supplier
    db = SessionLocal()
    for code, name in (("SUP_T1", "Test Sup One"), ("SUP_T2", "Test Sup Two")):
        if not db.query(Supplier).filter(Supplier.code == code).first():
            db.add(Supplier(code=code, legal_name=name, trading_name=name, status="Active"))
    db.add(Supplier(code="SUP_T3", legal_name="Pending Co", trading_name="Pending Co", status="Pending Approval"))
    db.commit()
    ids = {s.code: s.id for s in db.query(Supplier).all()}
    db.close()
    buyer = {"X-Demo-Role": "procurement_buyer", "X-Demo-Portal": "admin"}
    a = client.post("/api/v1/auctions", headers=buyer, json={
        "title": "Notify me", "auction_type": "Reverse Sourcing", "status": "Scheduled", "reserve_price": 100000,
        "min_decrement": 1000, "tax_rate_pct": 0, "freight_fixed": 0,
        "lines": [{"line_code": "A", "description": "x", "quantity": 1, "uom": "MT", "last_rate": 90000}]}).json()

    def bell(sid):
        h = {"X-Demo-Role": "supplier_user", "X-Demo-Portal": "buyer", "X-Demo-Supplier-Id": str(sid)}
        d = client.get("/api/v1/notifications", headers=h).json()
        return d, [i for i in d["items"] if i.get("db_id")]

    d0, s0 = bell(ids["SUP_T1"])
    assert s0 == []                                   # nothing while only Scheduled
    assert client.patch(f"/api/v1/auctions/{a['id']}", headers=buyer, json={"status": "Live"}).status_code == 200
    d1, s1 = bell(ids["SUP_T1"])
    assert len(s1) == 1 and s1[0]["unread"] and s1[0]["auction_id"] == a["id"] and "LIVE" in s1[0]["title"]
    assert d1["unread_count"] > d0["unread_count"]          # badge goes up
    assert len(bell(ids["SUP_T2"])[1]) == 1           # every ACTIVE supplier is told
    assert bell(ids["SUP_T3"])[1] == []               # a non-active supplier is not
    client.patch(f"/api/v1/auctions/{a['id']}", headers=buyer, json={"status": "Live"})  # already live -> no duplicate
    assert len(bell(ids["SUP_T1"])[1]) == 1
    h = {"X-Demo-Role": "supplier_user", "X-Demo-Portal": "buyer", "X-Demo-Supplier-Id": str(ids["SUP_T1"])}
    assert client.post(f"/api/v1/notifications/{s1[0]['db_id']}/read", headers=h).status_code == 200
    d2, s2 = bell(ids["SUP_T1"])
    assert s2[0]["unread"] is False and d2["unread_count"] == d1["unread_count"] - 1


def test_forward_auction_every_bid_must_beat_the_current_highest():
    from backend.database import SessionLocal
    from backend.models import Supplier
    db = SessionLocal()
    for code in ("SUP_F1", "SUP_F2"):
        if not db.query(Supplier).filter(Supplier.code == code).first():
            db.add(Supplier(code=code, legal_name=code, trading_name=code, status="Active"))
    db.commit()
    ids = {s.code: s.id for s in db.query(Supplier).all()}
    db.close()
    admin = {"X-Demo-Role": "procurement_buyer", "X-Demo-Portal": "admin"}
    a = client.post("/api/v1/auctions", headers=admin, json={
        "title": "Scrap highest wins", "auction_type": "Forward Disposal", "status": "Live",
        "reserve_price": 100000, "min_decrement": 5000, "min_bid_improvement": 5000}).json()

    def bid(code, amount):
        h = {"X-Demo-Role": "supplier_user", "X-Demo-Portal": "buyer", "X-Demo-Supplier-Id": str(ids[code])}
        return client.post(f"/api/v1/auctions/{a['id']}/bid", headers=h, json={"bid_amount": amount})

    assert bid("SUP_F1", 100000).status_code == 400          # first bid must beat the starting price
    assert bid("SUP_F1", 105000).status_code == 200
    for low in (103000, 105000, 108000):                      # another buyer must beat the highest by the min raise
        r = bid("SUP_F2", low)
        assert r.status_code == 400 and "current highest bid" in r.json()["detail"]
    assert bid("SUP_F2", 110000).status_code == 200
    assert bid("SUP_F1", 112000).status_code == 400           # even the previous leader needs highest + raise
    assert bid("SUP_F1", 115000).status_code == 200
    h = {"X-Demo-Role": "supplier_user", "X-Demo-Portal": "buyer", "X-Demo-Supplier-Id": str(ids["SUP_F2"])}
    c = client.get(f"/api/v1/auctions/{a['id']}/live-console", headers=h).json()
    assert c["session"]["your_current_rank"] == 2 and c["auction"]["current_best_bid"] == 115000


def test_forward_auction_with_item_lines_prices_per_line_highest_total_leads():
    from backend.database import SessionLocal
    from backend.models import Supplier
    db = SessionLocal()
    for code in ("SUP_L1", "SUP_L2"):
        if not db.query(Supplier).filter(Supplier.code == code).first():
            db.add(Supplier(code=code, legal_name=code, trading_name=code, status="Active"))
    db.commit()
    ids = {s.code: s.id for s in db.query(Supplier).all()}
    db.close()
    admin = {"X-Demo-Role": "procurement_buyer", "X-Demo-Portal": "admin"}
    a = client.post("/api/v1/auctions", headers=admin, json={
        "title": "Scrap with lines", "auction_type": "Forward Disposal", "status": "Live", "reserve_price": 1000000,
        "min_decrement": 10000, "min_bid_improvement": 10000, "tax_rate_pct": 0, "freight_fixed": 0,
        "lines": [{"line_code": "S1", "description": "HMS", "quantity": 10, "uom": "MT", "last_rate": 60000},
                  {"line_code": "S2", "description": "Boring", "quantity": 10, "uom": "MT", "last_rate": 40000}]}).json()

    def hdr(code):
        return {"X-Demo-Role": "supplier_user", "X-Demo-Portal": "buyer", "X-Demo-Supplier-Id": str(ids[code])}

    lines = client.get(f"/api/v1/auctions/{a['id']}/live-console", headers=hdr("SUP_L1")).json()["lines"]

    def bid(code, r1, r2):
        return client.post(f"/api/v1/auctions/{a['id']}/bid", headers=hdr(code), json={
            "line_rates": [{"line_id": lines[0]["id"], "new_rate": r1}, {"line_id": lines[1]["id"], "new_rate": r2}]})

    assert bid("SUP_L1", 60000, 40000).status_code == 400          # = starting price (10 x 60k + 10 x 40k)
    assert bid("SUP_L1", 62000, 41000).status_code == 200          # total 1,030,000
    low = bid("SUP_L2", 61000, 41000)                              # total 1,020,000 < highest + raise
    assert low.status_code == 400 and "current highest bid" in low.json()["detail"]
    assert bid("SUP_L2", 63000, 42000).status_code == 200          # total 1,050,000 leads
    c = client.get(f"/api/v1/auctions/{a['id']}/live-console", headers=hdr("SUP_L1")).json()
    assert c["session"]["your_current_rank"] == 2 and c["auction"]["current_best_bid"] == 1050000
