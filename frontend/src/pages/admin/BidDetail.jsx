import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../../components/StatusBadge';
import CompareBidsModal from '../../components/CompareBidsModal';
import InviteSupplierDrawer from '../../components/InviteSupplierDrawer';

const defaultEventData = {
  event: {
    id: 1,
    code: 'RFQ_2026_091',
    title: 'Procurement of Enterprise Managed Core Switches (Cisco Catalyst)',
    event_type: 'RFQ',
    status: 'Technical Review',
    stage: 'Technical Review',
    budget: 60000.0,
    currency: 'USD',
    payment_terms: 'Net 30 Days',
    delivery_location: 'Central Logistics Hub, Dallas TX',
    buyer_name: 'Marcus Vance',
    requester_name: 'Sarah Jenkins',
    department: 'Information Technology',
    linked_pr_number: 'PR_00084',
    open_date: '2026-10-25',
    close_date: '2026-11-06',
    is_sealed: true
  },
  responses: [
    {
      response: {
        id: 1,
        response_code: 'RSP_091_PRECISION',
        status: 'Submitted',
        gross_amount: 32000.0,
        discount_amount: 2000.0,
        tax_amount: 6000.0,
        net_quote: 36000.0,
        technical_score: 92.0,
        commercial_score: 88.0,
        total_score: 90.0,
        evaluator_remarks: 'Fully compliant with technical IEEE specs, provides 5-year hardware replacement SLA.'
      },
      supplier: {
        id: 1,
        legal_name: 'Precision Components Ltd',
        code: 'SUP_00101'
      }
    },
    {
      response: {
        id: 2,
        response_code: 'RSP_091_APEX',
        status: 'Submitted',
        gross_amount: 34500.0,
        discount_amount: 1500.0,
        tax_amount: 6600.0,
        net_quote: 39600.0,
        technical_score: 85.0,
        commercial_score: 82.0,
        total_score: 83.5,
        evaluator_remarks: 'Standard 3-year warranty, slightly higher unit cost and delivery timeline.'
      },
      supplier: {
        id: 2,
        legal_name: 'Apex Global Logistics Inc',
        code: 'SUP_00102'
      }
    }
  ],
  rules: {
    technical_weight: 0.5,
    commercial_weight: 0.5,
    sealed_bid: true
  }
};

export default function BidDetail({ eventId = 1, onBack, navigateTo }) {
  const [data, setData] = useState(defaultEventData);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [eventId]);

  const loadDetail = async () => {
    try {
      const res = await api.getSourcingEventDetail(eventId || 1);
      if (res && res.event) setData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const e = data.event;
  const stages = [
    'Prepare Bid',
    'Publish',
    'Closed',
    'Technical Review',
    'Commercial Review',
    'Prepare Award',
    'Award Approval',
    'Awarded'
  ];

  const currentStageIndex = stages.indexOf(e.stage) >= 0 ? stages.indexOf(e.stage) : 3;

  return (
    <div>
      {/* Header (Image 24) */}
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
            ← Back to Sourcing Events
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#242424' }}>
                {e.code} — {e.title}
              </h1>
              <StatusBadge status={e.status} />
              <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                {e.event_type}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#73767b', marginTop: '2px' }}>
              Linked Request: <strong style={{ color: '#432177' }}>{e.linked_pr_number || 'PR_00084'}</strong> • Owner: {e.buyer_name}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsInviteOpen(true)}
            style={{
              padding: '8px 14px',
              border: '1px solid #e6e6e9',
              background: '#fff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Invite Suppliers
          </button>
          <button
            onClick={() => setIsCompareOpen(true)}
            style={{
              padding: '8px 18px',
              backgroundColor: '#432177',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(67, 33, 119, 0.3)'
            }}
          >
            📊 Compare Bids & Award →
          </button>
        </div>
      </div>

      {/* Horizontal Stage Tracker (Section C3, Image 24) */}
      <div className="card-enterprise" style={{ padding: '16px 20px', marginBottom: '20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '850px' }}>
          {stages.map((st, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            let bgColor = '#f3f4f6';
            let textColor = '#73767b';
            let dotColor = '#cbd5e1';

            if (isCompleted) {
              bgColor = '#d1fae8';
              textColor = '#0f9d78';
              dotColor = '#0f9d78';
            } else if (isCurrent) {
              bgColor = '#f0e5ff';
              textColor = '#432177';
              dotColor = '#432177';
            }

            return (
              <React.Fragment key={st}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: isCurrent ? '700' : '500', color: textColor }}>
                    {st}
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: idx < currentStageIndex ? '#0f9d78' : '#e6e6e9',
                      margin: '0 8px'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Metadata & Deadline Banner (Image 24) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
            Event Scope & Commercial Parameters
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#73767b' }}>Delivery Destination:</span>
              <div style={{ fontWeight: '500' }}>{e.delivery_location}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Commercial Terms:</span>
              <div style={{ fontWeight: '600', color: '#0f9d78' }}>{e.payment_terms}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Procurement Budget:</span>
              <div style={{ fontWeight: '700' }} className="font-mono-numbers">${e.budget?.toLocaleString()} {e.currency}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Bidding Envelope:</span>
              <div style={{ fontWeight: '500' }}>Sealed Commercial Quotes</div>
            </div>
          </div>
        </div>

        {/* Evaluation Team Card (Image 17) */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
            Assigned Evaluation Team
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.evaluation_team?.map((member, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#242424' }}>{member.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#73767b' }}>{member.role}</div>
                </div>
                <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  ✓ {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supplier Responses Table (Images 17, 26) */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
            Submitted Supplier Quotes ({data.responses?.length || 0})
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsCompareOpen(true)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#432177',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Open Comparison Matrix
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Supplier Entity</th>
              <th style={{ padding: '12px 18px' }}>Response Code</th>
              <th style={{ padding: '12px 18px' }}>Technical Score</th>
              <th style={{ padding: '12px 18px' }}>Commercial Score</th>
              <th style={{ padding: '12px 18px' }}>Composite Score</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Evaluated Net Quote</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.responses?.map((rObj) => {
              const r = rObj.response;
              const s = rObj.supplier;
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '600', color: '#242424' }}>
                    {s?.legal_name || 'Precision Components Ltd'}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#432177', fontWeight: '500' }}>
                    {r.response_code}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#0f9d78', fontWeight: '600' }}>
                    {r.technical_score}%
                  </td>
                  <td style={{ padding: '12px 18px', color: '#432177', fontWeight: '600' }}>
                    {r.commercial_score}%
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: '700', fontSize: '14px' }}>
                    {r.total_score} pts
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${r.net_quote?.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => setIsCompareOpen(true)}
                      style={{ padding: '4px 10px', border: '1px solid #432177', color: '#432177', background: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Compare
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Compare Bids Modal */}
      {isCompareOpen && (
        <CompareBidsModal
          eventId={e.id}
          onClose={() => setIsCompareOpen(false)}
          onAwardSuccess={() => {
            loadDetail();
            navigateTo('purchase-orders');
          }}
        />
      )}

      {/* Invite Supplier Drawer */}
      <InviteSupplierDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSuccess={loadDetail}
      />
    </div>
  );
}

