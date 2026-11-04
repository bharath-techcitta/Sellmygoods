import React from 'react';
import { CHART_COLORS } from './chartTheme';

export default function BarChart({ title, items, height = 160, valueFormatter = (v) => String(v) }) {
  const max = Math.max(...items.map((d) => Number(d.value) || 0), 1);
  const barW = Math.min(48, Math.max(24, 320 / Math.max(items.length, 1) - 8));

  return (
    <div role="img" aria-label={title || 'Bar chart'}>
      {title ? (
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#242424', marginBottom: '12px' }}>{title}</div>
      ) : null}
      <svg width="100%" height={height} viewBox={`0 0 ${items.length * (barW + 12) + 8} ${height}`} preserveAspectRatio="xMidYMid meet">
        {items.map((item, i) => {
          const v = Number(item.value) || 0;
          const h = (v / max) * (height - 36);
          const x = 8 + i * (barW + 12);
          const y = height - 24 - h;
          const color = item.color || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <g key={item.label || i}>
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={color} />
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" fill="#73767b" fontSize="9">
                {item.shortLabel || item.label?.slice(0, 8)}
              </text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#242424" fontSize="10" fontWeight="600">
                {valueFormatter(v)}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        {items.map((item, i) => (
          <span key={item.label || i} style={{ fontSize: '11px', color: '#73767b' }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
