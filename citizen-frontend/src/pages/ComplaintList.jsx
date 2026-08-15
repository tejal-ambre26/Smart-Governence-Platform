import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { toast } from 'sonner';
import {
  ClipboardList, Plus, Search, Filter, Eye,
  AlertTriangle, CheckCircle2, Clock, Inbox,
  Building2, ChevronUp, ChevronDown, ChevronsUpDown,
  X, RefreshCw, User
} from 'lucide-react';

// ── colour maps ───────────────────────────────────────────────────────────────
const PRIORITY_MAP = {
  HIGH:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444', label: 'High' },
  MEDIUM: { bg: '#fff7ed', text: '#d97706', border: '#fed7aa', dot: '#f59e0b', label: 'Medium' },
  LOW:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e', label: 'Low' },
};

const STATUS_MAP = {
  NEW:        { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'NEW' },
  ASSIGNED:   { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'ASSIGNED' },
  IN_PROGRESS:{ bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'IN PROGRESS' },
  RESOLVED:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'RESOLVED' },
  CLOSED:     { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: 'CLOSED' },
  REJECTED:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'REJECTED' },
};

const SLA_MAP = {
  ON_TIME: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  OVERDUE: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  NEAR_DEADLINE: { bg: '#fff7ed', text: '#d97706', border: '#fed7aa' },
};

const DEPT_COLORS = [
  '#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#d97706','#4f46e5',
];
function deptColor(dept = '') {
  let h = 0;
  for (let i = 0; i < dept.length; i++) h = (h * 31 + dept.charCodeAt(i)) & 0xffff;
  return DEPT_COLORS[h % DEPT_COLORS.length];
}

function PriorityBadge({ priority }) {
  const m = PRIORITY_MAP[priority] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', dot: '#94a3b8', label: priority };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      background: m.bg, color: m.text,
      border: `1px solid ${m.border}`,
      fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label || priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_MAP[status] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      background: m.bg, color: m.text,
      border: `1px solid ${m.border}`,
      fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.text }} />
      {m.label || status || '—'}
    </span>
  );
}

