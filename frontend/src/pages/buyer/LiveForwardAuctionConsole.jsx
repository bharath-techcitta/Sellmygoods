import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import AuctionBarCharts, { fmtMoney } from '../../components/AuctionBarCharts';

function formatIst(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  } catch {
    return iso;
  }
}

function useCountdown(endIso) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const tick = () => setSec(endIso ? Math.max(0, Math.floor((new Date(endIso).getTime() - Date.now()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endIso]);
  const h = Math.floor(sec / 3600);
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

const backBtn = { marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' };

export default function LiveForwardAuctionConsole({ auctionId, onBack }) {
  const [consoleData, setConsoleData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const prevRank = useRef(null);
  const [rankMove, setRankMove] = useState('');

  const load = useCallback(async () => {
    if (!auctionId) {
      setLoadError('No auction selected.');
      return;
    }
    try {
      const res = await api.getAuctionLiveConsole(auctionId);
      setConsoleData(res);
      setLoadError('');
      const r = res?.session?.your_current_rank;
      if (prevRank.current != null && r != null && r > prevRank.current) {
        setRankMove(`You were outbid — you dropped to rank ${r}. Raise your bid to climb back.`);
      }
      if (r != null) prevRank.current = r;
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'Could not load live console.');
    }
  }, [auctionId]);

  useEffect(() => {
    prevRank.current = null;
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  const auction = consoleData?.auction;
  const session = consoleData?.session || {};
  const history = consoleData?.bid_history || [];
  const timer = useCountdown(auction?.end_time);

  if (loadError && !consoleData) {
    return (
      <div style={{ padding: 24 }}>
        {onBack && <button type="button" onClick={onBack} style={backBtn}>← Back to auction list</button>}
        <p style={{ color: '#c32e3b', fontWeight: 600 }}>{loadError}</p>
        <button type="button" onClick={load} style={{ marginTop: 8, padding: '8px 14px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }
  if (!auction) return <div style={{ padding: 24 }}>Loading forward auction…</div>;

  const cur = auction.currency || 'INR';
  const step = auction.min_bid_improvement || auction.min_decrement || 500;
  const biddingAllowed = consoleData.bidding_allowed === true && auction.status === 'Live';
  const myBest = session.your_best_total;
  // Smallest legal next bid: above own last bid, or above the starting price for a first bid.
  const minNext = myBest != null ? myBest + step : (auction.reserve_price || 0) + step;
  const rank = session.your_current_rank;
  const amount = parseFloat(bidAmount === '' ? String(minNext) : bidAmount);
  const validNumber = !Number.isNaN(amount);
  const tooLow = validNumber && amount < minNext;
  const wouldLead = validNumber && !tooLow && (session.leader_total == null || amount > session.leader_total);

  const submit = async (value) => {
    setError('');
    setMessage('');
    setRankMove('');
    setSubmitting(true);
    try {
      const res = await api.placeAuctionBid(auction.id, Number(value));
      setMessage(res.message || 'Bid accepted.');
      setBidAmount('');
      prevRank.current = res.rank ?? prevRank.current;
      setChartKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err.message || 'Bid rejected');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validNumber || tooLow || !biddingAllowed) return;
    submit(amount);
  };

  const quick = [...new Set([minNext, session.bid_to_gain_one_rank, session.bid_to_take_lead].filter((v) => v != null))].sort((a, b) => a - b);

  return (
    <div style={{ paddingBottom: 24 }}>
      {onBack && <button type="button" onClick={onBack} style={backBtn}>← Back to auction list</button>}

      <div className="card-enterprise" style={{ padding: '18px 22px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Forward disposal auction</h1>
            <StatusBadge status={auction.status} />
          </div>
          <p style={{ margin: '6px 0 0', color: '#73767b', fontSize: 13 }}>{auction.auction_number} · {auction.title}</p>
          <p style={{ margin: '4px 0 0', color: '#73767b', fontSize: 12 }}>Closes {formatIst(auction.end_time)} IST · Extension {auction.extensions_used} of {auction.max_extensions}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#432177', fontVariantNumeric: 'tabular-nums' }}>{timer}</div>
          <div style={{ fontSize: 12, color: '#73767b' }}>remaining</div>
        </div>
      </div>

      {message && <div style={{ padding: '10px 16px', background: '#d1fae8', color: '#0f9d78', borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>✓ {message}</div>}
      {rankMove && <div style={{ padding: '10px 16px', background: '#fff0d8', color: '#b65c16', borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{rankMove}</div>}
      {error && <div style={{ padding: '10px 16px', background: '#fee2e2', color: '#c32e3b', borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
        <div className="card-enterprise" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>HIGHEST BID</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#432177', marginTop: 6 }}>{session.leader_total != null ? fmtMoney(session.leader_total, cur) : 'No bids yet'}</div>
          <div style={{ fontSize: 11, color: '#73767b', marginTop: 4 }}>Starting price {fmtMoney(auction.reserve_price, cur)} · {auction.total_bids_placed} bids</div>
        </div>
        <div className="card-enterprise" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>YOUR BEST BID</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{myBest != null ? fmtMoney(myBest, cur) : '—'}</div>
          <div style={{ fontSize: 11, color: '#73767b', marginTop: 4 }}>{session.your_last_receipt_id || 'Not bid yet'}</div>
        </div>
        <div className="card-enterprise" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#73767b', fontWeight: 600 }}>YOUR CURRENT RANK</div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, color: rank === 1 ? '#0f9d78' : '#432177' }}>
            {rank ?? '—'}
            {session.total_bidders ? <span style={{ fontSize: 16, color: '#73767b', fontWeight: 600 }}> / {session.total_bidders}</span> : null}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: rank === 1 ? '#0f9d78' : '#73767b', fontWeight: 600 }}>
            {rank === 1 ? 'You are leading 🏆' : rank ? `${fmtMoney(session.bid_to_take_lead, cur)}+ takes rank 1` : 'Place a bid to get ranked'}
          </div>
        </div>
      </div>

      <div className="card-enterprise" style={{ padding: 22, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{myBest != null ? 'Raise your bid to climb the ranks' : 'Place your bid'}</h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#73767b' }}>
          Minimum next bid <strong>{fmtMoney(minNext, cur)}</strong> (your own bid + {fmtMoney(step, cur)}). Every re-bid must beat your previous one.
        </p>
        {biddingAllowed ? (
          <>
            {quick.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {quick.map((q) => {
                  const lead = q === session.bid_to_take_lead;
                  return (
                    <button key={q} type="button" onClick={() => setBidAmount(String(q))} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: '1px solid #432177', background: lead ? '#432177' : '#fff', color: lead ? '#fff' : '#432177', cursor: 'pointer' }}>
                      {lead ? 'Take rank 1: ' : q === minNext ? 'Minimum: ' : 'Climb: '}{fmtMoney(q, cur)}
                    </button>
                  );
                })}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="number"
                step="any"
                placeholder={String(minNext)}
                aria-label="Bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                style={{ flex: '1 1 220px', height: 44, padding: '0 12px', borderRadius: 6, border: `1px solid ${tooLow ? '#c32e3b' : '#e6e6e9'}`, boxSizing: 'border-box', fontSize: 15 }}
              />
              <button
                type="submit"
                disabled={submitting || !validNumber || tooLow}
                style={{ padding: '0 24px', height: 44, background: validNumber && !tooLow ? '#432177' : '#8a7aa8', minWidth: 140, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: validNumber && !tooLow ? 'pointer' : 'not-allowed' }}
              >
                {submitting ? 'Submitting…' : myBest != null ? 'Submit higher bid' : 'Submit bid'}
              </button>
            </form>
            {tooLow && <p style={{ color: '#c32e3b', fontSize: 12, fontWeight: 600, margin: '8px 0 0' }}>Bid must be at least {fmtMoney(minNext, cur)}.</p>}
            {wouldLead && <p style={{ color: '#0f9d78', fontSize: 12, fontWeight: 600, margin: '8px 0 0' }}>This bid would take rank 1.</p>}
          </>
        ) : (
          <p style={{ color: '#73767b', fontSize: 13, margin: 0 }}>
            Bidding is closed (status: {auction.status}). {rank ? `You finished at rank ${rank}.` : ''}
          </p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <AuctionBarCharts auctionId={auctionId} view="supplier" refreshKey={chartKey} />
      </div>

      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Your bid history</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#fcfcfd', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '10px 18px', textAlign: 'left' }}>Receipt</th>
              <th style={{ padding: '10px 18px', textAlign: 'left' }}>Accepted (IST)</th>
              <th style={{ padding: '10px 18px', textAlign: 'right' }}>Bid</th>
              <th style={{ padding: '10px 18px' }}>Rank then</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#73767b' }}>No bids submitted yet.</td></tr>
            ) : (
              history.map((h) => (
                <tr key={h.receipt_id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '10px 18px', fontWeight: 700, color: '#432177' }}>{h.receipt_id}</td>
                  <td style={{ padding: '10px 18px' }}>{formatIst(h.accepted_at)}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', fontWeight: 700 }}>{fmtMoney(h.evaluated_total, cur)}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'center' }}>{h.rank_at_acceptance}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
