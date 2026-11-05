"""
Render.com entrypoint: migrate + seed Neon (with retries), then start Uvicorn.
Ensures demo data exists before the service accepts traffic.
"""
from __future__ import annotations

import os
import sys
import time


def _mask_db_url(url: str) -> str:
    if "@" in url and "://" in url:
        prefix, rest = url.split("://", 1)
        if "@" in rest:
            user, host = rest.split("@", 1)
            user = user.split(":")[0] if ":" in user else user
            return f"{prefix}://{user}:****@{host[:48]}..."
    return url[:40] + "..." if len(url) > 40 else url


def _seed_with_retries(attempts: int = 3) -> bool:
    from backend.seed import seed_database

    last_err = None
    for attempt in range(1, attempts + 1):
        try:
            seed_database()
            return True
        except Exception as e:
            last_err = e
            print(f"[render_startup] Seed attempt {attempt}/{attempts} failed: {e}", flush=True)
            if attempt < attempts:
                time.sleep(5 * attempt)
    print(f"[render_startup] Seed failed after {attempts} attempts: {last_err}", flush=True)
    return False


def main() -> None:
    port = os.environ.get("PORT", "8000")
    db_url = os.environ.get("DATABASE_URL", "").strip()

    if not db_url:
        print(
            "[render_startup] FATAL: DATABASE_URL is not set on Render. "
            "Add your Neon connection string in Render → Environment.",
            flush=True,
        )
        print("[render_startup] Without it the app uses empty SQLite and deploy will show no data.", flush=True)
    elif db_url.startswith("sqlite"):
        print("[render_startup] WARNING: DATABASE_URL points to SQLite — not suitable for Render.", flush=True)
    else:
        print(f"[render_startup] PostgreSQL target: {_mask_db_url(db_url)}", flush=True)

    from backend.schema_migrate import ensure_postgres_schema

    print("[render_startup] Running schema migrate...", flush=True)
    ensure_postgres_schema()

    print("[render_startup] Seeding database (idempotent)...", flush=True)
    ok = _seed_with_retries()
    if ok:
        try:
            from backend.database import SessionLocal
            from backend.models import Supplier, Auction, Requisition

            db = SessionLocal()
            try:
                print(
                    "[render_startup] Row counts:",
                    {
                        "suppliers": db.query(Supplier).count(),
                        "requisitions": db.query(Requisition).count(),
                        "auctions": db.query(Auction).count(),
                    },
                    flush=True,
                )
            finally:
                db.close()
        except Exception as e:
            print(f"[render_startup] Count check failed: {e}", flush=True)

    print(f"[render_startup] Starting Uvicorn on 0.0.0.0:{port}", flush=True)
    os.execvp(
        "uvicorn",
        [
            "uvicorn",
            "backend.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(port),
        ],
    )


if __name__ == "__main__":
    sys.exit(main())
