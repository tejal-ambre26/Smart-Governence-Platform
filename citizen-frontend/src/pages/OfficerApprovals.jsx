import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';

import { toast } from 'sonner';

function OfficerApprovals() {
  const [submittedApps, setSubmittedApps] = useState([]);
  const [verifiedApps, setVerifiedApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      const [submittedRes, verifiedRes] = await Promise.all([
        api.get('/service-management-service/api/services/pending'),
        api.get('/service-management-service/api/services/status/verified')
      ]);
      setSubmittedApps(submittedRes.data);
      setVerifiedApps(verifiedRes.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending service approvals. Is service-management-service running?');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleVerify = async (id, isApprove) => {
    const remarks = prompt(isApprove ? 'Verification remarks (pass to Step 2):' : 'Rejection reason:');
    if (remarks === null) return;

    try {
      await api.put(`/service-management-service/api/services/verify/${id}`, {
        verified: isApprove,
        remarks: remarks
      });
      toast.success(isApprove ? 'Application verified successfully!' : 'Application verification rejected');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to verify application');
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this application and issue the certificate?')) return;
    try {
      await api.put(`/service-management-service/api/services/approve/${id}`);
      toast.success('Application approved and certificate issued!');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await api.put(`/service-management-service/api/services/reject/${id}`, {
        reason: reason
      });
      toast.success('Application rejected');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to reject application');
    }
  };

  const formatType = (type) => type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const renderAppCard = (app, stage) => (
    <div key={app.id} className="card animate-fade-in" style={{ marginBottom: '14px', borderLeft: stage === 2 ? '4px solid var(--accent)' : '4px solid var(--primary)' }}>
      <div className="card-header">
        <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--primary)' }}>{formatType(app.serviceType)}</h3>
        <span className={`badge badge-${stage === 1 ? 'blue' : 'purple'}`}>
          {stage === 1 ? 'SUBMITTED' : 'VERIFIED'}
        </span>
      </div>
      <div className="card-body">
        <div className="detail-grid-2" style={{ marginBottom: '14px' }}>
          <div className="detail-field">
            <label>Applicant</label>
            <div className="detail-value">{app.applicantName}</div>
          </div>
          <div className="detail-field">
            <label>Aadhaar</label>
            <div className="detail-value">XXXX-XXXX-{app.aadhaarNumber?.slice(-4)}</div>
          </div>
          {stage === 2 && (
            <div className="detail-field">
              <label>Verified By</label>
              <div className="detail-value">{app.verifiedBy || 'Officer'}</div>
            </div>
          )}
          <div className="detail-field">
            <label>Application ID</label>
            <div className="detail-value"><code style={{ fontSize: '11px' }}>{app.applicationNumber}</code></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/services/officer/verify/${app.id}`)}
          >
            View Details
          </button>
          {stage === 1 ? (
            <>
              <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleVerify(app.id, true)}>
                ✓ Verify
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleVerify(app.id, false)}>
                Reject
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => handleApprove(app.id)}>
                Approve & Issue
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleReject(app.id)}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AppShell title="Service Approvals">
      <div className="welcome-banner">
        <div>
          <div className="welcome-label">Approval Workflow</div>
          <h2>Service Approvals Panel</h2>
          <p>Review, verify, and approve birth/death registrations, income certificates, and trade licenses.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {isLoading ? (
        <PageLoader message="Loading approvals..." />
      ) : (
        <div className="detail-grid-2 officer-detail-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Step 1: Pending Verification
              <span className="badge badge-yellow">{submittedApps.length}</span>
            </h2>
            {submittedApps.length === 0 ? (
              <div className="card">
                <EmptyState icon="🎉" title="All Clear" message="No applications awaiting verification." />
              </div>
            ) : (
              submittedApps.map(app => renderAppCard(app, 1))
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Step 2: Pending Final Approval
              <span className="badge badge-green">{verifiedApps.length}</span>
            </h2>
            {verifiedApps.length === 0 ? (
              <div className="card">
                <EmptyState icon="🎉" title="All Clear" message="No applications awaiting final approval." />
              </div>
            ) : (
              verifiedApps.map(app => renderAppCard(app, 2))
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default OfficerApprovals;
