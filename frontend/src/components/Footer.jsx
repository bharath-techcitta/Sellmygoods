import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        height: '42px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e6e6e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontSize: '12px',
        color: '#73767b'
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>© 2026 Procurio Enterprise Procurement</span>
        <span>•</span>
        <a href="#privacy" style={{ color: '#73767b', textDecoration: 'none' }}>Security & Compliance</a>
        <span>•</span>
        <a href="#support" style={{ color: '#73767b', textDecoration: 'none' }}>Procurement Support</a>
      </div>
      <div>
        <span>Active Session: </span>
        <span style={{ fontWeight: '500', color: '#242424' }}>Authenticated (2026-11-03 17:30 UTC)</span>
      </div>
    </footer>
  );
}
