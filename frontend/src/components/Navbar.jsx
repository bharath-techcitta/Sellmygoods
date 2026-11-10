import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

const defaultAdminNotifications = [
  { id: 'd1', title: 'Approve PR: High Pressure Ball Valves', message: 'Purchase Request • PR_00085 • Due 2026-11-06', time: '2026-11-06', priority: 'Medium', route: 'requisitions', module: 'Purchase Request' },
  { id: 'd2', title: '3-Way Matched Invoice Review: Precision Components Ltd', message: 'Invoice • INV_99214 • Due 2026-11-04', time: '2026-11-04', priority: 'Urgent', route: 'invoices', module: 'Invoice' },
  { id: 'd3', title: 'Review Onboarding: TechVibe Cloud Systems Corp', message: 'Supplier Registration • SUP_00103', time: 'Today', priority: 'High', route: 'suppliers', module: 'Supplier Registration' },
  { id: 'd4', title: 'Award Evaluation & Commercial Recommendation', message: 'Bid Award • RFQ_2026_091', time: '2026-11-07', priority: 'High', route: 'bids', module: 'Bid Award' },
];

const defaultBuyerNotifications = [
  { id: 'b1', title: 'RFQ invitation: RFQ_2026_092', message: 'High Pressure Industrial Ball Valves Replacement', time: 'Awaiting your response', priority: 'High', route: 'buyer-bids', module: 'Bid' },
  { id: 'b2', title: 'Quote under review — RFQ_2026_091', message: 'Your submission status: Submitted. Net quote $36,000.00.', time: 'Updated recently', priority: 'Medium', route: 'buyer-bids', module: 'Bid' },
  { id: 'b3', title: 'Live auction lot open', message: '1 auction(s) accepting competitive bids now.', time: 'Live now', priority: 'Urgent', route: 'buyer-auctions', module: 'Auction' },
];

function priorityColor(priority) {
  if (priority === 'Urgent') return '#c32e3b';
  if (priority === 'High') return '#b65c16';
  if (priority === 'Medium') return '#432177';
  return '#73767b';
}

