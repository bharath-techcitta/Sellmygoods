import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function IntegrationsErp() {
  const [erpData, setErpData] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    api.getErpConnection().then(setErpData).catch(console.error);
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await api.testErpConnection();
      setTestResult(res);
    } catch (e) {
      alert("Connection test failed: " + e.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      {/* Header (Image 13) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#242424' }}>
            Enterprise ERP Master Data & Integrations
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#73767b' }}>
            Synchronize chart of accounts, supplier bank masters, purchase orders, and payment confirmations
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Connection Form (Image 13) */}
        <div className="card-enterprise" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
              Connected ERP Gateway Connector
            </h3>
            <span style={{ backgroundColor: '#d1fae8', color: '#0f9d78', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600' }}>
              ● {erpData?.status || 'Connected'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#242424' }}>
                ERP Core System
              </label>
              <input
                type="text"
                readOnly
                value={erpData?.system_type || 'SAP S/4HANA Cloud'}
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', backgroundColor: '#fcfcfd', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#242424' }}>
                OData Gateway REST Endpoint URL
              </label>
              <input
                type="text"
                readOnly
                value={erpData?.api_url || 'https://api.s4hana.enterprise.corp/odata/v4/procurement'}
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', backgroundColor: '#fcfcfd', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Authentication Protocol</label>
                <input
                  type="text"
                  readOnly
                  value={erpData?.auth_method || 'OAuth 2.0 mTLS'}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #e6e6e9', backgroundColor: '#fcfcfd', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Client Certificate State</label>
                <div style={{ height: '38px', display: 'flex', alignItems: 'center', padding: '0 10px', backgroundColor: '#fcfcfd', border: '1px solid #e6e6e9', borderRadius: '6px', color: '#0f9d78', fontWeight: '600' }}>
                  ✓ Hardware Key Vault Enrolled
                </div>
              </div>
            </div>

            {/* Test Connection Buttons (Image 13) */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#432177',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {isTesting ? 'Testing Latency...' : 'Test Connection'}
              </button>
              <button
                onClick={() => alert("Settings saved without re-testing.")}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#fff',
                  color: '#242424',
                  border: '1px solid #e6e6e9',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Save Without Testing
              </button>
            </div>

            {testResult && (
              <div style={{ padding: '12px', backgroundColor: '#d1fae8', color: '#0f9d78', borderRadius: '6px', fontSize: '12.5px', marginTop: '10px' }}>
                <strong>✓ Handshake Verified:</strong> {testResult.message} ({testResult.latency_ms}ms roundtrip)
              </div>
            )}
          </div>
        </div>

        {/* Entity Mappings List */}
        <div className="card-enterprise" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '700' }}>
            Entity Synchronization Mappings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {erpData?.entity_mappings?.map((m, idx) => (
              <div key={idx} style={{ padding: '12px', border: '1px solid #ededf0', borderRadius: '6px', backgroundColor: '#fcfcfd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13.5px', color: '#242424' }}>{m.entity}</strong>
                  <span style={{ color: '#0f9d78', fontSize: '12px', fontWeight: '600' }}>● {m.sync_state}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#73767b', marginTop: '4px' }}>
                  Direction: {m.direction} • Sync interval: Every 15 mins
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

