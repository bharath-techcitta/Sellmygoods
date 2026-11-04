import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultPOs = [
  { po: { id: 1, po_number: 'PO_2026_0142', status: 'Issued', receipt_status: 'Pending Receipt', invoice_status: 'Not Invoiced', payment_status: 'Unpaid', delivery_date: '2026-11-20', net_amount: 36000.0, currency: 'USD', department: 'Information Technology' }, supplier_name: 'Precision Components Ltd' },
  { po: { id: 2, po_number: 'PO_2026_0143', status: 'Approved', receipt_status: 'Fully Received', invoice_status: 'Invoiced', payment_status: 'Paid', delivery_date: '2026-12-05', net_amount: 24500.0, currency: 'USD', department: 'Logistics' }, supplier_name: 'Apex Global Logistics Inc' },
];

export default function PurchaseOrderList({ navigateTo, onSelectPO }) {
  const [rows, setRows] = useState(defaultPOs);

  useEffect(() => {
    api.getPurchaseOrders()
      .then((res) => {
        if (res && res.length) setRows(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>Purchase Orders</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Issue, track receipt, invoicing, and payment status for committed spend
          </p>
        </div>
      </div>

      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>PO Number</th>
              <th style={{ padding: '12px 18px' }}>Supplier</th>
              <th style={{ padding: '12px 18px' }}>Department</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px' }}>Receipt</th>
              <th style={{ padding: '12px 18px' }}>Delivery</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const p = row.po || row;
              return (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid #f1f1f4', cursor: 'pointer' }}
                  onClick={() => {
                    onSelectPO(p.id);
                    navigateTo('purchase-order-detail');
                  }}
                >
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{p.po_number}</td>
                  <td style={{ padding: '12px 18px' }}>{row.supplier_name || '—'}</td>
                  <td style={{ padding: '12px 18px' }}>{p.department}</td>
                  <td style={{ padding: '12px 18px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 18px' }}><StatusBadge status={p.receipt_status} /></td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{p.delivery_date}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${p.net_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency || 'USD'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
