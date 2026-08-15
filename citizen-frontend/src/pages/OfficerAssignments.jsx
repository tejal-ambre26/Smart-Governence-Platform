import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { toast } from 'sonner';
import {
  UserPlus, Search, Filter, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Building2, Eye, User, UserCheck, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';

const PRIORITY_MAP = {
  HIGH:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'High' },
  MEDIUM: { bg: '#fff7ed', text: '#d97706', border: '#fed7aa', label: 'Medium' },
  LOW:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Low' },
};

const STATUS_MAP = {
  NEW:         { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  ASSIGNED:    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  IN_PROGRESS: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  RESOLVED:    { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  CLOSED:      { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
  REJECTED:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

export default function OfficerAssignments() {
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  
  // Selected officer per complaint ID before committing assign
  const [selectedOfficers, setSelectedOfficers] = useState({});

  // Filters
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'all' | 'assigned'
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, offRes] = await Promise.all([
        api.get('/grievance-service/api/complaints'),
        api.get('/service-management-service/api/officers')
      ]);
      const compData = compRes.data || [];
      const offData = offRes.data || [];
      
      setComplaints(compData);
      setOfficers(offData);

      // Pre-fill selected officer map with existing assigned officers
      const initialMap = {};
      compData.forEach(c => {
        if (c.assignedOfficer) {
          initialMap[c.complaintId] = c.assignedOfficer;
        }
      });
      setSelectedOfficers(initialMap);

    } catch (err) {
      console.error('Failed to load assignment data:', err);
      toast.error('Failed to load complaints and officers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (complaintId) => {
    const officerUsername = selectedOfficers[complaintId];
    if (!officerUsername) {
      toast.warning('Please select an officer first.');
      return;
    }

    setAssigningId(complaintId);
    try {
      await api.put(`/grievance-service/api/complaints/${complaintId}/assign?officerUsername=${encodeURIComponent(officerUsername)}`);
      
      const assignedOffObj = officers.find(o => o.username === officerUsername);
      const officerDisplayName = assignedOffObj?.officerName || officerUsername;

      toast.success(`Assigned ${officerDisplayName} to Complaint #${complaintId}`);

      // Update local complaint state immediately
      setComplaints(prev => prev.map(c => {
        if (c.complaintId === complaintId) {
          return {
            ...c,
            assignedOfficer: officerUsername,
            status: c.status === 'NEW' ? 'ASSIGNED' : c.status
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Assignment error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign officer.');
    } finally {
      setAssigningId(null);
    }
  };

  // Compute metrics
  const unassignedCount = useMemo(() => complaints.filter(c => !c.assignedOfficer).length, [complaints]);
  const assignedCount = useMemo(() => complaints.filter(c => Boolean(c.assignedOfficer)).length, [complaints]);
  const overdueUnassignedCount = useMemo(() => complaints.filter(c => !c.assignedOfficer && c.slaStatus === 'OVERDUE').length, [complaints]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set(complaints.map(c => c.department).filter(Boolean));
    return Array.from(set);
  }, [complaints]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Tab filter
      if (activeTab === 'unassigned' && c.assignedOfficer) return false;
      if (activeTab === 'assigned' && !c.assignedOfficer) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesId = String(c.complaintId).includes(q);
        const matchesDept = c.department?.toLowerCase().includes(q);
        const matchesOfficer = c.assignedOfficer?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDept && !matchesOfficer) return false;
      }

      // Department filter
      if (deptFilter !== 'ALL' && c.department !== deptFilter) return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;

      return true;
    });
  }, [complaints, activeTab, search, deptFilter, priorityFilter]);

  if (loading) {
    return (
      <AppShell title="Officer Assignments">
        <div style={{ padding: 40, textAlign: 'center' }}>
          <PageLoader message="Loading complaints & officer dispatch directory..." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Officer Assignments">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 40px 24px', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ── Welcome Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #334155)',
        borderRadius: 16, padding: '24px 32px', color: '#ffffff',
        display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
        marginBottom: 30, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: '#fff', opacity: 0.03, borderRadius: '50%', filter: 'blur(30px)' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            background: 'rgba(255,255,255,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block'
          }}>
            OFFICER ASSIGNMENTS & DISPATCH
          </span>
          <h2 style={{ margin: '10px 0 6px', fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
            Officer Assignments & Workload Dispatch
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1', maxWidth: 620, fontSize: 14, lineHeight: 1.5 }}>
            Assign municipal field officers to incoming complaints, reassign active cases, and monitor departmental officer dispatch status in real-time.
          </p>
        </div>

        <button onClick={fetchData} style={{
          background: '#ffffff', color: '#0f172a', border: 'none', padding: '12px 20px',
          borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative', zIndex: 1
        }}>
          <RefreshCw size={15} /> Refresh Directory
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Unassigned Complaints</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{unassignedCount}</div>
          <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>Needs officer assignment</div>
        </div>

        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Assigned Cases</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{assignedCount}</div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Officers actively handling</div>
        </div>

        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Available Officers</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{officers.length}</div>
          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>Registered field officers</div>
        </div>

        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>SLA Overdue Unassigned</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{overdueUnassignedCount}</div>
          <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 4 }}>High-priority dispatch</div>
        </div>
      </div>

      {/* ── Tabs & Filter Controls ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        
        {/* Tab Buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '6px 16px 0', gap: 8 }}>
          <button
            onClick={() => setActiveTab('unassigned')}
            style={{
              padding: '12px 20px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'unassigned' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'unassigned' ? '3px solid #2563eb' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Clock size={16} /> Unassigned ({unassignedCount})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '12px 20px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'all' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'all' ? '3px solid #2563eb' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Building2 size={16} /> All Complaints ({complaints.length})
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '12px 20px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'assigned' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'assigned' ? '3px solid #2563eb' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <UserCheck size={16} /> Assigned ({assignedCount})
          </button>
        </div>

        {/* Toolbar Filters */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search complaint title, ID, or officer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
                border: '1px solid #cbd5e1', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', fontWeight: 600, color: '#334155' }}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', fontWeight: 600, color: '#334155' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Showing {filteredComplaints.length} cases
          </span>
        </div>

        {/* Table */}
        {filteredComplaints.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>No complaints matching criteria</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Try adjusting search query or tab filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Complaint ID & Title</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Priority</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Current Officer</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', minWidth: 260 }}>Assign Officer Action</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => {
                  const pri = PRIORITY_MAP[c.priority] || PRIORITY_MAP.LOW;
                  const sta = STATUS_MAP[c.status] || STATUS_MAP.NEW;
                  const currentOfficerVal = selectedOfficers[c.complaintId] || c.assignedOfficer || '';

                  // Recommend officers matching the department
                  const deptOfficers = officers.filter(o => !c.department || o.department?.toLowerCase() === c.department?.toLowerCase());
                  const otherOfficers = officers.filter(o => c.department && o.department?.toLowerCase() !== c.department?.toLowerCase());

                  return (
                    <tr key={c.complaintId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Title & ID */}
                      <td style={{ padding: '16px 20px', maxWidth: 260 }}>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>
                          #{c.complaintId}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.title || 'Untitled Complaint'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Filed on {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={13} color="#64748b" />
                          {c.department || 'General'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: pri.bg, color: pri.text, border: `1px solid ${pri.border}`, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {pri.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: sta.bg, color: sta.text, border: `1px solid ${sta.border}`, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {c.status}
                        </span>
                      </td>

                      {/* Current Officer */}
                      <td style={{ padding: '16px 20px' }}>
                        {c.assignedOfficer ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {c.assignedOfficer[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{c.assignedOfficer}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Inline Assign Action */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            value={currentOfficerVal}
                            onChange={e => setSelectedOfficers(prev => ({ ...prev, [c.complaintId]: e.target.value }))}
                            style={{
                              padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                              fontSize: 13, background: '#fff', fontWeight: 600, color: '#1e293b',
                              flex: 1
                            }}
                          >
                            <option value="">-- Select Officer --</option>
                            {deptOfficers.length > 0 && (
                              <optgroup label={`${c.department || 'Department'} Officers`}>
                                {deptOfficers.map(o => (
                                  <option key={o.username} value={o.username}>
                                    {o.officerName || o.username} ({o.department})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Other Officers">
                              {otherOfficers.map(o => (
                                <option key={o.username} value={o.username}>
                                  {o.officerName || o.username} ({o.department})
                                </option>
                              ))}
                            </optgroup>
                          </select>

                          <button
                            onClick={() => handleAssign(c.complaintId)}
                            disabled={assigningId === c.complaintId || !currentOfficerVal || currentOfficerVal === c.assignedOfficer}
                            style={{
                              background: currentOfficerVal === c.assignedOfficer ? '#e2e8f0' : '#2563eb',
                              color: currentOfficerVal === c.assignedOfficer ? '#94a3b8' : '#ffffff',
                              border: 'none', padding: '8px 16px', borderRadius: 8,
                              fontSize: 13, fontWeight: 700, cursor: currentOfficerVal === c.assignedOfficer ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                              boxShadow: currentOfficerVal === c.assignedOfficer ? 'none' : '0 2px 6px rgba(37,99,235,0.2)'
                            }}
                          >
                            <UserCheck size={14} />
                            {assigningId === c.complaintId ? 'Assigning...' : c.assignedOfficer ? 'Reassign' : 'Assign'}
                          </button>
                        </div>
                      </td>

                      {/* View Link */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <Link
                          to={`/complaints/${c.complaintId}`}
                          style={{
                            padding: '8px 12px', borderRadius: 8, background: '#f8fafc',
                            border: '1px solid #e2e8f0', color: '#334155', fontSize: 13,
                            fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </AppShell>
  );
}
