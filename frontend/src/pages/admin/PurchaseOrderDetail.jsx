import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../../components/StatusBadge';

const defaultPoData = {
  po: {
    id: 1,
    po_number: 'PO_2026_0142',
    supplier_id: 1,
    source_pr: 'PR_00084',
    source_rfq: 'RFQ_2026_091',
    status: 'Issued',
    approval_status: 'Approved',
    receipt_status: 'Pending Receipt',
    invoice_status: 'Not Invoiced',
    payment_status: 'Unpaid',
    delivery_date: '2026-11-20',
    buyer_name: 'Marcus Vance',
    entity_name: 'SellMyGoods Corp US',
    department: 'Information Technology',
    gross_amount: 32000.0,
    tax_amount: 6000.0,
    net_amount: 36000.0,
    currency: 'USD'
  },
  supplier: {
    id: 1,
    legal_name: 'Precision Components Ltd',
    code: 'SUP_00101',
    contact_no: '+1 (555) 234-8900',
    email: 'contact@precisioncomponents.com',
    payment_terms: 'Net 30 Days'
  },
  lines: [
    {
      id: 1,
      line_number: 1,
      description: 'Cisco Catalyst 9300 48-Port Switch',
      ordered_qty: 10.0,
      received_qty: 0.0,
      accepted_qty: 0.0,
      rejected_qty: 0.0,
      uom: 'Unit',
      unit_price: 3000.0,
      net_amount: 36000.0
    }
  ],
  receipts: [
    {
      id: 1,
      receipt_number: 'GRN_2026_001',
      receiver_name: 'Marcus Vance',
      accepted_qty: 10.0,
      rejected_qty: 0.0,
      status: 'Accepted',
      received_at: '2026-11-03 14:00',
      inspection_notes: 'All 10 units passed QA acceptance.'
    }
  ],
  invoices: [
    {
      id: 1,
      invoice_number: 'INV_99214',
      status: 'Pending Approval',
      total_amount: 36000.0
    }
  ],
  approval_history: [
    { actor: 'Marcus Vance (Buyer)', action: 'Created Draft PO from Award', date: '2026-11-03 10:00' },
    { actor: 'David Chen (Finance Approver)', action: 'Approved PO Budget Commitment', date: '2026-11-03 11:30' }
  ]
};

