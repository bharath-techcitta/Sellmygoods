import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultBuyerAuctions = [
  {
    id: 1,
    auction_number: 'AUC_2026_011',
    title: 'Surplus Automated Factory Machining Center & Robotic Arms',
    status: 'Live',
    current_best_bid: 52000.0,
    min_decrement: 500.0,
    reserve_price: 45000.0,
    total_bids_placed: 18,
    currency: 'USD'
  }
];

export default function BuyerAuctions() {
  const [auctions, setAuctions] = useState(defaultBuyerAuctions);
  const [bidAmount, setBidAmount] = useState('');
  const [activeAuction, setActiveAuction] = useState(defaultBuyerAuctions[0]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.getAuctions();
      if (res && res.length) {
        setAuctions(res);
        setActiveAuction(res[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Live Supplier Auction Terminal
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Submit dynamic competitive bids with real-time leading benchmark visibility
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700' }}>Active Auction Events</h3>
          {auctions.map((auc) => (
            <div
              key={auc.id}
              onClick={() => setActiveAuction(auc)}
              style={{
                padding: '14px',
                border: '1px solid #ededf2',
                borderRadius: '8px',
                marginBottom: '10px',
                cursor: 'pointer',
                backgroundColor: activeAuction?.id === auc.id ? '#faf5ff' : '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#432177' }}>{auc.auction_number}</strong>
                <StatusBadge status={auc.status} />
              </div>
              <div style={{ fontWeight: '600', marginTop: '4px' }}>{auc.title}</div>
              <div style={{ fontSize: '12px', color: '#73767b', marginTop: '4px' }}>
                Current Leading: <strong style={{ color: '#0f9d78' }}>${auc.current_best_bid?.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>

        {activeAuction && (
          <div className="card-enterprise" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700' }}>
              Place Bid — {activeAuction.auction_number}
            </h3>
            <div style={{ padding: '16px', backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '8px', textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '12.5px', color: '#73767b' }}>Current Best Quoted Bid</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#432177', margin: '4px 0' }} className="font-mono-numbers">
                ${activeAuction.current_best_bid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Your Bid ($ USD)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Enter competitive amount..."
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{ flex: 1, height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9' }}
                />
                <button
                  type="submit"
                  style={{ padding: '0 20px', backgroundColor: '#432177', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

