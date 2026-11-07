"""NetSuite Purchase Request integration (SuiteQL over REST, Token-Based Authentication).

Credentials are read ONLY from environment variables (root .env) and are never returned by any API:

    NETSUITE_ACCOUNT_ID       e.g. 1234567  or  1234567_SB1  (sandbox)
    NETSUITE_CONSUMER_KEY
    NETSUITE_CONSUMER_SECRET
    NETSUITE_TOKEN_ID
    NETSUITE_TOKEN_SECRET

Optional:
    NETSUITE_AUCTION_ELIGIBLE_STATUSES   comma list of local PR statuses that may become auctions
                                         (default: "Approved")
    NETSUITE_ALLOW_MULTIPLE_AUCTIONS_PER_PR   "true" to allow >1 non-cancelled auction per PR (default false)

Nothing here fabricates data: if the account is not configured, `NetSuiteNotConfigured` is raised
with the exact list of missing variables.
"""
from __future__ import annotations

import base64
import datetime
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

from sqlalchemy.orm import Session

from .models import Requisition, RequisitionLine

REQUIRED_ENV = [
    "NETSUITE_ACCOUNT_ID",
    "NETSUITE_CONSUMER_KEY",
    "NETSUITE_CONSUMER_SECRET",
    "NETSUITE_TOKEN_ID",
    "NETSUITE_TOKEN_SECRET",
]

# NetSuite Purchase Requisition (transaction type PurchReq) status codes -> local PR status.
# Anything not listed is stored as "Unknown" (ineligible) with the raw code preserved in netsuite_status.
# VERIFY these against your account (Setup > Accounting > ... or a SuiteQL: SELECT DISTINCT status FROM transaction WHERE type='PurchReq').
STATUS_MAP = {
    "A": "Pending Approval",
    "B": "Approved",
    "C": "Rejected",
    "H": "Cancelled",
    "PENDING APPROVAL": "Pending Approval",
    "APPROVED": "Approved",
    "REJECTED": "Rejected",
    "CANCELLED": "Cancelled",
    "CLOSED": "Complete",
}


class NetSuiteNotConfigured(Exception):
    def __init__(self, missing: List[str]):
        self.missing = missing
        super().__init__("NetSuite is not configured. Missing environment variables: " + ", ".join(missing))


class NetSuiteError(Exception):
    pass


def missing_config() -> List[str]:
    return [k for k in REQUIRED_ENV if not os.getenv(k, "").strip()]


def is_configured() -> bool:
    return not missing_config()


def eligible_statuses() -> List[str]:
    raw = os.getenv("NETSUITE_AUCTION_ELIGIBLE_STATUSES", "Approved")
    return [s.strip() for s in raw.split(",") if s.strip()]


def allow_multiple_auctions_per_pr() -> bool:
    return os.getenv("NETSUITE_ALLOW_MULTIPLE_AUCTIONS_PER_PR", "false").strip().lower() in ("1", "true", "yes")


# ----------------------------- OAuth 1.0a (TBA, HMAC-SHA256) -----------------------------

def _pct(v: str) -> str:
    return urllib.parse.quote(str(v), safe="~")


def _account_host() -> str:
    acct = os.environ["NETSUITE_ACCOUNT_ID"].strip().lower().replace("_", "-")
    return f"{acct}.suitetalk.api.netsuite.com"


def build_auth_header(method: str, url: str, query: Optional[Dict[str, str]] = None,
                      nonce: Optional[str] = None, timestamp: Optional[str] = None) -> str:
    realm = os.environ["NETSUITE_ACCOUNT_ID"].strip().upper().replace("-", "_")
    oauth = {
        "oauth_consumer_key": os.environ["NETSUITE_CONSUMER_KEY"].strip(),
        "oauth_token": os.environ["NETSUITE_TOKEN_ID"].strip(),
        "oauth_signature_method": "HMAC-SHA256",
        "oauth_timestamp": timestamp or str(int(time.time())),
        "oauth_nonce": nonce or secrets.token_hex(10),
        "oauth_version": "1.0",
    }
    params = dict(oauth)
    params.update(query or {})
    norm = "&".join(f"{_pct(k)}={_pct(v)}" for k, v in sorted(params.items()))
    base = "&".join([method.upper(), _pct(url), _pct(norm)])
    key = f"{_pct(os.environ['NETSUITE_CONSUMER_SECRET'].strip())}&{_pct(os.environ['NETSUITE_TOKEN_SECRET'].strip())}"
    sig = base64.b64encode(hmac.new(key.encode(), base.encode(), hashlib.sha256).digest()).decode()
    oauth["oauth_signature"] = sig
    parts = [f'realm="{realm}"'] + [f'{k}="{_pct(v)}"' for k, v in oauth.items()]
    return "OAuth " + ", ".join(parts)


