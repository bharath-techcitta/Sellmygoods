import React, { useState, useEffect, useCallback } from 'react';
import CompletionProgressRing from '../../components/CompletionProgressRing';
import {
  readSupplierWizardProgress,
  writeSupplierWizardProgress,
  completionFromHighestStep,
  TOTAL_STEPS,
} from '../../utils/supplierWizardProgress';

export default function SupplierRegistrationWizard({ onComplete }) {
  const saved = readSupplierWizardProgress();
  const [currentStep, setCurrentStep] = useState(saved.currentStep);
  const [highestStep, setHighestStep] = useState(saved.highestStep);
  const [completion, setCompletion] = useState(saved.completion);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);

  // Form states
  const [companyName, setCompanyName] = useState('Precision Components Ltd');
  const [tradingName, setTradingName] = useState('Precision Components');
  const [country, setCountry] = useState('United States');
  const [taxId, setTaxId] = useState('US-EIN-88492019');
  const [address, setAddress] = useState('104 Industrial Parkway, Suite 400');
  const [city, setCity] = useState('Austin, TX');
  const [phone, setPhone] = useState('+1 (555) 234-8900');
  const [email, setEmail] = useState('contact@precisioncomponents.com');

  const steps = [
    { num: 1, label: 'Company Details' },
    { num: 2, label: 'Contacts' },
    { num: 3, label: 'Scope of Supply' },
    { num: 4, label: 'Banking' },
    { num: 5, label: 'Certificates' },
    { num: 6, label: 'Review Profile' }
  ];

  const persistProgress = useCallback((step, high, submitted = false) => {
    const result = writeSupplierWizardProgress({
      currentStep: step,
      highestStep: high,
      submitted,
    });
    setCompletion(result.completion);
    return result;
  }, []);

  useEffect(() => {
    const c = completionFromHighestStep(highestStep, isSubmitted, currentStep);
    setCompletion(c);
  }, [currentStep, highestStep, isSubmitted]);

  const goToStep = (stepNum) => {
    const next = Math.max(1, Math.min(TOTAL_STEPS, stepNum));
    const high = Math.max(highestStep, next);
    setCurrentStep(next);
    setHighestStep(high);
    persistProgress(next, high, isSubmitted);
  };

  const handleNextStep = () => {
    const high = Math.max(highestStep, currentStep + 1);
    const nextStep = Math.min(TOTAL_STEPS, currentStep + 1);
    setHighestStep(high);
    setCurrentStep(nextStep);
    persistProgress(nextStep, high, isSubmitted);
  };

  const handlePrevStep = () => {
    if (currentStep <= 1) return;
    const nextStep = currentStep - 1;
    setCurrentStep(nextStep);
    persistProgress(nextStep, highestStep, isSubmitted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert("Please review and accept the Procurio Supplier Code of Conduct and Commercial Terms.");
      return;
    }
    const receiptId = "REC-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setSubmissionReceipt({
      receiptId,
      submittedAt: new Date().toISOString(),
      status: "Submitted to Internal Compliance Review"
    });
    setIsSubmitted(true);
    persistProgress(TOTAL_STEPS, TOTAL_STEPS, true);
    setCompletion(100);
  };

  return (
    <div>
      {/* Header (Images 8, 9) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Supplier Onboarding & Qualification Wizard
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Complete your legal profile, banking details, and statutory compliance certifications
          </p>
        </div>
        <CompletionProgressRing targetPercent={completion} size={48} durationMs={700} />
      </div>

      {/* Stepper Tabs Bar (Image 8) */}
      <div className="card-enterprise" style={{ padding: '12px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', overflowX: 'auto' }}>
        {steps.map((st) => {
          const isActive = currentStep === st.num;
          const isDone = currentStep > st.num;
          return (
            <div
              key={st.num}
              onClick={() => goToStep(st.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                opacity: isActive ? 1 : isDone ? 0.9 : 0.6
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#432177' : isDone ? '#0f9d78' : '#e6e6e9',
                  color: isActive || isDone ? '#ffffff' : '#73767b',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isDone ? '✓' : st.num}
              </div>
              <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: isActive ? '#432177' : '#242424' }}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {isSubmitted ? (
        /* Submission Success Receipt (Section E04, Image 9) */
        <div className="card-enterprise" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#d1fae8', color: '#0f9d78', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: '#242424' }}>
            Supplier Profile Submitted Successfully!
          </h2>
          <p style={{ fontSize: '13.5px', color: '#555', maxWidth: '520px', margin: '0 auto 20px auto' }}>
            Your registration case has been cryptographically signed and routed to the Internal Compliance Reviewer and Treasury Team for master verification.
          </p>

          <div style={{ display: 'inline-block', backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '8px', padding: '16px 24px', textAlign: 'left', fontSize: '13px', marginBottom: '24px' }}>
            <div>Receipt ID: <strong style={{ color: '#432177' }}>{submissionReceipt?.receiptId}</strong></div>
            <div style={{ marginTop: '4px' }}>Timestamp: {submissionReceipt?.submittedAt}</div>
            <div style={{ marginTop: '4px' }}>Status: <span style={{ color: '#0f9d78', fontWeight: '600' }}>Under Formal Review</span></div>
          </div>

          <div>
            <button
              onClick={() => onComplete && onComplete()}
              style={{ padding: '10px 24px', backgroundColor: '#432177', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              Return to Supplier Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Wizard Steps Content (Image 8 & 9) */
        <div className="card-enterprise" style={{ padding: '24px' }}>
          {currentStep === 1 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>1. Company Identity & Registration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Legal Entity Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Trading / Brand Name</label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Incorporation Country *</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Tax / EIN / PAN Identifier *</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Registered Street Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>City & Region *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Central Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>2. Key Organizational Contacts</h3>
              <div style={{ border: '1px solid #e6e6e9', borderRadius: '8px', padding: '16px', backgroundColor: '#fcfcfd', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14px', color: '#432177' }}>Primary Commercial Contact</strong>
                  <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                    Authorized Signatory
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div>Name: <strong>Elena Rostova</strong></div>
                  <div>Designation: <strong>Director of Strategic Accounts</strong></div>
                  <div>Email: <strong>elena.rostova@precisioncomponents.com</strong></div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>3. Scope of Supply & Capabilities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked /> IT & Telecom Equipment (Networking Hardware, Servers, Transceivers)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked /> Industrial Machinery & Replacement Tooling
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" /> Global Logistics & Freight Forwarding Services
                </label>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>4. Payee Banking Credentials</h3>
              <div style={{ border: '1px solid #e6e6e9', borderRadius: '8px', padding: '16px', backgroundColor: '#fcfcfd' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Bank Name</label>
                    <input type="text" readOnly value="JPMorgan Chase Bank, N.A." style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '4px', border: '1px solid #e6e6e9' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Account Holder Name</label>
                    <input type="text" readOnly value="Precision Components Ltd" style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '4px', border: '1px solid #e6e6e9' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Account Number</label>
                    <input type="text" readOnly value="••••••••9942" style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '4px', border: '1px solid #e6e6e9' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>SWIFT / Routing Code</label>
                    <input type="text" readOnly value="CHASUS33XXX" style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '4px', border: '1px solid #e6e6e9' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>5. Mandatory Statutory Certificates</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #ededf0', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#242424' }}>W-9 Federal Taxpayer Certification (Signed 2026)</strong>
                    <div style={{ fontSize: '11.5px', color: '#73767b' }}>File: W9_Signed_2026.pdf (Verified by OCR)</div>
                  </div>
                  <span style={{ color: '#0f9d78', fontWeight: '600' }}>✓ Uploaded & Scanned</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #ededf0', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#242424' }}>ISO 9001:2015 Quality Management Certificate</strong>
                    <div style={{ fontSize: '11.5px', color: '#73767b' }}>File: ISO_9001_Precision_2026.pdf (Valid until 2029)</div>
                  </div>
                  <span style={{ color: '#0f9d78', fontWeight: '600' }}>✓ Uploaded & Scanned</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            /* Review Profile Step (Image 9) */
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
                6. Profile Review & Final Submission
              </h3>
              <div style={{ backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '8px', padding: '18px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>Entity: <strong>{companyName}</strong></div>
                  <div>Country: <strong>{country}</strong></div>
                  <div>Tax Identifier: <strong style={{ color: '#432177' }}>{taxId}</strong></div>
                  <div>Primary Signatory: <strong>Elena Rostova</strong></div>
                  <div>Banking Settlement: <strong>JPMorgan Chase (••••9942)</strong></div>
                  <div>Documents: <strong>2 Verified Certificates</strong></div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#432177' }}
                  />
                  <span>
                    I confirm that the statutory details and banking credentials provided are authentic and binding. I acknowledge the <strong>Procurio Corporate Supplier Governance Code</strong>.
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#432177',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Submit Profile for Official Approval →
              </button>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e6e6e9', paddingTop: '16px', marginTop: '20px' }}>
            <button
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #e6e6e9',
                backgroundColor: '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1
              }}
            >
              ← Previous Step
            </button>
            {currentStep < 6 && (
              <button
                onClick={handleNextStep}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#432177',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

