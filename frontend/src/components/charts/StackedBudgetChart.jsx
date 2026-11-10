import React from 'react';
import { CHART_LEGEND } from './chartTheme';

function Row({ label, approved, pr, po, invoiced, available }) {
  const total = approved || 1;
  const segs = [
    { key: 'pr', v: pr, color: CHART_LEGEND.pr, name: 'PR reserved' },
    { key: 'po', v: po, color: CHART_LEGEND.po, name: 'PO committed' },
    { key: 'inv', v: invoiced, color: CHART_LEGEND.invoiced, name: 'Invoiced' },
    { key: 'avail', v: available, color: CHART_LEGEND.available, name: 'Available' },
  ];
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ fontWeight: 600, color: '#242424' }}>{label}</span>
        <span style={{ color: '#73767b' }}>₹{approved?.toLocaleString()} approved</span>
      </div>
      <div style={{ display: 'flex', height: 14, borderRadius: 6, overflow: 'hidden', backgroundColor: '#f1f1f4' }}>
        {segs.map((s) => (
          <div
            key={s.key}
            title={`${s.name}: ₹${s.v?.toLocaleString()}`}
            style={{ width: `${Math.min(100, (s.v / total) * 100)}%`, backgroundColor: s.color, minWidth: s.v > 0 ? 2 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function StackedBudgetChart({ title, budgets }) {
  return (
    <div role="img" aria-label={title || 'Budget utilization chart'}>
      {title ? (
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#242424', marginBottom: '12px' }}>{title}</div>
      ) : null}
      {budgets.map((b) => (
        <Row
          key={b.id || b.cost_centre}
          label={`${b.cost_centre} · ${b.department}`}
          approved={b.approved_budget + (b.adjustments || 0)}
          pr={b.pr_reserved}
          po={b.po_committed}
          invoiced={b.invoiced_actuals}
          available={b.available_balance}
        />
      ))}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#73767b' }}>
        {[
          ['PR reserved', CHART_LEGEND.pr],
          ['PO committed', CHART_LEGEND.po],
          ['Invoiced', CHART_LEGEND.invoiced],
          ['Available', CHART_LEGEND.available],
        ].map(([name, color]) => (
          <span key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
