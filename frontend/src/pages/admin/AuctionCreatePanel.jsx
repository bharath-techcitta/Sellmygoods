import React, { useState } from 'react';
import { api } from '../../api';

const defaultScrapLines = [
  { line_code: 'SC-01', description: 'MS Heavy Melting Scrap', quantity: 100, uom: 'MT', last_rate: 36000 },
  { line_code: 'SC-02', description: 'GI Sheeting Scrap', quantity: 40, uom: 'MT', last_rate: 31000 },
  { line_code: 'SC-03', description: 'MS Boring Scrap', quantity: 60, uom: 'MT', last_rate: 27000 },
];

export default function AuctionCreatePanel({ onCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const auctionType = 'Forward Disposal';   // the only auction type
  const [status, setStatus] = useState('Live');
  const [prNumber, setPrNumber] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [minImprovement, setMinImprovement] = useState(10000);
  const [reservePrice, setReservePrice] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [lines, setLines] = useState(defaultScrapLines);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLineChange = (idx, field, value) => {
    setLines((prev) => prev.map((ln, i) => (i === idx ? { ...ln, [field]: value } : ln)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        auction_type: auctionType,
        status,
        pr_number: prNumber.trim() || undefined,
        currency,
        freight_fixed: 0,
        tax_rate_pct: 0,
        min_bid_improvement: Number(minImprovement) || 10000,
        min_decrement: Number(minImprovement) || 10000,
        duration_hours: Number(durationHours) || 2,
        reserve_price: reservePrice === '' ? undefined : Number(reservePrice),
        lines: lines.map((ln) => ({
          ...ln,
          quantity: Number(ln.quantity),
          last_rate: Number(ln.last_rate),
        })),
      };
      const created = await api.createAuction(payload);
      onCreated?.(created);
    } catch (err) {
      setError(err.message || 'Could not create auction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-enterprise" style={{ padding: 22, marginBottom: 24, border: '2px solid #432177' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create auction</h2>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#73767b' }}>
            Cancel
          </button>
        )}
      </div>
      {error && <p style={{ color: '#c32e3b', fontSize: 13, fontWeight: 600 }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13 }}>
            Title *
            <input required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Type
            <select value={auctionType} disabled style={{ width: '100%', height: 38, marginTop: 4, borderRadius: 6, border: '1px solid #e6e6e9' }}>
              <option value="Forward Disposal">Forward Disposal</option>
            </select>
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', height: 38, marginTop: 4, borderRadius: 6, border: '1px solid #e6e6e9' }}>
              <option value="Live">Live (open for bids now)</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            PR reference
            <input value={prNumber} onChange={(e) => setPrNumber(e.target.value)} placeholder="PR_00100" style={{ width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%', height: 38, marginTop: 4, borderRadius: 6, border: '1px solid #e6e6e9' }}>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Duration (hours)
            <input type="number" min="0.5" step="0.5" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} style={{ width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Starting price (optional)
            <input type="number" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} placeholder="Auto from items" style={{ width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </label>
          <label style={{ display: 'block', fontSize: 13 }}>
            Minimum raise per bid
            <input type="number" value={minImprovement} onChange={(e) => setMinImprovement(e.target.value)} style={{ width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </label>
        </div>

        {(
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Scrap items (starting rate per MT)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#fcfcfd', color: '#73767b' }}>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left' }}>Code</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                  <th style={{ padding: 8 }}>Qty</th>
                  <th style={{ padding: 8 }}>UOM</th>
                  <th style={{ padding: 8 }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((ln, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 6 }}>
                      <input value={ln.line_code} onChange={(e) => handleLineChange(idx, 'line_code', e.target.value)} style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #e6e6e9' }} />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input value={ln.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} style={{ width: '100%', height: 32, borderRadius: 4, border: '1px solid #e6e6e9' }} />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input type="number" value={ln.quantity} onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)} style={{ width: 72, height: 32, borderRadius: 4, border: '1px solid #e6e6e9' }} />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input value={ln.uom} onChange={(e) => handleLineChange(idx, 'uom', e.target.value)} style={{ width: 72, height: 32, borderRadius: 4, border: '1px solid #e6e6e9' }} />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input type="number" value={ln.last_rate} onChange={(e) => handleLineChange(idx, 'last_rate', e.target.value)} style={{ width: 96, height: 32, borderRadius: 4, border: '1px solid #e6e6e9' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="submit" disabled={submitting} style={{ padding: '10px 20px', background: '#432177', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
          {submitting ? 'Creating…' : 'Create auction'}
        </button>
      </form>
    </div>
  );
}
