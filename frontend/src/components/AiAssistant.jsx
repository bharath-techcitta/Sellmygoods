import React, { useState } from 'react';
import { api } from '../api';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('market'); // market, negotiation, copilot
  const [promptInput, setPromptInput] = useState('');
  const [copilotResult, setCopilotResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunCopilot = async () => {
    if (!promptInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.getAiPrDraft(promptInput);
      setCopilotResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 56px Purple Circular Floating Launcher (Section C1) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '60px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#432177',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 14px rgba(67, 33, 119, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Procurio AI Assistant"
      >
        <span style={{ fontSize: '24px' }}>✨</span>
      </button>

      {/* Slide-out Assistant Panel (Section E18, Images 27, 28) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '126px',
            right: '24px',
            width: '420px',
            maxHeight: '620px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e6e6e9',
            boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#432177',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>✨</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>Procurio AI Copilot</div>
                <div style={{ fontSize: '11px', color: '#d8b4fe' }}>Grounding in live catalog & quotes</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Subheader Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e6e6e9', backgroundColor: '#fcfcfd' }}>
            {[
              { id: 'market', label: 'Market Intel' },
              { id: 'negotiation', label: 'Negotiation' },
              { id: 'copilot', label: 'PR Generator' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  fontSize: '12.5px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  color: activeTab === tab.id ? '#432177' : '#73767b',
                  borderBottom: activeTab === tab.id ? '2px solid #432177' : 'none',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '13px' }}>
            {activeTab === 'market' && (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#242424' }}>
                  Live Benchmarks: Cisco Catalyst 9300
                </div>
                <div style={{ backgroundColor: '#f9f9fb', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #ededf0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#73767b' }}>Supplier Quote:</span>
                    <span style={{ fontWeight: '600' }}>$36,000.00 (Net)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#73767b' }}>Historical PO Median:</span>
                    <span style={{ fontWeight: '600' }}>$33,200.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f9d78' }}>
                    <span>Estimated Cost Avoidance:</span>
                    <span style={{ fontWeight: '700' }}>+$2,500.00</span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
                  📌 <strong>Recommendation:</strong> Precision Components Ltd quote is within 4% of 12-month trailing contract baselines. Recommend counter-offering $33,500 based on Q4 volume commitments.
                </div>
              </div>
            )}

            {activeTab === 'negotiation' && (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '10px', color: '#242424' }}>
                  AI Negotiation Talking Points (RFQ_2026_091)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f5f0ff', borderRadius: '8px', borderLeft: '3px solid #432177' }}>
                    <strong>Volume Leverage:</strong> Reference the consolidated PR_00084 + PR_00086 hardware requirements (20 switches total) for tiered discounting.
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f5f0ff', borderRadius: '8px', borderLeft: '3px solid #432177' }}>
                    <strong>Warranty Surcharge:</strong> The supplier includes a 5-year hardware SLA. Request waiving shipping tariffs in exchange for standard 3-year replacement.
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f5f0ff', borderRadius: '8px', borderLeft: '3px solid #432177' }}>
                    <strong>Payment Incentives:</strong> Offer Net 15 accelerated settlement in return for a 3.5% early-pay discount.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'copilot' && (
              <div>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>
                  Draft Requisition from Natural Language
                </div>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Need 10 Cisco managed switches and 20 optical transceivers for Dallas datacenter upgrade..."
                  style={{
                    width: '100%',
                    height: '75px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e6e6e9',
                    fontSize: '12.5px',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleRunCopilot}
                  disabled={isLoading}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#432177',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {isLoading ? 'Synthesizing Spec...' : 'Generate PR Lines ✨'}
                </button>

                {copilotResult && (
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f9f9fb', borderRadius: '8px', border: '1px solid #ededf0' }}>
                    <div style={{ fontWeight: '600', color: '#432177', marginBottom: '4px' }}>
                      {copilotResult.suggested_title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#73767b', marginBottom: '8px' }}>
                      Category: {copilotResult.suggested_category} | Est. Total: ${copilotResult.estimated_total?.toLocaleString()}
                    </div>
                    {copilotResult.proposed_lines.map((l, i) => (
                      <div key={i} style={{ fontSize: '12px', padding: '4px 0', borderTop: '1px solid #eee' }}>
                        • {l.quantity}x {l.description} (${l.estimated_unit_price} / {l.uom})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

