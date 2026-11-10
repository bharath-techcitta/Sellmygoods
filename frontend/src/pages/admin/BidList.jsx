import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultEvents = [
  {
    id: 1,
    code: 'RFQ_2026_091',
    title: 'Procurement of Enterprise Managed Core Switches (Cisco Catalyst)',
    event_type: 'RFQ',
    status: 'Technical Review',
    stage: 'Technical Review',
    buyer_name: 'Marcus Vance',
    delivery_location: 'Central Logistics Hub, Dallas TX',
    budget: 60000.0,
    currency: 'INR'
  },
  {
    id: 2,
    code: 'RFQ_2026_092',
    title: 'High Pressure Industrial Ball Valves Replacement',
    event_type: 'RFQ',
    status: 'Live',
    stage: 'Live',
    buyer_name: 'Marcus Vance',
    delivery_location: 'Plant Facility #2, Ohio',
    budget: 18000.0,
    currency: 'INR'
  },
  {
    id: 3,
    code: 'RFP_2026_015',
    title: 'Global Logistics Freight Forwarding Master Lot',
    event_type: 'RFP',
    status: 'Awarded',
    stage: 'Awarded',
    buyer_name: 'Marcus Vance',
    delivery_location: 'Global Logistics Hubs',
    budget: 120000.0,
    currency: 'INR'
  }
];

export default function BidList({ navigateTo, onSelectEvent }) {
  const [events, setEvents] = useState(defaultEvents);

  useEffect(() => {
    api.getSourcingEvents()
      .then((res) => {
        if (res && res.length) setEvents(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Strategic Sourcing & RFx Events
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Manage RFI, RFQ, and RFP campaigns, invitation distributions, bid submissions, and awards
          </p>
        </div>
      </div>

      {/* Events Table (Image 24, 26) */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Event Code</th>
              <th style={{ padding: '12px 18px' }}>Event Title</th>
              <th style={{ padding: '12px 18px' }}>Type</th>
              <th style={{ padding: '12px 18px' }}>Lifecycle Stage</th>
              <th style={{ padding: '12px 18px' }}>Assigned Buyer</th>
              <th style={{ padding: '12px 18px' }}>Target Delivery Site</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Budget Cap</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr
                key={e.id}
                style={{ borderBottom: '1px solid #f1f1f4', cursor: 'pointer' }}
                onMouseEnter={(el) => (el.currentTarget.style.backgroundColor = '#faf9fc')}
                onMouseLeave={(el) => (el.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => {
                  onSelectEvent(e.id);
                  navigateTo('bid-detail');
                }}
              >
                <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177', textDecoration: 'underline' }}>
                  {e.code}
                </td>
                <td style={{ padding: '12px 18px', fontWeight: '500', color: '#242424' }}>
                  {e.title}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '11.5px' }}>
                    {e.event_type}
                  </span>
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <StatusBadge status={e.status} />
                </td>
                <td style={{ padding: '12px 18px', color: '#555' }}>{e.buyer_name}</td>
                <td style={{ padding: '12px 18px', color: '#73767b' }}>{e.delivery_location}</td>
                <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '600' }} className="font-mono-numbers">
                  ₹{e.budget?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {e.currency}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectEvent(e.id);
                      navigateTo('bid-detail');
                    }}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#432177',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Manage Event →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

