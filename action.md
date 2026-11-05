# SellMyGoods / Procurio — Action checklist

Follow these steps in order. This matches **DEPLOYMENT_GUIDE.md**, **RERUN.md**, and the **Run it.md** build spec (dual portals, live auctions, Neon + Render + Vercel).

---

## Step 0 — Prerequisites

- [ ] Python 3.11+ and Node 18+ installed
- [ ] Project root: `C:\Users\ADMIN\Desktop\%^&\WEBSITES`
- [ ] Root `.env` contains a valid **Neon** `DATABASE_URL` (see `.env` template)
- [ ] Do **not** commit `.env` (secrets)

---

## Step 1 — Neon database (schema + demo data)

From project root:

```powershell
cd "C:\Users\ADMIN\Desktop\%^&\WEBSITES"
python push_to_neon.py
```

- Normal run: migrates schema and ensures supplemental data (auctions, POs, live lots).
- Only if Neon is broken or empty: `python push_to_neon.py --force` (full reset; retries on connection drops).

**Success:** script prints auction counts and live reverse auction **AUC_2026_013** (or similar Live rows).

---

## Step 2 — Local backend

Stop any old process on port **8000**, then:

```powershell
python run_server.py
```

On startup: `ensure_postgres_schema()` + `seed_database()` (uses `DATABASE_URL` from `.env`).

**Smoke tests (browser or curl):**

| URL | Expected |
|-----|----------|
| http://127.0.0.1:8000/api/v1/health | `{"status":"ok",...}` |
| http://127.0.0.1:8000/api/v1/auctions | JSON list; **Live** first |
| http://127.0.0.1:8000/api/v1/auctions/{id}/monitor | Admin console payload |
| http://127.0.0.1:8000/api/v1/auctions/{id}/live-console | Supplier console payload |
| http://127.0.0.1:8000/docs | Swagger UI |

---

## Step 3 — Local frontend

The folder name `%^&` breaks Vite on Windows — use the subst helper:

```powershell
cd frontend
npm run dev:win
```

Or one shot from root: `.\start-dev.ps1`

**Config:** `frontend/.env` → `VITE_API_URL=http://127.0.0.1:8000/api/v1`

Open **http://127.0.0.1:3000**

---

## Step 4 — Verify both portals (Run it.md / acceptance slice)

### Admin portal (Marcus — procurement buyer)

Use profile menu → **Marcus Vance (Procurement Buyer)**.

| Area | Route (in-app) | Check |
|------|----------------|-------|
| Dashboard | `dashboard` | Metrics, tasks load from API |
| Requisitions | `requisitions` → detail | PR lines, create/submit |
| Bids / RFQ | `bids` → `bid-detail` | Comparison, award |
| Purchase orders | `purchase-orders` → detail | PO list + detail |
| Invoices | `invoices` | AP list |
| **Live auctions** | `auctions` → `auction-monitor` | Monitor, leaderboard, activity from API |
| Suppliers | `suppliers` → detail | Directory + detail |
| Categories / items | `categories` | CRUD to API |
| Budgets / AI / Integrations | sidebar | Pages load |

### Buyer portal — supplier workspace (Elena)

Switch role → **Elena Rostova (Precision Components - Supplier)**.

| Area | Route | Check |
|------|-------|-------|
| Dashboard | `buyer-dashboard` | Events, registration progress |
| Registration | `registration-wizard` | Step progress |
| Bid responses | `buyer-bids` → `buyer-bid-response` | Submit quote |
| POs / invoices / contracts | sidebar | Lists from API |
| **Auction console** | `buyer-auctions` → `buyer-auction-console` | **Live only**: reverse line bids or forward amount; scheduled/closed = read-only list |

---

## Step 5 — GitHub → Render (backend)

1. Push `main` to https://github.com/bharath-techcitta/Sellmygoods.git
2. Render service (`render.yaml`): **procurio-backend**
3. Environment on Render:
   - `DATABASE_URL` = Neon connection string
   - `CORS_ORIGINS` = your Vercel URL or `*`
   - `PYTHON_VERSION` = `3.11.9`
4. **Required:** set `DATABASE_URL` to the same Neon string as local `.env` (without committing `.env`).
5. Redeploy — `render_startup.py` migrates + seeds **before** Uvicorn starts.
6. Verify: `https://<your-render-host>/api/v1/health/db` → `status: ok` and non-zero counts.

Copy Render URL: `https://<service>.onrender.com`

---

## Step 6 — Vercel (frontend)

1. Import repo; **Root Directory** = `frontend`
2. Build: `npm run build` → output `dist`
3. Environment variable:
   - `VITE_API_URL` = `https://<your-render-host>/api/v1`
4. Redeploy after env changes.

---

## Step 7 — Production smoke (same as local)

- Admin: Live Auctions → open a **Live** lot → monitor
- Supplier: Auction Console → **Live** → place bid
- API health on Render: `/api/v1/health`, `/api/v1/auctions`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on `/health` or `/monitor` | Old uvicorn on 8000 — kill process, restart `run_server.py` |
| Neon seed fails mid-run | Re-run `push_to_neon.py` (retries); use `--force` only if needed |
| Frontend API errors | Check `VITE_API_URL`; CORS on Render |
| Vite/npm path errors | Use `npm run dev:win` or move repo to path without `%^&` |

---

## Document map

- **Run it.md** — full product spec (screens, routes, 118 features)
- **DEPLOYMENT_GUIDE.md** — Neon / Render / Vercel detail
- **RERUN.md** — quick local + Neon commands
