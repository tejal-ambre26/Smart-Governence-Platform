import React, { useState, useEffect } from 'react';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { Search, Plus, Edit2, Trash2, UserCheck, Users, Mail, Phone, KeyRound, CheckCircle2, Award, Clock, ShieldCheck, X, Briefcase } from 'lucide-react';

function OfficerAvatar({ name }) {
  const initials = (name || 'Officer')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const colors = [
    { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #10b981, #047857)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #f59e0b, #b45309)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #06b6d4, #0e7490)', text: '#fff' },
  ];
  
  const charCode = (name || 'A').charCodeAt(0);
  const theme = colors[charCode % colors.length];

  return (
    <div style={{
      width: 38, height: 38, borderRadius: 12, background: theme.bg, color: theme.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {initials}
    </div>
  );
}

function AdminOfficers() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // App data for metrics
  const [complaints, setComplaints] = useState([]);
  const [applications, setApplications] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    officerName: '',
    username: '',
    department: 'Health Department',
    role: 'OFFICER',
    email: '',
    phoneNumber: '',
    password: '',
    status: 'Active'
  });

  const [toastMessage, setToastMessage] = useState('');

  const departments = [
    'Health Department',
    'Revenue Department',
    'Municipal Corporation',
    'Water Department',
    'Roads Department',
    'Electricity Department',
    'Sanitation Department',
    'Urban Planning Department'
  ];

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const [officersRes, compRes, appsRes] = await Promise.all([
        api.get('/service-management-service/api/officers'),
        api.get('/grievance-service/api/complaints?page=0&size=1000'),
        api.get('/service-management-service/api/services')
      ]);
      setOfficers(officersRes.data || []);
      setComplaints(compRes.data.content || compRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data for officers', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({
      id: null,
      officerName: '',
      username: '',
      department: 'Health Department',
      role: 'OFFICER',
      email: '',
      phoneNumber: '',
      password: '',
      status: 'Active'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (officer) => {
    setFormData({
      id: officer.id,
      officerName: officer.officerName || '',
      username: officer.username || '',
      department: officer.department || 'Health Department',
      role: officer.role || 'OFFICER',
      email: officer.email || '',
      phoneNumber: officer.phoneNumber || '',
      password: '',
      status: officer.status || 'Active'
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/service-management-service/api/officers/${formData.id}`, formData);
        setToastMessage('Officer updated successfully!');
      } else {
        await api.post('/service-management-service/api/officers', formData);
        setToastMessage(`Officer created successfully! Username: @${formData.username}`);
      }
      setShowModal(false);
      fetchOfficers();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error('Failed to save officer', err);
      alert('Failed to save officer. Check console for details.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this officer?")) {
      try {
        await api.delete(`/service-management-service/api/officers/${id}`);
        fetchOfficers();
      } catch (err) {
        console.error('Failed to delete officer', err);
      }
    }
  };

  const enrichedOfficers = officers.map(o => {
    const myComplaints = complaints.filter(c => c.assignedOfficer === o.username);
    const myApps = applications.filter(a => a.department === o.department);

    const totalAssigned = myComplaints.length + myApps.length;
    const resolvedComps = myComplaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;
    const resolvedApps = myApps.filter(a => ['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED', 'REJECTED'].includes(a.status)).length;
    
    const totalResolved = resolvedComps + resolvedApps;
    const resolutionRate = totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0;
    
    return { ...o, totalAssigned, totalResolved, resolutionRate };
  });

  const filteredOfficers = enrichedOfficers.filter(o => {
    const matchSearch = o.officerName?.toLowerCase().includes(search.toLowerCase()) || 
                        o.username?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || o.department === deptFilter;
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const totalOfficersCount = officers.length;
  const activeOfficersCount = officers.filter(o => o.status === 'Active').length;
  const totalAssignedCases = enrichedOfficers.reduce((sum, o) => sum + o.totalAssigned, 0);
  const avgResolutionRate = totalOfficersCount > 0 
    ? Math.round(enrichedOfficers.reduce((sum, o) => sum + o.resolutionRate, 0) / totalOfficersCount) 
    : 0;

  if (loading && !officers.length) {
    return <AppShell title="Manage Officers"><PageLoader message="Loading Officers..." /></AppShell>;
  }

  return (
    <AppShell title="Manage Officers">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100 }}>
            <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, boxShadow: '0 10px 25px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} /> {toastMessage}
            </div>
          </div>
        )}

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Manage Officers"
          subtitle="View, assign, and provision field officers across all municipal departments"
          icon={UserCheck}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={fetchOfficers}
          refreshing={loading}
          extraButtons={
            <button
              onClick={openAddModal}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff',
                border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59,130,246,0.35)', transition: 'transform 0.15s'
              }}
            >
              <Plus size={16} /> Add Officer
            </button>
          }
        />

        {/* ── KPI Stat Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={Users} label="Total Officers" value={totalOfficersCount} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={CheckCircle2} label="Active Field Officers" value={activeOfficersCount} subtitle={`${((activeOfficersCount / (totalOfficersCount || 1)) * 100).toFixed(0)}% available`} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Briefcase} label="Total Assigned Cases" value={totalAssignedCases} subtitle="Complaints & applications" color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
          <KpiCard icon={Award} label="Avg Resolution Rate" value={`${avgResolutionRate}%`} subtitle="Performance score" color="#f59e0b" bg="#fff7ed" isDark={isDark} />
        </div>

        {/* ── Section Card Container ───────────────────────────────────────── */}
        <SectionCard
          title="Field Officers Directory"
          subtitle="Filter and inspect individual municipal officer workloads"
          icon={UserCheck}
          isDark={isDark}
          action={
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 240 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search by name or @username..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px 6px 32px', borderRadius: 8,
                    border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, fontSize: 13,
                    background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', outline: 'none'
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

              <select 
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                  fontSize: 13, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', outline: 'none', fontWeight: 600
                }}
                value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select 
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                  fontSize: 13, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', outline: 'none', fontWeight: 600
                }}
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          }
        >
          <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Officer</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Username</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Details</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Workload</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolution %</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((o) => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <OfficerAvatar name={o.officerName} />
                        <div>
                          <div style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 14 }}>{o.officerName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>ID: {o.id?.toString().substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: '#3b82f6', fontWeight: 700 }}>
                      @{o.username}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: isDark ? '#cbd5e1' : '#475569', fontWeight: 500 }}>
                      {o.department}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                        background: o.role === 'SENIOR_OFFICER' ? (isDark ? 'rgba(124,58,237,0.15)' : '#f3e8ff') : (isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff'),
                        color: o.role === 'SENIOR_OFFICER' ? (isDark ? '#c084fc' : '#7c3aed') : (isDark ? '#60a5fa' : '#2563eb'),
                        border: `1px solid ${o.role === 'SENIOR_OFFICER' ? (isDark ? 'rgba(124,58,237,0.3)' : '#ddd6fe') : (isDark ? 'rgba(37,99,235,0.3)' : '#bfdbfe')}`
                      }}>
                        {o.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Mail size={12} color="#94a3b8" /> {o.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} color="#94a3b8" /> {o.phoneNumber}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 }}>{o.totalAssigned} Cases</div>
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{o.totalResolved} Resolved</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 6, width: 60, background: isDark ? '#334155' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: o.resolutionRate > 80 ? '#10b981' : o.resolutionRate > 40 ? '#f59e0b' : '#ef4444',
                            width: `${o.resolutionRate}%`, borderRadius: 3
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>{o.resolutionRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                        background: o.status === 'Active' ? (isDark ? 'rgba(16,185,129,0.15)' : '#f0fdf4') : (isDark ? '#334155' : '#f8fafc'),
                        color: o.status === 'Active' ? (isDark ? '#4ade80' : '#15803d') : '#94a3b8',
                        border: `1px solid ${o.status === 'Active' ? (isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0') : (isDark ? '#475569' : '#e2e8f0')}`
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.status === 'Active' ? '#10b981' : '#94a3b8' }} />
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => openEditModal(o)} title="Edit Officer" style={{
                          background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#38bdf8' : '#2563eb', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                          width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                        }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(o.id)} title="Delete Officer" style={{
                          background: isDark ? '#334155' : '#fef2f2', color: '#ef4444', border: `1px solid ${isDark ? '#475569' : '#fecaca'}`,
                          width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOfficers.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      No officers found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Add / Edit Officer Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? '#0f172a' : '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserCheck size={20} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  {isEditing ? 'Edit Officer' : 'Add New Field Officer'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Full Name *</label>
                  <input
                    required type="text" name="officerName" value={formData.officerName} onChange={handleInputChange}
                    placeholder="e.g. John Officer"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Username *</label>
                  <input
                    required type="text" name="username" value={formData.username} onChange={handleInputChange} disabled={isEditing}
                    placeholder="e.g. john"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isEditing ? (isDark ? '#334155' : '#f1f5f9') : (isDark ? '#0f172a' : '#fff'), color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Email Address *</label>
                  <input
                    required type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="e.g. john@muni.gov"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Phone Number *</label>
                  <input
                    required type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange}
                    placeholder="e.g. 9100000000"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Department *</label>
                  <select
                    required name="department" value={formData.department} onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none' }}
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Role *</label>
                  <select
                    required name="role" value={formData.role} onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none' }}
                  >
                    <option value="OFFICER">Officer</option>
                    <option value="SENIOR_OFFICER">Senior Officer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Status *</label>
                  <select
                    required name="status" value={formData.status} onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 6 }}>Keycloak Password</label>
                  <input
                    type="password" name="password" value={formData.password} onChange={handleInputChange}
                    placeholder="Custom password (or default: Password123)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Assigned for officer authentication.
                  </div>
                </div>
              )}

              {!isEditing && (
                <div style={{ padding: 14, borderRadius: 12, background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: isDark ? '#cbd5e1' : '#64748b' }}>
                  <KeyRound size={16} color="#3b82f6" />
                  <span>
                    New officer will be provisioned in <strong>Keycloak</strong> with <strong>{formData.role}</strong> role. They can log in immediately using @{formData.username || 'username'} or {formData.email || 'email'}.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                <button
                  type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, background: isDark ? '#334155' : '#fff', color: isDark ? '#f1f5f9' : '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                >
                  {isEditing ? 'Save Changes' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        ${GLOBAL_STYLES}
      `}</style>
    </AppShell>
  );
}

export default AdminOfficers;
