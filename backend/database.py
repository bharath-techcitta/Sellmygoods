import os
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .env_loader import load_project_env

load_project_env()

def _normalize_postgres_url(url: str) -> str:
    """Render/Neon URLs must use psycopg2 (see requirements.txt), not psycopg v3."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    # channel_binding=require often breaks psycopg2 (Windows + some Linux hosts)
    url = re.sub(r"([?&])channel_binding=[^&]*&?", r"\1", url)
    return url.rstrip("?&")


# Support Neon DB / PostgreSQL from environment variable
raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./sellmygoods.db")

if not raw_db_url.startswith("sqlite"):
    raw_db_url = _normalize_postgres_url(raw_db_url)

DATABASE_URL = raw_db_url

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Neon DB Serverless PostgreSQL engine configuration
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"connect_timeout": 30},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
