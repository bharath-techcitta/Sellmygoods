import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ContractClauses() {
  const [clauses, setClauses] = useState([]);
  const [activeType, setActiveType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Legal');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadClauses();
  }, [activeType]);

  const loadClauses = async () => {
    try {
      const res = await api.getClauses(activeType);
      setClauses(res || []);
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
      loadClauses();
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

