import React from 'react';

export default function RouteFallback({ navigateTo, portal = 'admin' }) {
  const home = portal === 'buyer' ? 'buyer-dashboard' : 'dashboard';
  return (
    <div className="card-enterprise" style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 8px 0', color: '#242424' }}>Page not found</h2>
      <p style={{ color: '#73767b', fontSize: '14px', marginBottom: '20px' }}>
        This section is not available in the current view. Return to your dashboard.
      </p>
      <button
        type="button"
        onClick={() => navigateTo(home)}
        style={{ padding: '10px 18px', backgroundColor: '#432177', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
