import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../../components/StatusBadge';
const defaultSupplierData = {
  supplier: {
    id: 1,
    code: 'SUP_00101',
    legal_name: 'Precision Components Ltd',
    trading_name: 'Precision Components',
    type: 'Manufacturer',
    country: 'United States',
    email: 'contact@precisioncomponents.com',
    contact_no: '+1 (555) 234-8900',
    created_by: 'Marcus Vance',
    current_approver: 'Finance Director',
    license_no: 'US-MFG-99214-B',
    place_of_issue: 'Delaware, USA',
    status: 'Active',
    payment_terms: 'Net 30 Days',
    tax_identifier: 'US-94-8821940',
    performance_score: 94.5
  },
  contacts: [
    { id: 1, name: 'Elena Rostova', designation: 'Director of Strategic Accounts', email: 'elena.rostova@precisioncomponents.com', mobile: '+1 (555) 234-8901', is_primary: true, is_signatory: true },
    { id: 2, name: 'James Thorne', designation: 'Head of Engineering & QA', email: 'jthorne@precisioncomponents.com', mobile: '+1 (555) 234-8905', is_primary: false, is_signatory: false }
  ],
  banks: [
    { id: 1, bank_name: 'JPMorgan Chase Bank, N.A.', account_holder: 'Precision Components Ltd', account_number_masked: '••••••••9942', routing_swift: 'CHASUS33XXX', currency: 'USD', is_verified: true }
  ],
  documents: [
    { id: 1, title: 'ISO 9001:2015 Quality Management Certificate', doc_type: 'Certificate', file_name: 'ISO_9001_Precision_2026.pdf', status: 'Verified' },
    { id: 2, title: 'Certificate of Incorporation & Good Standing', doc_type: 'License', file_name: 'Cert_Incorporation_DE.pdf', status: 'Verified' },
    { id: 3, title: 'W-9 Federal Tax Certification', doc_type: 'Tax', file_name: 'W9_Signed_2026.pdf', status: 'Verified' }
  ],
  approval_history: [
    { step: 'Initial Registration', reviewer: 'Marcus Vance', decision: 'Verified', date: '2026-10-12', comment: 'All corporate filing docs verified.' },
    { step: 'Banking Audit', reviewer: 'David Chen', decision: 'Approved', date: '2026-10-15', comment: 'JPMorgan Chase routing confirmed via trusted vendor line.' }
  ]
};

