# Procurio — rerun & keep working

## Neon database (done when you run push)

```powershell
cd "C:\Users\ADMIN\Desktop\%^&\WEBSITES"
python push_to_neon.py
```

- Adds missing auction columns/tables via `backend/schema_migrate.py`
- Ensures supplemental data (POs, **AUC_2026_013** live reverse auction, lines)
- Retries up to 3 times on connection drops
- Full reset (only if needed): `python push_to_neon.py --force`

Expected summary line:

`Live reverse auction: AUC_2026_013 (id=1, status=Live)`

## Local backend

**Important:** If port 8000 was started before recent code changes, stop that process and restart so new routes load (`/monitor`, `/live-console`, `/health`).

```powershell
cd "C:\Users\ADMIN\Desktop\%^&\WEBSITES"
python run_server.py
```

Or: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload`

Smoke checks (new server):

- http://127.0.0.1:8000/api/v1/health
- http://127.0.0.1:8000/api/v1/auctions
- http://127.0.0.1:8000/api/v1/auctions/1/monitor
- http://127.0.0.1:8000/api/v1/auctions/1/live-console

## Local frontend

Path `%^&` breaks Vite/npm on Windows. Use:

```powershell
cd frontend
npm run dev:win
```

Or move the repo to e.g. `C:\dev\procurio`.

Set `.env`: `VITE_API_URL=http://127.0.0.1:8000/api/v1`

## Render + Vercel

1. **Push** latest code to GitHub (triggers Render/Vercel if connected).
2. **Render** redeploy `procurio-backend` — startup runs `ensure_postgres_schema()` + `seed_database()`.
3. **Vercel** env: `VITE_API_URL=https://<your-render-host>/api/v1`
4. **Render** env: `DATABASE_URL` (Neon), `CORS_ORIGINS` = your Vercel URL or `*`

## Roles to verify

| Role | Check |
|------|--------|
| Marcus (admin) | Auctions → Open live auction console |
| Elena (buyer) | Live Auctions → Open live console → line bid |
