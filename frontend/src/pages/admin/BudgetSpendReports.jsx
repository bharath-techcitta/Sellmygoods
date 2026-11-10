import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { isChartsEnabled } from '../../components/charts/chartsEnabled';
import BudgetSpendCharts from '../../components/charts/BudgetSpendCharts';

const defaultBudgets = [
  { id: 1, fiscal_period: 'FY 2026-2027', department: 'Information Technology', cost_centre: 'CC-1020-IT', approved_budget: 350000.0, adjustments: 0.0, pr_reserved: 32000.0, po_committed: 85000.0, invoiced_actuals: 64000.0, available_balance: 169000.0 },
  { id: 2, fiscal_period: 'FY 2026-2027', department: 'Plant Operations', cost_centre: 'CC-2040-OPS', approved_budget: 500000.0, adjustments: 15000.0, pr_reserved: 15500.0, po_committed: 140000.0, invoiced_actuals: 120000.0, available_balance: 239500.0 },
  { id: 3, fiscal_period: 'FY 2026-2027', department: 'Facilities & Admin', cost_centre: 'CC-3010-FAC', approved_budget: 180000.0, adjustments: 0.0, pr_reserved: 8000.0, po_committed: 42000.0, invoiced_actuals: 35000.0, available_balance: 95000.0 }
];

const defaultAnalytics = {
  categories: [
    { category: 'IT & Networking Hardware', spend: 420000.0, share: 38.5 },
    { category: 'Logistics & Freight Services', spend: 280000.0, share: 25.7 },
    { category: 'Plant & Industrial Machinery', spend: 195000.0, share: 17.9 },
    { category: 'Corporate Facilities & Admin', spend: 110000.0, share: 10.1 },
    { category: 'Professional Consulting', spend: 85000.0, share: 7.8 }
  ],
  supplier_concentration: [
    { supplier: 'Precision Components Ltd', annual_spend: 310000.0, status: 'Strategic Preferred' },
    { supplier: 'Apex Global Logistics', annual_spend: 245000.0, status: 'Approved Carrier' },
    { supplier: 'Vertex Industrial Tools', annual_spend: 160000.0, status: 'Tier-1 Vendor' }
  ],
  savings_summary: {
    identified: 128000.0,
    negotiated: 84500.0,
    contracted: 72000.0,
    realized: 61400.0
  }
};

export default function BudgetSpendReports() {
  const [budgets, setBudgets] = useState(defaultBudgets);
  const [analytics, setAnalytics] = useState(defaultAnalytics);

  useEffect(() => {
    async function load() {
      try {
        const [b, a] = await Promise.all([
          api.getBudgets(),
          api.getSpendAnalytics()
        ]);
        if (b && b.length) setBudgets(b);
        if (a && a.categories) setAnalytics(a);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Budget Ledgers & Spend Analytics
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Traceable commitments across fiscal cost centres, category distribution, and validated savings
          </p>
        </div>
      </div>

      {/* Savings Summary 4 Cards (Section E16) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#73767b' }}>1. Identified Savings</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#432177', marginTop: '4px' }} className="font-mono-numbers">
            ₹{analytics?.savings_summary?.identified?.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#73767b', marginTop: '2px' }}>AI sourcing discovery</div>
        </div>
        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#73767b' }}>2. Negotiated Savings</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#3676ce', marginTop: '4px' }} className="font-mono-numbers">
            ₹{analytics?.savings_summary?.negotiated?.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#73767b', marginTop: '2px' }}>RFQ tender delta</div>
        </div>
        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#73767b' }}>3. Contracted Savings</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#b65c16', marginTop: '4px' }} className="font-mono-numbers">
            ₹{analytics?.savings_summary?.contracted?.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#73767b', marginTop: '2px' }}>Locked agreement terms</div>
        </div>
        <div className="card-enterprise" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#73767b' }}>4. Realized Cash Savings</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f9d78', marginTop: '4px' }} className="font-mono-numbers">
            ₹{analytics?.savings_summary?.realized?.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#0f9d78', fontWeight: '600', marginTop: '2px' }}>✓ AP settlement confirmed</div>
        </div>
      </div>

      {isChartsEnabled() && <BudgetSpendCharts budgets={budgets} analytics={analytics} />}

      {/* Department Budget Ledger Table (Image 1, E16) */}
      <div className="card-enterprise" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6e6e9' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Fiscal Period Budget Ledgers (FY 2026-2027)</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#73767b' }}>
            Available = Approved Budget + Adjustments − PR Reserved − PO Committed − Invoiced Actuals
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Cost Centre</th>
              <th style={{ padding: '12px 18px' }}>Department</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Approved Budget</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>PR Reserved</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>PO Committed</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Invoiced Actuals</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Available Headroom</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{b.cost_centre}</td>
                <td style={{ padding: '12px 18px', fontWeight: '600', color: '#242424' }}>{b.department}</td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }} className="font-mono-numbers">
                  ₹{b.approved_budget?.toLocaleString()}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', color: '#b65c16' }} className="font-mono-numbers">
                  ₹{b.pr_reserved?.toLocaleString()}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', color: '#432177' }} className="font-mono-numbers">
                  ₹{b.po_committed?.toLocaleString()}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', color: '#555' }} className="font-mono-numbers">
                  ₹{b.invoiced_actuals?.toLocaleString()}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700', color: '#0f9d78' }} className="font-mono-numbers">
                  ₹{b.available_balance?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spend by Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
            Spend Concentration by Taxonomy Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics?.categories?.map((cat, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>{cat.category}</span>
                  <span className="font-mono-numbers" style={{ fontWeight: '600' }}>
                    ₹{cat.spend?.toLocaleString()} ({cat.share}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f1f4', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.share}%`, height: '100%', backgroundColor: i === 0 ? '#432177' : i === 1 ? '#0f9d78' : '#3676ce' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Supplier Concentration */}
        <div className="card-enterprise" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700' }}>
            Top Strategic Supplier Share
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics?.supplier_concentration?.map((sup, idx) => (
              <div key={idx} style={{ padding: '10px', backgroundColor: '#fcfcfd', border: '1px solid #ededf0', borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#242424' }}>{sup.supplier}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                  <span style={{ color: '#0f9d78', fontWeight: '500' }}>{sup.status}</span>
                  <span className="font-mono-numbers" style={{ fontWeight: '700', color: '#432177' }}>
                    ₹{sup.annual_spend?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