export default function SupplierDetail({ supplierId = 1, onBack }) {
  const [data, setData] = useState(defaultSupplierData);
  const [activeTab, setActiveTab] = useState('profile'); // profile, ai
  const [lowerTab, setLowerTab] = useState('banking'); // banking, contacts, documents, performance

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getSupplierDetail(supplierId || 1);
        if (res && res.supplier) setData(res);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [supplierId]);

  const s = data.supplier;

  return (
    <div>
      {/* Top Navigation & Header (Images 2 & 4) */}
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
            ← Back to Directory
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#242424' }}>
                {s.legal_name}
              </h1>
              <StatusBadge status={s.status} />
            </div>
            <div style={{ fontSize: '13px', color: '#73767b', marginTop: '2px' }}>
              Code: <strong style={{ color: '#432177' }}>{s.code}</strong> • Type: {s.type} • Country: {s.country}
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'profile' ? 'ai' : 'profile')}
          style={{
            padding: '9px 16px',
            backgroundColor: '#f5f0ff',
            color: '#432177',
            border: '1px solid #d8b4fe',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {activeTab === 'profile' ? '✨ View AI Risk & Rank Analysis' : '📋 View Vendor Profile'}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div>
          {/* Overview Two Cards (Images 2, 5) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px', marginBottom: '20px' }}>
            {/* Company Info Card */}
            <div className="card-enterprise" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
                Company Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#73767b' }}>Trading Name:</span>
                  <div style={{ fontWeight: '500' }}>{s.trading_name}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Website:</span>
                  <div>
                    <a href={s.website || '#'} target="_blank" rel="noreferrer" style={{ color: '#432177' }}>
                      {s.website || 'https://www.vendor.example.com'}
                    </a>
                  </div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Operating Phone:</span>
                  <div style={{ fontWeight: '500' }}>{s.contact_no}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Central Email:</span>
                  <div style={{ fontWeight: '500' }}>{s.email}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#73767b' }}>Registered Address:</span>
                  <div style={{ fontWeight: '500' }}>{s.address || '104 Industrial Parkway, Suite 400'}, {s.city || 'Austin, TX'} {s.postal_code || '78701'}</div>
                </div>
              </div>
            </div>

            {/* Primary Contact Card */}
            <div className="card-enterprise" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
                Primary Relationship Contact
              </h3>
              {data.contacts && data.contacts[0] ? (
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Contact Name:</span>
                    <strong style={{ color: '#242424' }}>{data.contacts[0].name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Designation:</span>
                    <span>{data.contacts[0].designation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Email:</span>
                    <span style={{ color: '#432177' }}>{data.contacts[0].email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Direct Mobile:</span>
                    <span>{data.contacts[0].mobile}</span>
                  </div>
                  <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                    ✓ Authorized Contract Signatory
                  </div>
                </div>
              ) : (
                <div style={{ color: '#73767b', fontSize: '13px' }}>No primary contact registered.</div>
              )}
            </div>
          </div>

          {/* Business & Tax Details Cards (Image 5) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '20px' }}>
            <div className="card-enterprise" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
                Business Details & Incorporation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#73767b' }}>License Number:</span>
                  <div style={{ fontWeight: '500' }}>{s.license_no || 'US-MFG-99214-B'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Place of Issue:</span>
                  <div style={{ fontWeight: '500' }}>{s.place_of_issue || 'Delaware, USA'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>License Expiry:</span>
                  <div style={{ fontWeight: '500' }}>{s.expiry_date || '2029-12-31'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Entity Classification:</span>
                  <div style={{ fontWeight: '500' }}>{s.legal_entity_type || 'Corporation'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Annual Turnover:</span>
                  <div style={{ fontWeight: '500' }} className="font-mono-numbers">${(s.annual_turnover || 8500000).toLocaleString()} USD</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Standard Working Hours:</span>
                  <div style={{ fontWeight: '500' }}>{s.working_hours || 'Mon-Fri 09:00 - 18:00'}</div>
                </div>
              </div>
            </div>

            <div className="card-enterprise" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
                Tax & Commercial Terms
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#73767b' }}>Tax / PAN Identifier:</span>
                  <div style={{ fontWeight: '600', color: '#432177' }}>{s.tax_identifier || 'US-EIN-88492019'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Payment Terms:</span>
                  <div style={{ fontWeight: '600', color: '#0f9d78' }}>{s.payment_terms || 'Net 30 Days'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Transaction Currency:</span>
                  <div style={{ fontWeight: '500' }}>{s.transaction_currency || 'USD'}</div>
                </div>
                <div>
                  <span style={{ color: '#73767b' }}>Tax Exemption:</span>
                  <div style={{ fontWeight: '500' }}>Standard Domestic Rate (20%)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Tabs: Banking, Contacts, Documents, Performance (Image 6) */}
          <div className="card-enterprise" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e6e6e9', paddingBottom: '12px', marginBottom: '16px' }}>
              {[
                { id: 'banking', label: 'Banking Accounts & Settlement' },
                { id: 'documents', label: 'Compliance Documents & Certificates' },
                { id: 'performance', label: 'Performance & Quality SLA' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setLowerTab(t.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: lowerTab === t.id ? '#432177' : '#f3f4f6',
                    color: lowerTab === t.id ? '#ffffff' : '#4b5563',
                    fontSize: '13px',
                    fontWeight: lowerTab === t.id ? '600' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {lowerTab === 'banking' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {data.banks?.map((b) => (
                    <div key={b.id} style={{ border: '1px solid #e6e6e9', borderRadius: '8px', padding: '16px', backgroundColor: '#fcfcfd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#242424' }}>{b.bank_name}</strong>
                        <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          Verified Payee
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>Account Holder: <strong>{b.account_holder}</strong></div>
                        <div>Masked Account: <span className="font-mono-numbers">{b.account_number_masked}</span></div>
                        <div>SWIFT / BIC: <span className="font-mono-numbers">{b.routing_swift}</span></div>
                        <div>Currency: {b.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowerTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.documents?.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #ededf2', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#242424' }}>{doc.title}</div>
                      <div style={{ fontSize: '12px', color: '#73767b' }}>File: {doc.file_name} • Type: {doc.doc_type}</div>
                    </div>
                    <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      ✓ {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {lowerTab === 'performance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f9f9fb', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#73767b' }}>On-Time Delivery Rate</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f9d78', marginTop: '6px' }}>{s.on_time_delivery_rate}%</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f9f9fb', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#73767b' }}>Quality Acceptance Rate</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#432177', marginTop: '6px' }}>{s.quality_acceptance_rate}%</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f9f9fb', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#73767b' }}>Composite Risk Rating</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f9d78', marginTop: '6px' }}>{s.risk_level}</div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Approval History Card (Image 5) */}
          <div className="card-enterprise" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: '700', color: '#242424' }}>
              Onboarding & Compliance Approval History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.approval_history?.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', fontSize: '13px', padding: '10px', backgroundColor: '#fcfcfd', borderRadius: '6px', border: '1px solid #ededf0' }}>
                  <span style={{ color: '#0f9d78', fontWeight: '700' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{h.step} — {h.decision}</strong>
                      <span style={{ color: '#73767b' }}>{h.date}</span>
                    </div>
                    <div style={{ color: '#555', marginTop: '2px' }}>{h.comment} (Reviewer: {h.reviewer})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* AI Analysis Tab (Images 27 & 28) */
        <div className="card-enterprise" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#432177', margin: '0 0 12px 0' }}>
            ✨ AI Supplier Rank & Capacity Intelligence
          </h2>
          <p style={{ fontSize: '13.5px', color: '#555', lineHeight: '1.6' }}>
            Precision Components Ltd is recognized as a <strong>Tier-1 Preferred Manufacturer</strong> in North America.
            Machine learning telemetry across 18 completed Purchase Orders demonstrates a 98.2% on-time arrival index and 0% RMA return rate.
          </p>
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '8px', borderLeft: '4px solid #432177' }}>
            <div style={{ fontWeight: '700', color: '#432177', marginBottom: '6px' }}>
              Strategic Sourcing Recommendation
            </div>
            <div style={{ fontSize: '13px', color: '#444' }}>
              Eligible for direct PO conversions up to $50,000 without mandatory RFx bidding under corporate procurement policy POL-CAT-IT-04.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
