import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import InviteSupplierDrawer from '../../components/InviteSupplierDrawer';

const defaultSuppliers = [
  { id: 1, code: 'SUP_00101', legal_name: 'Precision Components Ltd', type: 'Manufacturer', status: 'Active', country: 'United States', email: 'contact@precisioncomponents.com', current_approver: 'Finance Director', performance_score: 94.5 },
  { id: 2, code: 'SUP_00102', legal_name: 'Apex Global Logistics Inc', type: 'Freight Forwarder', status: 'Active', country: 'United States', email: 'ops@apexlogistics.example.com', current_approver: 'Logistics Manager', performance_score: 91.0 },
  { id: 3, code: 'SUP_00103', legal_name: 'TechVibe Cloud Systems Corp', type: 'SaaS & Infrastructure', status: 'Pending Approval', country: 'Canada', email: 'partnerships@techvibe.example.ca', current_approver: 'Compliance Reviewer', performance_score: 87.5 },
  { id: 4, code: 'SUP_00104', legal_name: 'Nordic Paper & Pulp AB', type: 'Raw Materials', status: 'More Info Required', country: 'Sweden', email: 'nordic@pulp.example.se', current_approver: 'Elena Rostova', performance_score: 94.5 },
  { id: 5, code: 'SUP_00105', legal_name: 'Vertex Industrial Tools Inc', type: 'Tooling & Parts', status: 'Changes in Draft', country: 'Germany', email: 'info@vertextools.example.de', current_approver: 'Senior Buyer', performance_score: 94.5 },
  { id: 6, code: 'SUP_00106', legal_name: 'OmniSource Supplies Group', type: 'Distributor', status: 'Draft', country: 'United Kingdom', email: 'sales@omnisource.example.co.uk', current_approver: 'None', performance_score: 94.5 },
  { id: 7, code: 'SUP_00107', legal_name: 'Zenith Automation & Robotics', type: 'Robotics', status: 'Rejected', country: 'Japan', email: 'contact@zenith-robotics.example.jp', current_approver: 'Executive Board', performance_score: 94.5 }
];

export default function SupplierDirectory({ navigateTo, onSelectSupplier }) {
  const [allSuppliers, setAllSuppliers] = useState(defaultSuppliers);
  const [counts, setCounts] = useState({ Total: 7, Active: 2, Draft: 1, 'Pending Approval': 1, 'More Info Required': 1, 'Pending + Info': 2, 'Changes in Draft': 1, Rejected: 1 });
  const [activeFilter, setActiveFilter] = useState('Total');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, [activeFilter, searchTerm]);

  const loadSuppliers = async () => {
    try {
      const res = await api.getSuppliers(activeFilter, searchTerm);
      if (res && res.items && res.items.length) {
        setAllSuppliers(res.items);
      }
      if (res && res.counts) {
        setCounts(res.counts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayedSuppliers = allSuppliers.filter((s) => {
    const matchesFilter = (activeFilter === 'Total') || 
      (activeFilter === 'Pending + Info' ? (s.status === 'Pending Approval' || s.status === 'More Info Required') : s.status === activeFilter);
    const matchesSearch = !searchTerm || 
      s.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    'Total',
    'Active',
    'Draft',
    'Pending Approval',
    'More Info Required',
    'Pending + Info',
    'Changes in Draft',
    'Rejected'
  ];

  return (
    <div>
      {/* Page Header (Image 3) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Supplier Directory & Repository
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Centrally manage approved vendor records, onboarding verifications, and compliance audits
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => alert("AI Ranking Engine: Precision Components Ltd holds top score (94.5%) with zero defect rate over trailing 12 months.")}
            style={{
              padding: '9px 14px',
              backgroundColor: '#f5f0ff',
              color: '#432177',
              border: '1px solid #d8b4fe',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>✨</span> AI Supplier Rank
          </button>
          <button
            onClick={() => setIsInviteOpen(true)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#432177',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Invite Supplier
          </button>
        </div>
      </div>

      {/* 8 Filter Metric Chips (Section E02, Image 3) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px' }}>
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab;
          const count = counts[tab] || 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? '#432177' : '#e6e6e9'}`,
                backgroundColor: isSelected ? '#432177' : '#ffffff',
                color: isSelected ? '#ffffff' : '#242424',
                fontSize: '13px',
                fontWeight: isSelected ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab}</span>
              <span
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color: isSelected ? '#ffffff' : '#73767b',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Toolbar */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search suppliers by name, code, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '320px',
              height: '36px',
              padding: '0 12px',
              borderRadius: '6px',
              border: '1px solid #e6e6e9',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <div style={{ fontSize: '12.5px', color: '#73767b' }}>
            Showing 1–{displayedSuppliers.length} of {displayedSuppliers.length} records
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b', fontSize: '12px' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Supplier Code</th>
                <th style={{ padding: '12px 16px' }}>Legal Entity Name</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Current Approver</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Country</th>
                <th style={{ padding: '12px 16px' }}>Contact Email</th>
                <th style={{ padding: '12px 16px' }}>Performance</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (displayedSuppliers.length === 0) {
                  return (
                    <tr>
                      <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: '#73767b' }}>
                        No suppliers found matching status "{activeFilter}".
                      </td>
                    </tr>
                  );
                }
                return displayedSuppliers.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid #f1f1f4', transition: 'background 0.1s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        onClick={() => {
                          onSelectSupplier(s.id);
                          navigateTo('supplier-detail');
                        }}
                        style={{ color: '#432177', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {s.code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#242424' }}>
                      {s.legal_name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      {s.current_approver}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      {s.type}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.country}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#73767b' }}>
                      {s.email}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '600', color: '#0f9d78' }}>
                        {s.performance_score}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          onSelectSupplier(s.id);
                          navigateTo('supplier-detail');
                        }}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #e6e6e9',
                          borderRadius: '4px',
                          background: '#ffffff',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Supplier Right Drawer */}
      <InviteSupplierDrawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSuccess={loadSuppliers}
      />
    </div>
  );
}

