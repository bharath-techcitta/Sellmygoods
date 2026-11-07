import React, { useEffect, useState } from 'react';
import { api } from '../api';

const field = { width: '100%', height: 38, marginTop: 4, padding: '0 10px', borderRadius: 6, border: '1px solid #e6e6e9', boxSizing: 'border-box', fontSize: 13 };

/** Create a reverse auction from a (NetSuite-synced) PR. PR data is prefilled from the server, not re-typed. */
export default function CreateAuctionFromPRModal({ pr, lines, onClose, onCreated }) {
  const [elig, setElig] = useState(null);
  const [title, setTitle] = useState(`${pr.pr_number} - ${pr.description || 'Reverse auction'}`);
  const [reserve, setReserve] = useState(String(pr.total_amount ?? ''));
  const [decrement, setDecrement] = useState(String(Math.max(1, Math.round((pr.total_amount || 0) * 0.005 * 100) / 100)));
  const [hours, setHours] = useState('2');
  const [startNow, setStartNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPrAuctionEligibility(pr.id).then(setElig).catch((e) => setError(e.message));
  }, [pr.id]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const reserveNum = Number(reserve);
    const decNum = Number(decrement);
    const hrs = Number(hours);
    if (!(reserveNum > 0)) return setError('Starting / reference price must be greater than 0.');
    if (!(decNum > 0) || decNum >= reserveNum) return setError('Minimum bid decrement must be greater than 0 and below the starting price.');
    if (!(hrs >= 0.5)) return setError('Duration must be at least 0.5 hours.');
    setBusy(true);
    try {
      const res = await api.createAuctionFromPr(pr.id, {
        title: title.trim(),
        reserve_price: reserveNum,
        min_decrement: decNum,
        min_bid_improvement: decNum,
        duration_hours: hrs,
        status: startNow ? 'Live' : 'Scheduled',
      });
      onCreated?.(res);
    } catch (err) {
      setError(err.message || 'Could not create auction');
    } finally {
      setBusy(false);
    }
  };

  const blocked = elig && !elig.eligible;
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} className="card-enterprise" style={{ background: '#fff', width: 'min(640px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: 22, borderRadius: 10 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Create reverse auction</h2>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#73767b' }}>
          Details below come from {pr.netsuite_internal_id ? `NetSuite PR (internal ID ${pr.netsuite_internal_id})` : 'the PR'}.
        </p>

        <div style={{ background: '#faf9fc', border: '1px solid #e6e6e9', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 12 }}>
          <div><strong>{pr.pr_number}</strong> · {pr.department || '—'} · {pr.requester_name || '—'}</div>
          <div style={{ color: '#73767b' }}>
            Estimated amount: <strong>₹ {Number(pr.total_amount || 0).toLocaleString()}</strong> · {lines.length} item line(s)
          </div>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {lines.map((l) => (
              <li key={l.id}>{l.item_name || l.description} — {l.quantity} {l.uom} @ {Number(l.unit_price || 0).toLocaleString()}</li>
            ))}
          </ul>
        </div>

        {blocked && (
          <div style={{ background: '#fee2e2', color: '#c32e3b', padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
            <strong>This PR is not eligible for an auction:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{elig.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        )}

        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10 }}>
          Auction title
          <input style={field} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Starting / reference price (₹ INR)
            <input style={field} type="number" min="0" step="any" value={reserve} onChange={(e) => setReserve(e.target.value)} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Minimum bid decrement
            <input style={field} type="number" min="0" step="any" value={decrement} onChange={(e) => setDecrement(e.target.value)} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Duration (hours)
            <input style={field} type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
        </div>
        <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
          <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} />
          Start immediately (otherwise scheduled to start in 5 minutes)
        </label>

        {error && <p role="alert" style={{ color: '#c32e3b', fontSize: 13, fontWeight: 600 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 16px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
          <button
            type="submit"
            disabled={busy || !elig || blocked}
            style={{ padding: '9px 18px', border: 'none', borderRadius: 6, fontWeight: 700, color: '#fff', background: busy || !elig || blocked ? '#8a7aa8' : '#432177', cursor: busy || blocked ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Creating…' : 'Create auction'}
          </button>
        </div>
      </form>
    </div>
  );
}
