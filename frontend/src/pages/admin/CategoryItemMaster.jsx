import React, { useState } from 'react';

export default function CategoryItemMaster() {
  const [activeTab, setActiveTab] = useState('categories'); // categories, items
  const [filterType, setFilterType] = useState('All'); // All, Category, Subcategory
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [categories, setCategories] = useState([
    { id: 1, code: 'CAT-IT', name: 'IT & Telecom Equipment', parent: '—', desc: 'Enterprise networking, computing, and peripheral devices', active: true, isSub: false },
    { id: 2, code: 'CAT-IT-NET', name: 'Networking Hardware', parent: 'CAT-IT', desc: 'Switches, routers, enterprise Wi-Fi', active: true, isSub: true },
    { id: 3, code: 'CAT-IT-COMP', name: 'Computing & Laptops', parent: 'CAT-IT', desc: 'Laptops, workstations, server blades', active: true, isSub: true },
    { id: 4, code: 'CAT-LOG', name: 'Logistics & Warehousing', parent: '—', desc: 'Global freight forwarding and regional fulfilment', active: true, isSub: false },
    { id: 5, code: 'CAT-IND', name: 'Industrial Machinery & Tools', parent: '—', desc: 'Plant tooling, valves, robotics, and replacement parts', active: true, isSub: false },
    { id: 6, code: 'CAT-FAC', name: 'Facilities & Corporate Supplies', parent: '—', desc: 'Corporate facilities, furniture, and maintenance', active: true, isSub: false }
  ]);

  const items = [
    { sku: 'IT-NET-012', name: 'Cisco Catalyst 9300 48-Port Switch', category: 'Networking Hardware', uom: 'Unit', price: 3200.0, currency: 'USD' },
    { sku: 'IT-NB-001', name: 'Dell XPS Developer Workstation 32GB', category: 'Computing & Laptops', uom: 'Unit', price: 1850.0, currency: 'USD' },
    { sku: 'IND-VLV-22', name: 'Stainless Steel Flanged Ball Valve 2"', category: 'Industrial Machinery', uom: 'Piece', price: 310.0, currency: 'USD' },
    { sku: 'FAC-DS-04', name: 'Ergonomic Dual-Arm Monitor Mount', category: 'Facilities & Supplies', uom: 'Set', price: 145.0, currency: 'USD' }
  ];

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newName) return;
    const newCat = {
      id: categories.length + 1,
      code: newCode || `CAT-GEN-0${categories.length + 1}`,
      name: newName,
      parent: newParent || '—',
      desc: newDesc,
      active: true,
      isSub: !!newParent && newParent !== '—'
    };
    setCategories([...categories, newCat]);
    setIsModalOpen(false);
    setNewName('');
    setNewCode('');
    setNewParent('');
    setNewDesc('');
  };

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'Category') return !c.isSub;
    if (filterType === 'Subcategory') return c.isSub;
    return true;
  });

  return (
    <div>
      {/* Page Heading (Image 7) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Category & Item Master
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Configure taxonomy hierarchy, approved product specifications, and pricing validity
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
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
            + Add New Category
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'categories' ? '#432177' : '#ffffff',
            color: activeTab === 'categories' ? '#ffffff' : '#4b5563',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          Category Hierarchy ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'items' ? '#432177' : '#ffffff',
            color: activeTab === 'items' ? '#ffffff' : '#4b5563',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          Item Master Catalog ({items.length})
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          {/* Sub-filters (Image 7) */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e6e9', display: 'flex', gap: '8px' }}>
            {[
              { id: 'All', label: 'All', count: categories.length },
              { id: 'Category', label: 'Root Categories', count: categories.filter((c) => !c.isSub).length },
              { id: 'Subcategory', label: 'Subcategories', count: categories.filter((c) => c.isSub).length }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #e6e6e9',
                  backgroundColor: filterType === f.id ? '#f0e5ff' : '#ffffff',
                  color: filterType === f.id ? '#432177' : '#73767b',
                  fontSize: '12.5px',
                  fontWeight: filterType === f.id ? '700' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>({f.count})</span>
              </button>
            ))}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
              <tr>
                <th style={{ padding: '12px 18px' }}>ID / Code</th>
                <th style={{ padding: '12px 18px' }}>Active</th>
                <th style={{ padding: '12px 18px' }}>Category Name</th>
                <th style={{ padding: '12px 18px' }}>Parent Entity</th>
                <th style={{ padding: '12px 18px' }}>Description</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '600', color: '#432177' }}>{c.code}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ color: '#0f9d78', fontWeight: '700' }}>✓ Active</span>
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: '500' }}>
                    {c.isSub && <span style={{ color: '#aaa', marginRight: '6px' }}>↳</span>}
                    {c.name}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{c.parent}</td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{c.desc}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <button style={{ padding: '4px 8px', border: '1px solid #e6e6e9', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #e6e6e9', color: '#73767b' }}>
              <tr>
                <th style={{ padding: '12px 18px' }}>SKU Code</th>
                <th style={{ padding: '12px 18px' }}>Item Specification</th>
                <th style={{ padding: '12px 18px' }}>Category</th>
                <th style={{ padding: '12px 18px' }}>UOM</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Approved Price</th>
                <th style={{ padding: '12px 18px' }}>Currency</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '600', color: '#432177' }}>{it.sku}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '500' }}>{it.name}</td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{it.category}</td>
                  <td style={{ padding: '12px 18px' }}>{it.uom}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '600' }} className="font-mono-numbers">
                    ${it.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{it.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Category Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '480px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700' }}>Add New Taxonomy Category</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Category Code</label>
                <input
                  type="text"
                  placeholder="e.g. CAT-MRO"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MRO & Operating Supplies"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Parent Category (Optional)</label>
                <select
                  value={newParent}
                  onChange={(e) => setNewParent(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                >
                  <option value="">— None (Top Level) —</option>
                  <option value="CAT-IT">CAT-IT (IT & Telecom)</option>
                  <option value="CAT-IND">CAT-IND (Industrial Machinery)</option>
                  <option value="CAT-LOG">CAT-LOG (Logistics)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', height: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box', resize: 'none' }}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

