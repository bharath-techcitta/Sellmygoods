import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';

const defaultCategories = [
  { id: 1, code: 'CAT-IT', name: 'IT & Telecom Equipment', parent: '—', desc: 'Enterprise networking, computing, and peripheral devices', active: true, isSub: false },
  { id: 2, code: 'CAT-IT-NET', name: 'Networking Hardware', parent: 'CAT-IT', desc: 'Switches, routers, enterprise Wi-Fi', active: true, isSub: true },
];

const defaultItems = [
  { sku: 'IT-NET-012', name: 'Cisco Catalyst 9300 48-Port Switch', category: 'Networking Hardware', uom: 'Unit', price: 3200.0, currency: 'USD' },
];

function mapCategoryRow(c) {
  const parentLabel = c.parent_name && c.parent_name !== 'None (Top Level)' ? c.parent_name : '—';
  return {
    id: c.id,
    code: c.code,
    name: c.name,
    parent: parentLabel,
    parent_id: c.parent_id,
    desc: c.description || '',
    active: c.is_active !== false,
    isSub: Boolean(c.parent_id),
  };
}

export default function CategoryItemMaster() {
  const [activeTab, setActiveTab] = useState('categories');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  const [items, setItems] = useState(defaultItems);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, itms] = await Promise.all([api.getCategories(), api.getItems()]);
      if (Array.isArray(cats) && cats.length) setCategories(cats.map(mapCategoryRow));
      if (Array.isArray(itms) && itms.length) {
        setItems(
          itms.map((it) => ({
            sku: it.sku,
            name: it.name,
            category: it.category_name || 'General',
            uom: it.uom,
            price: it.unit_price,
            currency: it.currency || 'USD',
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newName) return;
    setSaving(true);
    try {
      await api.createCategory({
        code: newCode || undefined,
        name: newName,
        parent_id: newParentId ? Number(newParentId) : null,
        description: newDesc,
      });
      await loadData();
      setIsModalOpen(false);
      setNewName('');
      setNewCode('');
      setNewParentId('');
      setNewDesc('');
    } catch (err) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (filterType === 'Category') return !c.isSub;
    if (filterType === 'Subcategory') return c.isSub;
    return true;
  });

  const rootCategories = categories.filter((c) => !c.isSub);

  return (
    <div>
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
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '9px 16px',
              backgroundColor: '#432177',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Add New Category
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          type="button"
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
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          Category Hierarchy ({categories.length})
        </button>
        <button
          type="button"
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
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          Item Master Catalog ({items.length})
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e6e9', display: 'flex', gap: '8px' }}>
            {[
              { id: 'All', label: 'All', count: categories.length },
              { id: 'Category', label: 'Root Categories', count: categories.filter((c) => !c.isSub).length },
              { id: 'Subcategory', label: 'Subcategories', count: categories.filter((c) => c.isSub).length },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
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
                  gap: '6px',
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
              {items.map((it) => (
                <tr key={it.sku} style={{ borderBottom: '1px solid #f1f1f4' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '600', color: '#432177' }}>{it.sku}</td>
                  <td style={{ padding: '12px 18px', fontWeight: '500' }}>{it.name}</td>
                  <td style={{ padding: '12px 18px', color: '#73767b' }}>{it.category}</td>
                  <td style={{ padding: '12px 18px' }}>{it.uom}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: '600' }} className="font-mono-numbers">
                    ${Number(it.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 18px', color: '#555' }}>{it.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                >
                  <option value="">— None (Top Level) —</option>
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.name})
                    </option>
                  ))}
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
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e6e6e9', background: '#fff' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#432177', color: '#fff', fontWeight: '600' }}>
                  {saving ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
