import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

function formatInr(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function useCountdown(endTimeIso) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const tick = () => {
      if (!endTimeIso) return setSec(0);
      setSec(Math.max(0, Math.floor((new Date(endTimeIso).getTime() - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTimeIso]);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function StepDownChart({ points, currency }) {
  if (!points?.length) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = 360;
  const h = 140;
  const pad = 24;
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
    const y = pad + ((max - p.value) / range) * (h - pad * 2);
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const fmt = currency === 'INR' ? (v) => `₹${(v / 100000).toFixed(2)}L` : (v) => `$${v.toLocaleString()}`;

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Best evaluated total over time</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: 420 }}>
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e6e6e9" />
        <text x={pad} y={16} fontSize="10" fill="#73767b">{fmt(max)}</text>
        <text x={pad} y={h - pad - 4} fontSize="10" fill="#73767b">{fmt(min)}</text>
        <path d={path} fill="none" stroke="#432177" strokeWidth="2.5" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="4" fill="#432177" />
        ))}
      </svg>
    </div>
  );
}

export default function LiveAuctionAdminConsole({ auctionId, onBack }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const timer = useCountdown(data?.auction?.end_time);

  const load = useCallback(async () => {
    if (!auctionId) {
      setLoadError('No auction selected.');
      setData(null);
      return;
    }
    setLoadError('');
    try {
      const res = await api.getAuctionMonitor(auctionId);
      setData(res);
    } catch (e) {
      console.error(e);
      setData(null);
      setLoadError(e.message || 'Could not load monitor console.');
    }
  }, [auctionId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 8000);
    return () => clearInterval(poll);
  }, [load]);

  if (loadError) {
    return (
      <div style={{ padding: 24 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
            ← All auctions
          </button>
        )}
        <p style={{ color: '#c32e3b', fontWeight: 600 }}>{loadError}</p>
        <button type="button" onClick={load} style={{ marginTop: 8, padding: '8px 14px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <div style={{ padding: 24 }}>Loading live auction console…</div>;

  const m = data.metrics || {};
  const cur = m.currency || 'INR';
  const fmt = cur === 'INR' ? formatInr : (n) => `$${n?.toLocaleString()}`;

  return (
    <div style={{ paddingBottom: 32 }}>
      {onBack && (
        <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
          ← All auctions
        </button>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{data.auction?.title || data.header?.title || 'Live auction console'}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#73767b' }}>{data.header?.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={load} style={{ padding: '8px 14px', border: '1px solid #432177', borderRadius: 6, background: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#432177' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="card-enterprise" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <StatusBadge status={data.auction?.status || 'Live'} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{data.header?.lot_banner}</span>
          <span style={{ fontSize: 12, color: '#73767b' }}>Closes {data.header?.closes_at}</span>
          <span style={{ fontSize: 12, color: '#73767b' }}>{data.header?.extension_label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#432177', fontVariantNumeric: 'tabular-nums' }}>{timer}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f9d78', background: '#d1fae8', padding: '4px 10px', borderRadius: 20 }}>Connected</span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Current best evaluated', value: fmt(m.current_best_evaluated), sub: m.current_best_supplier },
          { label: 'Provisional savings', value: `${m.provisional_savings_pct}%`, sub: `${fmt(m.provisional_savings_amount)} vs ${fmt(m.baseline_total)} baseline`, valueColor: '#0f9d78' },
          { label: 'Participation', value: `${m.participation_bidding} bidding`, sub: `${m.participation_invited} invited / ${m.participation_admitted} admitted` },
          { label: 'Accepted bids', value: String(m.accepted_bids_count), sub: `Last accepted ${m.last_accepted_at}` },
          { label: 'Live health', value: m.live_health, sub: `Sequence ${m.sequence} · Updated just now`, valueColor: '#0f9d78' },
        ].map((card) => (
          <div key={card.label} className="card-enterprise" style={{ padding: 14 }}>
            <div style={{ fontSize: 10, color: '#73767b', fontWeight: 600, textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, color: card.valueColor || '#242424' }} className="font-mono-numbers">{card.value}</div>
            <div style={{ fontSize: 11, color: '#73767b', marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, marginBottom: 16 }}>
        {/* Lots sidebar */}
        <div className="card-enterprise" style={{ padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Auction lots</div>
          {(data.lots || []).map((lot) => {
            const live = lot.status === 'LIVE';
            return (
              <div
                key={lot.lot_code}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  border: live ? '2px solid #432177' : '1px solid #ededf2',
                  background: live ? '#faf5ff' : '#fff',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: live ? '#432177' : '#73767b' }}>
                  {lot.lot_code} · {lot.status}
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{lot.title}</div>
                <div style={{ fontSize: 11, color: '#73767b', marginTop: 2 }}>{lot.quantity_label}</div>
                {lot.best_total != null ? (
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#432177', marginTop: 6 }}>{fmt(lot.best_total)}</div>
                ) : (
                  <div style={{ fontSize: 11, color: '#73767b', marginTop: 6 }}>Starts {lot.starts_at} · No bids yet</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Supplier leaderboard</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#73767b' }}>Evaluated lot totals + latest eligible complete bid per supplier</p>
            </div>
            <button type="button" style={{ padding: '6px 12px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Compare</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#fcfcfd', color: '#73767b' }}>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '10px 14px', textAlign: 'left' }}>Supplier / ERP code</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Evaluated {cur}</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Gap to best</th>
                <th style={{ padding: '10px 14px' }}>Bids</th>
                <th style={{ padding: '10px 14px' }}>Last bid</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.leaderboard || []).length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#73767b' }}>
                    No supplier bids yet — activity will appear here when Elena (or other suppliers) submit.
                  </td>
                </tr>
              )}
              {(data.leaderboard || []).map((row) => (
                <tr key={`${row.erp_code}-${row.rank}`} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{row.rank ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <strong>{row.supplier_name}</strong>
                    <div style={{ fontSize: 11, color: '#73767b' }}>{row.erp_code}</div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }} className="font-mono-numbers">
                    {row.evaluated_total != null ? fmt(row.evaluated_total) : 'No bid'}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }} className="font-mono-numbers">
                    {row.gap_to_best != null && row.gap_to_best !== 0 ? fmt(row.gap_to_best) : row.gap_to_best === 0 ? '—' : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{row.bids_count}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#73767b' }}>{row.last_bid_at}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: row.status === 'Leading' ? '#0f9d78' : '#555', fontWeight: 600 }}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card-enterprise" style={{ padding: 18 }}>
          <StepDownChart points={data.price_history} currency={cur} />
        </div>
        <div className="card-enterprise" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Live activity</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {(data.activity || []).length === 0 && (
              <li style={{ padding: 12, color: '#73767b', fontSize: 13 }}>No bid activity yet for this lot.</li>
            )}
            {(data.activity || []).map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13, padding: '8px 0', borderBottom: '1px solid #f1f1f4' }}>
                <span style={{ color: '#73767b', fontVariantNumeric: 'tabular-nums', minWidth: 64 }}>{a.time}</span>
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
