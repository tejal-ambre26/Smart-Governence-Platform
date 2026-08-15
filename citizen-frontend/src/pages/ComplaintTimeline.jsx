import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { FeedbackCard } from '../components/StarRating.jsx';

import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { AlertCircle, ClipboardList, UserCheck, RefreshCw, Calendar, ArrowLeft } from 'lucide-react';

function statusBadgeVariant(s) {
  if (s === 'NEW') return 'info';
  if (s === 'ASSIGNED') return 'info';
  if (s === 'IN_PROGRESS') return 'warning';
  if (s === 'RESOLVED') return 'success';
  if (s === 'CLOSED') return 'neutral';
  return 'neutral';
}

function dotColor(s) {
  if (s === 'RESOLVED' || s === 'CLOSED') return 'green';
  if (s === 'IN_PROGRESS') return 'orange';
  if (s === 'ASSIGNED') return '';
  return 'gray';
}

function ComplaintTimeline() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assignMsg, setAssignMsg] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('ADMIN');
  const isOfficer = roles.includes('OFFICER') || roles.includes('officer');

  const load = () => {
    api.get(`/grievance-service/api/complaints/${id}`)
      .then(r => setComplaint(r.data))
      .catch(() => setError('Could not load complaint details.'));
    api.get(`/grievance-service/api/complaints/${id}/history`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]));
  };

  useEffect(() => { load(); }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignMsg('');
    try {
      await api.put(`/grievance-service/api/complaints/${id}/assign?officerUsername=${encodeURIComponent(assignOfficer)}`);
      setAssignMsg('success:Officer assigned successfully.');
      setAssignOfficer('');
      load();
    } catch (err) {
      setAssignMsg('error:' + (err.response?.data?.message || 'Assignment failed.'));
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdateMsg('');
    try {
      await api.put(`/grievance-service/api/complaints/${id}/status?status=${newStatus}&remarks=${encodeURIComponent(remarks)}`);
      setUpdateMsg('success:Status updated successfully.');
      setRemarks('');
      setNewStatus('');
      load();
    } catch (err) {
      setUpdateMsg('error:' + (err.response?.data?.message || 'Update failed.'));
    }
  };

  if (error) return (
    <AppShell title="Complaint Detail">
      <div className="alert alert-error"><span>⚠️</span>{error}</div>
    </AppShell>
  );

  if (!complaint) return (
    <AppShell title="Complaint Detail">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner-sm" style={{ width: '32px', height: '32px', borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Complaint Detail">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <Link 
          to="/complaints" 
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20,
            background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)',
            border: '1px solid var(--border, #cbd5e1)', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.15s'
          }}
        >
          <ArrowLeft size={16} /> Back to Complaints
        </Link>
        <h1 style={{ color: 'var(--color-primary)', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 22, fontWeight: 800 }}>
          <ClipboardList size={26} color="#3b82f6" /> {complaint.title}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Complaint details */}
        <div>
          <SectionCard className="mb-4" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Complaint Details</h3>
              <Badge variant={statusBadgeVariant(complaint.status)} label={complaint.status} />
            </div>
            <div style={{ padding: '20px' }}>
              <table style={{ width: '100%', fontSize: '13.5px' }}>
                <tbody>
                  {[
                    ['Complaint ID', <code key="id" style={{ fontSize: '11px', backgroundColor: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>{complaint.complaintId}</code>],
                    ['Department', complaint.department],
                    ['Priority', <Badge key="pri" variant={complaint.priority === 'HIGH' ? 'danger' : complaint.priority === 'MEDIUM' ? 'warning' : 'info'} label={complaint.priority} />],
                    ['SLA Status', <Badge key="sla" variant={complaint.slaStatus === 'ON_TIME' ? 'success' : complaint.slaStatus === 'NEAR_DEADLINE' ? 'warning' : complaint.slaStatus === 'OVERDUE' ? 'danger' : 'neutral'} label={complaint.slaStatus || 'N/A'} />],
                    ['Assigned Officer', complaint.assignedOfficer || <span key="off" style={{ color: 'var(--color-text-muted)' }}>Not yet assigned</span>],
                    ['Filed On', complaint.createdAt ? new Date(complaint.createdAt).toLocaleString('en-IN') : '—'],
                    ['SLA Deadline', complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString('en-IN') : '—'],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 0', color: 'var(--color-text-secondary)', fontWeight: '500', width: '140px', verticalAlign: 'top' }}>{label}</td>
                      <td style={{ padding: '12px 0', fontWeight: '500' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', marginBottom: '8px' }}>Description</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-primary)' }}>{complaint.description}</div>
              </div>
            </div>
          </SectionCard>

          {/* Admin: Assign Officer */}
          {isAdmin && complaint.status === 'NEW' && (
            <SectionCard className="mb-4" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} /> Assign to Officer
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {assignMsg && (
                  <div className={`alert ${assignMsg.startsWith('success') ? 'alert-success' : 'alert-error'}`}>
                    {assignMsg.replace(/^(success|error):/, '')}
                  </div>
                )}
                <form onSubmit={handleAssign} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="form-control"
                    value={assignOfficer}
                    onChange={e => setAssignOfficer(e.target.value)}
                    placeholder="Officer username (e.g. jane_officer)"
                    required
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary">Assign</button>
                </form>
              </div>
            </SectionCard>
          )}

          {/* Officer/Admin: Update Status */}
          {(isAdmin || isOfficer) && !['CLOSED', 'RESOLVED'].includes(complaint.status) && (
            <SectionCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={20} /> Update Status
                </h3>
              </div>
              <div style={{ padding: '20px' }}>
                {updateMsg && (
                  <div className={`alert ${updateMsg.startsWith('success') ? 'alert-success' : 'alert-error'}`}>
                    {updateMsg.replace(/^(success|error):/, '')}
                  </div>
                )}
                <form onSubmit={handleStatusUpdate}>
                  <div className="form-group">
                    <label>Change Status to</label>
                    <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                      <option value="">— Select new status —</option>
                      {complaint.status === 'NEW' && <option value="ASSIGNED">ASSIGNED</option>}
                      {complaint.status === 'ASSIGNED' && <option value="IN_PROGRESS">IN_PROGRESS</option>}
                      {complaint.status === 'IN_PROGRESS' && <option value="RESOLVED">RESOLVED</option>}
                      {isAdmin && complaint.status === 'RESOLVED' && <option value="CLOSED">CLOSED</option>}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Remarks / Notes</label>
                    <input className="form-control" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a note about this status change (optional)" />
                  </div>
                  <button type="submit" className="btn btn-primary">Update Status</button>
                </form>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Timeline */}
        <SectionCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} /> Status Timeline
            </h3>
          </div>
          <div style={{ padding: '20px' }}>
            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0', textAlign: 'center' }}>
                <Calendar size={32} color="var(--color-text-secondary)" style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No history recorded yet.</p>
              </div>
            ) : (
              <div className="timeline">
                {history.map((h, i) => (
                  <div className="timeline-item" key={i}>
                    <div className={`timeline-dot ${dotColor(h.newStatus)}`} />
                    <div className="timeline-content">
                      <div className="tl-status">
                        {h.previousStatus ? `${h.previousStatus} → ` : ''}{h.newStatus}
                        {h.changedBy && <span style={{ fontWeight: '400', color: 'var(--color-text-secondary)' }}> by {h.changedBy}</span>}
                      </div>
                      <div className="tl-meta">
                        {h.changedAt ? new Date(h.changedAt).toLocaleString('en-IN') : ''}
                      </div>
                      {h.remarks && <div className="tl-remarks">"{h.remarks}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Feedback Widget for Resolved / Closed Complaints */}
        {complaint && (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') && (
          <div style={{ marginTop: 24 }}>
            <FeedbackCard
              referenceType="COMPLAINT"
              referenceId={complaint.complaintId || id}
              title="Rate your complaint resolution experience"
            />
          </div>
        )}
      </div>
    </AppShell>

  );
}

export default ComplaintTimeline;
