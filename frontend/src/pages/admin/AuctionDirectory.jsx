import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import AuctionCreatePanel from './AuctionCreatePanel';

function fmtMoney(auc) {
  if (auc.currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(auc.current_best_bid);
  }
  return `$${auc.current_best_bid?.toLocaleString()}`;
}

export default function AuctionDirectory({ navigateTo, onSelectAuction }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAuctions();
      setAuctions(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not load auctions from the API.');
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuctions();
    const poll = setInterval(loadAuctions, 15000);
    return () => clearInterval(poll);
  }, [loadAuctions]);

  const openMonitor = (auc) => {
    onSelectAuction?.(auc.id);
    navigateTo?.('auction-monitor');
  };

  const goLive = async (auc) => {
    setActionId(auc.id);
    try {
      await api.updateAuction(auc.id, { status: 'Live', duration_hours: 2 });
      await loadAuctions();
    } catch (e) {
      alert(e.message || 'Could not start auction');
    } finally {
      setActionId(null);
    }
  };

  const closeAuction = async (auc) => {
    setActionId(auc.id);
    try {
      await api.updateAuction(auc.id, { status: 'Closed' });
      await loadAuctions();
    } catch (e) {
      alert(e.message || 'Could not close auction');
    } finally {
      setActionId(null);
    }
  };

  const live = auctions.filter((a) => a.status === 'Live');
  const scheduled = auctions.filter((a) => a.status === 'Scheduled');
  const archive = auctions.filter((a) => !['Live', 'Scheduled'].includes(a.status));

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Live Procurement & Disposal Auctions</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#73767b' }}>
            Create lots, go live, monitor bids, and manage supplier consoles
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          style={{ padding: '10px 18px', background: showCreate ? '#73767b' : '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
        >
          {showCreate ? 'Hide form' : '+ Create auction'}
        </button>
      </div>

      {showCreate && (
        <AuctionCreatePanel
          onCancel={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadAuctions();
          }}
        />
      )}

      {error && (
        <div className="card-enterprise" style={{ padding: 16, marginBottom: 16, background: '#fee2e2', color: '#c32e3b', fontSize: 13 }}>
          {error}
          <button type="button" onClick={loadAuctions} style={{ marginLeft: 12, padding: '6px 12px', border: '1px solid #c32e3b', borderRadius: 6, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-enterprise" style={{ padding: 24, color: '#73767b' }}>Loading auctions…</div>
      ) : (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Live auctions ({live.length})</h3>
          {live.length === 0 ? (
            <div className="card-enterprise" style={{ padding: 24, marginBottom: 24, textAlign: 'center', color: '#73767b' }}>
              No live auctions. Create one above or go live on a scheduled lot.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14, marginBottom: 24 }}>
              {live.map((auc) => (
                <div key={auc.id} className="card-enterprise" style={{ padding: 18, border: '2px solid #432177' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: '#432177' }}>{auc.auction_number}</strong>
                    <StatusBadge status={auc.status} />
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>{auc.title}</div>
                  <div style={{ fontSize: 12, color: '#73767b', marginTop: 6 }}>{auc.auction_type}</div>
                  <div style={{ fontSize: 12, color: '#73767b', marginTop: 8 }}>Best: {fmtMoney(auc)} · Bids: {auc.total_bids_placed ?? 0}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => openMonitor(auc)}
                      style={{ width: '100%', padding: '10px 16px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Open live auction console →
                    </button>
                    <button
                      type="button"
                      disabled={actionId === auc.id}
                      onClick={() => closeAuction(auc)}
                      style={{ width: '100%', padding: '8px 16px', background: '#fff', color: '#73767b', border: '1px solid #e6e6e9', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Close lot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduled.length > 0 && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Scheduled ({scheduled.length})</h3>
              <div className="card-enterprise" style={{ overflow: 'hidden', marginBottom: 24 }}>
                {scheduled.map((auc) => (
                  <div key={auc.id} style={{ padding: 16, borderBottom: '1px solid #f1f1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong>{auc.auction_number}</strong> — {auc.title}
                      <div style={{ fontSize: 12, color: '#73767b' }}>{auc.auction_type} · Opening {fmtMoney(auc)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={auc.status} />
                      <button
                        type="button"
                        disabled={actionId === auc.id}
                        onClick={() => goLive(auc)}
                        style={{ padding: '6px 12px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                      >
                        Go live
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {archive.length > 0 && (
            <>
              <button type="button" onClick={() => setShowArchive((v) => !v)} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                {showArchive ? 'Hide' : 'Show'} closed archive ({archive.length})
              </button>
              {showArchive && (
                <div className="card-enterprise" style={{ overflow: 'hidden' }}>
                  {archive.map((auc) => (
                    <div key={auc.id} style={{ padding: 16, borderBottom: '1px solid #f1f1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{auc.auction_number}</strong> — {auc.title}
                        <div style={{ fontSize: 12, color: '#73767b' }}>{auc.auction_type} · {fmtMoney(auc)} · Bids: {auc.total_bids_placed}</div>
                      </div>
                      <StatusBadge status={auc.status} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