export default function Navbar({
  activePortal,
  currentRole,
  currentSupplierId = 1,
  onSwitchRole,
  toggleSidebar,
  onNavigate,
  onOpenAuction,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(
    currentRole === 'supplier_user' ? defaultBuyerNotifications : defaultAdminNotifications
  );
  const [unreadCount, setUnreadCount] = useState(notifications.length);
  const [toast, setToast] = useState(null);      // pop-up when a buyer starts an auction
  const seenIds = useRef(null);                  // ids already shown (null until the first load)

  // Logins come from the backend: the procurement buyer + one login per ACTIVE supplier.
  const [roles, setRoles] = useState([
    { role: 'procurement_buyer', portal: 'admin', supplier_id: null, label: 'Marcus Vance (Procurement Buyer)', person: 'Marcus Vance', company: 'Procurement Buyer', initials: 'MV' },
    { role: 'supplier_user', portal: 'buyer', supplier_id: 1, label: 'Elena Rostova (Precision Components - Supplier)', person: 'Elena Rostova', company: 'Precision Components', initials: 'ER' },
  ]);
  useEffect(() => {
    api.getMe().then((res) => {
      if (res?.available_roles?.length) {
        setRoles(res.available_roles.map((r) => ({ ...r, label: r.name })));
      }
    }).catch(() => {});
  }, []);
  const isSameLogin = (r) => r.role === currentRole && (r.role !== 'supplier_user' || Number(r.supplier_id) === Number(currentSupplierId));
  const me = roles.find(isSameLogin) || roles.find((r) => r.role === currentRole) || roles[0];

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res?.items?.length) {
        const stored = res.items.filter((i) => i.db_id);
        if (seenIds.current === null) {
          seenIds.current = new Set(stored.map((i) => i.id));
        } else {
          const fresh = stored.find((i) => i.unread && !seenIds.current.has(i.id));
          stored.forEach((i) => seenIds.current.add(i.id));
          if (fresh) setToast(fresh);
        }
        setNotifications(res.items);
        setUnreadCount(res.unread_count ?? res.items.length);
      } else if (res?.items) {
        setNotifications(currentRole === 'supplier_user' ? defaultBuyerNotifications : defaultAdminNotifications);
        setUnreadCount((currentRole === 'supplier_user' ? defaultBuyerNotifications : defaultAdminNotifications).length);
      }
    } catch (e) {
      console.error(e);
      const fallback = currentRole === 'supplier_user' ? defaultBuyerNotifications : defaultAdminNotifications;
      setNotifications(fallback);
      setUnreadCount(fallback.length);
    }
  }, [currentRole, currentSupplierId]);

  useEffect(() => {
    seenIds.current = null;
    setToast(null);
  }, [currentRole, currentSupplierId]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 10000);
    return () => clearInterval(timer);
  }, [loadNotifications, currentRole, currentSupplierId, activePortal]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleNotificationClick = (item) => {
    setShowNotifications(false);
    setToast(null);
    if (item.db_id) {
      api.markNotificationRead(item.db_id).then(loadNotifications).catch(() => {});
    }
    if (item.auction_id && onOpenAuction) {
      onOpenAuction(item.auction_id);
    } else if (item.route && onNavigate) {
      onNavigate(item.route);
    }
  };

  const markAllRead = () => {
    api.markAllNotificationsRead().then(loadNotifications).catch(() => {});
  };

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
        zIndex: 40,
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
            alignItems: 'center',
          }}
          title="Toggle Sidebar"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

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
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activePortal === 'admin' ? '#432177' : '#0284c7',
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
              backgroundColor: '#f7f7f8',
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
              if (!showNotifications) loadNotifications();
            }}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#555',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Notifications"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#c32e3b',
                  color: '#fff',
                  fontSize: '10px',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontWeight: '700',
                  minWidth: '16px',
                  textAlign: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '36px',
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                border: '1px solid #e6e6e9',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 55,
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f1f4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#242424' }}>Notifications</span>
                <span style={{ fontSize: '11px', color: '#73767b', display: 'flex', gap: 10, alignItems: 'center' }}>
                  {currentRole === 'supplier_user' && notifications.some((n) => n.unread) && (
                    <button type="button" onClick={markAllRead} style={{ border: 'none', background: 'none', color: '#432177', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                  {currentRole === 'supplier_user' ? 'Supplier workspace' : 'Procurement workspace'}
                </span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#73767b', fontSize: '13px' }}>
                  No new updates right now.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      border: 'none',
                      borderBottom: '1px solid #f1f1f4',
                      background: n.unread ? '#f5f0ff' : '#fff',
                      borderLeft: n.unread ? '3px solid #432177' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#faf5ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = n.unread ? '#f5f0ff' : '#fff';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#242424' }}>{n.title}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: priorityColor(n.priority),
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{n.time}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <div
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
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
                fontSize: '13px',
              }}
            >
              {me.initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#242424' }}>
                {me.person}
              </div>
              <div style={{ fontSize: '11px', color: '#73767b' }}>
                {me.company}
              </div>
            </div>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                zIndex: 50,
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f1f4', fontSize: '12px', color: '#73767b', fontWeight: '600' }}>
                SWITCH ACTIVE ROLE & PORTAL
              </div>
              {roles.map((r, idx) => (
                <div
                  key={`${r.role}-${r.supplier_id ?? 'x'}-${idx}`}
                  onClick={() => {
                    onSwitchRole(r.role, r.portal, r.supplier_id);
                    setShowProfileMenu(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    color: isSameLogin(r) ? '#432177' : '#242424',
                    fontWeight: isSameLogin(r) ? '600' : '400',
                    backgroundColor: isSameLogin(r) ? '#f5f0ff' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{r.label}</span>
                  {isSameLogin(r) && <span style={{ color: '#0f9d78', fontSize: '14px' }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && (
        <div
          role="alert"
          onClick={() => handleNotificationClick(toast)}
          style={{
            position: 'fixed', top: 70, right: 24, width: 340, zIndex: 80, cursor: 'pointer',
            background: '#2e1857', color: '#fff', borderRadius: 10, padding: '14px 16px',
            boxShadow: '0 12px 30px rgba(46,24,87,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <strong style={{ fontSize: 13 }}>🔔 {toast.title}</strong>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(e) => { e.stopPropagation(); setToast(null); }}
              style={{ background: 'none', border: 'none', color: '#d8c8ff', fontSize: 16, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: '#e9defc' }}>{toast.message}</div>
          <div style={{ fontSize: 11, marginTop: 8, fontWeight: 700, color: '#ffd9a8' }}>Click to open the auction →</div>
        </div>
      )}
    </header>
  );
}
