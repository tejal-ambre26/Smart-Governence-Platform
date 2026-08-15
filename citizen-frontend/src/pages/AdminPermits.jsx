import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { Search, ShieldCheck, CheckCircle2, Clock, XCircle, Download, Building2, HardHat, FileCheck, X } from 'lucide-react';

const STATUS_MAP = {
  SUBMITTED:             { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', darkBg: 'rgba(37,99,235,0.15)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  RESUBMITTED:           { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', darkBg: 'rgba(37,99,235,0.15)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  UNDER_VERIFICATION:    { bg: '#fef3c7', text: '#d97706', border: '#fde68a', darkBg: 'rgba(217,119,6,0.15)', darkText: '#fbbf24', darkBorder: 'rgba(245,158,11,0.3)' },
  VERIFIED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.15)', darkText: '#4ade80', darkBorder: 'rgba(34,197,94,0.3)' },
  APPROVED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.15)', darkText: '#4ade80', darkBorder: 'rgba(34,197,94,0.3)' },
  CERTIFICATE_GENERATED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', darkBg: 'rgba(16,185,129,0.15)', darkText: '#34d399', darkBorder: 'rgba(16,185,129,0.3)' },
  DOWNLOADED:            { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', darkBg: 'rgba(124,58,237,0.15)', darkText: '#a78bfa', darkBorder: 'rgba(139,92,246,0.3)' },
  REJECTED:              { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', darkBg: 'rgba(220,38,38,0.15)', darkText: '#f87171', darkBorder: 'rgba(239,68,68,0.3)' },
};

function StatusBadge({ status, isDark }) {
  const m = STATUS_MAP[status] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', darkBg: '#334155', darkText: '#94a3b8', darkBorder: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      background: isDark ? m.darkBg : m.bg,
      color: isDark ? m.darkText : m.text,
      border: `1px solid ${isDark ? m.darkBorder : m.border}`,
      fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? m.darkText : m.text }} />
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

function PermitTypeBadge({ type }) {
  const isConstruction = type?.toLowerCase().includes('construction');
  const bg = isConstruction ? '#fff7ed' : '#eff6ff';
  const color = isConstruction ? '#c2410c' : '#1d4ed8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 12,
      background: bg, color: color,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      {isConstruction ? <HardHat size={12} /> : <Building2 size={12} />}
      {type || 'Commercial'} Permit
    </span>
  );
}

function AdminPermits() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-management-service/api/services');
      const permits = (res.data || []).filter(a => a.serviceType === 'PERMIT_APPROVAL');
      setApplications(permits.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)));
    } catch (err) {
      console.error('Failed to fetch permits', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDownload = async (appId, appNum) => {
    try {
      const res = await api.get(`/service-management-service/api/services/download/${appId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${appNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Permit not ready or download failed.');
    }
  };

  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      return (
        (app.applicationNumber && app.applicationNumber.toLowerCase().includes(lower)) ||
        (app.applicantName && app.applicantName.toLowerCase().includes(lower))
      );
    }
    return true;
  });

  const totalCount = applications.length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED' || a.status === 'CERTIFICATE_GENERATED' || a.status === 'DOWNLOADED').length;
  const pendingCount = applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_VERIFICATION').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  if (loading && !applications.length) {
    return <AppShell title="Permit Management"><PageLoader message="Loading Permits..." /></AppShell>;
  }

  return (
    <AppShell title="Permit Management">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Permits Config"
          subtitle="Manage, inspect, and approve commercial and construction permit requests"
          icon={ShieldCheck}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={fetchApps}
          refreshing={loading}
        />

        {/* ── KPI Stat Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={ShieldCheck} label="Total Permits" value={totalCount} color="#f59e0b" bg="#fff3c7" isDark={isDark} />
          <KpiCard icon={CheckCircle2} label="Approved & Issued" value={approvedCount} subtitle={`${((approvedCount / (totalCount || 1)) * 100).toFixed(1)}% cleared`} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Clock} label="Pending Inspection" value={pendingCount} subtitle="Awaiting site verification" color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
          <KpiCard icon={XCircle} label="Rejected Permits" value={rejectedCount} color="#ef4444" bg="#fef2f2" isDark={isDark} />
        </div>

        {/* ── Section Card Container ───────────────────────────────────────── */}
        <SectionCard
          title="Permit Applications & Registry"
          subtitle="Filter and manage commercial and municipal permit approvals"
          icon={ShieldCheck}
          isDark={isDark}
          action={
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search Permit No or Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px 6px 32px', borderRadius: 8,
                    border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, fontSize: 13,
                    background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', outline: 'none'
                  }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{
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
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_VERIFICATION">Under Verification</option>
                <option value="APPROVED">Approved</option>
                <option value="CERTIFICATE_GENERATED">Generated</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          }
        >
          <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Permit No.</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicant</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Permit Type</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inspection Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied Date</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>{app.applicationNumber}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' }}>{app.applicantName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <PermitTypeBadge type={app.dynamicData?.permitType} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: isDark ? '#cbd5e1' : '#475569', fontWeight: 500 }}>{app.department || 'Urban Planning Department'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: app.status === 'UNDER_VERIFICATION' ? '#d97706' : (app.status === 'SUBMITTED' ? '#2563eb' : '#16a34a') }}>
                      {app.status === 'UNDER_VERIFICATION' ? '⏳ Pending Inspection' : (app.status === 'SUBMITTED' ? '📋 Awaiting Assignment' : '✓ Inspection Cleared')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={app.status} isDark={isDark} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Link to={`/services/officer/verify/${app.id}`} style={{ textDecoration: 'none' }}>
                          <button style={{
                            background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#0f172a', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, padding: '6px 12px',
                            borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                          }}>View</button>
                        </Link>
                        {(app.status === 'CERTIFICATE_GENERATED' || app.status === 'DOWNLOADED') && (
                          <button onClick={() => handleDownload(app.id, app.applicationNumber)} style={{
                            background: 'linear-gradient(135deg,#f59e0b,#ea580c)', color: '#fff', border: 'none', padding: '6px 12px',
                            borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                          }}>
                            <Download size={13} /> PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      <div style={{ marginBottom: 12 }}><Search size={40} color="#cbd5e1" /></div>
                      No permits found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <style>{`
        ${GLOBAL_STYLES}
      `}</style>
    </AppShell>
  );
}

export default AdminPermits;
