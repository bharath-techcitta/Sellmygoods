import React from 'react';
import { CHART_COLORS } from './chartTheme';

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export default function DonutChart({ title, segments, size = 168, innerRatio = 0.58, centerLabel }) {
  const total = segments.reduce((s, x) => s + Math.max(0, Number(x.value) || 0), 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const ri = r * innerRatio;
  let angle = 0;

  return (
    <div role="img" aria-label={title || 'Donut chart'}>
      {title ? (
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#242424', marginBottom: '10px' }}>{title}</div>
      ) : null}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => {
            const v = Math.max(0, Number(seg.value) || 0);
            const sweep = (v / total) * 360;
            const start = angle;
            const end = angle + sweep;
            angle = end;
            if (sweep < 0.01) return null;
            const color = seg.color || CHART_COLORS[i % CHART_COLORS.length];
            const d = arcPath(cx, cy, r, start, end - 0.01);
            return (
              <path
                key={seg.label || i}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={r - ri}
                strokeLinecap="butt"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={ri - 2} fill="#fff" />
          {centerLabel ? (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#242424" fontSize="13" fontWeight="700">
              {centerLabel}
            </text>
          ) : null}
        </svg>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, minWidth: '140px' }}>
          {segments.map((seg, i) => {
            const color = seg.color || CHART_COLORS[i % CHART_COLORS.length];
            const pct = total ? ((Number(seg.value) || 0) / total) * 100 : 0;
            return (
              <li key={seg.label || i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '12px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#555' }}>{seg.label}</span>
                <span style={{ fontWeight: 600, color: '#242424' }}>{seg.valueLabel ?? `${pct.toFixed(0)}%`}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
