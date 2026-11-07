import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import AuctionBarCharts from '../../components/AuctionBarCharts';

function formatMoney(amount, currency = 'INR') {
  if (amount == null || Number.isNaN(amount)) return '—';
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatIst(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  } catch {
    return iso;
  }
}

function useAuctionCountdown(endTimeIso) {
  const [remainingSec, setRemainingSec] = useState(0);
  useEffect(() => {
    const tick = () => {
      if (!endTimeIso) {
        setRemainingSec(0);
        return;
      }
      const end = new Date(endTimeIso).getTime();
      setRemainingSec(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTimeIso]);
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');
  return { remainingSec, label: `${mm}:${ss} remaining` };
}

export default function LiveReverseAuctionConsole({ auctionId, onBack }) {
  const [consoleData, setConsoleData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rates, setRates] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState('');

  const [chartKey, setChartKey] = useState(0);
  const ratesSeeded = useRef(false);

  // resetRates=true only on first load / right after a bid; background polls never wipe the user's draft.
  const load = useCallback(async (resetRates = false) => {
    if (!auctionId) {
      setLoadError('No auction selected.');
      setConsoleData(null);
      return;
    }
    setLoadError('');
    try {
      const res = await api.getAuctionLiveConsole(auctionId);
      setConsoleData(res);
      if (resetRates || !ratesSeeded.current) {
        const init = {};
        (res.lines || []).forEach((l) => {
          init[l.id] = l.last_rate;
        });
        setRates(init);
        ratesSeeded.current = true;
      }
    } catch (e) {
      console.error(e);
      setLoadError((prev) => prev || e.message || 'Could not load live console.');
    }
  }, [auctionId]);

  useEffect(() => {
    ratesSeeded.current = false;
    load(true);
    const poll = setInterval(() => load(false), 4000);
    return () => clearInterval(poll);
  }, [load]);

  const auction = consoleData?.auction;
  const lines = consoleData?.lines || [];
  const commercial = consoleData?.commercial_conditions || {};
  const session = consoleData?.session || {};
  const history = consoleData?.bid_history || [];
  const currency = auction?.currency || 'INR';
  const biddingAllowed = consoleData?.bidding_allowed !== false && auction?.status === 'Live';
  const freight = Number(commercial.freight_fixed ?? auction?.freight_fixed ?? 0) || 0;
  const taxRate = auction?.tax_rate_pct ?? 18;

  const { label: timerLabel } = useAuctionCountdown(auction?.end_time);

  const breakdown = useMemo(() => {
    let material = 0;
    lines.forEach((l) => {
      const rate = Number(rates[l.id] ?? l.last_rate) || 0;
      material += rate * Number(l.quantity);
    });
    const tax = (material + freight) * (taxRate / 100);
    return { material, freight, tax, total: material + freight + tax };
  }, [lines, rates, freight, taxRate]);

  const validation = useMemo(() => {
    const minImp = auction?.min_bid_improvement ?? 5000;
    const last = session.your_last_accepted_total;
    const opening = auction?.reserve_price;
    const badLine = lines.find((l) => !(Number(rates[l.id] ?? l.last_rate) > 0));
    if (badLine) {
      return { ok: false, message: `Enter a rate greater than 0 for ${badLine.line_code}.` };
    }
    if (last != null && breakdown.total > last - minImp) {
      return { ok: false, message: `Total must be at most ${formatMoney(last - minImp, currency)} (at least ${formatMoney(minImp, currency)} below your last bid of ${formatMoney(last, currency)}).` };
    }
    if (last == null && opening && breakdown.total >= opening) {
      return { ok: false, message: `Opening bid must be lower than the starting price (${formatMoney(opening, currency)}).` };
    }
    const leader = session.leader_total;
    const wouldLead = leader == null || breakdown.total < leader;
    return { ok: true, message: wouldLead ? 'Valid — this bid would take rank 1.' : 'Valid — this bid improves your position.' };
  }, [breakdown.total, rates, lines, session.your_last_accepted_total, session.leader_total, auction, currency]);

  const handleRateChange = (lineId, value) => {
    setRates((prev) => ({ ...prev, [lineId]: value === '' ? '' : Number(value) }));
  };

  // Scale every line rate down proportionally so the evaluated total lands on `target`.
  const applyTarget = (target) => {
    if (target == null || !lines.length) return;
    const base = lines.reduce((s, l) => s + Number(l.last_rate) * Number(l.quantity), 0);
    const neededMaterial = target / (1 + taxRate / 100) - freight;
    if (base <= 0 || neededMaterial <= 0) return;
    const scale = neededMaterial / base;
    const next = {};
    lines.forEach((l) => {
      next[l.id] = Math.floor(Number(l.last_rate) * scale * 100) / 100;
    });
    setRates(next);
  };

  const handleSubmit = async () => {
    if (!biddingAllowed || !validation.ok || !auction?.id) return;
    setSubmitting(true);
    try {
      const line_rates = lines
        .filter((l) => l.id > 0)
        .map((l) => ({ line_id: l.id, new_rate: Number(rates[l.id] ?? l.last_rate) }));
      const res = await api.placeAuctionBid(auction.id, {
        line_rates,
        bid_amount: breakdown.total,
      });
      setFlash(res.message || 'Bid submitted.');
      setChartKey((k) => k + 1);
      await load(true);
    } catch (err) {
      alert(err.message || 'Bid rejected');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError && !consoleData) {
    return (
      <div style={{ padding: 24 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
            ← Back to auction list
          </button>
        )}
        <p style={{ color: '#c32e3b', fontWeight: 600 }}>{loadError}</p>
        <button type="button" onClick={load} style={{ marginTop: 8, padding: '8px 14px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!consoleData) {
    return <div style={{ padding: 24 }}>Loading live auction console…</div>;
  }

  if (lines.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
            ← Back to auction list
          </button>
        )}
        <p style={{ color: '#73767b' }}>This reverse auction has no line items yet. Ask procurement to add lines or recreate the lot.</p>
      </div>
    );
  }

  return (
    <div>
      {onBack && (
        <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
          ← Back to auction list
        </button>
      )}

      {/* Header */}
      <div className="card-enterprise" style={{ padding: '18px 22px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Reverse procurement auction</h1>
            <StatusBadge status={auction?.status || 'Live'} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f9d78', background: '#d1fae8', padding: '2px 8px', borderRadius: 4 }}>Online</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#73767b' }}>{auction?.title}</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#73767b' }}>
            Closes {formatIst(auction?.end_time)} IST · Extension {auction?.extensions_used ?? 0} of {auction?.max_extensions ?? 5}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#432177', fontVariantNumeric: 'tabular-nums' }}>{timerLabel}</div>
          <div style={{ fontSize: 12, color: '#73767b' }}>{auction?.auction_number}</div>
        </div>
      </div>

      {!biddingAllowed && (
        <div style={{ padding: 10, background: '#fff0d8', color: '#b65c16', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
          Bidding is closed for this lot (status: {auction?.status}). Live lots only accept bids.
        </div>
      )}
      {flash && (
        <div style={{ padding: '10px 16px', background: '#d1fae8', color: '#0f9d78', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
          ✓ {flash}
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        <div className="card-enterprise" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>YOUR LAST ACCEPTED TOTAL</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#242424', marginTop: 6 }} className="font-mono-numbers">
            {formatMoney(session.your_last_accepted_total, currency)}
          </div>
          <div style={{ fontSize: 11, color: '#73767b', marginTop: 4 }}>
            {session.your_last_receipt_id} · {formatIst(session.your_last_accepted_at)}
          </div>
        </div>
        <div className="card-enterprise" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>YOUR CURRENT RANK</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: session.your_current_rank === 1 ? '#0f9d78' : '#432177', lineHeight: 1.1 }}>
            {session.your_current_rank ?? '—'}
            {session.total_bidders ? <span style={{ fontSize: 16, color: '#73767b', fontWeight: 600 }}> / {session.total_bidders}</span> : null}
          </div>
          {session.your_current_rank === 1 ? (
            <div style={{ fontSize: 12, color: '#0f9d78', fontWeight: 700, marginTop: 4 }}>You are leading 🏆</div>
          ) : session.your_current_rank ? (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {session.bid_to_gain_one_rank != null && session.bid_to_gain_one_rank !== session.bid_to_take_lead && (
                <button type="button" onClick={() => applyTarget(session.bid_to_gain_one_rank)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5, border: '1px solid #432177', background: '#fff', color: '#432177', cursor: 'pointer' }}>
                  Climb 1 rank ≤ {formatMoney(session.bid_to_gain_one_rank, currency)}
                </button>
              )}
              {session.bid_to_take_lead != null && (
                <button type="button" onClick={() => applyTarget(session.bid_to_take_lead)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5, border: 'none', background: '#432177', color: '#fff', cursor: 'pointer' }}>
                  Take rank 1 ≤ {formatMoney(session.bid_to_take_lead, currency)}
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#73767b', marginTop: 4 }}>Place a bid to get ranked</div>
          )}
        </div>
        <div className="card-enterprise" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>VISIBILITY</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#242424', marginTop: 8 }}>{session.visibility || 'Own rank only'}</div>
          <div style={{ fontSize: 11, color: '#73767b', marginTop: 6 }}>Competitor names hidden (sealed bid)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Line bid entry */}
        <div className="card-enterprise" style={{ padding: 20, overflowX: 'auto', minWidth: 0 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Enter revised unit prices</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#fcfcfd', color: '#73767b', borderBottom: '1px solid #e6e6e9' }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item / Grade</th>
                <th style={{ padding: '10px 8px' }}>Qty</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Last rate</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>New rate / MT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const rate = Number(rates[l.id] ?? l.last_rate) || 0;
                const amt = rate * l.quantity;
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <strong>{l.line_code}</strong>
                      <div style={{ fontSize: 11, color: '#73767b' }}>{l.description}</div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>{l.quantity}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }} className="font-mono-numbers">
                      {formatMoney(l.last_rate, currency)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={rates[l.id] ?? l.last_rate}
                        onChange={(e) => handleRateChange(l.id, e.target.value)}
                        style={{ width: 100, height: 34, padding: '0 8px', borderRadius: 6, border: '1px solid #e6e6e9', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }} className="font-mono-numbers">
                      {formatMoney(amt, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 600 }}>Material subtotal</td>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#432177' }} className="font-mono-numbers">
                  {formatMoney(breakdown.material, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Review panel */}
        <div className="card-enterprise" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Review your next bid</h3>
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#73767b' }}>Material subtotal</span>
              <span className="font-mono-numbers">{formatMoney(breakdown.material, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#73767b' }}>Fixed freight</span>
              <span className="font-mono-numbers">{formatMoney(freight, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#73767b' }}>Tax (illustrative)</span>
              <span className="font-mono-numbers">{formatMoney(breakdown.tax, currency)}</span>
            </div>
            <div style={{ borderTop: '2px solid #e6e6e9', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>EVALUATED TOTAL</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#432177' }} className="font-mono-numbers">
                {formatMoney(breakdown.total, currency)}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#73767b', margin: '14px 0 8px' }}>
            Minimum own-bid improvement: {formatMoney(auction?.min_bid_improvement ?? 5000, currency)}
          </p>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: validation.ok ? '#d1fae8' : '#fee2e2',
              color: validation.ok ? '#0f9d78' : '#c32e3b',
              marginBottom: 14,
            }}
          >
            {validation.message}
          </div>
          <button
            type="button"
            disabled={!biddingAllowed || !validation.ok || submitting || !auction?.id}
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: validation.ok ? '#432177' : '#aaa',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              cursor: validation.ok ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting…' : session.your_last_accepted_total != null ? 'Submit next bid to improve rank' : 'Submit bid'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AuctionBarCharts auctionId={auctionId} view="supplier" refreshKey={chartKey} />
      </div>

      {/* Commercial conditions */}
      <div className="card-enterprise" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700 }}>Commercial conditions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 13 }}>
          <div><span style={{ color: '#73767b' }}>Freight:</span> {formatMoney(freight, currency)} fixed</div>
          <div><span style={{ color: '#73767b' }}>Delivery:</span> {commercial.delivery_terms}</div>
          <div><span style={{ color: '#73767b' }}>Tax:</span> {commercial.tax_note}</div>
          <div><span style={{ color: '#73767b' }}>Payment:</span> {commercial.payment_terms}</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: '#0f9d78', fontWeight: 600 }}>
          ✓ Terms version {commercial.terms_version} accepted
        </div>
      </div>

      {/* Bid history */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Bid history (your session)</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#fcfcfd', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '10px 18px', textAlign: 'left' }}>Receipt ID</th>
              <th style={{ padding: '10px 18px', textAlign: 'left' }}>Accepted at (IST)</th>
              <th style={{ padding: '10px 18px', textAlign: 'right' }}>Evaluated total</th>
              <th style={{ padding: '10px 18px' }}>Rank</th>
              <th style={{ padding: '10px 18px' }}>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#73767b' }}>No bids submitted yet.</td>
              </tr>
            ) : (
              history.map((h) => (
                <tr key={h.receipt_id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '10px 18px', fontWeight: 700, color: '#432177' }}>{h.receipt_id}</td>
                  <td style={{ padding: '10px 18px' }}>{formatIst(h.accepted_at)}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', fontWeight: 700 }} className="font-mono-numbers">
                    {formatMoney(h.evaluated_total, currency)}
                  </td>
                  <td style={{ padding: '10px 18px' }}>{h.rank_at_acceptance}</td>
                  <td style={{ padding: '10px 18px', color: '#0f9d78', fontWeight: 600 }}>{h.outcome}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
