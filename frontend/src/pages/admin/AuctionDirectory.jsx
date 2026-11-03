import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultAuctions = [
  {
    id: 1,
    auction_number: 'AUC_2026_011',
    title: 'Surplus Automated Factory Machining Center & Robotic Arms',
    auction_type: 'Forward Disposal',
    status: 'Live',
    pr_number: 'PR_00078',
    current_approver: 'Disposal Officer',
    reserve_price: 45000.0,
    min_decrement: 500.0,
    current_best_bid: 52000.0,
    total_bids_placed: 18,
    currency: 'USD'
  },
  {
    id: 2,
    auction_number: 'AUC_2026_012',
    title: 'Bulk Packaging Cardboard Corrugated Boxes Q1 Lot',
    auction_type: 'Reverse Sourcing',
    status: 'Scheduled',
    pr_number: 'PR_00080',
    current_approver: 'Marcus Vance',
    reserve_price: 28000.0,
    min_decrement: 200.0,
    current_best_bid: 28000.0,
    total_bids_placed: 0,
    currency: 'USD'
  }
];

export default function AuctionDirectory() {
  const [auctions, setAuctions] = useState(defaultAuctions);
  const [selectedAuction, setSelectedAuction] = useState(defaultAuctions[0]);
  const [bidInput, setBidInput] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      const res = await api.getAuctions();
      if (res && res.length) {
        setAuctions(res);
        setSelectedAuction(res[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!bidInput || !selectedAuction) return;
    try {
      const res = await api.placeAuctionBid(selectedAuction.id, parseFloat(bidInput));
      setBidSuccess(res.message);
      setBidInput('');
      loadAuctions();
    } catch (err) {
      alert(err.message || 'Bid submission rejected');
    }
  };

  return (
    <div>
      {/* Header (Image 14) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Live Procurement & Disposal Auctions
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Reverse auctions for competitive dynamic cost reduction and forward auctions for asset disposal
          </p>
        </div>
      </div>

      {bidSuccess && (
        <div style={{ padding: '10px 16px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          ✓ {bidSuccess}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
        {/* Auctions List (Image 14) */}
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', fontWeight: '700', fontSize: '15px' }}>
            Active Auction Lots ({auctions.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {auctions.map((auc) => {
              const isSelected = selectedAuction?.id === auc.id;
              return (
                <div
                  key={auc.id}
                  onClick={() => {
                    setSelectedAuction(auc);
                    setBidSuccess('');
                  }}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f1f4',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#faf5ff' : '#ffffff',
                    borderLeft: isSelected ? '4px solid #432177' : '4px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#432177', fontSize: '14px' }}>
                      {auc.auction_number}
                    </span>
                    <StatusBadge status={auc.status} />
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#242424', marginTop: '4px' }}>
                    {auc.title}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#73767b', marginTop: '6px' }}>
                    <span>Type: <strong>{auc.auction_type}</strong></span>
                    <span>Bids: <strong>{auc.total_bids_placed}</strong></span>
                    <span>Current Best: <strong style={{ color: '#0f9d78' }}>${auc.current_best_bid?.toLocaleString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Bidding Console */}
        {selectedAuction && (
          <div className="card-enterprise" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#242424' }}>
                  Live Bidding Console
                </h3>
                <span style={{ fontSize: '12px', color: '#73767b' }}>
                  Lot: {selectedAuction.auction_number} • {selectedAuction.auction_type}
                </span>
              </div>
              <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                ⚡ LIVE STREAM ACTIVE
              </span>
            </div>

            {/* Current Best Price Card */}
            <div style={{ backgroundColor: '#f9f9fb', border: '1px solid #e6e6e9', borderRadius: '10px', padding: '18px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#73767b' }}>Current Winning Bid Benchmark</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#432177', margin: '6px 0' }} className="font-mono-numbers">
                ${selectedAuction.current_best_bid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: '#555' }}>
                Reserve Ceiling: ${selectedAuction.reserve_price?.toLocaleString()} • Min Tick: ${selectedAuction.min_decrement}
              </div>
            </div>

            {/* Place New Bid Form */}
            <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#242424' }}>
                Place Competitive Bid Amount ($ USD)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="number"
                  step="50"
                  placeholder={
                    selectedAuction.auction_type === 'Reverse Sourcing'
                      ? `Must be < $${selectedAuction.current_best_bid}`
                      : `Must be > $${selectedAuction.current_best_bid}`
                  }
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #e6e6e9',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0 20px',
                    backgroundColor: '#432177',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Bid
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#73767b' }}>
                Bids are atomic and cryptographically time-stamped. Anti-sniping auto-extends close by 3 minutes on late bids.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

