import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultPRs = [
  {
    id: 1,
    pr_number: 'PR_00084',
    description: 'Enterprise Core Network Switch Upgrade for Dallas Logistics Datacenter',
    department: 'Information Technology',
    requester_name: 'Sarah Jenkins',
    delivery_date: '2026-11-20',
    total_amount: 32000.0,
    status: 'Approved',
    current_approver: 'Finance Director',
    is_budgeted: true
  },
  {
    id: 2,
    pr_number: 'PR_00085',
    description: 'High Pressure Industrial Ball Valves Replacement for Processing Unit 4',
    department: 'Plant Operations',
    requester_name: 'Mike Alvarez',
    delivery_date: '2026-12-05',
    total_amount: 15500.0,
    status: 'Pending Approval',
    current_approver: 'David Chen',
    is_budgeted: true
  },
  {
    id: 3,
    pr_number: 'PR_00086',
    description: 'Developer High Performance Workstations Q4 Batch',
    department: 'Information Technology',
    requester_name: 'Sarah Jenkins',
    delivery_date: '2026-12-15',
    total_amount: 18500.0,
    status: 'Draft',
    current_approver: 'Marcus Vance',
    is_budgeted: true
  }
];

export default function RequisitionList({ navigateTo, onSelectPR }) {
  const [allPRs, setAllPRs] = useState(defaultPRs);
  const [counts, setCounts] = useState({ Total: 3, Approved: 1, 'Pending Approval': 1, Draft: 1 });
  const [activeFilter, setActiveFilter] = useState('Total');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPRs();
  }, [activeFilter, searchTerm]);

  const loadPRs = async () => {
    try {
      const res = await api.getRequisitions(activeFilter, searchTerm);
      if (res && res.items && res.items.length) setAllPRs(res.items);
      if (res && res.counts) setCounts(res.counts);
    } catch (e) {
      console.error(e);
    }
  };

  const displayedPRs = allPRs.filter((pr) => {
    const matchesFilter = (activeFilter === 'Total') || (pr.status === activeFilter);
    const matchesSearch = !searchTerm || 
      pr.pr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs = [
    'Total',
    'Draft',
    'Pending Approval',
    'Approved',
    'Complete',
    'More Info Required',
    'Rejected',
    'Cancelled'
  ];

  return (
    <div>
      {/* Page Header (Image 11) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Purchase Requisitions (PR)
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Track operational demand, budget reservations, policy compliance, and downstream conversions
          </p>
        </div>
        <button
          onClick={() => {
            onSelectPR(null);
            navigateTo('requisition-detail');
          }}
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
          + Create PR
        </button>
      </div>

      {/* Metrics Filter Bar (Image 11) */}
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
                whiteSpace: 'nowrap'
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
            placeholder="Search by PR number, requester, description..."
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
            Showing 1–{requisitions.length} of {requisitions.length} records
          </div>
        </div>

        {/* Requisition Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b', fontSize: '12px' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>PR Number</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Description</th>
                <th style={{ padding: '12px 16px' }}>Requester</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Procurement Buyer</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '12px 16px' }}>Target Delivery</th>
                <th style={{ padding: '12px 16px' }}>Current Approver</th>
              </tr>
            </thead>
            <tbody>
              {displayedPRs.map((pr) => (
                <tr
                  key={pr.id}
                  style={{ borderBottom: '1px solid #f1f1f4', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#faf9fc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => {
                    onSelectPR(pr.id);
                    navigateTo('requisition-detail');
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#432177', textDecoration: 'underline' }}>
                    {pr.pr_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={pr.status} />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '500', color: '#242424', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pr.description}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{pr.requester_name}</td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{pr.department}</td>
                  <td style={{ padding: '12px 16px', color: '#555' }}>{pr.buyer_name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${pr.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {pr.currency}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#73767b' }}>{pr.delivery_date}</td>
                  <td style={{ padding: '12px 16px', color: '#432177', fontWeight: '500' }}>
                    {pr.current_approver}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

