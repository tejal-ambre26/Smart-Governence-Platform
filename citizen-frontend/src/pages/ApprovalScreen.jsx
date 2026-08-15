import { useEffect, useState } from 'react';
import api from '../api.js';
import { toast } from 'sonner';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { ShieldCheck } from 'lucide-react';

function eligibilityVariant(s) {
  if (s === 'ELIGIBLE') return 'success';
  if (s === 'NOT_ELIGIBLE') return 'danger';
  return 'warning';
}

export default function ApprovalScreen() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [actioning, setActioning] = useState(null);
  const [rejectReason, setRejectReason] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      let bData = [];
      try {
        const rRes = await api.get('/welfare-service/api/welfare/beneficiaries/recommended');
        bData = rRes.data || [];
      } catch {
        const rRes = await api.get('/api/welfare/beneficiaries/recommended');
        bData = rRes.data || [];
      }

      if (!bData.length) {
        try {
          const pRes = await api.get('/welfare-service/api/welfare/beneficiaries/pending');
          bData = pRes.data || [];
        } catch {
          const pRes = await api.get('/api/welfare/beneficiaries/pending');
          bData = pRes.data || [];
        }
      }

      let sData = [];
      try {
        const sRes = await api.get('/welfare-service/api/welfare/schemes');
        sData = sRes.data || [];
      } catch {
        const sRes = await api.get('/api/welfare/schemes');
        sData = sRes.data || [];
      }

      const map = {};
      sData.forEach(s => { map[s.schemeId] = s; });
      setSchemes(map);

      // Include RECOMMENDED, UNDER_REVIEW, ADMIN_APPROVED, ASSIGNED_TO_DEPARTMENT
      const approvalStatuses = ['RECOMMENDED', 'UNDER_REVIEW', 'ADMIN_APPROVED', 'ASSIGNED_TO_DEPARTMENT', 'UNDER_DEPARTMENT_VERIFICATION'];
      setBeneficiaries(bData.filter(b => approvalStatuses.includes(b.status)));
    } catch (e) {
      console.error("ApprovalScreen load error:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setActioning(id + '_approve');
    try {
      await api.put(`/welfare-service/api/welfare/beneficiaries/${id}/approve`, { remarks: remarks[id] });
      toast.success('Application approved successfully!');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Approve failed'); }
    setActioning(null);
  };

  const handleReject = async (id) => {
    if (!rejectReason[id]?.trim()) { toast.error('Please enter a rejection reason'); return; }
    setActioning(id + '_reject');
    try {
      await api.put(`/welfare-service/api/welfare/beneficiaries/${id}/reject`, { reason: rejectReason[id] });
      toast.success('Application rejected.');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Reject failed'); }
    setActioning(null);
  };

  return (
    <AppShell title="Approval Screen (Approver View)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={18} color="#16a34a" />
          <span style={{ fontSize: '14px', color: '#15803d', fontWeight: 500 }}>
            Applications under review — approve or reject based on eligibility check and documents.
          </span>
        </div>

        {loading ? <PageLoader message="Loading applications for approval..." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {beneficiaries.length === 0 && (
              <SectionCard title="">
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px' }}>
                  No applications awaiting approval
                </p>
              </SectionCard>
            )}
            {beneficiaries.map(b => {
              const scheme = schemes[b.schemeId];
              const isEligible = b.eligibilityStatus === 'ELIGIBLE';
              return (
                <SectionCard key={b.beneficiaryId} title="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#6366f1', fontSize: '16px' }}>
                          {b.beneficiaryCode}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                          {b.applicantName}
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          Scheme: {scheme?.schemeName || b.schemeId?.substring(0, 8)}
                        </div>
                      </div>
                      <Badge variant={eligibilityVariant(b.eligibilityStatus)}>
                        Eligibility Check: {b.eligibilityStatus?.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Eligibility Check Detail */}
                    <div style={{ padding: '16px', borderRadius: '10px',
                      backgroundColor: isEligible ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${isEligible ? '#bbf7d0' : '#fed7aa'}` }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: isEligible ? '#15803d' : '#c2410c', marginBottom: '8px' }}>
                        {isEligible ? '✓ Automated Eligibility Check PASSED' : '⚠ Automated Eligibility Check FAILED — Review Manually'}
                      </div>
                      {scheme && (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          <div>Scheme criteria: {scheme.eligibilityCriteria || 'N/A'}</div>
                          {scheme.minIncome && <div>Income range: ₹{Number(scheme.minIncome).toLocaleString('en-IN')} – ₹{Number(scheme.maxIncome || 0).toLocaleString('en-IN')} | Applicant: ₹{b.annualIncome ? Number(b.annualIncome).toLocaleString('en-IN') : 'N/A'}</div>}
                          {scheme.minAge && <div>Age range: {scheme.minAge}–{scheme.maxAge || '∞'} | Applicant: {b.age ?? 'N/A'}</div>}
                        </div>
                      )}
                    </div>

                    {/* Approver remarks */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        Approver Comments
                      </label>
                      <textarea rows={2} value={remarks[b.beneficiaryId] || ''}
                        onChange={e => setRemarks(r => ({ ...r, [b.beneficiaryId]: e.target.value }))}
                        placeholder="Add approval remarks..."
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px',
                          fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>
                        Rejection Reason (required if rejecting)
                      </label>
                      <textarea rows={2} value={rejectReason[b.beneficiaryId] || ''}
                        onChange={e => setRejectReason(r => ({ ...r, [b.beneficiaryId]: e.target.value }))}
                        placeholder="Enter rejection reason here..."
                        style={{ width: '100%', padding: '10px', border: '1px solid #fecaca', borderRadius: '8px',
                          fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleReject(b.beneficiaryId)}
                        disabled={actioning === b.beneficiaryId + '_reject'}
                        style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#fef2f2',
                          color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontWeight: 600 }}>
                        {actioning === b.beneficiaryId + '_reject' ? 'Rejecting…' : 'Reject Application'}
                      </button>
                      <button onClick={() => handleApprove(b.beneficiaryId)}
                        disabled={actioning === b.beneficiaryId + '_approve'}
                        style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#16a34a',
                          color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        {actioning === b.beneficiaryId + '_approve' ? 'Approving…' : '✓ Approve Application'}
                      </button>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
