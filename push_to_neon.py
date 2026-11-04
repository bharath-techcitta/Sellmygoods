"""Push demo data into Neon PostgreSQL (DATABASE_URL from .env or environment).

Usage (from project root):
  python push_to_neon.py           # seed if empty; fill supplemental rows if already seeded
  python push_to_neon.py --force   # wipe Neon tables and full reseed
"""
from __future__ import annotations

import os
import time

os.environ.setdefault("PYTHONUNBUFFERED", "1")

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.env_loader import load_project_env

load_project_env()

from backend.database import DATABASE_URL, SessionLocal  # noqa: E402
from backend.models import (  # noqa: E402
    Supplier,
    Requisition,
    PurchaseOrder,
    Invoice,
    Auction,
    AuctionLineItem,
)
from backend.seed import seed_database  # noqa: E402


def _mask_url(url: str) -> str:
    if "@" in url and "://" in url:
        prefix, rest = url.split("://", 1)
        if "@" in rest:
            creds, host = rest.split("@", 1)
            user = creds.split(":")[0] if ":" in creds else creds
            return f"{prefix}://{user}:****@{host}"
    return url[:40] + "..." if len(url) > 40 else url


def _run_seed_with_retries(force: bool, attempts: int = 3) -> None:
    last_err = None
    for attempt in range(1, attempts + 1):
        try:
            seed_database(force=force)
            return
        except Exception as e:
            last_err = e
            print(f"Seed attempt {attempt}/{attempts} failed: {e}")
            if attempt < attempts:
                wait = 5 * attempt
                print(f"Retrying in {wait}s…")
                time.sleep(wait)
    raise last_err


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed Neon DB from Procurio demo dataset.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Drop all tables on the target DB and run a full reseed.",
    )
    args = parser.parse_args()

    if DATABASE_URL.startswith("sqlite"):
        print("WARNING: DATABASE_URL points to SQLite. Set Neon URL in .env or environment.")
        return 1

    print(f"Target database: {_mask_url(DATABASE_URL)}")

    _run_seed_with_retries(force=args.force)

    db = SessionLocal()
    try:
        summary = {
            "suppliers": db.query(Supplier).count(),
            "requisitions": db.query(Requisition).count(),
            "purchase_orders": db.query(PurchaseOrder).count(),
            "invoices": db.query(Invoice).count(),
            "auctions": db.query(Auction).count(),
            "auction_lines": db.query(AuctionLineItem).count(),
        }
        print("Neon seed complete. Row counts:", summary)
        live = db.query(Auction).filter(Auction.auction_number == "AUC_2026_013").first()
        if live:
            print(f"Live reverse auction: {live.auction_number} (id={live.id}, status={live.status})")
        else:
            print("Note: AUC_2026_013 not found — restart backend or run push again for supplemental auction.")
    finally:
        db.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
