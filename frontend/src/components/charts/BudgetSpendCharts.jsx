import React, { useMemo } from 'react';
import DonutChart from './DonutChart';
import BarChart from './BarChart';
import StackedBudgetChart from './StackedBudgetChart';
import { CHART_COLORS } from './chartTheme';

export default function BudgetSpendCharts({ budgets, analytics }) {
  const categoryDonut = useMemo(
    () =>
      (analytics?.categories || []).map((c, i) => ({
        label: c.category,
        value: c.share || c.spend,
        valueLabel: `${c.share}%`,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [analytics]
  );

  const savingsBars = useMemo(() => {
    const s = analytics?.savings_summary || {};
    return [
      { label: 'Identified', value: (s.identified || 0) / 1000, color: '#432177' },
      { label: 'Negotiated', value: (s.negotiated || 0) / 1000, color: '#3676ce' },
      { label: 'Contracted', value: (s.contracted || 0) / 1000, color: '#b65c16' },
      { label: 'Realized', value: (s.realized || 0) / 1000, color: '#0f9d78' },
    ];
  }, [analytics]);

  const supplierBars = useMemo(
    () =>
      (analytics?.supplier_concentration || []).map((sup, i) => ({
        label: sup.supplier,
        shortLabel: sup.supplier?.split(' ')[0]?.slice(0, 6),
        value: (sup.annual_spend || 0) / 1000,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [analytics]
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <StackedBudgetChart title="Budget utilization by cost centre" budgets={budgets} />
        </div>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <DonutChart title="Spend share by category (%)" segments={categoryDonut} centerLabel="100%" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <BarChart
            title="Savings pipeline ($ thousands)"
            items={savingsBars}
            valueFormatter={(v) => `$${v.toFixed(0)}k`}
          />
        </div>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <BarChart
            title="Top supplier annual spend ($ thousands)"
            items={supplierBars}
            valueFormatter={(v) => `$${v.toFixed(0)}k`}
          />
        </div>
      </div>
    </>
  );
}
