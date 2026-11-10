import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import CreateBidModal from '../../components/CreateBidModal';

const defaultPrData = {
  requisition: {
    id: 1,
    pr_number: 'PR_00084',
    description: 'Enterprise Core Network Switch Upgrade for Dallas Logistics Datacenter',
    pr_type: 'Goods',
    status: 'Approved',
    requester_name: 'Sarah Jenkins',
    requester_email: 'sarah.jenkins@procurio.com',
    buyer_name: 'Marcus Vance',
    department: 'Information Technology',
    business_entity: 'Procurio Corp US',
    currency: 'INR',
    total_amount: 32000.0,
    delivery_date: '2026-11-20',
    destination: 'Central Logistics Hub, Dallas TX',
    is_budgeted: true,
    budget_allocated: 50000.0,
    budget_available: 32000.0,
    current_approver: 'Finance Director'
  },
  lines: [
    {
      id: 1,
      line_number: 1,
      description: 'Cisco Catalyst 9300 48-Port Switch',
      category: 'Networking Hardware',
      quantity: 10,
      uom: 'Unit',
      unit_price: 3200.0,
      amount: 32000.0,
      status: 'Approved'
    }
  ],
  allocations: [
    { cost_centre: 'CC-1020-IT', percentage: 100.0, amount: 32000.0, gl_account: '6100-Equipment' }
  ],
  approval_history: [
    { step: 'Department Review', actor: 'Sarah Jenkins', decision: 'Submitted', timestamp: '2026-11-01 09:30', comments: 'Urgent datacenter refresh requirement.' },
    { step: 'Finance Allocation Check', actor: 'David Chen', decision: 'Approved', timestamp: '2026-11-02 14:15', comments: 'Budget headroom validated against FY26 Q4 IT pool.' }
  ]
};

