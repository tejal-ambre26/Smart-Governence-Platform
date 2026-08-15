import { useEffect, useState, useMemo } from 'react';
import api from '../api.js';
import { toast } from 'sonner';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { 
  Landmark, CheckCircle2, DollarSign, RefreshCw, ThumbsUp, XCircle, X, Check, Wallet, Banknote, Users
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

export default function AdminWelfareDashboard() {
  const [recommendedApps, setRecommendedApps] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      let rData = [];
      let allData = [];
      let sData = [];
      let bData = [];

      try {
        const [rRes, allRes, sRes, bRes] = await Promise.all([
          api.get('/welfare-service/api/welfare/beneficiaries/recommended'),
          api.get('/welfare-service/api/welfare/beneficiaries/all'),
          api.get('/welfare-service/api/welfare/schemes'),
          api.get('/welfare-service/api/welfare/budgets'),
        ]);
        rData = rRes.data || [];
        allData = allRes.data || [];
        sData = sRes.data || [];
        bData = bRes.data || [];
      } catch (err1) {
        try {
          const [rRes, allRes, sRes, bRes] = await Promise.all([
            api.get('/api/welfare/beneficiaries/recommended'),
            api.get('/api/welfare/beneficiaries/all'),
            api.get('/api/welfare/schemes'),
            api.get('/api/welfare/budgets'),
          ]);
          rData = rRes.data || [];
          allData = allRes.data || [];
          sData = sRes.data || [];
          bData = bRes.data || [];
        } catch (err2) {
          console.error("Admin dashboard fetch error:", err2);
        }
      }

      // If rData is empty, extract RECOMMENDED & ADMIN_APPROVED from allData
      if (!rData || rData.length === 0) {
        rData = allData.filter(b => ['RECOMMENDED', 'ADMIN_APPROVED'].includes(b.status));
      }

      setRecommendedApps(rData);
      setAllApps(allData);

      const sMap = {};
      sData.forEach(s => { sMap[s.schemeId] = s; });
      setSchemes(sMap);

      const bMap = {};
      bData.forEach(b => { bMap[b.department] = b; });
      setBudgets(bMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveFundRelease = async (beneficiary) => {
    setActioningId(beneficiary.beneficiaryId);
    try {
      const res = await api.post(`/welfare-service/api/welfare/beneficiaries/${beneficiary.beneficiaryId}/dbt`, {
        adminUsername: 'admin_user',
        remarks: 'Admin approved fund release and executed Direct Benefit Transfer (DBT).'
      });
      
      const updated = res.data;
      setReceiptData({
        beneficiaryCode: updated.beneficiaryCode || beneficiary.beneficiaryCode,
        applicantName: updated.applicantName || beneficiary.applicantName,
        schemeName: schemes[beneficiary.schemeId]?.schemeName || 'Welfare Scheme',
        department: updated.assignedDepartment || beneficiary.assignedDepartment || 'Government Department',
        amount: `₹${Number(updated.disbursedAmount || 25000).toLocaleString('en-IN')}`,
        txnId: updated.transactionId || ('DBT-2026-' + Math.floor(100000 + Math.random() * 900000)),
        bankName: updated.bankName || 'State Bank of India',
        accountNumberMasked: `**** **** ${(updated.accountNumber || '12345678901').slice(-4)}`,
        date: new Date().toLocaleDateString('en-IN')
      });

      loadData();
      toast.success(`Direct Benefit Transfer (DBT) released for ${beneficiary.beneficiaryCode}!`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Fund release failed');
    }
    setActioningId(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActioningId(rejectModal);
    try {
      await api.put(`/welfare-service/api/welfare/beneficiaries/${rejectModal}/reject`, { reason: rejectReason });
      toast.error('Application Rejected');
      setRejectModal(null); setRejectReason(''); loadData();
    } catch (e) { toast.error(e.response?.data?.error || 'Reject failed'); }
    setActioningId(null);
  };

  // Compute Top Cards Data
  const depts = ['Education Department', 'Social Welfare Department', 'Health Department'];
  let totalAllocated = 0;
  let totalSpent = 0;
  depts.forEach(dept => {
    const b = budgets[dept];
    totalAllocated += b ? Number(b.totalAllocated) : 10000000;
    totalSpent += b ? Number(b.totalSpent) : 250000;
  });
  const totalRemaining = totalAllocated - totalSpent;
  const totalApproved = allApps.filter(b => ['ADMIN_APPROVED', 'APPROVED', 'COMPLETED', 'FUNDS_DISBURSED'].includes(b.status)).length;
  const awaitingPayment = recommendedApps.length;

  return (
    <AppShell title="Budget & Fund Approval">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 60px 24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#ffffff',
          borderRadius: 20, padding: '24px 28px', border: '1px solid #059669',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Landmark size={24} color="#6ee7b7" />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff' }}>
                Budget & Fund Approval
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a7f3d0' }}>
              Approve recommended applications and manage department budgets.
            </p>
          </div>

          <button
            onClick={loadData}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Top Cards */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <StatCard label="Total Budget" value={`₹${totalAllocated.toLocaleString('en-IN')}`} icon={Wallet} color="#3b82f6" />
          <StatCard label="Remaining Budget" value={`₹${totalRemaining.toLocaleString('en-IN')}`} icon={Banknote} color="#10b981" />
          <StatCard label="Total Approved" value={totalApproved} icon={CheckCircle2} color="#065f46" />
          <StatCard label="Awaiting Payment" value={awaitingPayment} icon={Users} color="#f59e0b" />
        </div>

        {/* Budget Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Department Budgets</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Department</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Allocated</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Used</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(dept => {
                  const b = budgets[dept];
                  const allocated = b ? Number(b.totalAllocated) : 10000000;
                  const spent = b ? Number(b.totalSpent) : 250000;
                  const remaining = allocated - spent;
                  return (
                    <tr key={dept} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>{dept}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#475569' }}>₹{allocated.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#ef4444' }}>₹{spent.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: '#059669' }}>₹{remaining.toLocaleString('en-IN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Recommendations Queue */}
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
            Recommended Applications ({recommendedApps.length})
          </h3>

          {loading ? <PageLoader message="Loading recommended applications..." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recommendedApps.length === 0 && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
                  <p style={{ color: '#64748b', margin: 0, fontWeight: 600 }}>🎉 No applications pending Admin fund release.</p>
                </div>
              )}

              {recommendedApps.map(b => {
                const scheme = schemes[b.schemeId];
                return (
                  <SectionCard key={b.beneficiaryId} title="">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#059669', fontSize: 15, background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                            {b.beneficiaryCode}
                          </span>
                          <h3 style={{ margin: '6px 0 2px', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                            {b.applicantName}
                          </h3>
                        </div>
                        <Badge variant="success">RECOMMENDED BY OFFICER</Badge>
                      </div>

                      {/* Recommendation Notes & Citizen Data Table */}
                      <div style={{ overflowX: 'auto', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Beneficiary</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Scheme</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Department</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Amount</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Officer</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>{b.applicantName}</td>
                              <td style={{ padding: '12px 14px', color: '#475569' }}>{scheme?.schemeName || 'Welfare'}</td>
                              <td style={{ padding: '12px 14px', color: '#475569' }}>{b.assignedDepartment || '—'}</td>
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: '#059669' }}>₹{Number(scheme?.benefitAmount || 25000).toLocaleString('en-IN')}</td>
                              <td style={{ padding: '12px 14px', color: '#475569' }}>{b.assignedOfficer || 'System'}</td>
                              <td style={{ padding: '12px 14px', color: '#15803d', fontStyle: 'italic' }}>{b.recommendationRemarks || 'Eligible'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button
                          onClick={() => setRejectModal(b.beneficiaryId)}
                          disabled={actioningId === b.beneficiaryId}
                          style={{
                            padding: '12px 20px', borderRadius: 10, background: '#fff',
                            color: '#ef4444', border: '1.5px solid #fecaca', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8
                          }}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                        <button
                          onClick={() => handleApproveFundRelease(b)}
                          disabled={actioningId === b.beneficiaryId}
                          style={{
                            padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8
                          }}
                        >
                          <Check size={18} /> {actioningId === b.beneficiaryId ? 'Approving…' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400,
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Reject Application</h3>
                <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Rejection Reason *</label>
                  <select
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8,
                      fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none', marginBottom: 12
                    }}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Budget exhausted">Budget exhausted</option>
                    <option value="Duplicate detected">Duplicate detected</option>
                    <option value="Administrative issue">Administrative issue</option>
                  </select>
                  <textarea
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                    placeholder="Or enter custom reason..."
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8,
                      fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                <button onClick={() => setRejectModal(null)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff',
                  fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || actioningId} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444',
                  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: (!rejectReason.trim() || actioningId) ? 0.7 : 1
                }}>
                  {actioningId ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Confirmation Modal */}
        {receiptData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, maxWidth: 520, width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ background: '#059669', color: '#fff', padding: '20px 24px', textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#fff" style={{ margin: '0 auto 8px' }} />
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Application Approved</h3>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Fund Transfer queued & processed</div>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Beneficiary Code</span>
                  <strong style={{ fontFamily: 'monospace' }}>{receiptData.beneficiaryCode}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Applicant Name</span>
                  <strong>{receiptData.applicantName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Scheme Name</span>
                  <strong>{receiptData.schemeName}</strong>
                </div>
              </div>
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setReceiptData(null)}
                  style={{ padding: '10px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
