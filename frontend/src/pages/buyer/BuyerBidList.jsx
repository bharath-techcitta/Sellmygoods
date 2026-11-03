import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../../components/StatusBadge';

const defaultBuyerEvents = [
  {
    id: 1,
    code: 'RFQ_2026_091',
    title: 'Procurement of Enterprise Managed Core Switches (Cisco Catalyst)',
    type: 'RFQ',
    delivery_location: 'Central Logistics Hub, Dallas TX',
    submission_deadline: '2026-11-06',
    response_status: 'Quote Submitted ($36,000.00 Net)',
    submitted_net: 36000.0
  },
  {
    id: 2,
    code: 'RFQ_2026_092',
    title: 'High Pressure Industrial Ball Valves Replacement',
    type: 'RFQ',
    delivery_location: 'Plant Facility #2, Ohio',
    submission_deadline: '2026-11-12',
    response_status: 'Awaiting Participation',
    submitted_net: null
  }
];

export default function BuyerBidList({ navigateTo, onSelectEvent }) {
  const [events, setEvents] = useState(defaultBuyerEvents);

  useEffect(() => {
    api.getSupplierEvents()
      .then((res) => {
        if (res && res.length) setEvents(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      {/* Header (Image 18) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            My Invited Tenders & RFx Responses
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Submit structured technical proposals and commercial price schedules before competitive close
          </p>
        </div>
      </div>

      {/* Tender Responses Table (Image 18) */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Active Tender Invitations</h3>
          <span style={{ fontSize: '12.5px', color: '#73767b' }}>Showing 1–{events.length} of 21 records</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Response Code</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px' }}>Tender Title</th>
              <th style={{ padding: '12px 18px' }}>Event Code</th>
              <th style={{ padding: '12px 18px' }}>Type</th>
              <th style={{ padding: '12px 18px' }}>Delivery Site</th>
              <th style={{ padding: '12px 18px' }}>Submission Deadline</th>
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
                  navigateTo('buyer-bid-response');
                }}
              >
                <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177', textDecoration: 'underline' }}>
                  {e.response_code !== '—' ? e.response_code : `RSP_${e.id}_DRAFT`}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <StatusBadge status={e.response_status} />
                </td>
                <td style={{ padding: '12px 18px', fontWeight: '600', color: '#242424' }}>
                  {e.title}
                </td>
                <td style={{ padding: '12px 18px', color: '#555' }}>{e.code}</td>
                <td style={{ padding: '12px 18px' }}>
                  <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                    {e.type}
                  </span>
                </td>
                <td style={{ padding: '12px 18px', color: '#73767b' }}>{e.delivery_location}</td>
                <td style={{ padding: '12px 18px', color: '#b65c16', fontWeight: '600' }}>
                  {e.close_date || '3 Days Remaining'}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectEvent(e.id);
                      navigateTo('buyer-bid-response');
                    }}
                    style={{
                      padding: '5px 14px',
                      backgroundColor: '#432177',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Edit Quote →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar (Image 18) */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfcfd', fontSize: '12.5px', color: '#73767b' }}>
          <div>Page 1 of 3</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button style={{ padding: '4px 10px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Previous</button>
            <button style={{ padding: '4px 10px', border: 'none', background: '#432177', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: '700' }}>1</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>2</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>3</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

