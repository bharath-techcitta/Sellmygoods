# SellMyGoods — Production Deployment Guide
## Complete Stack: Neon DB (PostgreSQL) + Render (FastAPI) + Vercel (React Vite)

---

### Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          Vercel Edge CDN             │
                      │   React 18 Single-Page Application   │
                      │      https://<app>.vercel.app        │
                      └──────────────────┬───────────────────┘
                                         │
                        HTTPS API Calls  │ (VITE_API_URL)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │           Render Web Service         │
                      │          FastAPI Python 3.11         │
                      │     https://<api>.onrender.com       │
                      └──────────────────┬───────────────────┘
                                         │
                        mTLS / SSL       │ (DATABASE_URL)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │          Neon DB Serverless          │
                      │         PostgreSQL Database          │
                      │       *.aws.neon.tech (SSL)          │
                      └──────────────────────────────────────┘
```

---

### Step 1: Provision Neon DB (Serverless PostgreSQL)

1. Navigate to **[https://neon.tech](https://neon.tech)** and sign in (or create a free account).
2. Click **Create Project**:
   - **Project Name:** `sellmygoods-db`
   - **Postgres Version:** 16 (Default)
   - **Region:** Choose the region nearest to your Render deployment (e.g., `US East (Ohio)` or `US East (N. Virginia)`).
3. Once the database is ready, go to the **Dashboard** and find the **Connection Details** card.
4. Select **Connection String** and make sure **Pooled connection** or standard connection with `sslmode=require` is selected.
5. Copy the connection string. It will look like:
   ```text
   postgresql://neondb_owner:npg_AbCd1234@ep-proud-flower-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Keep this string safe — you will paste it into Render in Step 3).*

---

### Step 2: Push Your Code to GitHub

Open a PowerShell / terminal window in your project root:

```powershell
# 1. Initialize Git repository
git init

# 2. Add all files (.gitignore already protects virtual environments and .env)
git add .

# 3. Create initial commit
git commit -m "feat: complete SellMyGoods enterprise dual-portal with Neon DB, Render and Vercel configs"

# 4. Set main branch
git branch -M main

# 5. Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/<your-username>/sellmygoods.git

# 6. Push code to GitHub
git push -u origin main
```

---

### Step 3: Deploy Backend to Render

1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and sign in.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `sellmygoods` repository.
4. Fill in the service configuration:
   - **Name:** `sellmygoods-backend` (or your preferred name)
   - **Region:** Same region as your Neon DB (e.g., `Oregon` or `Ohio`)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for root)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan Type:** `Free`
5. Scroll down to **Environment Variables** and add the following:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | *(Your Neon DB connection string from Step 1)* |
   | `CORS_ORIGINS` | `*` | *(Allows Vercel frontend to make API calls)* |
   | `PYTHON_VERSION` | `3.11.9` | |
6. Click **Create Web Service**.
7. Render will build the dependencies, launch Uvicorn, connect to Neon DB, and **automatically run database migrations and seed all sample data** on first startup!
8. Copy your Render service URL once deployment completes (e.g., `https://sellmygoods-backend.onrender.com`).
   - Test it by visiting `https://sellmygoods-backend.onrender.com/api/v1/auth/me` or `/docs` (Swagger UI).

---

### Step 4: Deploy Frontend to Vercel

1. Go to **[https://vercel.com](https://vercel.com)** and sign in.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your `sellmygoods` GitHub repository.
4. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select **`frontend`**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://<your-render-app-name>.onrender.com/api/v1` |
   *(Make sure to append `/api/v1` at the end).*
6. Click **Deploy**.
7. In ~60 seconds, Vercel will deploy your production React application to a global edge domain (e.g., `https://sellmygoods.vercel.app`).

---

### Step 5: End-to-End Verification Checklist

1. **Open Vercel App**: Visit your Vercel URL.
2. **Admin Portal**:
   - Check **Suppliers**: Click `Active (2)` tab $\rightarrow$ only active suppliers appear.
   - Check **Categories & Items**: Explore categories hierarchy and master SKU catalog.
   - Check **Requisitions**: Click on `PR_00084` to inspect the line items and budget headroom.
   - Check **Approval Workflows**: Review the 3-step authorization matrix.
   - Check **ERP Integrations**: Click `Test ERP Connection` $\rightarrow$ verifies SAP S/4HANA handshake.
   - Check **Live Auctions**: Verify real-time bid decrement.
3. **Role Switching**:
   - Click the profile switcher in the top right header $\rightarrow$ switch to **Elena Rostova (Buyer Portal)**.
   - Verify the Supplier Workspace, 6-Step Onboarding Wizard, and Quote Submission with Section I1 math ($36,000.00 Net).
4. **Neon DB Console Verification**:
   - Go to your Neon DB project dashboard $\rightarrow$ **Tables**.
   - You will see all tables (`suppliers`, `items`, `requisitions`, `purchase_orders`, `invoices`, `contracts`, `auctions`, etc.) populated with live records!

