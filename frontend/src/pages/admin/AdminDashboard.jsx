import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import MetricCard from '../../components/MetricCard';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard({ navigateTo }) {
  const [metrics, setMetrics] = useState({
    top_metrics: { total_users: 1248, active_org_users: 842, supplier_users: 406 },
    pending_approvals: { supplier_registrations: 1, purchase_requests: 1, purchase_orders: 0, invoices: 1, budgets: 1, contracts: 1 },
    my_requests: { draft_prs: 1, approved_prs: 1, draft_pos: 0, approved_pos: 3, pending_invoices: 1 },
    supplier_counts: { total: 7, active: 2 }
  });
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Review Onboarding: TechVibe Cloud Systems Corp', record_code: 'SUP_00103', assignee_role: 'Compliance Reviewer', due_date: '2026-11-05', status: 'Pending Approval' },
    { id: 2, title: 'Approve PR: High Pressure Ball Valves ($15,500.00)', record_code: 'PR_00085', assignee_role: 'Finance Controller', due_date: '2026-11-06', status: 'Pending Approval' },
    { id: 3, title: '3-Way Matched Invoice Review: Precision Components Ltd ($36,000.00)', record_code: 'INV_99214', assignee_role: 'AP Lead', due_date: '2026-11-04', status: 'Urgent' },
    { id: 4, title: 'Award Evaluation & Commercial Recommendation (RFQ_2026_091)', record_code: 'RFQ_2026_091', assignee_role: 'Procurement Lead', due_date: '2026-11-07', status: 'High' }
  ]);
  const [activity, setActivity] = useState([
    { id: 1, actor: 'Sarah Jenkins', action: 'Submitted PR_00084 for IT Core Switches ($32,000.00)', time: '15 mins ago', type: 'PR' },
    { id: 2, actor: 'Precision Components', action: 'Submitted quote for RFQ_2026_091 ($36,000.00 Net)', time: '45 mins ago', type: 'Bid' },
    { id: 3, actor: 'Marcus Vance', action: 'Issued PO_2026_0142 to Precision Components Ltd', time: '2 hours ago', type: 'PO' },
    { id: 4, actor: 'TechVibe Cloud', action: 'Completed Step 5 of Supplier Onboarding Wizard', time: '4 hours ago', type: 'Supplier' },
    { id: 5, actor: 'David Chen', action: 'Approved budget allocation for Plant Operations ($15,500.00)', time: 'Yesterday', type: 'Budget' }
  ]);

  useEffect(() => {
    async function load() {
      try {
        const [m, t, a] = await Promise.all([
          api.getMetrics().catch(() => null),
          api.getTasks().catch(() => null),
          api.getActivity().catch(() => null)
        ]);
        if (m) setMetrics(m);
        if (t && t.length) setTasks(t);
        if (a && a.length) setActivity(a);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Page Heading (Section C1, Image 1) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Enterprise Procurement Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#73767b' }}>
            Consolidated overview of requisitions, sourcing, contracts, and supplier compliance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigateTo('requisitions')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#432177',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Create Requisition
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards (Section E01, Image 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '24px' }}>
        <MetricCard
          label="Total System Users"
          count={metrics?.top_metrics?.total_users || 1248}
          icon="👥"
          color="#432177"
        />
        <MetricCard
          label="Active Organization Users"
          count={metrics?.top_metrics?.active_org_users || 842}
          icon="🏢"
          color="#0f9d78"
        />
        <MetricCard
          label="External Supplier Accounts"
          count={metrics?.top_metrics?.supplier_users || 406}
          icon="🤝"
          color="#3676ce"
        />
      </div>

      {/* Middle Two Columns: Pending Approval Requests & My Requests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Pending Approval Requests Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#242424' }}>
              Pending Approval Requests
            </h3>
            <span style={{ fontSize: '12px', color: '#b65c16', backgroundColor: '#fff0d8', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              Requires Action
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Supplier Onboarding', count: metrics?.pending_approvals?.supplier_registrations || 1, route: 'suppliers' },
              { label: 'Purchase Requests', count: metrics?.pending_approvals?.purchase_requests || 1, route: 'requisitions' },
              { label: 'Purchase Orders', count: metrics?.pending_approvals?.purchase_orders || 0, route: 'purchase-orders' },
              { label: 'Invoices (3-Way)', count: metrics?.pending_approvals?.invoices || 1, route: 'invoices' },
              { label: 'Budget Changes', count: metrics?.pending_approvals?.budgets || 1, route: 'budgets' },
              { label: 'Contract Sign-offs', count: metrics?.pending_approvals?.contracts || 1, route: 'contracts' }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigateTo(item.route)}
                style={{
                  backgroundColor: '#fbfbfe',
                  border: '1px solid #ededf2',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3eeff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fbfbfe')}
              >
                <div style={{ fontSize: '11.5px', color: '#73767b' }}>{item.label}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#432177', marginTop: '4px' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Requests Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#242424' }}>
              My Procurement Tracking
            </h3>
            <span style={{ fontSize: '12px', color: '#432177', fontWeight: '600' }}>
              Live Portfolio
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div
              onClick={() => navigateTo('requisitions')}
              style={{ backgroundColor: '#f9f9fb', border: '1px solid #ededf2', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#73767b' }}>Approved Requisitions Ready for Bid/PO</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f9d78', marginTop: '6px' }}>
                {metrics?.my_requests?.approved_prs || 2} PRs
              </div>
            </div>
            <div
              onClick={() => navigateTo('purchase-orders')}
              style={{ backgroundColor: '#f9f9fb', border: '1px solid #ededf2', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#73767b' }}>Active Issued Orders (In-Flight)</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#432177', marginTop: '6px' }}>
                {metrics?.my_requests?.approved_pos || 1} Orders
              </div>
            </div>
            <div
              onClick={() => navigateTo('bids')}
              style={{ backgroundColor: '#f9f9fb', border: '1px solid #ededf2', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#73767b' }}>Sourcing Events Under Evaluation</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#3676ce', marginTop: '6px' }}>
                1 Event
              </div>
            </div>
            <div
              onClick={() => navigateTo('invoices')}
              style={{ backgroundColor: '#f9f9fb', border: '1px solid #ededf2', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', color: '#73767b' }}>Invoices Ready for AP Settlement</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#b65c16', marginTop: '6px' }}>
                $36,000.00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Cards: Tasks To Do & Persistent Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Tasks To Do Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Tasks To Do</h3>
            <span style={{ fontSize: '12px', color: '#432177', cursor: 'pointer', fontWeight: '600' }}>
              View All Tasks →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ededf0',
                  backgroundColor: '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#242424' }}>
                      {task.title}
                    </span>
                    <StatusBadge status={task.priority === 'Urgent' ? 'Rejected' : task.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#73767b', marginTop: '3px' }}>
                    Record: <strong style={{ color: '#432177' }}>{task.record_code}</strong> • Assignee: {task.assignee_role} • Due: {task.due_date}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (task.module.includes('Supplier')) navigateTo('suppliers');
                    else if (task.module.includes('Invoice')) navigateTo('invoices');
                    else if (task.module.includes('Bid')) navigateTo('bids');
                    else navigateTo('requisitions');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e6e6e9',
                    backgroundColor: '#f7f7f8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700' }}>
            Recent Activity Stream
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activity.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#432177', marginTop: '6px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#242424' }}>
                    <strong>{act.actor}</strong> {act.action}
                  </div>
                  <div style={{ fontSize: '11px', color: '#73767b', marginTop: '2px' }}>
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

