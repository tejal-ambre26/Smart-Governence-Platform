import { useEffect, useState, useMemo } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { toast } from 'sonner';
import {
  Users, Search, X, CheckCircle2, Clock, XCircle, FileText, Calendar, Building2, Layers
} from 'lucide-react';

function StatusBadge({ s }) {
  const isAct = ['COMPLETED', 'FUNDS_DISBURSED', 'APPROVED', 'ADMIN_APPROVED', 'RECOMMENDED'].includes(s);
  const isErr = ['REJECTED'].includes(s);
  const bg = isAct ? '#f0fdf4' : isErr ? '#fef2f2' : '#eff6ff';
  const text = isAct ? '#15803d' : isErr ? '#dc2626' : '#2563eb';
  const border = isAct ? '#bbf7d0' : isErr ? '#fecaca' : '#bfdbfe';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20,
      background: bg, color: text, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700,
    }}>
      {s?.replace(/_/g, ' ') || 'PENDING'}
    </span>
  );
}

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

export default function BeneficiaryManagement() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [schemeFilter, setSchemeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const [viewModal, setViewModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/welfare-service/api/welfare/beneficiaries/all'),
        api.get('/welfare-service/api/welfare/schemes'),
      ]);
      const schemeMap = {};
      (sRes.data || []).forEach(s => { schemeMap[s.schemeId] = s; });
      setSchemes(schemeMap);
      setBeneficiaries(bRes.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return beneficiaries.filter(b => {
      const matchSearch = !search || 
        b.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
        b.beneficiaryCode?.toLowerCase().includes(search.toLowerCase()) ||
        b.applicantAadhaar?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchScheme = schemeFilter === 'ALL' || b.schemeId === schemeFilter;
      const matchDept = deptFilter === 'ALL' || b.assignedDepartment === deptFilter;
      const matchDate = !dateFilter || (b.appliedDate && b.appliedDate.startsWith(dateFilter));
      
      return matchSearch && matchStatus && matchScheme && matchDept && matchDate;
    });
  }, [beneficiaries, search, statusFilter, schemeFilter, deptFilter, dateFilter]);

  const handleView = async (b) => {
    setViewModal(b);
    setHistoryLoading(true);
    setHistory([]);
    try {
      const res = await api.get(`/welfare-service/api/welfare/beneficiaries/${b.beneficiaryId}/history`);
      setHistory(res.data || []);
    } catch { }
    setHistoryLoading(false);
  };

  const pendingCount = beneficiaries.filter(b => ['SUBMITTED', 'ASSIGNED_TO_DEPARTMENT', 'UNDER_DEPARTMENT_VERIFICATION'].includes(b.status)).length;
  const approvedCount = beneficiaries.filter(b => ['ADMIN_APPROVED', 'APPROVED', 'COMPLETED', 'FUNDS_DISBURSED', 'RECOMMENDED'].includes(b.status)).length;
  const rejectedCount = beneficiaries.filter(b => b.status === 'REJECTED').length;
  const fundsDisbursedCount = beneficiaries.filter(b => ['COMPLETED', 'FUNDS_DISBURSED'].includes(b.status)).length;

  const schemeOptions = Object.values(schemes);
  const deptOptions = [...new Set(beneficiaries.map(b => b.assignedDepartment).filter(Boolean))];

  return (
    <AppShell title="Beneficiary Management">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Beneficiaries"
          subtitle="Master database of all welfare applications submitted by citizens"
          icon={Users}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={new Date()}
          onRefresh={load}
          refreshing={loading}
        />

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <KpiCard icon={FileText} label="Total Applications" value={beneficiaries.length} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Clock} label="Pending Verification" value={pendingCount} color="#f59e0b" bg="#fff7ed" isDark={isDark} />
          <KpiCard icon={CheckCircle2} label="Approved" value={approvedCount} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={XCircle} label="Rejected" value={rejectedCount} color="#ef4444" bg="#fef2f2" isDark={isDark} />
          <KpiCard icon={CheckCircle2} label="Funds Disbursed" value={fundsDisbursedCount} color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
        </div>

        {/* ── Main Section Card ────────────────────────────────────────────── */}
        <SectionCard
          title="Beneficiary Registry"
          subtitle="Filter and inspect individual beneficiary records across all schemes"
          icon={Users}
          isDark={isDark}
          action={
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  placeholder="Search ID, Name, Aadhaar..." value={search} onChange={e => setSearch(e.target.value)}
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
              
              <select value={schemeFilter} onChange={e => setSchemeFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: isDark ? '#f1f5f9' : '#374151', background: isDark ? '#1e293b' : '#fff', cursor: 'pointer', fontWeight: 500 }}>
                <option value="ALL">All Schemes</option>
                {schemeOptions.map(s => <option key={s.schemeId} value={s.schemeId}>{s.schemeName}</option>)}
              </select>

              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: isDark ? '#f1f5f9' : '#374151', background: isDark ? '#1e293b' : '#fff', cursor: 'pointer', fontWeight: 500 }}>
                <option value="ALL">All Departments</option>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: isDark ? '#f1f5f9' : '#374151', background: isDark ? '#1e293b' : '#fff', cursor: 'pointer', fontWeight: 500 }}>
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_DEPARTMENT_VERIFICATION">Pending Verification</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="ADMIN_APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, color: isDark ? '#f1f5f9' : '#374151', background: isDark ? '#1e293b' : '#fff', outline: 'none' }} />

              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                {filtered.length} shown
              </div>
            </div>
          }
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px',
                border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ color: '#64748b', fontSize: 14 }}>Loading applications…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#334155', marginBottom: 6 }}>No applications found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Beneficiary ID</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Scheme</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Assigned Officer</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Applied Date</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', width: 80 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.beneficiaryId} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#3b82f6', fontSize: 12 }}>
                        {b.beneficiaryCode}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 13 }}>
                        {b.applicantName}
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 500 }}>
                        {schemes[b.schemeId]?.schemeName || b.schemeId?.substring(0, 8)}
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 500 }}>
                        {b.assignedDepartment || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge s={b.status} />
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 500 }}>
                        {b.assignedOfficer || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 500 }}>
                        {b.appliedDate ? new Date(b.appliedDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => handleView(b)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                          background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, transition: 'background 0.2s'
                        }}>
                          <Search size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* View Details Modal */}
        {viewModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{
              background: '#f8fafc', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Beneficiary Details <StatusBadge s={viewModal.status} />
                  </h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>
                    {viewModal.beneficiaryCode}
                  </div>
                </div>
                <button onClick={() => setViewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Citizen Details */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Citizen Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Name</span><strong style={{ color: '#0f172a' }}>{viewModal.applicantName}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Aadhaar</span><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{viewModal.applicantAadhaar}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Age</span><strong style={{ color: '#0f172a' }}>{viewModal.age || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Annual Income</span><strong style={{ color: '#0f172a' }}>{viewModal.annualIncome ? `₹${Number(viewModal.annualIncome).toLocaleString('en-IN')}` : '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Family Status</span><strong style={{ color: '#0f172a' }}>{viewModal.familyStatus || '—'}</strong></div>
                  </div>
                </div>

                {/* Scheme Details */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={16} /> Scheme Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Scheme</span><strong style={{ color: '#0f172a' }}>{schemes[viewModal.schemeId]?.schemeName || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Department</span><strong style={{ color: '#0f172a' }}>{viewModal.assignedDepartment || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Applied Date</span><strong style={{ color: '#0f172a' }}>{viewModal.appliedDate ? new Date(viewModal.appliedDate).toLocaleDateString('en-IN') : '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Eligibility</span><strong style={{ color: '#0f172a' }}>{viewModal.eligibilityStatus || 'PENDING_CHECK'}</strong></div>
                  </div>
                </div>

                {/* Bank Details */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={16} /> Bank Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Account Name</span><strong style={{ color: '#0f172a' }}>{viewModal.accountHolderName || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Bank Name</span><strong style={{ color: '#0f172a' }}>{viewModal.bankName || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Account No.</span><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{viewModal.accountNumber || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>IFSC Code</span><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{viewModal.ifscCode || '—'}</strong></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Verified?</span><strong style={{ color: viewModal.bankVerified ? '#16a34a' : '#ef4444' }}>{viewModal.bankVerified ? 'Yes' : 'No'}</strong></div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={16} /> Uploaded Documents</h4>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {viewModal.documentsSubmitted || 'No documents submitted.'}
                  </div>
                </div>

                {/* Officer Recommendation */}
                {viewModal.recommendationStatus && (
                  <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, border: '1px solid #bbf7d0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#166534', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={16} /> Officer Recommendation</h4>
                    <div style={{ fontSize: 13, color: '#15803d' }}>
                      <strong>Officer:</strong> {viewModal.assignedOfficer || '—'}<br/>
                      <strong>Remarks:</strong> {viewModal.recommendationRemarks || '—'}
                    </div>
                  </div>
                )}

                {/* Audit History */}
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> Audit History & Timeline</h4>
                  {historyLoading ? (
                    <div style={{ fontSize: 13, color: '#64748b' }}>Loading history...</div>
                  ) : history.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#64748b' }}>No history found.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {history.map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                          <div style={{ width: 120, flexShrink: 0, color: '#64748b', fontWeight: 600 }}>
                            {new Date(h.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.actionTitle} <span style={{ color: '#94a3b8', fontWeight: 500 }}>by {h.actorName}</span></div>
                            <div style={{ color: '#475569', marginTop: 2 }}>{h.remarks}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              
              <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewModal(null)} style={{
                  padding: '8px 20px', borderRadius: 8, background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
