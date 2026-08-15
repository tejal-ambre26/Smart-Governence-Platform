import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { Search, FileText, CheckCircle2, Clock, XCircle, Download, Award, Shield, FileCheck, X } from 'lucide-react';

const STATUS_MAP = {
  SUBMITTED:             { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', darkBg: 'rgba(37,99,235,0.15)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  RESUBMITTED:           { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', darkBg: 'rgba(37,99,235,0.15)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  UNDER_VERIFICATION:    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', darkBg: 'rgba(234,88,12,0.15)', darkText: '#fb923c', darkBorder: 'rgba(249,115,22,0.3)' },
  VERIFIED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.15)', darkText: '#4ade80', darkBorder: 'rgba(34,197,94,0.3)' },
  APPROVED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.15)', darkText: '#4ade80', darkBorder: 'rgba(34,197,94,0.3)' },
  CERTIFICATE_GENERATED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', darkBg: 'rgba(16,185,129,0.15)', darkText: '#34d399', darkBorder: 'rgba(16,185,129,0.3)' },
  DOWNLOADED:            { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', darkBg: 'rgba(124,58,237,0.15)', darkText: '#a78bfa', darkBorder: 'rgba(139,92,246,0.3)' },
  REJECTED:              { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', darkBg: 'rgba(220,38,38,0.15)', darkText: '#f87171', darkBorder: 'rgba(239,68,68,0.3)' },
};

const SERVICE_TYPE_COLOR = {
  BIRTH_CERTIFICATE:     { bg: '#e0f2fe', color: '#0284c7', label: '👶 Birth Cert' },
  DEATH_CERTIFICATE:     { bg: '#f1f5f9', color: '#475569', label: '📜 Death Cert' },
  INCOME_CERTIFICATE:    { bg: '#dcfce7', color: '#16a34a', label: '💰 Income Cert' },
  RESIDENCE_CERTIFICATE: { bg: '#f3e8ff', color: '#7c3aed', label: '🏠 Residence Cert' },
  TRADE_LICENSE:         { bg: '#ffedd5', color: '#ea580c', label: '🏢 Trade License' },
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

function ServiceBadge({ type }) {
  const s = SERVICE_TYPE_COLOR[type] || { bg: '#eff6ff', color: '#2563eb', label: type?.replace(/_/g, ' ') };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 12,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
    }}>
      {s.label}
    </span>
  );
}

function AdminCertificates() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-management-service/api/services');
      const certs = (res.data || []).filter(a => a.serviceType !== 'PERMIT_APPROVAL');
      setApplications(certs.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)));
    } catch (err) {
      console.error('Failed to fetch certificates', err);
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
      alert('Certificate not ready or download failed.');
    }
  };

  const filteredApps = applications.filter(app => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && app.serviceType !== typeFilter) return false;
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
  const generatedCount = applications.filter(a => a.status === 'CERTIFICATE_GENERATED' || a.status === 'DOWNLOADED').length;
  const pendingCount = applications.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_VERIFICATION').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;

  if (loading && !applications.length) {
    return <AppShell title="Certificate Management"><PageLoader message="Loading Certificates..." /></AppShell>;
  }

  return (
    <AppShell title="Certificate Management">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Certificates Setup"
          subtitle="Manage, verify, and issue citizen certificate applications across all municipal services"
          icon={FileCheck}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={fetchApps}
          refreshing={loading}
        />

        {/* ── KPI Stat Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={FileText} label="Total Applications" value={totalCount} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Award} label="Certificates Issued" value={generatedCount} subtitle={`${((generatedCount/ (totalCount || 1))*100).toFixed(1)}% success`} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Clock} label="Under Verification" value={pendingCount} subtitle="Requires officer review" color="#f59e0b" bg="#fff7ed" isDark={isDark} />
          <KpiCard icon={XCircle} label="Rejected Requests" value={rejectedCount} color="#ef4444" bg="#fef2f2" isDark={isDark} />
        </div>

        {/* ── Section Card Container ───────────────────────────────────────── */}
        <SectionCard
          title="Certificates Applications Directory"
          subtitle="Filter and inspect individual certificate requests"
          icon={FileText}
          isDark={isDark}
          action={
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 240 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search App No or Name..." 
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

              <select 
                style={{
                  padding: '6px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                  fontSize: 13, background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a', outline: 'none', fontWeight: 600
                }}
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                <option value="DEATH_CERTIFICATE">Death Certificate</option>
                <option value="INCOME_CERTIFICATE">Income Certificate</option>
                <option value="RESIDENCE_CERTIFICATE">Residence Certificate</option>
                <option value="TRADE_LICENSE">Trade License</option>
              </select>
            </div>
          }
        >
          <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>App No.</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicant</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Certificate Type</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied Date</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: '#3b82f6', fontWeight: 700 }}>{app.applicationNumber}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' }}>{app.applicantName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <ServiceBadge type={app.serviceType} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: isDark ? '#cbd5e1' : '#475569', fontWeight: 500 }}>{app.department || 'Health Department'}</td>
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
                            background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', padding: '6px 12px',
                            borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
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
                    <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      <div style={{ marginBottom: 12 }}><Search size={40} color="#cbd5e1" /></div>
                      No certificates found.
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

export default AdminCertificates;
