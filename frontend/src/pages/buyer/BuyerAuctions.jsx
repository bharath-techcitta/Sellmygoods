import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiBaseUrl } from '../../api';
import StatusBadge from '../../components/StatusBadge';

function fmtMoney(auc) {
  if (auc.currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(auc.current_best_bid);
  }
  return `$${auc.current_best_bid?.toLocaleString()}`;
}

export default function BuyerAuctions({ navigateTo, onSelectAuction }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.getAuctions();
      setAuctions(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setError(`${e.message || 'Could not load auctions from the API.'} (API: ${getApiBaseUrl()})`);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [load]);

  const openLive = (auc) => {
    onSelectAuction?.(auc.id);
    navigateTo?.('buyer-auction-console');
  };

  const live = auctions.filter((a) => a.status === 'Live');

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Live Supplier Auction Terminal</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#73767b' }}>
          Bid on <strong>Live</strong> lots only — the highest bid wins
        </p>
      </div>

      {error && (
        <div className="card-enterprise" style={{ padding: 16, marginBottom: 16, background: '#fee2e2', color: '#c32e3b', fontSize: 13 }}>
          {error}
          <button type="button" onClick={load} style={{ marginLeft: 12, padding: '6px 12px', border: '1px solid #c32e3b', borderRadius: 6, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-enterprise" style={{ padding: 20, color: '#73767b' }}>Loading auctions…</div>
      ) : (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Live now ({live.length})</h3>
          {live.length === 0 ? (
            <div className="card-enterprise" style={{ padding: 20, marginBottom: 24, color: '#73767b' }}>No live auctions at the moment.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, marginBottom: 24 }}>
              {live.map((auc) => (
                <div key={auc.id} className="card-enterprise" style={{ padding: 18, border: '2px solid #432177' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#432177' }}>{auc.auction_number}</strong>
                    <StatusBadge status={auc.status} />
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>{auc.title}</div>
                  <div style={{ fontSize: 12, color: '#73767b', marginTop: 6 }}>{auc.auction_type}</div>
                  <div style={{ fontSize: 12, color: '#73767b', marginTop: 8 }}>
                    Leading: <strong style={{ color: '#0f9d78' }}>{fmtMoney(auc)}</strong>
                    {' · '}Bids: <strong>{auc.total_bids_placed ?? 0}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLive(auc)}
                    style={{ marginTop: 12, width: '100%', padding: '8px 14px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Open live console →
                  </button>
                </div>
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
}
