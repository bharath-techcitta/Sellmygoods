import React, { useMemo } from 'react';
import BarChart from './BarChart';

export default function AiAnalysisCharts({ data }) {
  const intel = data?.market_price_intelligence || {};
  const quality = data?.quality_scores || {};

  const priceCompare = useMemo(
    () => [
      { label: 'Current quote', value: (intel.current_quote || 0) / 1000, color: '#c32e3b' },
      { label: 'Historical PO', value: (intel.historical_po_benchmark || 0) / 1000, color: '#432177' },
      { label: 'Market median', value: (intel.regional_market_median || 0) / 1000, color: '#3676ce' },
      { label: 'AI target', value: (intel.suggested_target_price || 0) / 1000, color: '#0f9d78' },
    ],
    [intel]
  );

  const qualityBars = useMemo(
    () => [
      { label: 'Technical alignment', value: quality.technical_compliance || 0, color: '#0f9d78' },
      { label: 'On-time delivery', value: quality.on_time_delivery_record || 0, color: '#432177' },
      { label: 'AI confidence', value: intel.confidence_score || 0, color: '#3676ce' },
    ],
    [quality, intel]
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px', marginBottom: '24px' }}>
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <BarChart
          title="Price benchmark comparison (₹ thousands)"
          items={priceCompare}
          height={180}
          valueFormatter={(v) => `₹${v.toFixed(1)}k`}
        />
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#73767b' }}>
          Estimated savings vs current quote:{' '}
          <strong style={{ color: '#0f9d78' }}>
            ₹{intel.estimated_savings_potential?.toLocaleString()}
          </strong>
        </p>
      </div>
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <BarChart title="Quality & confidence scores (%)" items={qualityBars} valueFormatter={(v) => `${v}%`} />
      </div>
    </div>
  );
}
