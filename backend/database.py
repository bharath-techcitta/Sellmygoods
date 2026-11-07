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

_dns_cache = {"ips": [], "ts": 0.0}


def _fallback_ips(host: str) -> list:
    """Resolve `host` via Google DNS-over-HTTPS (cached 30s). Used only when system DNS fails."""
    import json, time, urllib.request
    if _dns_cache["ips"] and time.time() - _dns_cache["ts"] < 30:
        return _dns_cache["ips"]
    with urllib.request.urlopen(f"https://8.8.8.8/resolve?name={host}&type=A", timeout=10) as r:
        answers = json.loads(r.read().decode()).get("Answer", [])
    ips = [a["data"] for a in answers if a.get("type") == 1]
    if ips:
        _dns_cache.update(ips=ips, ts=time.time())
    return ips


def _install_dns_fallback(eng, url: str) -> None:
    """If the system resolver cannot resolve the DB host (e.g. router/ISP DNS refusing Neon lookups),
    pass a freshly resolved `hostaddr` to psycopg2 on every new connection (random IP, so retries
    try another one). No effect at all when normal DNS works (Render, Vercel, most networks)."""
    import random, socket
    from urllib.parse import urlparse
    from sqlalchemy import event
    host = urlparse(url.replace("postgresql+psycopg2://", "postgresql://", 1)).hostname
    if not host:
        return
    try:
        socket.getaddrinfo(host, 5432)
        return
    except OSError:
        print(f"[db] System DNS cannot resolve {host}; resolving via Google DNS per connection.")

    @event.listens_for(eng, "do_connect")
    def _inject_hostaddr(dialect, conn_rec, cargs, cparams):
        try:
            ips = _fallback_ips(host)
            if ips:
                cparams["hostaddr"] = random.choice(ips)
        except Exception as exc:
            print(f"[db] DNS fallback failed: {exc}")


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

if not DATABASE_URL.startswith("sqlite"):
    _install_dns_fallback(engine, DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
