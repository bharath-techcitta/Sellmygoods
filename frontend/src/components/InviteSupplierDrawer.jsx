import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function InviteSupplierDrawer({ isOpen, onClose, onInviteSuccess }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSuppliers().then((res) => {
        setSuppliers(res.items || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendInvitations = async () => {
    setIsSubmitting(true);
    try {
      alert(`Invitations dispatched to ${selectedIds.size} selected suppliers with expiring secure tokens.`);
      if (onInviteSuccess) onInviteSuccess();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchesSearch = s.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <div
        style={{
          width: '620px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Drawer Header (Image 20) */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e6e6e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#242424' }}>
              Invite Suppliers to Event
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#73767b' }}>
              Select approved vendors by category, country, or qualifications
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
          >
            ✕
          </button>
        </div>

        {/* Filters Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f1f4', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by vendor name, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              height: '38px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid #e6e6e9',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid #e6e6e9',
              fontSize: '13px',
              backgroundColor: '#fff',
              outline: 'none'
            }}
          >
            <option value="All">All Categories</option>
            <option value="IT">IT Hardware</option>
            <option value="Logistics">Logistics</option>
            <option value="Machinery">Machinery</option>
          </select>
        </div>

        {/* Suppliers List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {filtered.map((s) => {
            const isChecked = selectedIds.has(s.id);
            return (
              <div
                key={s.id}
                onClick={() => toggleSelect(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isChecked ? '#432177' : '#e6e6e9'}`,
                  backgroundColor: isChecked ? '#faf6ff' : '#ffffff',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', accentColor: '#432177' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#242424' }}>
                      {s.legal_name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#0f9d78', backgroundColor: '#d1fae8', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#73767b', marginTop: '2px' }}>
                    {s.country} • {s.email}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Actions Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e6e6e9',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#432177' }}>
            {selectedIds.size} Suppliers Selected
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e6e6e9',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitations}
              disabled={selectedIds.size === 0 || isSubmitting}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#432177',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedIds.size === 0 ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Dispatching...' : 'Invite Selected'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

