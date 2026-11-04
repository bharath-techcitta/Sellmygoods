import React, { useMemo } from 'react';
import DonutChart from './DonutChart';
import BarChart from './BarChart';

export default function BuyerDashboardCharts({ events }) {
  const statusCounts = useMemo(() => {
    let submitted = 0;
    let awaiting = 0;
    let other = 0;
    events.forEach((e) => {
      const s = (e.response_status || '').toLowerCase();
      if (s.includes('submitted') || s.includes('quote')) submitted += 1;
      else if (s.includes('await')) awaiting += 1;
      else other += 1;
    });
    return { submitted, awaiting, other: other || Math.max(0, events.length - submitted - awaiting) };
  }, [events]);

  const donut = [
    { label: 'Awaiting response', value: statusCounts.awaiting || 1, color: '#b65c16' },
    { label: 'Quotes submitted', value: statusCounts.submitted, color: '#0f9d78' },
    { label: 'Other / closed', value: statusCounts.other, color: '#73767b' },
  ];

  const valueBars = events.slice(0, 4).map((e, i) => ({
    label: e.code || `Event ${i + 1}`,
    shortLabel: e.code?.slice(-3) || 'RFQ',
    value: (e.submitted_net || e.budget || 36000) / 1000,
    color: ['#432177', '#3676ce', '#0f9d78', '#b65c16'][i % 4],
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
      <div className="card-enterprise" style={{ padding: '18px' }}>
        <DonutChart title="RFx pipeline status" segments={donut} centerLabel={String(events.length)} />
      </div>
      <div className="card-enterprise" style={{ padding: '18px' }}>
        <BarChart
          title="Quoted value by event ($ thousands)"
          items={valueBars.length ? valueBars : [{ label: 'No events', value: 0 }]}
          valueFormatter={(v) => (v ? `$${v.toFixed(0)}k` : '—')}
        />
      </div>
    </div>
  );
}
