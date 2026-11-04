import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import MetricCard from '../../components/MetricCard';
import { isChartsEnabled } from '../../components/charts/chartsEnabled';
import BuyerDashboardCharts from '../../components/charts/BuyerDashboardCharts';
import CompletionProgressRing from '../../components/CompletionProgressRing';
import { readSupplierWizardProgress } from '../../utils/supplierWizardProgress';

const defaultSupplierEvents = [
  {
    id: 1,
    code: 'RFQ_2026_091',
    title: 'Cisco Managed Switch Procurement (10 Units)',
    type: 'RFQ',
    delivery_location: 'Central Logistics Hub, Dallas TX',
    submission_deadline: '2026-11-06',
    response_status: 'Quote Submitted ($36,000.00 Net)',
    submitted_net: 36000.0
  }
];

export default function BuyerDashboard({ navigateTo }) {
  const [events, setEvents] = useState(defaultSupplierEvents);
  const [wizardCompletion, setWizardCompletion] = useState(() => readSupplierWizardProgress().completion);

  const refreshWizardProgress = () => {
    setWizardCompletion(readSupplierWizardProgress().completion);
  };

  useEffect(() => {
    api.getSupplierEvents()
      .then((res) => {
        if (res && res.length) setEvents(res);
      })
      .catch(console.error);
    refreshWizardProgress();
    const onStorage = (e) => {
      if (e.key === 'procurio_supplier_wizard_progress') refreshWizardProgress();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refreshWizardProgress);
    window.addEventListener('procurio-wizard-progress', refreshWizardProgress);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refreshWizardProgress);
      window.removeEventListener('procurio-wizard-progress', refreshWizardProgress);
    };
  }, []);

  return (
    <div>
      {/* Header (Image 21) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
              Buyer Portal — Supplier Workspace
            </h1>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
              PRECISION COMPONENTS LTD
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Manage invited tender quotations, purchase orders, milestone invoices, and corporate onboarding
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CompletionProgressRing targetPercent={wizardCompletion} size={48} durationMs={700} />
          <button
            type="button"
            onClick={() => navigateTo('registration-wizard')}
            style={{
              padding: '9px 16px',
              backgroundColor: '#432177',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚀 Registration Profile Wizard ({wizardCompletion}%)
          </button>
        </div>
      </div>

      {isChartsEnabled() && <BuyerDashboardCharts events={events} />}

      {/* Top 4 Operational Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '24px' }}>
        <MetricCard
          label="Pending RFx Invitations"
          count={events.filter((e) => e.response_status.includes('Awaiting')).length || 1}
          icon="🎯"
          color="#b65c16"
          onClick={() => navigateTo('buyer-bids')}
        />
        <MetricCard
          label="Active Purchase Orders"
          count={1}
          icon="📋"
          color="#432177"
          onClick={() => navigateTo('buyer-pos')}
        />
        <MetricCard
          label="Invoices Under Review"
          count={1}
          icon="💳"
          color="#3676ce"
          onClick={() => navigateTo('buyer-invoices')}
        />
        <MetricCard
          label="Active MSA Agreements"
          count={1}
          icon="📜"
          color="#0f9d78"
          onClick={() => navigateTo('buyer-contracts')}
        />
      </div>

      {/* Action Banner: Pending Tender Response (Image 21) */}
      <div className="card-enterprise" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid #432177' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#242424' }}>
                Pending Action: Sourcing Tender RFQ_2026_091
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
              Procurement of Enterprise Managed Core Switches — Submit quotation before deadline in 3 days.
            </p>
          </div>
          <button
            onClick={() => navigateTo('buyer-bids')}
            style={{
              padding: '8px 18px',
              backgroundColor: '#432177',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Review & Submit Response →
          </button>
        </div>
      </div>

      {/* My Bid Responses Metrics Bar (Image 21, E11) */}
      <div className="card-enterprise" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
            My Bid Responses Overview
          </h3>
          <span style={{ fontSize: '12px', color: '#73767b' }}>Showing all historical tender rounds</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Events', count: 4, color: '#242424' },
            { label: 'Drafts in Progress', count: 0, color: '#73767b' },
            { label: 'Submitted Quotes', count: 2, color: '#432177' },
            { label: 'Awarded Contracts', count: 1, color: '#0f9d78' },
            { label: 'Under Negotiation', count: 1, color: '#b65c16' }
          ].map((item, idx) => (
            <div key={idx} style={{ padding: '14px', backgroundColor: '#fcfcfd', border: '1px solid #ededf2', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#73767b' }}>{item.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: item.color, marginTop: '4px' }} className="font-mono-numbers">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

