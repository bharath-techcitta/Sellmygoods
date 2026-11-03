import React, { useState } from 'react';

export default function ApprovalWorkflowDesigner() {
  const [activeModule, setActiveModule] = useState('Purchase Request');

  const modules = [
    'Supplier Registration',
    'Purchase Request',
    'Purchase Order',
    'Invoice',
    'Budget',
    'Bid',
    'Contracts',
    'Auction'
  ];

  const steps = [
    {
      step: 1,
      title: 'Department Head Operational Need Review',
      approver_role: 'Assigned Department Manager',
      condition: 'Triggered for all submissions > $0.00',
      sla_hours: 24,
      mode: 'Sequential'
    },
    {
      step: 2,
      title: 'Finance Controller Budget Allocation Check',
      approver_role: 'Finance Controller (David Chen)',
      condition: 'Total Request Amount >= $10,000 USD',
      sla_hours: 48,
      mode: 'Sequential'
    },
    {
      step: 3,
      title: 'Executive / CFO Commercial Authorization',
      approver_role: 'Chief Financial Officer (Executive Board)',
      condition: 'Total Request Amount >= $50,000 USD',
      sla_hours: 72,
      mode: 'Parallel'
    }
  ];

  return (
    <div>
      {/* Page Heading (Image 10) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Approval Workflow Designer & Authority Matrix
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Configure multi-tier sequential and parallel authorization gates, limits, and escalation SLAs
          </p>
        </div>
        <button
          onClick={() => alert("Workflow validation check passed: No cyclic steps detected, all role assignments have active fallbacks.")}
          style={{
            padding: '9px 16px',
            backgroundColor: '#0f9d78',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          ✓ Test & Publish Workflow
        </button>
      </div>

      {/* Module Tabs (Image 10) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px' }}>
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => setActiveModule(m)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: `1px solid ${activeModule === m ? '#432177' : '#e6e6e9'}`,
              backgroundColor: activeModule === m ? '#432177' : '#ffffff',
              color: activeModule === m ? '#ffffff' : '#242424',
              fontSize: '13px',
              fontWeight: activeModule === m ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Checklist Card Header (Image 10) */}
      <div className="card-enterprise" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                {activeModule} Policy Governance
              </h3>
              <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                ACTIVE VERSION 2.4
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#73767b' }}>
              Snapshot applied at moment of submission. Segregation of duties prevents self-approval.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: '#73767b' }}>3 Mandatory Stages Configured</span>
            <button
              onClick={() => alert("Stage editor enabled.")}
              style={{
                padding: '7px 14px',
                border: '1px solid #432177',
                color: '#432177',
                background: '#fff',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Create New Step
            </button>
          </div>
        </div>
      </div>

      {/* Numbered Stage Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {steps.map((st) => (
          <div
            key={st.step}
            className="card-enterprise"
            style={{
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: '4px solid #432177'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#f0e5ff',
                  color: '#432177',
                  fontWeight: '700',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {st.step}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#242424' }}>
                  {st.title}
                </h4>
                <div style={{ fontSize: '12.5px', color: '#73767b' }}>
                  Assignee: <strong style={{ color: '#432177' }}>{st.approver_role}</strong> • Condition: {st.condition}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#73767b' }}>Execution SLA</div>
                <div style={{ fontWeight: '600', color: '#242424', fontSize: '13px' }}>{st.sla_hours} Hours</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#73767b' }}>Routing Gate</div>
                <div style={{ fontWeight: '600', color: '#0f9d78', fontSize: '13px' }}>{st.mode}</div>
              </div>
              <button
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e6e6e9',
                  background: '#fff',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

