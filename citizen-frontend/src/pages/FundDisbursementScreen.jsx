import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Send } from 'lucide-react';

export default function FundDisbursementScreen() {
  const navigate = useNavigate();
  const [approvedBeneficiaries, setApprovedBeneficiaries] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ amount: '', paymentMode: 'BANK_TRANSFER' });
  const [disbursing, setDisbursing] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/welfare-service/api/welfare/beneficiaries/pending'),
        api.get('/welfare-service/api/welfare/schemes'),
      ]);
      const map = {};
      (sRes.data || []).forEach(s => { map[s.schemeId] = s; });
      setSchemes(map);
      setApprovedBeneficiaries((bRes.data || []).filter(b => b.status === 'APPROVED'));
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDisburse = async () => {
    if (!selected) return;
    setDisbursing(true); setError(null);
    try {
      const res = await api.post('/welfare-service/api/welfare/disbursements', {
        beneficiaryId: selected.beneficiaryId,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
      });
      navigate('/welfare/payment-success', {
        state: {
          transactionId: res.data.transactionId,
          amount: form.amount,
          applicantName: selected.applicantName,
          schemeName: schemes[selected.schemeId]?.schemeName || 'N/A',
          paymentMode: form.paymentMode,
        }
      });
    } catch (e) {
      setError(e.response?.data?.error || 'Disbursement failed');
    } finally { setDisbursing(false); }
  };

  return (
    <AppShell title="Fund Disbursement (Finance Officer View)">
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Step indicator line */}
        <div style={{ padding: '12px 20px', borderRadius: '10px', backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe', fontSize: '13px', color: '#1d4ed8', fontWeight: 500 }}>
          Step 4 of 5: Fund Disbursement → Payment Successful
        </div>

        {loading ? <PageLoader message="Loading approved beneficiaries..." /> : (
          <>
            {/* Beneficiary Selection */}
            <SectionCard title="Select Approved Beneficiary">
              {approvedBeneficiaries.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px' }}>
                  No approved beneficiaries awaiting disbursement
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {approvedBeneficiaries.map(b => (
                    <label key={b.beneficiaryId} style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                      borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      border: `2px solid ${selected?.beneficiaryId === b.beneficiaryId ? '#6366f1' : 'var(--color-border)'}`,
                      backgroundColor: selected?.beneficiaryId === b.beneficiaryId ? '#ede9fe' : 'white'
                    }}>
                      <input type="radio" name="beneficiary" value={b.beneficiaryId}
                        checked={selected?.beneficiaryId === b.beneficiaryId}
                        onChange={() => setSelected(b)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.applicantName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {b.beneficiaryCode} · {schemes[b.schemeId]?.schemeName || 'Unknown Scheme'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Disbursement Form */}
            {selected && (
              <SectionCard title="Disbursement Details">
                {error && (
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Beneficiary
                  </label>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#ede9fe', fontWeight: 600, color: '#4c1d95' }}>
                    {selected.applicantName} ({selected.beneficiaryCode})
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Amount (₹) *
                  </label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Enter amount..."
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px',
                      fontSize: '16px', boxSizing: 'border-box', fontWeight: 600 }} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Payment Mode *
                  </label>
                  <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <button onClick={handleDisburse} disabled={disbursing || !form.amount}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', backgroundColor: '#16a34a',
                    color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    opacity: disbursing || !form.amount ? 0.7 : 1 }}>
                  <Send size={18} />
                  {disbursing ? 'Processing Disbursement…' : 'Disburse Funds →'}
                </button>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
