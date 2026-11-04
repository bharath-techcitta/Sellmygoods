import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';

const defaultClauses = [
  { id: 1, code: 'CLS-OPS-01', name: 'Force Majeure & Unforeseen Circumstances', clause_type: 'Operational', description: 'Defines performance suspension relief under severe geopolitical, weather, or regulatory disruption exceeding 14 calendar days.' },
  { id: 2, code: 'CLS-CMP-02', name: 'Comprehensive Data Privacy & Security (GDPR/CCPA)', clause_type: 'Compliance', description: 'Binds supplier to rigorous encryption at rest and in transit, 72-hour breach notification, and strict data processing boundaries.' },
  { id: 3, code: 'CLS-LEG-03', name: 'Mutual Non-Disclosure & Proprietary Rights', clause_type: 'Legal', description: 'Ensures absolute commercial secrecy of pricing, architecture diagrams, and internal roadmaps.' },
  { id: 4, code: 'CLS-LEG-04', name: 'Limitation of Liability & Mutual Indemnification', clause_type: 'Legal', description: 'Caps aggregate direct damages at 2x annual contract fees while maintaining uncapped indemnity for IP infringement.' },
  { id: 5, code: 'CLS-FIN-05', name: 'Payment Terms, Milestones & Audit Rights', clause_type: 'Financial', description: 'Standard Net 30 day settlement upon formal milestone sign-off, with annual non-intrusive accounting audit provisions.' },
  { id: 6, code: 'CLS-OPS-06', name: 'Termination for Convenience & Transition Services', clause_type: 'Operational', description: 'Allows 30-day notice termination by the buyer with mandatory 60-day migration support at agreed rate cards.' },
];

const defaultContracts = [
  { contract: { id: 1, contract_number: 'CTR_2026_004', title: 'Enterprise Master IT Equipment & Maintenance Agreement', contract_type: 'Master Services Agreement', start_date: '2026-01-01', end_date: '2028-12-31', status: 'Active', total_value: 250000.0, currency: 'USD' }, supplier_name: 'Precision Components Ltd' },
  { contract: { id: 2, contract_number: 'CTR_2026_005', title: 'Global Express Freight & Regional Fulfilment SLA', contract_type: 'Logistics Framework Agreement', start_date: '2026-02-01', end_date: '2027-01-31', status: 'Active', total_value: 180000.0, currency: 'USD' }, supplier_name: 'Apex Global Logistics Inc' },
  { contract: { id: 3, contract_number: 'CTR_2026_006', title: 'Plant Tooling & Mechanical Maintenance Master Agreement', contract_type: 'Maintenance Service Agreement', start_date: '2026-12-01', end_date: '2027-11-30', status: 'Draft', total_value: 95000.0, currency: 'USD' }, supplier_name: 'Vertex Industrial Tools Inc' },
];

export default function ContractClauses() {
  const [clauses, setClauses] = useState(defaultClauses);
  const [contracts, setContracts] = useState(defaultContracts);
  const [activeType, setActiveType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Legal');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadData();
  }, [activeType]);

  const loadData = async () => {
    try {
      const [clauseRes, contractRes] = await Promise.all([
        api.getClauses(activeType),
        api.getContracts(),
      ]);
      if (clauseRes && clauseRes.length) setClauses(clauseRes);
      if (contractRes && contractRes.length) setContracts(contractRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await api.createClause({ name: newName, clause_type: newType, description: newDesc });
      setIsModalOpen(false);
      setNewName('');
      setNewDesc('');
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create clause");
    }
  };

  const types = ['All', 'Legal', 'Operational', 'Compliance', 'Financial'];

  return (
    <div>
      {/* Header with AI Badge (Image 29) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
              Contract Clause Library & Playbooks
            </h1>
            <span style={{ backgroundColor: '#f0e5ff', color: '#432177', fontSize: '12px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
              ✨ AI Powered
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Pre-approved legal, operational, and financial clauses with version control and fallback guidance
          </p>
        </div>

        {/* Action Buttons (Image 29) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => alert("AI Clause Builder: Proposes standard Net 30 with 2% 10-day discount milestone provisions.")}
            style={{
              padding: '8px 14px',
              backgroundColor: '#faf5ff',
              color: '#432177',
              border: '1px solid #d8b4fe',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✨ AI Clause Builder
          </button>
          <button
            onClick={() => alert("Extract Contract Clauses: OCR scanning ready. Upload third-party agreements to parse deviating terms.")}
            style={{
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              color: '#242424',
              border: '1px solid #e6e6e9',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Extract Clauses
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#432177',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + New Clause
          </button>
        </div>
      </div>

      {/* Active master agreements */}
      <div className="card-enterprise" style={{ overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6e6e9', fontWeight: '700', fontSize: '15px' }}>
          Master Agreements ({contracts.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Contract #</th>
              <th style={{ padding: '12px 18px' }}>Title</th>
              <th style={{ padding: '12px 18px' }}>Supplier</th>
              <th style={{ padding: '12px 18px' }}>Type</th>
              <th style={{ padding: '12px 18px' }}>Term</th>
              <th style={{ padding: '12px 18px' }}>Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((row) => {
              const c = row.contract || row;
              const supplier = row.supplier_name || '—';
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{c.contract_number}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '600' }}>{c.title}</td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{supplier}</td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{c.contract_type}</td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{c.start_date} → {c.end_date}</td>
                  <td style={{ padding: '12px 18px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '700' }} className="font-mono-numbers">
                    ${c.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {c.currency}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Filter Tabs (Image 29) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: `1px solid ${activeType === t ? '#432177' : '#e6e6e9'}`,
              backgroundColor: activeType === t ? '#432177' : '#ffffff',
              color: activeType === t ? '#ffffff' : '#73767b',
              fontSize: '13px',
              fontWeight: activeType === t ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Clause Table (Image 29) */}
      <div className="card-enterprise" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
            <tr>
              <th style={{ padding: '12px 18px' }}>Clause Code</th>
              <th style={{ padding: '12px 18px' }}>Clause Title</th>
              <th style={{ padding: '12px 18px' }}>Classification</th>
              <th style={{ padding: '12px 18px' }}>Pre-Approved Standard Text / Description</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && clauses.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#73767b' }}>No clauses in this category.</td>
              </tr>
            )}
            {clauses.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                <td style={{ padding: '12px 18px', fontWeight: '700', color: '#432177' }}>{c.code}</td>
                <td style={{ padding: '12px 18px', fontWeight: '600', color: '#242424' }}>{c.name}</td>
                <td style={{ padding: '12px 18px' }}>
                  <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500' }}>
                    {c.clause_type}
                  </span>
                </td>
                <td style={{ padding: '12px 18px', color: '#555', maxWidth: '480px' }}>
                  {c.description}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                  <button style={{ padding: '4px 8px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11.5px' }}>
                    Insert in Contract
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Clause Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '480px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Add Pre-Approved Clause</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Clause Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intellectual Property Rights & Licensing"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Classification Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                >
                  <option value="Legal">Legal</option>
                  <option value="Operational">Operational</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Financial">Financial</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Approved Clause Language</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Insert exact pre-approved legal drafting..."
                  style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e6e6e9', background: '#fff' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#432177', color: '#fff', fontWeight: '600' }}
                >
                  Save Clause
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

