import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import LiveReverseAuctionConsole from './LiveReverseAuctionConsole';
import LiveForwardAuctionConsole from './LiveForwardAuctionConsole';

export default function LiveAuctionBiddingEntry({ auctionId, onBack }) {
  const [auctionType, setAuctionType] = useState(null);
  const [hasLines, setHasLines] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setAuctionType(null);
    setHasLines(false);
    setError('');
    (async () => {
      try {
        const consoleRes = await api.getAuctionLiveConsole(auctionId);
        if (cancelled) return;
        const type = consoleRes?.auction?.auction_type;
        if (type) {
          setHasLines((consoleRes?.lines || []).length > 0);
          setAuctionType(type);
          return;
        }
        const auc = await api.getAuction(auctionId);
        if (cancelled) return;
        setAuctionType(auc.auction_type);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(e.message || 'Could not load this auction.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auctionId]);

  if (error) {
    return (
      <div className="card-enterprise" style={{ padding: 24 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ marginBottom: 12, padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
            ← Back to auction list
          </button>
        )}
        <p style={{ color: '#c32e3b', fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  if (!auctionType) {
    return <div style={{ padding: 24 }}>Loading auction…</div>;
  }

  // Scrap sales with item lines use the same price-per-line screen as procurement lots (highest price leads);
  // single-amount disposal lots without lines keep the simple amount screen.
  if (auctionType === 'Forward Disposal' && !hasLines) {
    return <LiveForwardAuctionConsole auctionId={auctionId} onBack={onBack} />;
  }

  return <LiveReverseAuctionConsole auctionId={auctionId} onBack={onBack} />;
}
