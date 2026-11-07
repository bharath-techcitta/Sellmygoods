import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

export function fmtMoney(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function compact(v, currency) {
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  const sym = currency === 'INR' ? '₹' : '$';
  if (n >= 10000000 && currency === 'INR') return `${sym}${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000 && currency === 'INR') return `${sym}${(n / 100000).toFixed(2)}L`;
  if (n >= 1000000) return `${sym}${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toFixed(0)}`;
}

const COLORS = { me: '#432177', other: '#b9a6d6', lead: '#0f9d78', grid: '#e6e6e9', text: '#73767b' };

/** Vertical bar chart. bars: [{label, value, highlight, sub}] */
function BarChart({ bars, currency, height = 220, valueLabel = true }) {
  if (!bars?.length) {
    return <div style={{ padding: 28, textAlign: 'center', color: COLORS.text, fontSize: 13 }}>No bids yet — bars appear as soon as the first bid lands.</div>;
  }
  const w = Math.max(320, bars.length * 74);
  const padL = 8;
  const padB = 44;
  const padT = 26;
  const max = Math.max(...bars.map((b) => b.value)) || 1;
  const innerH = height - padB - padT;
  const slot = (w - padL * 2) / bars.length;
  const bw = Math.min(46, slot * 0.62);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ minWidth: Math.min(w, 320), display: 'block' }} role="img" aria-label="Bid bar chart">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={padL} x2={w - padL} y1={padT + innerH * (1 - t)} y2={padT + innerH * (1 - t)} stroke={COLORS.grid} strokeDasharray={t === 0 ? '0' : '3 3'} />
        ))}
        {bars.map((b, i) => {
          const h = Math.max(3, (b.value / max) * innerH);
          const x = padL + slot * i + (slot - bw) / 2;
          const y = padT + innerH - h;
          const fill = b.lead ? COLORS.lead : b.highlight ? COLORS.me : COLORS.other;
          return (
            <g key={`${b.label}-${i}`}>
              <rect x={x} y={y} width={bw} height={h} rx="4" fill={fill} style={{ transition: 'all .4s ease' }}>
                <title>{`${b.label}: ${fmtMoney(b.value, currency)}${b.sub ? ` · ${b.sub}` : ''}`}</title>
              </rect>
              {valueLabel && (
                <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#242424">
                  {compact(b.value, currency)}
                </text>
              )}
              <text x={x + bw / 2} y={height - 24} textAnchor="middle" fontSize="11" fontWeight={b.highlight ? 700 : 500} fill={b.highlight ? COLORS.me : COLORS.text}>
                {b.label.length > 11 ? `${b.label.slice(0, 10)}…` : b.label}
              </text>
              {b.sub && (
                <text x={x + bw / 2} y={height - 10} textAnchor="middle" fontSize="10" fill={COLORS.text}>
                  {b.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend() {
  const item = (c, t) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 14, fontSize: 12, color: COLORS.text }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
      {t}
    </span>
  );
  return <div style={{ marginBottom: 6 }}>{item(COLORS.lead, 'Leading')}{item(COLORS.me, 'You')}{item(COLORS.other, 'Other bidders')}</div>;
}

/**
 * Live analytics: rank ladder (best bid per bidder) + bid-by-bid timeline.
 * view="supplier" hides competitor names; view="buyer" shows everyone.
 */
export default function AuctionBarCharts({ auctionId, view = 'buyer', refreshMs = 5000, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!auctionId) return;
    try {
      setData(await api.getAuctionAnalytics(auctionId, view));
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load analytics.');
    }
  }, [auctionId, view]);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs, refreshKey]);

  if (error && !data) return <div className="card-enterprise" style={{ padding: 18, color: '#c32e3b', fontSize: 13 }}>{error}</div>;
  if (!data) return <div className="card-enterprise" style={{ padding: 18, color: COLORS.text, fontSize: 13 }}>Loading analytics…</div>;

  const cur = data.currency;
  const fwd = data.auction_type === 'Forward Disposal';
  const rankBars = data.rank_bars.map((b) => ({
    label: b.label,
    value: b.value,
    lead: b.rank === 1,
    highlight: b.is_me,
    sub: `Rank ${b.rank} · ${b.bids} bid${b.bids === 1 ? '' : 's'}`,
  }));
  const timelineBars = data.timeline_bars.map((b) => ({ label: b.label, value: b.value, highlight: b.is_me, sub: b.time.replace(' IST', '') }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
      <div className="card-enterprise" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Rank ladder — best bid per bidder</div>
          <div style={{ fontSize: 12, color: COLORS.text }}>{data.total_bidders} bidder{data.total_bidders === 1 ? '' : 's'} · {data.total_bids} bids</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.text, margin: '2px 0 8px' }}>{fwd ? 'Higher bid ranks better' : 'Lower evaluated total ranks better'}</div>
        <Legend />
        <BarChart bars={rankBars} currency={cur} />
      </div>
      <div className="card-enterprise" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Bid-by-bid timeline</div>
        <div style={{ fontSize: 12, color: COLORS.text, margin: '2px 0 8px' }}>Last {data.timeline_bars.length || 0} accepted bids — purple bars are yours</div>
        <BarChart bars={timelineBars} currency={cur} />
      </div>
    </div>
  );
}
