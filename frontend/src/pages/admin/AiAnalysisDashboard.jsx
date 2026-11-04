import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { isChartsEnabled } from '../../components/charts/chartsEnabled';
import AiAnalysisCharts from '../../components/charts/AiAnalysisCharts';

const defaultAiData = {
  supplier_name: "Precision Components Ltd",
  market_price_intelligence: {
    current_quote: 36000.0,
    historical_po_benchmark: 33200.0,
    regional_market_median: 34100.0,
    suggested_target_price: 33500.0,
    estimated_savings_potential: 2500.0,
    confidence_score: 92.4
  },
  quality_scores: {
    technical_compliance: 92.0,
    on_time_delivery_record: 98.2,
    warranty_terms: "5-Year Full Replacement (Exceeds 3-Year RFP Requirement)"
  },
  talking_points: [
    "Leverage historical volume commitment across PR_00084 and pending Q1 demand to request an additional 4% unit discount.",
    "Highlight competitive quote from alternative tier-1 distributor offering $3,100 unit pricing with 48-hour delivery.",
    "Propose accelerated Net 15 payment terms in exchange for waiving initial warranty surcharge."
  ]
};

export default function AiAnalysisDashboard() {
  const [data, setData] = useState(defaultAiData);

  useEffect(() => {
    api.getAiNegotiation(1, 1)
      .then((res) => {
        if (res && res.market_price_intelligence) setData(res);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      {/* Header (Images 27 & 28) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
              AI Market Intelligence & Negotiation Copilot
            </h1>
            <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
              LIVE BENCHMARKS
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Telemetry-driven price benchmarks, supplier response quality scoring, and structured counter-offer playbooks
          </p>
        </div>
      </div>

      {isChartsEnabled() && <AiAnalysisCharts data={data} />}

      {/* Paired Cards (Section E18, Image 28) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Market Price Intelligence */}
        <div className="card-enterprise" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#432177' }}>
              📊 Market Price Intelligence (Cisco Switches)
            </h3>
            <span style={{ fontSize: '12px', color: '#0f9d78', fontWeight: '600' }}>92.4% Confidence</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fcfcfd', border: '1px solid #ededf2', borderRadius: '8px' }}>
              <div style={{ color: '#73767b' }}>Current Quoted Net Price</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#242424', marginTop: '4px' }} className="font-mono-numbers">
                ${data.market_price_intelligence.current_quote?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fcfcfd', border: '1px solid #ededf2', borderRadius: '8px' }}>
              <div style={{ color: '#73767b' }}>Historical PO Median (12 Mo.)</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#432177', marginTop: '4px' }} className="font-mono-numbers">
                ${data.market_price_intelligence.historical_po_benchmark?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fcfcfd', border: '1px solid #ededf2', borderRadius: '8px' }}>
              <div style={{ color: '#73767b' }}>AI Target Negotiation Price</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f9d78', marginTop: '4px' }} className="font-mono-numbers">
                ${data.market_price_intelligence.suggested_target_price?.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fcfcfd', border: '1px solid #ededf2', borderRadius: '8px' }}>
              <div style={{ color: '#73767b' }}>Estimated Savings Potential</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f9d78', marginTop: '4px' }} className="font-mono-numbers">
                +${data.market_price_intelligence.estimated_savings_potential?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Response Quality Scores */}
        <div className="card-enterprise" style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#432177' }}>
            🎯 Response Quality & SLA Attainment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '500' }}>Technical Requirement Alignment</span>
                <span style={{ fontWeight: '700', color: '#0f9d78' }}>{data.quality_scores.technical_compliance}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f1f4', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${data.quality_scores.technical_compliance}%`, height: '100%', backgroundColor: '#0f9d78' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '500' }}>Historical On-Time Delivery Index</span>
                <span style={{ fontWeight: '700', color: '#432177' }}>{data.quality_scores.on_time_delivery_record}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f1f4', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${data.quality_scores.on_time_delivery_record}%`, height: '100%', backgroundColor: '#432177' }} />
              </div>
            </div>

            <div style={{ marginTop: '6px', padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #d8b4fe' }}>
              <div style={{ fontWeight: '600', color: '#432177' }}>Warranty Differentiation:</div>
              <div style={{ color: '#444', marginTop: '2px' }}>{data.quality_scores.warranty_terms}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiation Suggestions Card (Image 27) */}
      <div className="card-enterprise" style={{ padding: '22px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#242424' }}>
          💡 AI Negotiation Playbook & Counter-Offer Arguments
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.talking_points?.map((pt, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', padding: '14px', backgroundColor: '#fcfcfd', border: '1px solid #ededf0', borderRadius: '8px', fontSize: '13.5px' }}>
              <span style={{ color: '#432177', fontWeight: '700' }}>#{idx + 1}</span>
              <div style={{ flex: 1, color: '#333', lineHeight: '1.5' }}>{pt}</div>
              <button
                onClick={() => alert(`Copied talking point to clipboard: "${pt}"`)}
                style={{ padding: '4px 10px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', height: 'fit-content' }}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