def suiteql(query: str, limit: int = 1000, max_pages: int = 50) -> List[Dict[str, Any]]:
    """Run a SuiteQL query and return all rows (follows pagination)."""
    missing = missing_config()
    if missing:
        raise NetSuiteNotConfigured(missing)
    url = f"https://{_account_host()}/services/rest/query/v1/suiteql"
    rows: List[Dict[str, Any]] = []
    offset = 0
    for _ in range(max_pages):
        qs = {"limit": str(limit), "offset": str(offset)}
        full = url + "?" + urllib.parse.urlencode(qs)
        req = urllib.request.Request(
            full,
            data=json.dumps({"q": query}).encode(),
            method="POST",
            headers={
                "Authorization": build_auth_header("POST", url, qs),
                "Content-Type": "application/json",
                "Prefer": "transient",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:400]
            raise NetSuiteError(f"NetSuite HTTP {e.code}: {detail}") from e
        except urllib.error.URLError as e:
            raise NetSuiteError(f"Could not reach NetSuite: {e.reason}") from e
        rows.extend(payload.get("items", []))
        if not payload.get("hasMore"):
            break
        offset += limit
    return rows


PR_QUERY = """
SELECT t.id AS ns_id, t.tranid AS tranid, t.trandate AS trandate, t.status AS status,
       BUILTIN.DF(t.entity) AS requester, BUILTIN.DF(t.department) AS department,
       BUILTIN.DF(t.subsidiary) AS subsidiary, BUILTIN.DF(t.currency) AS currency,
       t.foreigntotal AS total, t.memo AS memo, t.lastmodifieddate AS last_modified
FROM transaction t
WHERE t.type = 'PurchReq'{since}
ORDER BY t.id
"""

LINE_QUERY = """
SELECT l.transaction AS ns_id, l.id AS line_id, l.linesequencenumber AS line_no,
       l.item AS item_id, BUILTIN.DF(l.item) AS item_name, l.memo AS memo,
       ABS(l.quantity) AS quantity, BUILTIN.DF(l.units) AS unit, l.rate AS rate,
       ABS(l.foreignamount) AS amount, l.expectedreceiptdate AS expected_date
FROM transactionline l
WHERE l.transaction IN ({ids}) AND l.mainline = 'F'
ORDER BY l.transaction, l.linesequencenumber
"""


def fetch_purchase_requests(since: Optional[datetime.datetime] = None) -> List[Dict[str, Any]]:
    """Fetch PR headers + lines from NetSuite. Returns normalised dicts for `upsert_purchase_requests`."""
    since_clause = ""
    if since:
        since_clause = f" AND t.lastmodifieddate >= TO_DATE('{since.strftime('%Y-%m-%d')}', 'YYYY-MM-DD')"
    headers = suiteql(PR_QUERY.format(since=since_clause))
    lines_by_pr: Dict[str, List[Dict[str, Any]]] = {}
    ids = [str(h["ns_id"]) for h in headers]
    for i in range(0, len(ids), 200):
        chunk = ids[i:i + 200]
        for ln in suiteql(LINE_QUERY.format(ids=",".join(chunk))):
            lines_by_pr.setdefault(str(ln["ns_id"]), []).append(ln)
    for h in headers:
        h["lines"] = lines_by_pr.get(str(h["ns_id"]), [])
    return headers


# ----------------------------- Upsert (pure DB logic, unit-testable) -----------------------------

def _f(v: Any) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def map_status(raw: Any) -> str:
    key = str(raw or "").strip().upper()
    return STATUS_MAP.get(key, "Unknown")


def upsert_purchase_requests(db: Session, records: Iterable[Dict[str, Any]]) -> Dict[str, int]:
    """Insert new PRs / update changed ones keyed by NetSuite internal id. Never creates duplicates."""
    now = datetime.datetime.utcnow()
    stats = {"created": 0, "updated": 0, "unchanged": 0, "failed": 0}
    for rec in records:
        try:
            ns_id = str(rec["ns_id"])
            pr = db.query(Requisition).filter(Requisition.netsuite_internal_id == ns_id).first()
            tranid = str(rec.get("tranid") or f"NS-{ns_id}")
            lines = rec.get("lines") or []
            status = map_status(rec.get("status"))
            total = _f(rec.get("total")) or sum(_f(l.get("amount")) for l in lines)

            if pr is None:
                pr_number = tranid
                if db.query(Requisition).filter(Requisition.pr_number == pr_number).first():
                    pr_number = f"NS-{tranid}"
                pr = Requisition(pr_number=pr_number, netsuite_internal_id=ns_id, source="netsuite")
                db.add(pr)
                stats["created"] += 1
                is_new = True
            else:
                is_new = False

            before = (pr.status, pr.total_amount, pr.netsuite_status, pr.description, pr.department,
                      pr.requester_name, pr.currency, pr.subsidiary)
            pr.description = rec.get("memo") or (lines[0].get("item_name") if lines else None) or tranid
            pr.status = status
            pr.netsuite_status = str(rec.get("status") or "")
            pr.requester_name = rec.get("requester") or pr.requester_name
            pr.department = rec.get("department") or pr.department
            pr.subsidiary = rec.get("subsidiary") or pr.subsidiary
            pr.business_entity = pr.subsidiary or pr.business_entity
            pr.currency = rec.get("currency") or pr.currency
            pr.total_amount = total
            pr.sync_status = "Synced"
            pr.last_synced_at = now
            if is_new:
                pr.delivery_date = (lines[0].get("expected_date") if lines else None)
            after = (pr.status, pr.total_amount, pr.netsuite_status, pr.description, pr.department,
                     pr.requester_name, pr.currency, pr.subsidiary)
            if not is_new:
                stats["updated" if before != after else "unchanged"] += 1
            db.flush()

            # Replace lines by NetSuite line id (preserve ids, avoid duplicates)
            existing = {l.netsuite_line_id: l for l in
                        db.query(RequisitionLine).filter(RequisitionLine.requisition_id == pr.id).all()
                        if l.netsuite_line_id}
            seen = set()
            for idx, ln in enumerate(lines, start=1):
                lid = str(ln.get("line_id") if ln.get("line_id") is not None else idx)
                seen.add(lid)
                row = existing.get(lid) or RequisitionLine(requisition_id=pr.id, netsuite_line_id=lid)
                if lid not in existing:
                    db.add(row)
                qty = _f(ln.get("quantity")) or 1.0
                rate = _f(ln.get("rate"))
                amount = _f(ln.get("amount")) or qty * rate
                row.line_number = int(ln.get("line_no") or idx)
                row.item_name = ln.get("item_name")
                row.description = ln.get("memo") or ln.get("item_name") or ""
                row.quantity = qty
                row.uom = ln.get("unit") or "Unit"
                row.unit_price = rate or (amount / qty if qty else 0.0)
                row.amount = amount
                row.delivery_requirement = ln.get("expected_date")
            for lid, row in existing.items():
                if lid not in seen:
                    db.delete(row)
            db.commit()
        except Exception:
            db.rollback()
            stats["failed"] += 1
    return stats


def sync_purchase_requests(db: Session, full: bool = False) -> Dict[str, Any]:
    since = None
    if not full:
        last = (db.query(Requisition.last_synced_at)
                .filter(Requisition.source == "netsuite", Requisition.last_synced_at.isnot(None))
                .order_by(Requisition.last_synced_at.desc()).first())
        # Re-read a 1-day safety window to catch records modified around the last run
        if last and last[0]:
            since = last[0] - datetime.timedelta(days=1)
    records = fetch_purchase_requests(since)
    stats = upsert_purchase_requests(db, records)
    stats["fetched"] = len(records)
    stats["synced_at"] = datetime.datetime.utcnow().isoformat() + "Z"
    return stats
