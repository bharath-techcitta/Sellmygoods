import React, { useState } from 'react';
import { api } from '../api';

export default function CreateBidModal({ isOpen, onClose, defaultPrId, onBidCreated }) {
  const [bidType, setBidType] = useState('RFQ');
  const [openDate, setOpenDate] = useState('2026-11-03');
  const [closeDate, setCloseDate] = useState('2026-11-13');
  const [template, setTemplate] = useState('Standard Hardware RFQ Template');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.convertRequisition(defaultPrId || 1, 'rfq');
      alert(`Sourcing Event ${res.event_code} drafted successfully!`);
      if (onBidCreated) onBidCreated(res);
      onClose();
    } catch (err) {
      alert(err.message || 'Error converting PR to Bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 95,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '500px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Header (Image 19) */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e6e6e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#242424' }}>
            Create Bid from PR
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#242424' }}>
              Bid / Event Type <span style={{ color: '#c32e3b' }}>*</span>
            </label>
            <select
              value={bidType}
              onChange={(e) => setBidType(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #e6e6e9',
                padding: '0 12px',
                fontSize: '13px'
              }}
            >
              <option value="RFQ">RFQ — Request for Quotation (Standard Goods)</option>
              <option value="RFP">RFP — Request for Proposal (Technical Solutions)</option>
              <option value="RFI">RFI — Request for Information (Market Survey)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Open Date <span style={{ color: '#c32e3b' }}>*</span>
              </label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '6px',
                  border: '1px solid #e6e6e9',
                  padding: '0 12px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Close Date <span style={{ color: '#c32e3b' }}>*</span>
              </label>
              <input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '6px',
                  border: '1px solid #e6e6e9',
                  padding: '0 12px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Copy Criteria from Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #e6e6e9',
                padding: '0 12px',
                fontSize: '13px'
              }}
            >
              <option value="Standard Hardware RFQ Template">Standard Hardware RFQ Template (50/50 Scoring)</option>
              <option value="Enterprise Consulting RFP Template">Enterprise Consulting RFP Template (70/30 Tech Weighted)</option>
              <option value="Blank">Start from Blank Schedule</option>
            </select>
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
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
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 22px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#432177',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {isSubmitting ? 'Creating...' : 'Convert & Open Editor →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

