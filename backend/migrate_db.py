"""Copy ALL data from one database to another (e.g. Neon -> Aiven), preserving ids and relations.

Environment (root .env):
    DATABASE_URL          TARGET database (the new one, e.g. Aiven)  - this is what the app uses
    SOURCE_DATABASE_URL   SOURCE database (the old one, e.g. Neon)   - only needed for this migration

Usage (from the project root):
    python -m backend.migrate_db --dry-run      # show what would be copied, change nothing
    python -m backend.migrate_db                # copy (aborts if the target already has data)
    python -m backend.migrate_db --truncate     # empty the target tables first, then copy

The source is only ever READ. Nothing is deleted from it.
"""
import argparse
import os
import sys

from sqlalchemy import create_engine, func, inspect, select, text

from . import models  # noqa: F401  (registers all tables on Base.metadata)
from .database import Base, DATABASE_URL, _install_dns_fallback, _normalize_postgres_url, engine as target_engine
from .env_loader import load_project_env

BATCH = 500


def _mask(url: str) -> str:
    import re
    return re.sub(r"(://[^:/@]+:)[^@]+@", lambda m: m.group(1) + "****@", url).split("?")[0]


def _source_engine():
    load_project_env()
    url = os.getenv("SOURCE_DATABASE_URL", "").strip()
    if not url:
        sys.exit("SOURCE_DATABASE_URL is not set in .env (put the OLD database URL there for the migration).")
    if not url.startswith("sqlite"):
        url = _normalize_postgres_url(url)
    if url == DATABASE_URL:
        sys.exit("SOURCE_DATABASE_URL and DATABASE_URL are identical - nothing to migrate.")
    eng = create_engine(url, pool_pre_ping=True, connect_args={} if url.startswith("sqlite") else {"connect_timeout": 30})
    if not url.startswith("sqlite"):
        _install_dns_fallback(eng, url)
    return eng, url


def _reset_sequences(conn, tables):
    if target_engine.dialect.name != "postgresql":
        return
    for t in tables:
        pk = [c for c in t.primary_key.columns]
        if len(pk) == 1 and pk[0].name == "id" and pk[0].type.python_type is int:
            conn.execute(text(
                f'SELECT setval(pg_get_serial_sequence(\'"{t.name}"\', \'id\'), '
                f'COALESCE((SELECT MAX(id) FROM "{t.name}"), 1), (SELECT MAX(id) IS NOT NULL FROM "{t.name}"))'
            ))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--truncate", action="store_true", help="empty target tables before copying")
    args = ap.parse_args()

    src, src_url = _source_engine()
    print(f"SOURCE: {_mask(src_url)}")
    print(f"TARGET: {_mask(DATABASE_URL)}")

    tables = list(Base.metadata.sorted_tables)  # parents before children
    src_insp = inspect(src)
    src_tables = set(src_insp.get_table_names())

    # counts on the source
    plan = []
    with src.connect() as sc:
        for t in tables:
            if t.name not in src_tables:
                plan.append((t, 0, []))
                continue
            common = [c.name for c in t.columns if c.name in {x["name"] for x in src_insp.get_columns(t.name)}]
            n = sc.execute(select(func.count()).select_from(t)).scalar()
            plan.append((t, n, common))
    print("\nTable                      rows")
    for t, n, _ in plan:
        print(f"  {t.name:<26}{n}")
    if args.dry_run:
        print("\nDry run - nothing changed.")
        return 0

    # create schema on the target (adds every table/column the app needs)
    Base.metadata.create_all(bind=target_engine)

    with target_engine.begin() as tc:
        existing = {t.name: tc.execute(select(func.count()).select_from(t)).scalar() for t in tables}
        if any(existing.values()):
            if not args.truncate:
                busy = {k: v for k, v in existing.items() if v}
                sys.exit(f"Target already contains data {busy}. Re-run with --truncate to replace it, or use an empty database.")
            if target_engine.dialect.name == "postgresql":
                tc.execute(text("TRUNCATE " + ", ".join(f'"{t.name}"' for t in tables) + " RESTART IDENTITY CASCADE"))
            else:
                for t in reversed(tables):
                    tc.execute(t.delete())
            print("Target tables emptied.")

    copied = {}
    with src.connect() as sc, target_engine.begin() as tc:
        for t, n, common in plan:
            if not n:
                copied[t.name] = 0
                continue
            cols = [t.c[c] for c in common]
            rows = sc.execution_options(stream_results=True).execute(select(*cols))
            total = 0
            while True:
                chunk = rows.fetchmany(BATCH)
                if not chunk:
                    break
                tc.execute(t.insert(), [dict(zip(common, r)) for r in chunk])
                total += len(chunk)
            copied[t.name] = total
            print(f"  copied {t.name:<26}{total}")
        _reset_sequences(tc, tables)

    # verify
    ok = True
    with target_engine.connect() as tc:
        print("\nVerification (source -> target):")
        for t, n, _ in plan:
            got = tc.execute(select(func.count()).select_from(t)).scalar()
            flag = "OK " if got == n else "MISMATCH"
            ok &= got == n
            print(f"  {flag} {t.name:<26}{n} -> {got}")
    print("\nMigration complete and verified." if ok else "\nMigration finished WITH MISMATCHES - do not delete the source database.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
