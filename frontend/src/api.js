const BASE_URL = import.meta.env?.VITE_API_URL 
  || (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL)
  || (typeof window !== 'undefined' && (window.location.origin.includes('localhost:3000') || window.location.origin.includes('localhost:5173'))
    ? 'http://localhost:8000/api/v1' 
    : '/api/v1');

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
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

  // Suppliers
  getSuppliers: (status = '', search = '') => 
    request(`/suppliers?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`),
  getSupplierDetail: (id) => request(`/suppliers/${id}`),
  inviteSupplier: (data) => request('/suppliers/invite', { method: 'POST', body: JSON.stringify(data) }),

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
  placeAuctionBid: (id, bid_amount) => request(`/auctions/${id}/bid`, { method: 'POST', body: JSON.stringify({ bid_amount }) }),

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
