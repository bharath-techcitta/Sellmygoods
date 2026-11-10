import React from 'react';

export default function Sidebar({ activePortal, currentRoute, navigateTo, isCollapsed }) {
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
    { id: 'categories', label: 'Categories & Items', icon: '📦' },
    { id: 'requisitions', label: 'Requisitions', icon: '📝' },
    { id: 'bids', label: 'Bids & Sourcing', icon: '🎯' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: '📋' },
    { id: 'invoices', label: 'Invoices & AP', icon: '💳' },
    { id: 'contracts', label: 'Contracts & Clauses', icon: '📜' },
    { id: 'auctions', label: 'Live Auctions', icon: '⚡' },
    { id: 'budgets', label: 'Budgets & Spend', icon: '💰' },
    { id: 'workflows', label: 'Approval Workflows', icon: '⚙️' },
    { id: 'integrations', label: 'ERP Integrations', icon: '🔌' },
    { id: 'ai-analysis', label: 'AI Market Intelligence', icon: '✨' }
  ];

  const buyerNav = [
    { id: 'buyer-dashboard', label: 'Supplier Dashboard', icon: '📊' },
    { id: 'registration-wizard', label: 'Registration Wizard', icon: '🚀' },
    { id: 'buyer-bids', label: 'My Bids & Invitations', icon: '🎯' },
    { id: 'buyer-pos', label: 'Purchase Orders', icon: '📋' },
    { id: 'buyer-invoices', label: 'Submit Invoices', icon: '💳' },
    { id: 'buyer-contracts', label: 'Contracts', icon: '📜' },
    { id: 'buyer-auctions', label: 'Auction Console', icon: '⚡' },
    { id: 'buyer-profile', label: 'Profile & Banking', icon: '🏢' }
  ];

  const navItems = activePortal === 'admin' ? adminNav : buyerNav;

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '242px',
        backgroundColor: '#2e1857',
        color: '#ffffff',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease-in-out',
        flexShrink: 0,
        zIndex: 45,
        overflowY: 'auto'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#2e1857',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '18px'
          }}
        >
          S
        </div>
        {!isCollapsed && (
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', lineHeight: 1 }}>
              Procurio
            </div>
            <div style={{ fontSize: '10px', color: '#b5a5cf', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '3px' }}>
              Procurement 360
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <div
              key={item.id}
              onClick={() => navigateTo(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#482a73' : 'transparent',
                color: isActive ? '#ffffff' : '#cfc3e5',
                fontWeight: isActive ? '600' : '400',
                fontSize: '13.5px',
                transition: 'all 0.15s ease'
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </div>

      {/* Portal Mode Indicator Footer */}
      {!isCollapsed && (
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '11px',
            color: '#a394bf',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>Version 1.0 Production</span>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f9d78' }} />
        </div>
      )}
    </aside>
  );
}
