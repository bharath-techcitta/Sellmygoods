import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

function formatMoney(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(amount)) return '—';
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function LiveForwardAuctionConsole({ auctionId, onBack }) {
  const [consoleData, setConsoleData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!auctionId) {
      setLoadError('No auction selected.');
      setConsoleData(null);
      return;
    }
    setLoadError('');
    try {
      const res = await api.getAuctionLiveConsole(auctionId);
      setConsoleData(res);
    } catch (e) {
      console.error(e);
      setConsoleData(null);
      setLoadError(e.message || 'Could not load live console.');
    }
  }, [auctionId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auction = consoleData?.auction;
    if (!auction || !consoleData?.bidding_allowed) return;
    const amount = parseFloat(bidAmount);
    if (Number.isNaN(amount)) return;
    try {
      const res = await api.placeAuctionBid(auction.id, amount);
      setMessage(res.message || 'Bid accepted.');
      setBidAmount('');
      await load();
    } catch (err) {
      alert(err.message || 'Bid rejected');
    }
  };

  if (loadError) {
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

  if (!consoleData?.auction) return <div style={{ padding: 24 }}>Loading forward auction…</div>;

  const auction = consoleData.auction;
  const minNext = (auction.current_best_bid || 0) + (auction.min_decrement || 500);
  const cur = auction.currency || 'USD';
  const biddingAllowed = consoleData.bidding_allowed === true && auction.status === 'Live';

  return (
    <div>
      {onBack && (
        <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
          ← Back to auction list
        </button>
      )}
      <div className="card-enterprise" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Forward disposal auction</h1>
            <p style={{ margin: '6px 0 0', color: '#73767b', fontSize: 13 }}>{auction.auction_number} · {auction.title}</p>
          </div>
          <StatusBadge status={auction.status} />
        </div>
      </div>
      {message && (
        <div style={{ padding: 10, background: '#d1fae8', color: '#0f9d78', borderRadius: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{message}</div>
      )}
      <div className="card-enterprise" style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#73767b' }}>Current leading bid</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#432177' }}>{formatMoney(auction.current_best_bid, cur)}</div>
          <div style={{ fontSize: 12, color: '#73767b', marginTop: 6 }}>Reserve: {formatMoney(auction.reserve_price, cur)} · Min increment: {formatMoney(auction.min_decrement, cur)}</div>
        </div>
        {biddingAllowed ? (
          <form onSubmit={handleSubmit}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Your bid (must exceed current best)</label>
            <input
              type="number"
              step="50"
              min={minNext}
              placeholder={String(minNext)}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              style={{ width: '100%', height: 42, marginTop: 6, padding: '0 12px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ marginTop: 14, width: '100%', padding: 12, background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
              Submit forward bid
            </button>
          </form>
        ) : (
          <p style={{ color: '#73767b', fontSize: 13 }}>This lot is not live — viewing only.</p>
        )}
      </div>
    </div>
  );
}
