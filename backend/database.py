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
    # Managed PostgreSQL (Aiven / Neon / any). Keep the pool small: Aiven's free plan allows few connections.
    engine = create_engine(
        DATABASE_URL,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "5")),
        pool_pre_ping=True,
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "240")),   # drop idle connections before the server/pooler does
        connect_args={
            "connect_timeout": 30,
            # TCP keepalives stop idle connections being silently dropped by serverless/pooled Postgres
            "keepalives": 1, "keepalives_idle": 30, "keepalives_interval": 10, "keepalives_count": 5,
        },
    )

def _install_connect_retry(eng) -> None:
    """Retry brand-new connections a few times. Serverless/managed Postgres (Neon, Aiven free) can drop or
    refuse the very first connection while the compute wakes up ("server closed the connection unexpectedly")."""
    import time
    from sqlalchemy import event
    attempts = int(os.getenv("DB_CONNECT_RETRIES", "4"))

    @event.listens_for(eng, "do_connect")
    def _connect_with_retry(dialect, conn_rec, cargs, cparams):
        last = None
        for i in range(attempts):
            try:
                return dialect.loaded_dbapi.connect(*cargs, **cparams)
            except dialect.loaded_dbapi.OperationalError as exc:
                last = exc
                msg = str(exc).lower()
                if "password authentication failed" in msg or "does not exist" in msg:
                    raise  # permanent: wrong credentials / database - retrying cannot help
                if i < attempts - 1:
                    delay = 1.5 * (i + 1)
                    print(f"[db] connect failed ({str(exc).splitlines()[0][:90]}); retry {i + 1}/{attempts - 1} in {delay:.1f}s")
                    time.sleep(delay)
        raise last


def run_with_db_retry(fn, attempts: int = 5, delay: float = 3.0, what: str = "database task"):
    """Run fn(); on a transient DB error wait and try again (used for start-up work like create_all)."""
    import time
    from sqlalchemy.exc import OperationalError, DBAPIError
    for i in range(1, attempts + 1):
        try:
            return fn()
        except (OperationalError, DBAPIError) as exc:
            if i == attempts:
                print(f"[db] {what} failed after {attempts} attempts: {str(exc).splitlines()[0][:160]}")
                raise
            print(f"[db] {what}: attempt {i}/{attempts} failed ({str(exc).splitlines()[0][:90]}); retrying in {delay}s")
            time.sleep(delay)


if not DATABASE_URL.startswith("sqlite"):
    _install_dns_fallback(engine, DATABASE_URL)   # registered first: it fills in hostaddr when system DNS fails
    _install_connect_retry(engine)                # registered last: performs the connect (with retries)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
