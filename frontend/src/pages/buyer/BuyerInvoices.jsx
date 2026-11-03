import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultBuyerInvoices = [
  {
    invoice: {
      id: 1,
      invoice_number: 'INV_99214',
      status: 'Pending Approval',
      match_status: '3-Way Matched',
      invoice_date: '2026-11-03',
      due_date: '2026-12-03',
      total_amount: 36000.0,
      currency: 'USD'
    }
  }
];

export default function BuyerInvoices() {
  const [invoices, setInvoices] = useState(defaultBuyerInvoices);

  useEffect(() => {
    api.getInvoices()
      .then((res) => {
        if (res && res.length) setInvoices(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Submitted Invoices & Payment Schedule
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Real-time tracking of 3-way matching approvals and automated treasury disbursement releases
          </p>
        </div>
      </div>

      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Invoice #</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px' }}>Match Verification</th>
              <th style={{ padding: '12px 18px' }}>Invoice Date</th>
              <th style={{ padding: '12px 18px' }}>Due Date</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Billed Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invObj) => {
              const inv = invObj.invoice;
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600' }}>
                      ✓ {inv.match_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{inv.invoice_date}</td>
                  <td style={{ padding: '12px 18px', color: '#432177', fontWeight: '600' }}>{inv.due_date}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${inv.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency}
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

