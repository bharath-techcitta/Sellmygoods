# SellMyGoods — Enterprise Procurement & Supplier Collaboration Platform

A dual-portal enterprise procurement web application built strictly to the specifications in `Run it.md` and the 30 screenshot references.

---

## Architecture Overview

```
SellMyGoods/
├── backend/                  # Python FastAPI Backend
│   ├── database.py           # SQLAlchemy SQLite connection engine
│   ├── models.py             # 13-Module Relational Schema (Appendix §15.3, Section G2)
│   ├── calculations.py       # Financial Engine, Quotation Math, Scoring, Budget Ledgers
│   ├── seed.py               # Seed data for vendors, PRs, RFQs, POs, Invoices, Workflows
│   └── main.py               # REST API endpoints (/api/v1/*) & static SPA mounting
│
├── frontend/                 # React Frontend Architecture (Vite + Modular Components)
│   ├── package.json          # React dependencies & build scripts
│   ├── vite.config.js        # Vite dev server configuration with API proxying
│   ├── src/
│   │   ├── api.js            # API client wrapper
│   │   ├── index.css         # Design tokens & CSS custom variables (Section C1)
│   │   ├── components/       # AppShell, Navbar, Sidebar, MetricCard, StatusBadge,
│   │   │                     # CompareBidsModal, InviteSupplierDrawer, CreateBidModal, AiAssistant
│   │   ├── pages/admin/      # Admin Portal screens (Dashboard, Suppliers, Categories,
│   │   │                     # Workflows, PRs, Bids, POs, Invoices, Auctions, Clauses, ERP)
│   │   ├── pages/buyer/      # Buyer Portal screens (Supplier Dashboard, 6-Step Wizard,
│   │   │                     # Bids, Quotation Forms, PO Acknowledgment, Invoices)
│   │   ├── App.jsx           # Master Portal Switcher & SPA Router
│   │   └── main.jsx          # React DOM entry point
│   └── index.html            # Vite HTML template
│
├── static/                   # Production-bundled React SPA
│   └── index.html            # Standalone browser-executable React 18 Application
│
├── run_server.py             # Instant application launcher (Uvicorn + FastAPI)
└── test_system.py            # Comprehensive 11-point test suite for calculations & APIs
```

---

## Key Capabilities & Features

### 1. Dual-Portal Role System
- **Admin Portal (`/admin/*`)**: Internal procurement workspace for Buyers, Approvers, Finance Controllers, and Administrators.
- **Buyer Portal (`/buyer/*`)**: External Supplier Workspace for invited suppliers (e.g., *Precision Components Ltd*).
- **1-Click User & Role Switcher**: Located in the top header navbar to seamlessly toggle between **Marcus Vance (Procurement Buyer)** and **Elena Rostova (Supplier User)**.

### 2. Design System Adherence (Section C1)
- **Deep Purple Sidebar**: `#2e1857`, 242px expanded width, active item highlight `#482a73`.
- **Top Header**: `#ffffff`, 58px height, workspace pill identifier, global search, notifications badge, user profile.
- **Canvas & Cards**: `#f7f7f8` canvas background, `#ffffff` cards with 13px radius and `#e6e6e9` border.
- **Floating AI Assistant**: 56px circular purple launcher (`#432177`) bottom-right with slide-out Copilot drawer.

### 3. Financial & Quotation Arithmetic (Section I1)
Verified exact formula:
$$\text{Gross} = q \times p$$
$$\text{Discount} = q \times d$$
$$\text{Taxable Base} = \text{Gross} - \text{Discount}$$
$$\text{Net} = \text{Taxable Base} + (\text{Taxable Base} \times r)$$
*Example:* 10 units at \$3,200 list price with \$200 unit discount and 20% tax yields **\$36,000.00 Net**.

### 4. Modules Implemented
- **E01 Admin Dashboard**: Top 3 metrics, 2-column pending approvals & my requests, task list, and persistent activity stream.
- **E02/E03 Supplier Directory & Detail**: 8 status filter chips, AI Supplier Rank, 600px Invite Supplier drawer, full corporate profiles, banking details, compliance docs, and approval history.
- **E04 External 6-Step Registration Wizard**: Company details, contacts, supply scope, banking, certificates, and review profile with 83% completion ring and cryptographic submission receipt.
- **E05 Categories & Items**: Taxonomy hierarchy, active toggles, and item master catalog with SKU, UOM, and approved pricing.
- **E06 Approval Workflow Designer**: Multi-tier sequential/parallel stages, conditions, SLAs, and authority limits.
- **E07/E08 Requisitions (PR)**: PR list, line items, budget check, submission, and conversion to RFx or Direct PO.
- **E09/E10 Sourcing & Bid Comparison**: Create Bid modal, stage tracker, deadline countdown, evaluation team cards, and comprehensive technical/financial/award comparison matrix.
- **E11 External Bid Quotation**: Supplier quotation form with live calculation of gross, discount, tax, and net quote.
- **E12 Auctions**: Reverse and forward auctions with live bidding console and tick validation.
- **E13 Purchase Orders & Receiving**: 3 summary columns, PO lines, and Goods Receipt (GRN) inspection modal.
- **E14 Invoices & 3-Way Matching**: PO vs Receipt vs Invoice line verification workspace and AP approval release.
- **E15 Contract Clause Library**: Pre-approved clause cards with AI Clause Builder and type filters.
- **E16 Budgets & Spend Analytics**: Ledger headroom calculations, spend concentration by category, and realized savings tracking.
- **E17 ERP Integration**: SAP S/4HANA connector settings and latency test tool.
- **E18 AI Negotiation Copilot**: Market price intelligence, benchmark comparisons, and talking points.

---

## How to Run & Test

### Run Verification Test Suite
```powershell
python test_system.py
```

### Launch the Complete Application
```powershell
python run_server.py
```
Open **`http://localhost:8000`** in any web browser to explore both portals live!