function SlaBadge({ sla }) {
  if (!sla) return <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>—</span>;
  const m = SLA_MAP[sla] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 12px', borderRadius: 20,
      background: m.bg, color: m.text,
      border: `1px solid ${m.border}`,
      fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap'
    }}>
      {sla === 'OVERDUE' ? '⚠ ' : sla === 'ON_TIME' ? '✓ ' : '⏱ '}
      {sla.replace('_', ' ')}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 200px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}33`
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 700 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, fontWeight: 800, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const ALL = 'ALL';

export default function ComplaintList() {
  const [complaints, setComplaints]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [sortKey, setSortKey]         = useState('createdAt');
  const [sortDir, setSortDir]         = useState('desc');

  const roles     = keycloak.tokenParsed?.realm_access?.roles || [];
  const isCitizen = roles.includes('CITIZEN') || roles.includes('citizen');
  const citizenId = keycloak.tokenParsed?.sub;

  const load = () => {
    setLoading(true);
    api.get('/grievance-service/api/complaints')
      .then(r => {
        let data = r.data;
        if (isCitizen) data = data.filter(c => c.citizenId === citizenId);
        setComplaints(data);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load complaints.'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  // ── Sort handler ─────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Derived / filtered list ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...complaints];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.assignedOfficer?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== ALL)   list = list.filter(c => c.status === statusFilter);
    if (priorityFilter !== ALL) list = list.filter(c => c.priority === priorityFilter);

    list.sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (sortKey === 'createdAt') { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [complaints, search, statusFilter, priorityFilter, sortKey, sortDir]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total    = complaints.length;
  const newCount = complaints.filter(c => c.status === 'NEW').length;
  const overdueC = complaints.filter(c => c.slaStatus === 'OVERDUE').length;
  const resolved = complaints.filter(c => ['RESOLVED','CLOSED'].includes(c.status)).length;

  // ── Unique filter options ─────────────────────────────────────────────────
  const statuses   = [...new Set(complaints.map(c => c.status).filter(Boolean))];
  const priorities = [...new Set(complaints.map(c => c.priority).filter(Boolean))];

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronsUpDown size={14} style={{ opacity: 0.35, flexShrink: 0 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
      : <ChevronDown size={14} style={{ color: '#2563eb', flexShrink: 0 }} />;
  };

  const thStyle = (col) => ({
    padding: '16px 20px', fontSize: 12, fontWeight: 800, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
    cursor: 'pointer', userSelect: 'none', background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  });

  return (
    <AppShell title={isCitizen ? 'My Complaints' : 'All Complaints'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 40px 24px', width: '100%', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── Page Header (Executive Navy/Emerald Theme matching Civic Services) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#ffffff',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 36px rgba(15,23,42,0.25)', border: '1px solid #334155',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block', marginBottom: 8
            }}>
              GRIEVANCE REDRESSAL
            </span>
            <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {isCitizen ? 'My Complaints' : 'Global Complaints Directory'}
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: 540, fontSize: 14, lineHeight: 1.5 }}>
              {isCitizen ? 'Track real-time status of your filed grievances, officer SLA deadlines, and resolution logs.' : `Real-time registry of ${total} total complaints across all municipal departments.`}
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={load} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
              fontSize: 13, fontWeight: 700, color: '#ffffff', cursor: 'pointer', backdropFilter: 'blur(4px)'
            }}>
              <RefreshCw size={15} /> Refresh Directory
            </button>
            {isCitizen && (
              <Link to="/complaints/new" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', padding: '10px 22px',
                  borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
                }}>
                  <Plus size={16} /> Raise Complaint
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        {!isCitizen && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard label="Total Complaints" value={total}    icon={ClipboardList} color="#6366f1" />
            <StatCard label="New / Unassigned" value={newCount} icon={Clock}         color="#2563eb" sub={`${((newCount/total||0)*100).toFixed(0)}% of total`} />
            <StatCard label="SLA Overdue"       value={overdueC} icon={AlertTriangle} color="#dc2626" sub="Needs attention" />
            <StatCard label="Resolved / Closed" value={resolved} icon={CheckCircle2}  color="#16a34a" sub={`${((resolved/total||0)*100).toFixed(0)}% resolution rate`} />
          </div>
        )}

        {/* ── Main Card ────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 18,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
          overflow: 'hidden',
        }}>
          {/* ── Toolbar ── */}
          <div style={{
            padding: '18px 24px', borderBottom: '2px solid #f1f5f9',
            display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center',
            background: '#ffffff',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                placeholder="Search by title, department, officer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px 11px 42px',
                  border: '1px solid #cbd5e1', borderRadius: 12,
                  fontSize: 14, color: '#0f172a', background: '#f8fafc',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 42, padding: '0 16px', border: '1px solid #cbd5e1', borderRadius: 12,
                fontSize: 13, color: '#334155', background: '#fff', cursor: 'pointer',
                fontWeight: 700, outline: 'none'
              }}
            >
              <option value={ALL}>All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Priority filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{
                height: 42, padding: '0 16px', border: '1px solid #cbd5e1', borderRadius: 12,
                fontSize: 13, color: '#334155', background: '#fff', cursor: 'pointer',
                fontWeight: 700, outline: 'none'
              }}
            >
              <option value={ALL}>All Priorities</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 700 }}>
              Showing <strong>{filtered.length}</strong> of <strong>{total}</strong> complaints
            </div>
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', margin: '0 auto 14px',
                border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>Loading complaints directory…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No complaints found</div>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {search || statusFilter !== ALL || priorityFilter !== ALL
                  ? 'Try adjusting your search query or filters'
                  : isCitizen ? 'You haven\'t filed any complaints yet.' : 'No complaints registered in the system.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle('idx'), width: 60, textAlign: 'center', cursor: 'default' }}>#</th>
                    <th style={thStyle('title')} onClick={() => toggleSort('title')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Complaint Details <SortIcon col="title" />
                      </span>
                    </th>
                    <th style={thStyle('department')} onClick={() => toggleSort('department')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Department <SortIcon col="department" />
                      </span>
                    </th>
                    <th style={thStyle('priority')} onClick={() => toggleSort('priority')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Priority <SortIcon col="priority" />
                      </span>
                    </th>
                    <th style={thStyle('status')} onClick={() => toggleSort('status')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Status <SortIcon col="status" />
                      </span>
                    </th>
                    <th style={thStyle('slaStatus')}>SLA Status</th>
                    <th style={thStyle('assignedOfficer')}>Assigned Officer</th>
                    <th style={thStyle('createdAt')} onClick={() => toggleSort('createdAt')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Filed Date <SortIcon col="createdAt" />
                      </span>
                    </th>
                    <th style={{ ...thStyle('action'), cursor: 'default', width: 100, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const dc = deptColor(c.department);
                    const isOverdue = c.slaStatus === 'OVERDUE';
                    return (
                      <tr
                        key={c.complaintId}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* # Index */}
                        <td style={{ padding: '18px 20px', color: '#64748b', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
                          {i + 1}
                        </td>

                        {/* Title & Ref ID */}
                        <td style={{ padding: '18px 20px', maxWidth: 320 }}>
                          <Link
                            to={`/complaints/${c.complaintId}`}
                            style={{ fontWeight: 800, color: '#0f172a', textDecoration: 'none', fontSize: 15, display: 'block', lineHeight: 1.4, marginBottom: 4 }}
                          >
                            {c.title || 'Untitled Complaint'}
                          </Link>
                          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', fontWeight: 800, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                            #{c.complaintId?.toString().slice(-6) || '—'}
                          </span>
                        </td>

                        {/* Department Badge */}
                        <td style={{ padding: '18px 20px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 20,
                            background: dc + '15', color: dc,
                            border: `1px solid ${dc}33`,
                            fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
                          }}>
                            <Building2 size={13} />
                            {c.department || '—'}
                          </span>
                        </td>

                        {/* Priority Badge */}
                        <td style={{ padding: '18px 20px' }}>
                          <PriorityBadge priority={c.priority} />
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '18px 20px' }}>
                          <StatusBadge status={c.status} />
                        </td>

                        {/* SLA Badge */}
                        <td style={{ padding: '18px 20px' }}>
                          <SlaBadge sla={c.slaStatus} />
                        </td>

                        {/* Assigned Officer */}
                        <td style={{ padding: '18px 20px' }}>
                          {c.assignedOfficer ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${deptColor(c.assignedOfficer)}, #6366f1)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 12, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                              }}>
                                {c.assignedOfficer[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>{c.assignedOfficer}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', fontWeight: 700 }}>Unassigned</span>
                          )}
                        </td>

                        {/* Filed On Date */}
                        <td style={{ padding: '18px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          </div>
                          {isOverdue && (
                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, marginTop: 2 }}>⚠ SLA Breached</div>
                          )}
                        </td>

                        {/* View Action Button */}
                        <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                          <Link to={`/complaints/${c.complaintId}`} style={{ textDecoration: 'none' }}>
                            <button style={{
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                              border: 'none', padding: '8px 16px', borderRadius: 10,
                              fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                            }}>
                              <Eye size={14} /> View
                            </button>
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
