import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultBuyerOrders = [
  {
    po: {
      id: 1,
      po_number: 'PO_2026_0142',
      status: 'Issued',
      entity_name: 'Procurio Corp US',
      delivery_date: '2026-11-20',
      payment_terms: 'Net 30 Days',
      net_amount: 36000.0,
      currency: 'INR'
    }
  }
];

export default function BuyerPurchaseOrders({ navigateTo }) {
  const [orders, setOrders] = useState(defaultBuyerOrders);

  useEffect(() => {
    api.getPurchaseOrders()
      .then((res) => {
        if (res && res.length) setOrders(res);
      })
      .catch(console.error);
  }, []);

  const handleAcknowledge = (poNum) => {
    alert(`Order ${poNum} acknowledged. Delivery commitment confirmed for 2026-11-20.`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Customer Purchase Orders
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Legally binding purchase contracts issued to Precision Components Ltd
          </p>
        </div>
      </div>

      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>PO Number</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px' }}>Issuing Entity</th>
              <th style={{ padding: '12px 18px' }}>Promised Delivery</th>
              <th style={{ padding: '12px 18px' }}>Payment Terms</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total Order Value</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const po = o.po;
              return (
                <tr key={po.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{po.po_number}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <StatusBadge status={po.status} />
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: '500' }}>{po.entity_name}</td>
                  <td style={{ padding: '12px 18px', color: '#0f9d78', fontWeight: '600' }}>{po.delivery_date}</td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{po.payment_terms}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ₹{po.net_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {po.currency}
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleAcknowledge(po.po_number)}
                      style={{ padding: '5px 12px', backgroundColor: '#0f9d78', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      ✓ Acknowledge PO
                    </button>
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

