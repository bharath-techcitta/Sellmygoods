import React, { useState } from 'react';
import { api } from '../api';

export default function BuyerBidResponse({ eventId = 1, onBack, navigateTo }) {
  const [activeTab, setActiveTab] = useState('financial'); // technical, financial
  const [quantity, setQuantity] = useState(10);
  const [unitPrice, setUnitPrice] = useState(3200);
  const [unitDiscount, setUnitDiscount] = useState(200);
  const [taxRate, setTaxRate] = useState(0.20);
  const [promisedDate, setPromisedDate] = useState('2026-11-20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  // Live calculation adhering strictly to Section I1:
  const gross = quantity * unitPrice;
  const discount = quantity * Math.min(unitDiscount, unitPrice);
  const taxableBase = gross - discount;
  const tax = taxableBase * taxRate;
  const net = taxableBase + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.submitBidResponse({
        event_id: eventId || 1,
        quantity,
        unit_price: unitPrice,
        unit_discount: unitDiscount,
        tax_rate: taxRate,
        promised_delivery_date: promisedDate,
        technical_remarks: "Compliant with IEEE 802.3 and 5-year replacement hardware SLA."
      });
      setSubmittedReceipt(res.receipt);
    } catch (err) {
      alert(err.message || 'Error submitting response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
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
            ← Back to Invitations
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#242424' }}>
                RFQ_2026_091 — Enterprise Core Switch Quotation
              </h1>
              <span style={{ backgroundColor: '#fff0d8', color: '#b65c16', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                CLOSING IN 3 DAYS
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#73767b', marginTop: '2px' }}>
              Buyer: Marcus Vance • Entity: SellMyGoods Corp US • Destination: Central Logistics Hub, Dallas TX
            </div>
          </div>
        </div>
      </div>

      {submittedReceipt ? (
        /* Submission Success Receipt (Section E11, P06) */
        <div className="card-enterprise" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#242424' }}>
            Tender Response Submitted & Frozen for Evaluation
          </h2>
          <p style={{ fontSize: '13.5px', color: '#555', maxWidth: '540px', margin: '0 auto 20px auto' }}>
            Your quotation is cryptographically timestamped and sealed. The internal evaluation committee cannot inspect commercial numbers until official deadline close.
          </p>

          <div style={{ display: 'inline-block', backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '8px', padding: '16px 24px', textAlign: 'left', fontSize: '13px', marginBottom: '24px' }}>
            <div>Receipt Reference: <strong style={{ color: '#432177' }}>{submittedReceipt.receipt_id}</strong></div>
            <div style={{ marginTop: '4px' }}>Response Version: <strong>v{submittedReceipt.version} (Immutable)</strong></div>
            <div style={{ marginTop: '4px' }}>Canonical Evaluated Net Quote: <strong style={{ color: '#0f9d78' }}>${submittedReceipt.calculated_financials?.net?.toLocaleString()} USD</strong></div>
          </div>

          <div>
            <button
              onClick={() => navigateTo('buyer-bids')}
              style={{ padding: '10px 24px', backgroundColor: '#432177', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              Return to Tender List
            </button>
          </div>
        </div>
      ) : (
        /* Response Form (Images 22, 23) */
        <div className="card-enterprise" style={{ overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e6e6e9', backgroundColor: '#fcfcfd' }}>
            <button
              onClick={() => setActiveTab('technical')}
              style={{
                padding: '14px 24px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'technical' ? '3px solid #432177' : 'none',
                color: activeTab === 'technical' ? '#432177' : '#73767b',
                fontWeight: activeTab === 'technical' ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              1. Technical Questionnaire & SLA Commitments
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              style={{
                padding: '14px 24px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'financial' ? '3px solid #432177' : 'none',
                color: activeTab === 'financial' ? '#432177' : '#73767b',
                fontWeight: activeTab === 'financial' ? '700' : '500',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              2. Commercial Schedule & Unit Price Breakdown
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {activeTab === 'technical' ? (
              /* TAB 1: TECHNICAL (Image 22) */
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
                  Technical Specifications Compliance Checklist
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '14px', border: '1px solid #ededf0', borderRadius: '8px', backgroundColor: '#fcfcfd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13.5px' }}>IEEE 802.3 Ethernet & PoE+ 802.3at Compatibility</strong>
                      <span style={{ color: '#c32e3b', fontWeight: '700', fontSize: '11.5px' }}>Mandatory Pass/Fail</span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="radio" name="crit1" defaultChecked /> Fully Compliant (Full hardware support on all 48 ports)
                      </label>
                    </div>
                  </div>

                  <div style={{ padding: '14px', border: '1px solid #ededf0', borderRadius: '8px', backgroundColor: '#fcfcfd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13.5px' }}>Manufacturer Warranty & 24/7 Advance Replacement SLA</strong>
                      <span style={{ color: '#432177', fontWeight: '600', fontSize: '11.5px' }}>Scored Criterion (15 pts)</span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="radio" name="crit2" defaultChecked /> 5-Year Full Replacement SLA with 24-hour on-site courier dispatch
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: FINANCIAL (Image 23 & Section I1 formula) */
              <div>
                <div style={{ backgroundColor: '#f0e5ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '12.5px', color: '#432177' }}>
                  💡 <strong>Automated Price Calculation:</strong> Deducts unit discount and appends standard statutory taxes in real-time.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Requested Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Unit List Price ($ USD)</label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Unit Discount ($ USD)</label>
                    <input
                      type="number"
                      value={unitDiscount}
                      onChange={(e) => setUnitDiscount(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tax Regime / Rate</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                    >
                      <option value="0.20">20% Standard Domestic VAT/GST (Tax Exclusive)</option>
                      <option value="0.0">0% Tax Exempt / Export</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Promised Delivery Date</label>
                    <input
                      type="date"
                      value={promisedDate}
                      onChange={(e) => setPromisedDate(e.target.value)}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Calculation Preview Box (Image 23 & Section I1 formula) */}
                <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Gross Total (10 × $3,200.00):</span>
                    <span className="font-mono-numbers">${gross.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f9d78' }}>
                    <span>Total Discount Deduction (10 × $200.00):</span>
                    <span className="font-mono-numbers">−${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Taxable Net Base:</span>
                    <span className="font-mono-numbers">${taxableBase.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#73767b' }}>Applicable Tax (20%):</span>
                    <span className="font-mono-numbers">+${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div style={{ borderTop: '2px solid #e6e6e9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '17px', color: '#432177' }}>
                    <span>Final Evaluated Net Quotation:</span>
                    <span className="font-mono-numbers">${net.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e6e6e9', paddingTop: '18px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={onBack}
                style={{ padding: '9px 18px', borderRadius: '6px', border: '1px solid #e6e6e9', background: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 24px',
                  backgroundColor: '#432177',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Signing & Submitting...' : 'Sign & Submit Official Quote →'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

