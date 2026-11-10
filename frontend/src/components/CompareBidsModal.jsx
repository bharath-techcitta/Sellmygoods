import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function CompareBidsModal({ eventId, onClose, onAwardSuccess }) {
  const [activeTab, setActiveTab] = useState('financial'); // technical, financial, award
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBidComparison(eventId);
        setComparisonData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  const handleAward = async (supplierId) => {
    setAwarding(true);
    try {
      const res = await api.awardBid(
        eventId,
        supplierId,
        "Awarded to Precision Components based on evaluated lowest TCO and verified 5-year replacement SLA."
      );
      alert(`Award Approved! Generated Purchase Order: ${res.po_number}`);
      if (onAwardSuccess) onAwardSuccess(res);
      onClose();
    } catch (e) {
      alert(e.message || "Failed to award bid");
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px' }}>Loading Bid Matrix...</div>
      </div>
    );
  }

  const suppliers = comparisonData?.suppliers || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          width: '95%',
          maxWidth: '1240px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header (Images 15 & 16) */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e6e6e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#242424' }}>
                Bid Comparison Matrix — {comparisonData?.event_code}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#73767b' }}>
              {comparisonData?.event_title} • Evaluated in {comparisonData?.currency}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              color: '#4b5563'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid #e6e6e9', backgroundColor: '#fcfcfd' }}>
          {[
            { id: 'technical', label: '1. Technical Response & Compliance' },
            { id: 'financial', label: '2. Financial Response & Cost Breakdown' },
            { id: 'award', label: '3. Award Decision & Split Allocation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #432177' : 'none',
                color: activeTab === tab.id ? '#432177' : '#73767b',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: TECHNICAL (Image 15) */}
          {activeTab === 'technical' && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#555' }}>
                Scored against immutable RFP requirements. Minimum passing threshold is 80%.
              </div>
              <div style={{ border: '1px solid #e6e6e9', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead style={{ backgroundColor: '#f7f7f8', borderBottom: '1px solid #e6e6e9' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', color: '#73767b' }}>Evaluation Criterion</th>
                      {suppliers.map((s, idx) => (
                        <th key={idx} style={{ padding: '12px 16px', color: '#432177', fontWeight: '700' }}>
                          {s.supplier_name} ({s.country})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers[0]?.technical_criteria?.map((crit, cIdx) => (
                      <tr key={cIdx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>{crit.criterion}</td>
                        {suppliers.map((s, sIdx) => (
                          <td key={sIdx} style={{ padding: '12px 16px' }}>
                            <span style={{ color: '#0f9d78', fontWeight: '600' }}>✓ {s.technical_criteria[cIdx]?.result}</span>
                            <span style={{ fontSize: '11px', color: '#73767b', marginLeft: '6px' }}>({s.technical_criteria[cIdx]?.score} pts)</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#faf5ff', fontWeight: '700' }}>
                      <td style={{ padding: '14px 16px', color: '#432177' }}>Overall Technical Score (50% Weight)</td>
                      {suppliers.map((s, sIdx) => (
                        <td key={sIdx} style={{ padding: '14px 16px', color: '#432177', fontSize: '15px' }}>
                          {s.technical_score}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL (Image 16 & Section I1 calculation) */}
          {activeTab === 'financial' && (
            <div>
              <div style={{ backgroundColor: '#f0e5ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px', color: '#432177' }}>
                💡 <strong>Section I1 Verified Arithmetic:</strong> Gross = Qty × Price | Discount = Qty × Unit Discount | Taxable Base = Gross − Discount | Net = Base + Tax.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${suppliers.length}, 1fr)`, gap: '20px' }}>
                {suppliers.map((s, idx) => (
                  <div key={idx} style={{ border: '1px solid #e6e6e9', borderRadius: '10px', padding: '18px', backgroundColor: idx === 0 ? '#faf9fc' : '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#242424' }}>{s.supplier_name}</h4>
                        <span style={{ fontSize: '11px', color: '#73767b' }}>{s.response_code}</span>
                      </div>
                      {idx === 0 && (
                        <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          Best Value
                        </span>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#73767b' }}>Gross Total (10 units):</span>
                        <span className="font-mono-numbers">₹{s.gross_amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f9d78' }}>
                        <span>Unit Discount Deduction:</span>
                        <span className="font-mono-numbers">−₹{s.discount_amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#73767b' }}>Taxable Net Base:</span>
                        <span className="font-mono-numbers">₹{s.taxable_base?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#73767b' }}>Tax (20% Standard VAT):</span>
                        <span className="font-mono-numbers">+₹{s.tax_amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ borderTop: '2px solid #e6e6e9', marginTop: '6px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', color: '#432177' }}>
                        <span>Evaluated Net Quote:</span>
                        <span className="font-mono-numbers">₹{s.net_quote?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#73767b' }}>Composite Score (Tech + Comm):</span>
                        <span style={{ fontWeight: '600', color: '#242424' }}>{s.total_score} pts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AWARD DECISION */}
          {activeTab === 'award' && (
            <div>
              <div style={{ backgroundColor: '#f9f9fb', border: '1px solid #e6e6e9', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#242424' }}>
                  Procurement Officer Award Recommendation
                </h4>
                <div style={{ fontSize: '13.5px', color: '#444', lineHeight: '1.6', marginBottom: '14px' }}>
                  {comparisonData?.best_recommendation?.rationale}
                </div>
                <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#73767b' }}>Recommended Supplier:</span>
                    <div style={{ fontWeight: '700', color: '#432177', fontSize: '15px' }}>
                      {comparisonData?.best_recommendation?.supplier_name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#73767b' }}>Total Approved Amount:</span>
                    <div style={{ fontWeight: '700', color: '#0f9d78', fontSize: '15px' }} className="font-mono-numbers">
                      ₹{comparisonData?.best_recommendation?.proposed_award_amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '6px',
                    border: '1px solid #e6e6e9',
                    background: '#fff',
                    color: '#242424',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAward(suppliers[0]?.supplier_id || 1)}
                  disabled={awarding}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#432177',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(67, 33, 119, 0.3)'
                  }}
                >
                  {awarding ? 'Generating PO...' : 'Confirm Award & Create Purchase Order →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