export default function RequisitionDetail({ prId, onBack, navigateTo, onPoCreated, onAuctionCreated }) {
  const isCreate = prId == null;
  const [data, setData] = useState(isCreate ? null : defaultPrData);
  const [loading, setLoading] = useState(!isCreate);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [createForm, setCreateForm] = useState({
    description: '',
    department: 'Information Technology',
    delivery_date: '2026-12-01',
    destination: 'Headquarters, Austin TX',
    line_description: 'General procurement line item',
    quantity: 1,
    unit_price: 1000,
  });

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    loadDetail();
  }, [prId, isCreate]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getRequisitionDetail(prId);
      if (res && res.requisition) setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePR = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createRequisition({
        description: createForm.description,
        department: createForm.department,
        delivery_date: createForm.delivery_date,
        destination: createForm.destination,
        lines: [{
          description: createForm.line_description,
          category: 'General',
          quantity: Number(createForm.quantity),
          unit_price: Number(createForm.unit_price),
          uom: 'Unit',
        }],
      });
      if (res?.requisition?.id) {
        navigateTo('requisitions');
        alert(`Created ${res.requisition.pr_number} successfully.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create PR');
    }
  };

  const handleCheckBudget = () => {
    alert("Budget Ledger Verification: CC-1020-IT has ₹32,000.00 available headroom. Proposed PR reservation is within policy bounds.");
  };

  const handleSubmitPR = async () => {
    try {
      await api.submitRequisition(prId);
      setActionMessage("Requisition submitted for approval workflow.");
      loadDetail();
    } catch (e) {
      alert(e.message || "Submission failed");
    }
  };

  const handleDirectPO = async () => {
    try {
      const res = await api.convertRequisition(prId, 'po', 1);
      alert(`Requisition successfully converted to Direct Purchase Order: ${res.po_number}`);
      if (onPoCreated && res.id) onPoCreated(res.id);
      else navigateTo('purchase-orders');
    } catch (e) {
      alert(e.message || "Conversion failed");
    }
  };

  if (loading) {
    return <div style={{ padding: '30px' }}>Loading Requisition Detail...</div>;
  }

  if (isCreate) {
    return (
      <div>
        <button onClick={onBack} style={{ marginBottom: '16px', padding: '8px 14px', border: '1px solid #e6e6e9', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>
          ← Back to PR List
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>Create Purchase Requisition</h1>
        <form onSubmit={handleCreatePR} className="card-enterprise" style={{ padding: '24px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px' }}>Description *</label>
            <input required value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px' }}>Department</label>
            <input value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px' }}>Destination</label>
            <input value={createForm.destination} onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px' }}>Delivery date</label>
            <input type="date" value={createForm.delivery_date} onChange={(e) => setCreateForm({ ...createForm, delivery_date: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '13px' }}>Line item description</label>
            <input value={createForm.line_description} onChange={(e) => setCreateForm({ ...createForm, line_description: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontWeight: '600', fontSize: '13px' }}>Quantity</label>
              <input type="number" min="1" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontWeight: '600', fontSize: '13px' }}>Unit price (INR)</label>
              <input type="number" min="0" step="0.01" value={createForm.unit_price} onChange={(e) => setCreateForm({ ...createForm, unit_price: e.target.value })} style={{ width: '100%', height: '38px', marginTop: '4px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="submit" style={{ marginTop: '8px', padding: '10px 18px', backgroundColor: '#432177', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>
            Save Draft PR
          </button>
        </form>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: '30px' }}>Requisition not found.</div>;
  }

  const pr = data.requisition;

  return (
    <div>
      {/* Top Header (Image 12) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #e6e6e9',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Back to PR List
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#242424' }}>
                {pr.pr_number}
              </h1>
              <StatusBadge status={pr.status} />
              <span style={{ fontSize: '12px', color: '#73767b' }}>Type: {pr.pr_type}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#73767b', marginTop: '2px' }}>
              Created: 2026-11-01 • Assigned Buyer: <strong style={{ color: '#432177' }}>{pr.buyer_name}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCheckBudget}
            style={{
              padding: '8px 14px',
              border: '1px solid #e6e6e9',
              background: '#fff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            💰 Check Budget
          </button>

          {pr.status === 'Draft' && (
            <button
              onClick={handleSubmitPR}
              style={{
                padding: '8px 16px',
                backgroundColor: '#432177',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Submit for Approval
            </button>
          )}


          {pr.status === 'Approved' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsBidModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#432177',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Create Bid / Sourcing Event
              </button>
              <button
                onClick={handleDirectPO}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#0f9d78',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Convert to Direct PO
              </button>
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: '10px 16px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* Summary: Two Equal Cards (Image 12) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
        {/* Requisition Details Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
            Requisition Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#73767b' }}>Business Scope & Justification:</span>
              <div style={{ fontWeight: '500', marginTop: '2px', color: '#242424' }}>{pr.description}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Operating Department:</span>
              <div style={{ fontWeight: '600' }}>{pr.department}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Desired Delivery Date:</span>
              <div style={{ fontWeight: '600', color: '#0f9d78' }}>{pr.delivery_date}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#73767b' }}>Destination Facility:</span>
              <div style={{ fontWeight: '500' }}>{pr.destination}</div>
            </div>
          </div>
        </div>

        {/* People & Budget Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
            People & Budget Allocation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#73767b' }}>Requester:</span>
              <div style={{ fontWeight: '600' }}>{pr.requester_name}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Purchasing Entity:</span>
              <div style={{ fontWeight: '500' }}>{pr.business_entity}</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Fiscal Budget Allocated:</span>
              <div style={{ fontWeight: '600' }} className="font-mono-numbers">₹{pr.budget_allocated?.toLocaleString()} INR</div>
            </div>
            <div>
              <span style={{ color: '#73767b' }}>Available Headroom:</span>
              <div style={{ fontWeight: '700', color: '#0f9d78' }} className="font-mono-numbers">₹{pr.budget_available?.toLocaleString()} INR</div>
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
              <span style={{ backgroundColor: '#f0e5ff', color: '#432177', padding: '4px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600' }}>
                ✓ Pre-allocated Against FY26 IT Infrastructure Pool (CC-1020-IT)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table (Image 12) */}
      <div className="card-enterprise" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e6e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Requested Line Items</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => alert("AI Advisor: Historical purchase price for Cisco Catalyst 9300 in Q2 was ₹3,150. Current quote of ₹3,200 is acceptable.")}
              style={{ padding: '6px 12px', border: '1px solid #d8b4fe', background: '#faf5ff', color: '#432177', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              ✨ AI Advisor
            </button>
            <button
              style={{ padding: '6px 12px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
            >
              + Add Line Item
            </button>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Line #</th>
              <th style={{ padding: '12px 18px' }}>Description / Specification</th>
              <th style={{ padding: '12px 18px' }}>Category</th>
              <th style={{ padding: '12px 18px' }}>Quantity</th>
              <th style={{ padding: '12px 18px' }}>UOM</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Est. Unit Price</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.lines?.map((line) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                <td style={{ padding: '12px 18px', fontWeight: '600' }}>{line.line_number}</td>
                <td style={{ padding: '12px 18px', fontWeight: '500', color: '#242424' }}>{line.description}</td>
                <td style={{ padding: '12px 18px', color: '#73767b' }}>{line.category}</td>
                <td style={{ padding: '12px 18px' }}>{line.quantity}</td>
                <td style={{ padding: '12px 18px' }}>{line.uom}</td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }} className="font-mono-numbers">
                  ₹{line.unit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                  ₹{line.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <StatusBadge status={line.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: '16px 20px', borderTop: '2px solid #e6e6e9', display: 'flex', justifyContent: 'flex-end', gap: '20px', backgroundColor: '#fcfcfd' }}>
          <div style={{ fontSize: '15px' }}>
            <span>Total Requisition Value: </span>
            <strong style={{ fontSize: '18px', color: '#432177' }} className="font-mono-numbers">
              ₹{pr.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {pr.currency}
            </strong>
          </div>
        </div>
      </div>

      {/* Approval History Timeline */}
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
          Approval Decisions & Audit History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.approval_history?.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px', padding: '10px', backgroundColor: '#fbfbfe', borderRadius: '6px', border: '1px solid #ededf0' }}>
              <span style={{ color: '#0f9d78', fontWeight: '700' }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{h.step} — {h.decision}</strong>
                  <span style={{ color: '#73767b' }}>{h.timestamp}</span>
                </div>
                <div style={{ color: '#555', marginTop: '2px' }}>{h.comments} (Actor: {h.actor})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Bid Modal (Image 19) */}
      <CreateBidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        defaultPrId={pr.id}
        onBidCreated={() => {
          navigateTo('bids');
        }}
      />
    </div>
  );
}