export default function PurchaseOrderDetail({ poId = 1, onBack, navigateTo }) {
  const [data, setData] = useState(defaultPoData);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [acceptedQty, setAcceptedQty] = useState(10);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [inspectionNotes, setInspectionNotes] = useState('All 10 units passed hardware QA inspection without cosmetic or operational defects.');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadDetail();
  }, [poId]);

  const loadDetail = async () => {
    try {
      const res = await api.getPurchaseOrderDetail(poId || 1);
      if (res && res.po) setData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const po = data.po;
  const s = data.supplier;

  return (
    <div>
      {/* Top Header (Image 25) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e6e6e9',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Back to Orders
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#242424' }}>
                {po.po_number}
              </h1>
              <StatusBadge status={po.status} />
              <StatusBadge status={po.receipt_status} />
              <StatusBadge status={po.invoice_status} />
            </div>
            <div style={{ fontSize: '13px', color: '#73767b', marginTop: '2px' }}>
              Source PR: <strong style={{ color: '#432177' }}>{po.source_pr}</strong> • Source RFQ: {po.source_rfq}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#0f9d78',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📦</span> Record Goods Receipt
          </button>
          <button
            onClick={() => navigateTo('invoices')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#432177',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            View Matching Invoices →
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: '10px 16px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* 3 Summary Columns (Section E13, Image 25) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '20px' }}>
        {/* Column 1: Order Details */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
            1. Order Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#73767b' }}>Operating Entity:</span>
              <div style={{ fontWeight: '600' }}>{po.entity_name}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Department / Cost Centre:</span>
              <div style={{ fontWeight: '500' }}>{po.department}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Procurement Buyer:</span>
              <div style={{ fontWeight: '500' }}>{po.buyer_name}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Approval Release:</span>
              <div style={{ fontWeight: '600', color: '#0f9d78' }}>Authorized by Finance Controller</div>
            </div>
          </div>
        </div>

        {/* Column 2: Supplier & Delivery */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
            2. Supplier & Delivery
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#73767b' }}>Contracted Vendor:</span>
              <div style={{ fontWeight: '700', color: '#432177' }}>{s?.legal_name || 'Precision Components Ltd'}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Vendor Address:</span>
              <div style={{ fontWeight: '500' }}>{s?.address || '104 Industrial Parkway, Austin, TX'}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Target Delivery Schedule:</span>
              <div style={{ fontWeight: '600', color: '#0f9d78' }}>{po.delivery_date}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Ship-to Location:</span>
              <div style={{ fontWeight: '500' }}>Central Logistics Hub, Dallas TX</div>
            </div>
          </div>
        </div>

        {/* Column 3: Payment & Amount */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
            3. Payment & Amount
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#73767b' }}>Subtotal Gross:</span>
              <span className="font-mono-numbers">${po.gross_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#73767b' }}>Standard Tax (20%):</span>
              <span className="font-mono-numbers">${po.tax_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ borderTop: '2px solid #e6e6e9', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', color: '#432177' }}>
              <span>Total Committed:</span>
              <span className="font-mono-numbers">${po.net_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {po.currency}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#73767b' }}>
              Payment Terms: <strong style={{ color: '#242424' }}>{po.payment_terms}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PO Lines Table (Image 25) */}
      <div className="card-enterprise" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Purchase Order Line Items & Delivery Schedules</h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Line #</th>
              <th style={{ padding: '12px 18px' }}>Item Description</th>
              <th style={{ padding: '12px 18px' }}>Ordered Qty</th>
              <th style={{ padding: '12px 18px' }}>Received Qty</th>
              <th style={{ padding: '12px 18px' }}>Accepted Qty</th>
              <th style={{ padding: '12px 18px' }}>UOM</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lines?.map((line) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                <td style={{ padding: '12px 18px', fontWeight: '600' }}>{line.line_number}</td>
                <td style={{ padding: '12px 18px', fontWeight: '500', color: '#242424' }}>{line.description}</td>
                <td style={{ padding: '12px 18px', fontWeight: '600' }}>{line.ordered_qty}</td>
                <td style={{ padding: '12px 18px', color: line.received_qty > 0 ? '#0f9d78' : '#73767b', fontWeight: '600' }}>
                  {line.received_qty}
                </td>
                <td style={{ padding: '12px 18px', color: line.accepted_qty > 0 ? '#0f9d78' : '#73767b', fontWeight: '600' }}>
                  {line.accepted_qty}
                </td>
                <td style={{ padding: '12px 18px' }}>{line.uom}</td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }} className="font-mono-numbers">
                  ${line.unit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                  ${line.net_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipts Recorded */}
      {data.receipts && data.receipts.length > 0 && (
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
            Goods Receipts Recorded (GRN)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.receipts.map((rcpt) => (
              <div key={rcpt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#fcfcfd', border: '1px solid #ededf0', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#432177' }}>{rcpt.receipt_number}</div>
                  <div style={{ fontSize: '12px', color: '#73767b', marginTop: '2px' }}>
                    Received by: {rcpt.receiver_name} • Accepted: {rcpt.accepted_qty} units • Rejected: {rcpt.rejected_qty}
                  </div>
                  <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
                    Notes: {rcpt.inspection_notes}
                  </div>
                </div>
                <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  ✓ {rcpt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goods Receipt Modal */}
      {isReceiptModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '500px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Record Goods Receipt (GRN)</h3>
            <form onSubmit={handleRecordReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Accepted Quantity</label>
                  <input
                    type="number"
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Rejected Quantity</label>
                  <input
                    type="number"
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>QA Inspection Log</label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  style={{ width: '100%', height: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e6e6e9', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0f9d78', color: '#fff', fontWeight: '600' }}
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

