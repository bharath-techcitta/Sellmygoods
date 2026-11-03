import React, { useState } from 'react';

export default function Navbar({ activePortal, currentRole, onSwitchRole, toggleSidebar, isSidebarCollapsed }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roles = [
    { role: 'procurement_buyer', portal: 'admin', label: 'Marcus Vance (Procurement Buyer)' },
    { role: 'supplier_user', portal: 'buyer', label: 'Elena Rostova (Precision Components - Supplier)' },
  ];

  return (
    <header
      style={{
        height: '58px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e6e6e9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            color: '#73767b',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Toggle Sidebar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        {/* Portal Identifier Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: activePortal === 'admin' ? '#f0e5ff' : '#e0f2fe',
              color: activePortal === 'admin' ? '#432177' : '#0369a1',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activePortal === 'admin' ? '#432177' : '#0284c7'
              }}
            />
            {activePortal === 'admin' ? 'Admin Portal' : 'Buyer Portal'}
          </span>
          <span style={{ fontSize: '13px', color: '#73767b' }}>
            {activePortal === 'admin' ? '— Internal Organization Workspace' : '— Supplier Workspace'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Global Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search suppliers, PRs, RFQs, POs..."
            style={{
              width: '280px',
              height: '36px',
              padding: '0 12px 0 34px',
              borderRadius: '6px',
              border: '1px solid #e6e6e9',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#f7f7f8'
            }}
          />
          <svg
            style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }}
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer', color: '#555' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#c32e3b',
              color: '#fff',
              fontSize: '10px',
              borderRadius: '10px',
              padding: '1px 5px',
              fontWeight: '700'
            }}
          >
            4
          </span>
        </div>

        {/* User Profile & Role Switcher */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#432177',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              {currentRole === 'supplier_user' ? 'ER' : 'MV'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#242424' }}>
                {currentRole === 'supplier_user' ? 'Elena Rostova' : 'Marcus Vance'}
              </div>
              <div style={{ fontSize: '11px', color: '#73767b' }}>
                {currentRole === 'supplier_user' ? 'Precision Components' : 'Procurement Buyer'}
              </div>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '280px',
                backgroundColor: '#ffffff',
                border: '1px solid #e6e6e9',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                padding: '8px 0',
                zIndex: 50
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f1f4', fontSize: '12px', color: '#73767b', fontWeight: '600' }}>
                SWITCH ACTIVE ROLE & PORTAL
              </div>
              {roles.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSwitchRole(r.role, r.portal);
                    setShowProfileMenu(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: currentRole === r.role ? '#432177' : '#242424',
                    fontWeight: currentRole === r.role ? '600' : '400',
                    backgroundColor: currentRole === r.role ? '#f5f0ff' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{r.label}</span>
                  {currentRole === r.role && (
                    <span style={{ color: '#0f9d78', fontSize: '14px' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
