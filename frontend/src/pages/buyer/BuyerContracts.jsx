import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../../components/StatusBadge';

const defaultBuyerContracts = [
  {
    contract: {
      id: 1,
      contract_number: 'CTR_2026_004',
      title: 'Enterprise Master IT Equipment & Maintenance Agreement',
      contract_type: 'Master Services Agreement',
      start_date: '2026-01-01',
      end_date: '2028-12-31',
      status: 'Active',
      total_value: 250000.0,
      currency: 'USD'
    }
  }
];

export default function BuyerContracts() {
  const [contracts, setContracts] = useState(defaultBuyerContracts);

  useEffect(() => {
    api.getContracts()
      .then((res) => {
        if (res && res.length) setContracts(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Master Contracts & Legal Agreements
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Signed master terms, rate cards, and digital signature envelopes
          </p>
        </div>
      </div>

      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Contract #</th>
              <th style={{ padding: '12px 18px' }}>Agreement Title</th>
              <th style={{ padding: '12px 18px' }}>Type</th>
              <th style={{ padding: '12px 18px' }}>Term Validity</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Agreed Value</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((cObj) => {
              const c = cObj.contract;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{c.contract_number}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '600', color: '#242424' }}>{c.title}</td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{c.contract_type}</td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{c.start_date} → {c.end_date}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${c.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {c.currency}
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

