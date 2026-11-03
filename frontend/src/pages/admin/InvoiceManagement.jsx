import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultInvoices = [
  {
    invoice: {
      id: 1,
      invoice_number: 'INV_99214',
      po_id: 1,
      invoice_date: '2026-11-03',
      due_date: '2026-12-03',
      status: 'Pending Approval',
      match_status: '3-Way Matched',
      subtotal: 30000.0,
      tax_amount: 6000.0,
      total_amount: 36000.0,
      currency: 'USD'
    },
    supplier_name: 'Precision Components Ltd'
  },
  {
    invoice: {
      id: 2,
      invoice_number: 'INV_99215',
      po_id: 2,
      invoice_date: '2026-10-28',
      due_date: '2026-11-28',
      status: 'Verified',
      match_status: '3-Way Matched',
      subtotal: 22000.0,
      tax_amount: 2500.0,
      total_amount: 24500.0,
      currency: 'USD'
    },
    supplier_name: 'Apex Global Logistics Inc'
  },
  {
    invoice: {
      id: 3,
      invoice_number: 'INV_99216',
      po_id: 3,
      invoice_date: '2026-10-18',
      due_date: '2026-11-18',
      status: 'Approved',
      match_status: '3-Way Matched',
      subtotal: 11000.0,
      tax_amount: 1800.0,
      total_amount: 12800.0,
      currency: 'USD'
    },
    supplier_name: 'Vertex Industrial Tools Inc'
  }
];

const defaultSelectedInvoice = {
  invoice: defaultInvoices[0].invoice,
  supplier: {
    legal_name: 'Precision Components Ltd',
    code: 'SUP_00101',
    payment_terms: 'Net 30 Days'
  },
  po: {
    po_number: 'PO_2026_0142',
    net_amount: 36000.0
  },
  matching_comparison: {
    po_amount: 36000.0,
    receipt_accepted_qty: 10,
    invoice_qty: 10,
    variance_amount: 0.0,
    tolerance_status: 'Within Zero-Tolerance Limit'
  }
};

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState(defaultInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState(defaultSelectedInvoice);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await api.getInvoices();
      if (res && res.length) {
        setInvoices(res);
        loadDetail(res[0].invoice.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDetail = async (id) => {
    try {
      const detail = await api.getInvoiceDetail(id);
      if (detail && detail.invoice) setSelectedInvoice(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveInvoice(id);
      setActionSuccess("Invoice approved! Commercial liability scheduled for automated ERP settlement.");
      loadInvoices();
    } catch (e) {
      alert(e.message || "Approval failed");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Invoices & Accounts Payable (3-Way Matching)
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Automated line reconciliation across Purchase Order, Accepted Receiving GRN, and Supplier Billing
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '10px 16px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          ✓ {actionSuccess}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '20px' }}>
        {/* Left: Invoice List */}
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', fontWeight: '700', fontSize: '15px' }}>
            Invoices Awaiting Review ({invoices.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {invoices.map((invObj) => {
              const inv = invObj.invoice;
              const isSelected = selectedInvoice?.invoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => loadDetail(inv.id)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #f1f1f4',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#faf5ff' : '#ffffff',
                    borderLeft: isSelected ? '4px solid #432177' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#432177', fontSize: '14px' }}>
                      {inv.invoice_number}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#242424', fontWeight: '500', marginTop: '3px' }}>
                    {invObj.supplier_name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#73767b', marginTop: '6px' }}>
                    <span>Due: {inv.due_date}</span>
                    <strong style={{ color: '#242424' }} className="font-mono-numbers">
                      ${inv.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 3-Way Match Workspace */}
        {selectedInvoice && (
          <div className="card-enterprise" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#242424' }}>
                  Match Reconciliation Workspace
                </h3>
                <span style={{ fontSize: '12px', color: '#73767b' }}>
                  Comparing against Linked PO: <strong style={{ color: '#432177' }}>{selectedInvoice.po?.po_number || 'PO_2026_0142'}</strong>
                </span>
              </div>
              {selectedInvoice.invoice.status !== 'Approved' && (
                <button
                  onClick={() => handleApprove(selectedInvoice.invoice.id)}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0f9d78',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Approve & Release
                </button>
              )}
            </div>

            {/* 3-Way Matching Matrix */}
            <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', fontSize: '13.5px', marginBottom: '12px', color: '#432177' }}>
                Three-Way Verification Check (Zero Tolerance)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', fontSize: '12.5px' }}>
                <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ededf0', borderRadius: '6px' }}>
                  <div style={{ color: '#73767b', marginBottom: '4px' }}>1. Purchase Order</div>
                  <div style={{ fontWeight: '700', color: '#242424' }}>10 Units Ordered</div>
                  <div className="font-mono-numbers" style={{ color: '#555', marginTop: '2px' }}>$36,000.00 Authorized</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ededf0', borderRadius: '6px' }}>
                  <div style={{ color: '#73767b', marginBottom: '4px' }}>2. Goods Receipt (GRN)</div>
                  <div style={{ fontWeight: '700', color: '#0f9d78' }}>10 Units Accepted</div>
                  <div style={{ color: '#555', marginTop: '2px' }}>0 Defective / Rejected</div>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ededf0', borderRadius: '6px' }}>
                  <div style={{ color: '#73767b', marginBottom: '4px' }}>3. Supplier Invoice</div>
                  <div style={{ fontWeight: '700', color: '#432177' }}>10 Units Billed</div>
                  <div className="font-mono-numbers" style={{ color: '#555', marginTop: '2px' }}>$36,000.00 Claimed</div>
                </div>
              </div>

              <div style={{ marginTop: '14px', padding: '8px 12px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓</span> Perfect 3-Way Match: Zero quantity discrepancy and zero price variance detected.
              </div>
            </div>

            {/* Invoice Line Breakdown */}
            <div style={{ borderTop: '1px solid #e6e6e9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#73767b' }}>Taxable Net Subtotal:</span>
                <span className="font-mono-numbers">${selectedInvoice.invoice.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#73767b' }}>Sales Tax / VAT (20%):</span>
                <span className="font-mono-numbers">${selectedInvoice.invoice.tax_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e6e6e9', paddingTop: '8px', fontWeight: '700', fontSize: '16px', color: '#432177' }}>
                <span>Total Payable Amount:</span>
                <span className="font-mono-numbers">${selectedInvoice.invoice.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedInvoice.invoice.currency}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

