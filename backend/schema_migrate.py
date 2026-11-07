"""Lightweight Postgres column/table sync for existing Neon/Render DBs (no Alembic)."""
from sqlalchemy import text

from .database import engine, Base


def ensure_postgres_schema() -> None:
    if not str(engine.url).startswith("postgresql"):
        Base.metadata.create_all(bind=engine)
        return

    Base.metadata.create_all(bind=engine)

    auction_columns = [
        ("freight_fixed", "DOUBLE PRECISION DEFAULT 0"),
        ("tax_rate_pct", "DOUBLE PRECISION DEFAULT 18"),
        ("min_bid_improvement", "DOUBLE PRECISION DEFAULT 5000"),
        ("visibility", "VARCHAR DEFAULT 'own_rank_only'"),
        ("terms_version", "VARCHAR DEFAULT '3'"),
        ("currency", "VARCHAR DEFAULT 'USD'"),
        ("extensions_used", "INTEGER DEFAULT 0"),
        ("max_extensions", "INTEGER DEFAULT 5"),
        ("requisition_id", "INTEGER"),
    ]
    requisition_columns = [
        ("netsuite_internal_id", "VARCHAR"),
        ("netsuite_status", "VARCHAR"),
        ("subsidiary", "VARCHAR"),
        ("source", "VARCHAR DEFAULT 'local'"),
        ("sync_status", "VARCHAR DEFAULT 'Local'"),
        ("last_synced_at", "TIMESTAMP"),
    ]
    requisition_line_columns = [
        ("netsuite_line_id", "VARCHAR"),
        ("item_name", "VARCHAR"),
        ("delivery_requirement", "VARCHAR"),
    ]

    with engine.connect() as conn:
        autocommit = conn.execution_options(isolation_level="AUTOCOMMIT")
        for col, typedef in auction_columns:
            autocommit.execute(
                text(f"ALTER TABLE auctions ADD COLUMN IF NOT EXISTS {col} {typedef}")
            )
        for col, typedef in requisition_columns:
            autocommit.execute(text(f"ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS {col} {typedef}"))
        for col, typedef in requisition_line_columns:
            autocommit.execute(text(f"ALTER TABLE requisition_lines ADD COLUMN IF NOT EXISTS {col} {typedef}"))
        autocommit.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ux_requisitions_netsuite_id ON requisitions (netsuite_internal_id)")
        )
