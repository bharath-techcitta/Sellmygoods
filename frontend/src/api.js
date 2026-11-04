import { demoSessionHeaders } from './demoSession';

const isLocalDev =
  typeof window !== 'undefined' &&
  /localhost:3000|localhost:5173|127\.0\.0\.1:3000|127\.0\.0\.1:5173/.test(window.location.origin);

function normalizeApiBase(url) {
  if (!url || typeof url !== 'string') return url;
  let base = url.trim().replace(/\/+$/, '');
  if (base.endsWith('/api/v1')) return base;
  if (base.endsWith('/api')) return `${base}/v1`;
  return `${base}/api/v1`;
}

const envApiUrl = normalizeApiBase(
  import.meta.env?.VITE_API_URL || (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL)
);

const BASE_URL =
  envApiUrl ||
  (isLocalDev ? 'http://localhost:8000/api/v1' : '/api/v1');

if (typeof window !== 'undefined' && !envApiUrl && !isLocalDev) {
  console.warn(
    '[Procurio] VITE_API_URL is not set on Vercel. Role switch and API calls will fail unless you point the frontend at your Render backend.'
  );
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...demoSessionHeaders(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network response was not ok' }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  getMe: () => request('/auth/me'),
  switchRole: (role, portal, supplier_id = 1) => 
    request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role, portal, supplier_id }) }),

  // Dashboard
  getMetrics: () => request('/dashboard/metrics'),
  getTasks: () => request('/dashboard/tasks'),
  getActivity: () => request('/dashboard/recent-activity'),
  getNotifications: () => request('/notifications'),

  // Suppliers
  getSuppliers: (status = '', search = '') => 
    request(`/suppliers?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
  getSupplierDetail: (id) => request(`/suppliers/${id}`),
  inviteSupplier: (data) => request('/suppliers/invite', { method: 'POST', body: JSON.stringify(data) }),

  getCategories: () => request('/categories'),
  getItems: (category_id = '', search = '') => {
    const params = new URLSearchParams();
    if (category_id) params.set('category_id', String(category_id));
    if (search) params.set('search', search);
    const q = params.toString();
    return request(`/items${q ? `?${q}` : ''}`);
  },
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  createItem: (data) => request('/items', { method: 'POST', body: JSON.stringify(data) }),

  // Requisitions
  getRequisitions: (status = '', search = '') =>
    request(`/requisitions?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
  getRequisitionDetail: (id) => request(`/requisitions/${id}`),
  createRequisition: (data) => request('/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  submitRequisition: (id) => request(`/requisitions/${id}/submit`, { method: 'POST' }),
  convertRequisition: (id, conversion_type, supplier_id = 1) =>
    request(`/requisitions/${id}/convert`, { method: 'POST', body: JSON.stringify({ conversion_type, supplier_id }) }),

  // Sourcing & Bids
  getSourcingEvents: () => request('/sourcing-events'),
  getSourcingEventDetail: (id) => request(`/sourcing-events/${id}`),
  getBidComparison: (id) => request(`/sourcing-events/${id}/comparison`),
  awardBid: (id, winning_supplier_id, award_notes) =>
    request(`/sourcing-events/${id}/award`, { method: 'POST', body: JSON.stringify({ winning_supplier_id, award_notes }) }),

  // Supplier Workspace
  getSupplierEvents: () => request('/supplier/events'),
  submitBidResponse: (data) => request('/supplier/responses/submit', { method: 'POST', body: JSON.stringify(data) }),

  // Purchase Orders & Receiving
  getPurchaseOrders: () => request('/purchase-orders'),
  getPurchaseOrderDetail: (id) => request(`/purchase-orders/${id}`),
  receiveGoods: (id, accepted_qty, rejected_qty = 0, inspection_notes = '') =>
    request(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify({ accepted_qty, rejected_qty, inspection_notes }) }),

  // Invoices
  getInvoices: () => request('/invoices'),
  getInvoiceDetail: (id) => request(`/invoices/${id}`),
  approveInvoice: (id) => request(`/invoices/${id}/approve`, { method: 'POST' }),

  // Auctions
  getAuctions: () => request('/auctions'),
  getAuction: (id) => request(`/auctions/${id}`),
  createAuction: (data) => request('/auctions', { method: 'POST', body: JSON.stringify(data) }),
  updateAuction: (id, data) => request(`/auctions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAuctionLiveConsole: (id) => request(`/auctions/${id}/live-console`),
  getAuctionMonitor: (id) => request(`/auctions/${id}/monitor`),
  placeAuctionBid: (id, payload) =>
    request(`/auctions/${id}/bid`, {
      method: 'POST',
      body: JSON.stringify(typeof payload === 'number' ? { bid_amount: payload } : payload),
    }),

  // Contracts & Clauses
  getContracts: () => request('/contracts'),
  getClauses: (type = 'All') => request(`/clauses?clause_type=${encodeURIComponent(type)}`),
  createClause: (data) => request('/clauses', { method: 'POST', body: JSON.stringify(data) }),

  // Budgets & Analytics
  getBudgets: () => request('/budgets'),
  getSpendAnalytics: () => request('/analytics/spend'),

  // Workflows & Integrations
  getWorkflows: () => request('/workflows'),
  getErpConnection: () => request('/integrations/erp'),
  testErpConnection: () => request('/integrations/erp/test', { method: 'POST' }),

  // AI Copilot
  getAiNegotiation: (event_id, supplier_id) =>
    request('/ai/negotiation-proposal', { method: 'POST', body: JSON.stringify({ event_id, supplier_id }) }),
  getAiPrDraft: (prompt) =>
    request('/ai/pr-assistant', { method: 'POST', body: JSON.stringify({ prompt }) })
};
