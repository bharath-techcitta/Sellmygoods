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
