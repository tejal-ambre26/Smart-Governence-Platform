import { useEffect, useState, useMemo } from 'react';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { 
  DollarSign, CheckCircle2, CheckCircle, Download, FileText, Search, X, Hash, Calendar, Building2, Layers, Check, ShieldCheck, Landmark, Clock
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 22px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 160px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function FundDistribution() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [payments, setPayments] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [receiptModal, setReceiptModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/welfare-service/api/welfare/beneficiaries/all'),
        api.get('/welfare-service/api/welfare/schemes'),
      ]);
      const schemeMap = {};
      (sRes.data || []).forEach(s => { schemeMap[s.schemeId] = s.schemeName; });
      setSchemes(schemeMap);

      const dbtPayments = (bRes.data || []).filter(b => 
        ['COMPLETED', 'FUNDS_DISBURSED'].includes(b.status) && b.transactionId
      );
      setPayments(dbtPayments);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (p.transactionId?.toLowerCase().includes(term) ||
              p.beneficiaryCode?.toLowerCase().includes(term) ||
              p.applicantName?.toLowerCase().includes(term));
    });
  }, [payments, search]);

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.disbursedAmount || 0), 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.approvedDate && p.approvedDate.startsWith(todayStr)).length;

  return (
    <AppShell title="Payment History">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Payment History"
          subtitle="Track every Direct Benefit Transfer (DBT) transaction across all welfare schemes"
          icon={DollarSign}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={new Date()}
          onRefresh={load}
          refreshing={loading}
        />

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={FileText} label="Total Payments" value={payments.length} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Calendar} label="Today's Payments" value={todayPayments} color="#f59e0b" bg="#fff7ed" isDark={isDark} />
          <KpiCard icon={DollarSign} label="Total Amount Disbursed" value={`₹${totalAmount.toLocaleString('en-IN')}`} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Clock} label="Pending Payments" value={0} color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
        </div>

        {/* ── Main Section Card ────────────────────────────────────────────── */}
        <SectionCard
          title="Disbursement Audit Trail"
          subtitle="Verified Direct Benefit Transfer history and receipt generation"
          icon={DollarSign}
          isDark={isDark}
          action={
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search Transaction ID, Beneficiary ID or Name..." value={search} onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '6px 10px 6px 32px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8,
                  fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b', background: isDark ? '#1e293b' : '#fff', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                }}>
                  <X size={13} />
                </button>
              )}
            </div>
          }
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px',
                border: '3px solid #e2e8f0', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ color: '#64748b', fontSize: 14 }}>Loading payment history…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>💳</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#334155', marginBottom: 6 }}>No transactions found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Beneficiary</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Scheme</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', width: 120 }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.beneficiaryId} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6', fontSize: 13 }}>
                        {p.transactionId}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 13 }}>{p.applicantName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.beneficiaryCode}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 500 }}>
                        {schemes[p.schemeId] || p.schemeId?.substring(0, 8)}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#059669', fontSize: 14 }}>
                        ₹{Number(p.disbursedAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#64748b', fontSize: 13, fontWeight: 500 }}>
                        {p.approvedDate ? new Date(p.approvedDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20,
                          background: isDark ? '#064e3b' : '#f0fdf4', color: isDark ? '#6ee7b7' : '#15803d', border: `1px solid ${isDark ? '#047857' : '#bbf7d0'}`, fontSize: 11, fontWeight: 700,
                        }}>
                          {p.fundTransferStatus || 'SUCCESS'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => setReceiptModal(p)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                          background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, transition: 'background 0.2s'
                        }}>
                          <Download size={13} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Digital Receipt Modal */}
        {receiptModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{
              background: '#f8fafc', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
            }}>
              
              <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24, background: '#fff' }}>
                
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: 20 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', marginBottom: 12 }}>
                    <Landmark size={24} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Government of India</h2>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Direct Benefit Transfer Receipt</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Transaction ID</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: 14 }}>{receiptModal.transactionId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Beneficiary ID</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{receiptModal.beneficiaryCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Beneficiary Name</span>
                    <strong style={{ color: '#0f172a' }}>{receiptModal.applicantName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Scheme</span>
                    <strong style={{ color: '#0f172a', textAlign: 'right', maxWidth: 200 }}>{schemes[receiptModal.schemeId] || receiptModal.schemeId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Department</span>
                    <strong style={{ color: '#0f172a', textAlign: 'right', maxWidth: 200 }}>{receiptModal.assignedDepartment || 'Government Dept'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Approved By</span>
                    <strong style={{ color: '#0f172a' }}>Admin Official</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Amount</span>
                    <strong style={{ color: '#059669', fontSize: 16, fontWeight: 900 }}>₹{Number(receiptModal.disbursedAmount || 0).toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Transfer Date</span>
                    <strong style={{ color: '#0f172a' }}>{receiptModal.approvedDate ? new Date(receiptModal.approvedDate).toLocaleString('en-IN') : '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Reference Number</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{receiptModal.paymentReference || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Status</span>
                    <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} /> {receiptModal.fundTransferStatus || 'SUCCESS'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                  <ShieldCheck size={14} /> Digitally Generated Receipt
                </div>

              </div>
              
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button onClick={() => setReceiptModal(null)} style={{
                  padding: '10px 20px', borderRadius: 8, background: '#fff', color: '#475569', border: '1px solid #cbd5e1',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 1
                }}>Close</button>
                <button onClick={() => { window.print(); }} style={{
                  padding: '10px 20px', borderRadius: 8, background: '#1e293b', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <Download size={16} /> Save / Print
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
