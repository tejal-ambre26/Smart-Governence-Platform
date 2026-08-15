import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { 
  AlertCircle, FileBadge, Download, Printer, Eye, X, Search, 
  Building2, User, FileSignature, ShieldCheck, CheckCircle2, 
  Award, Sparkles, RefreshCw, Calendar, FileText, Baby,
  Landmark, Home, Store
} from 'lucide-react';

function formatServiceType(type) {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Distinct Certificate Type Theme Configurations ──────────────────────────────
const SERVICE_THEMES = {
  BIRTH_CERTIFICATE: {
    icon: Baby,
    titleColor: '#0369a1',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    badgeBorder: '#bae6fd',
    iconBg: '#f0f9ff',
    iconBorder: '#bae6fd',
    iconColor: '#0284c7',
    accentGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    btnShadow: '0 4px 14px rgba(2,132,199,0.35)'
  },
  DEATH_CERTIFICATE: {
    icon: FileText,
    titleColor: '#334155',
    badgeBg: '#f1f5f9',
    badgeText: '#334155',
    badgeBorder: '#cbd5e1',
    iconBg: '#f8fafc',
    iconBorder: '#cbd5e1',
    iconColor: '#475569',
    accentGradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    btnShadow: '0 4px 14px rgba(71,85,105,0.35)'
  },
  INCOME_CERTIFICATE: {
    icon: Landmark,
    titleColor: '#15803d',
    badgeBg: '#dcfce7',
    badgeText: '#15803d',
    badgeBorder: '#bbf7d0',
    iconBg: '#f0fdf4',
    iconBorder: '#bbf7d0',
    iconColor: '#16a34a',
    accentGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    btnShadow: '0 4px 14px rgba(22,163,74,0.35)'
  },
  RESIDENCE_CERTIFICATE: {
    icon: Home,
    titleColor: '#6d28d9',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    badgeBorder: '#ddd6fe',
    iconBg: '#f5f3ff',
    iconBorder: '#ddd6fe',
    iconColor: '#7c3aed',
    accentGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    btnShadow: '0 4px 14px rgba(124,58,237,0.35)'
  },
  TRADE_LICENSE: {
    icon: Store,
    titleColor: '#c2410c',
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    badgeBorder: '#fed7aa',
    iconBg: '#fff7ed',
    iconBorder: '#fed7aa',
    iconColor: '#ea580c',
    accentGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    btnShadow: '0 4px 14px rgba(234,88,12,0.35)'
  },
  PERMIT_APPROVAL: {
    icon: ShieldCheck,
    titleColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    badgeBorder: '#bfdbfe',
    iconBg: '#eff6ff',
    iconBorder: '#bfdbfe',
    iconColor: '#2563eb',
    accentGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    btnShadow: '0 4px 14px rgba(37,99,235,0.35)'
  }
};

function getTheme(serviceType) {
  return SERVICE_THEMES[serviceType] || {
    icon: Award,
    titleColor: '#15803d',
    badgeBg: '#dcfce7',
    badgeText: '#15803d',
    badgeBorder: '#bbf7d0',
    iconBg: '#f0fdf4',
    iconBorder: '#bbf7d0',
    iconColor: '#16a34a',
    accentGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    btnShadow: '0 4px 14px rgba(22,163,74,0.35)'
  };
}

function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewCertTitle, setPreviewCertTitle] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchCertificates = () => {
    setIsLoading(true);
    const citizenId = keycloak.tokenParsed?.sub;
    api.get(`/service-management-service/api/services/citizen/${citizenId}`)
      .then(r => {
        const approvedCerts = (r.data || []).filter(app => app.status === 'CERTIFICATE_GENERATED' || app.status === 'DOWNLOADED');
        setCertificates(approvedCerts);
        setIsLoading(false);
      })
      .catch(() => {
        api.get(`/api/services/citizen/${citizenId}`)
          .then(r2 => {
            const approvedCerts = (r2.data || []).filter(app => app.status === 'CERTIFICATE_GENERATED' || app.status === 'DOWNLOADED');
            setCertificates(approvedCerts);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setError('Could not load certificates. Is service-management-service running?');
            setIsLoading(false);
          });
      });
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownload = async (id, certNum, print = false) => {
    try {
      const response = await api.get(`/service-management-service/api/services/download/${id}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      if (print) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.print();
        };
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${certNum || 'certificate'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      fetchCertificates();
    } catch (err) {
      console.error(err);
      alert('Failed to process certificate document.');
    }
  };

  const handlePreview = async (id, certTitle) => {
    try {
      const response = await api.get(`/service-management-service/api/services/download/${id}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setPreviewCertTitle(certTitle);
      setShowPreviewModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load preview.');
    }
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Extract unique filter options
  const uniqueTypes = [...new Set(certificates.map(c => c.serviceType))];
  const uniqueDepts = [...new Set(certificates.map(c => c.department || 'Revenue Dept.'))];
  const uniqueYears = [...new Set(certificates.map(c => new Date(c.approvedDate || c.appliedDate).getFullYear().toString()))];

  // Stats
  const totalDownloads = useMemo(() => {
    return certificates.reduce((acc, c) => acc + (c.downloadCount || 0), 0);
  }, [certificates]);

  // Apply filters and search
  let processedCerts = certificates.filter(c => {
    const query = searchQuery.toLowerCase();
    const matchSearch = !query || 
      (c.applicantName && c.applicantName.toLowerCase().includes(query)) ||
      (c.certificateNumber && c.certificateNumber.toLowerCase().includes(query)) ||
      (c.applicationNumber && c.applicationNumber.toLowerCase().includes(query)) ||
      (c.serviceType && formatServiceType(c.serviceType).toLowerCase().includes(query));

    const matchType = filterType === 'all' || c.serviceType === filterType;
    const matchDept = filterDept === 'all' || (c.department || 'Revenue Dept.') === filterDept;
    const matchYear = filterYear === 'all' || new Date(c.approvedDate || c.appliedDate).getFullYear().toString() === filterYear;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchSearch && matchType && matchDept && matchYear && matchStatus;
  });

  // Apply sorting
  processedCerts = processedCerts.sort((a, b) => {
    const dateA = new Date(a.approvedDate || a.appliedDate).getTime();
    const dateB = new Date(b.approvedDate || b.appliedDate).getTime();
    
    switch (sortOrder) {
      case 'newest': return dateB - dateA;
      case 'oldest': return dateA - dateB;
      case 'downloads': return (b.downloadCount || 0) - (a.downloadCount || 0);
      case 'certNum': return (a.certificateNumber || '').localeCompare(b.certificateNumber || '');
      case 'appNum': return (a.applicationNumber || '').localeCompare(b.applicationNumber || '');
      default: return 0;
    }
  });

  return (
    <AppShell title="My Digital Certificates Vault">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Executive Top Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#ffffff',
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 36px rgba(15,23,42,0.25)', border: '1px solid #334155',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>
                ENCRYPTED CERTIFICATE VAULT
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              My Certificates
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: 600, fontSize: 14, lineHeight: 1.5 }}>
              Access, preview, download, and print your officially signed municipal certificates with verified digital signatures.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
            <button
              onClick={fetchCertificates}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)'
              }}
            >
              <RefreshCw size={15} /> Refresh Vault
            </button>
            <Link to="/services/apply" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none',
                padding: '10px 22px', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(16,185,129,0.4)'
              }}>
                + Apply New Certificate
              </button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* ── Summary Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { label: 'Certificates Issued', count: certificates.length, color: '#10b981', bg: '#f0fdf4', icon: Award },
            { label: 'Total Downloads', count: totalDownloads, color: '#3b82f6', bg: '#eff6ff', icon: Download },
            { label: 'Digital Signatures Verified', count: certificates.length, color: '#8b5cf6', bg: '#f5f3ff', icon: ShieldCheck },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{
                background: '#ffffff', borderRadius: 16, padding: '18px 22px',
                border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: m.color, marginTop: 4 }}>{m.count}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={m.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search & Filter Controls Bar ── */}
        <div style={{
          background: '#ffffff', borderRadius: 16, padding: '18px 22px',
          border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          display: 'flex', flexDirection: 'column', gap: 14
        }}>
          {/* Top Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Applicant Name, Certificate Number, Application Number, or Certificate Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '11px 16px 11px 44px', borderRadius: 12,
                border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none',
                background: '#f8fafc', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
              value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="downloads">Sort: Most Downloaded</option>
              <option value="certNum">Sort: Cert Number</option>
              <option value="appNum">Sort: App Number</option>
            </select>

            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Certificate Types</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{formatServiceType(t)}</option>)}
            </select>

            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
              value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="all">All Departments</option>
              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
              value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="CERTIFICATE_GENERATED">New / Ready</option>
              <option value="DOWNLOADED">Downloaded</option>
            </select>
          </div>
        </div>

        {/* Loader */}
        {isLoading && <PageLoader message="Loading your certificates vault..." />}

        {/* Empty State */}
        {!isLoading && certificates.length === 0 && (
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Award size={32} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Certificates Found</h3>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: '0 auto 20px' }}>
              No approved certificates are available in your vault yet. Submit an application to get started.
            </p>
            <Link to="/services/tracker" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                padding: '10px 22px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}>
                Track Applications
              </button>
            </Link>
          </div>
        )}

        {/* Search Mismatch State */}
        {!isLoading && certificates.length > 0 && processedCerts.length === 0 && (
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
          }}>
            <Search size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Certificate Matches</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>No certificates match your search query or filter selection.</p>
          </div>
        )}

        {/* ── Executive Certificate Cards (Two-Tier Luxury Card Layout) ── */}
        {!isLoading && processedCerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {processedCerts.map(app => {
              const isDownloaded = app.status === 'DOWNLOADED';
              const certTitle = formatServiceType(app.serviceType);
              const theme = getTheme(app.serviceType);
              const IconComp = theme.icon;

              return (
                <div key={app.id} style={{
                  background: '#ffffff', borderRadius: 18,
                  border: `1.5px solid ${theme.iconBorder}`,
                  boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
                  overflow: 'hidden', transition: 'all 0.2s ease'
                }}>
                  {/* ── Tier 1: Header & Action Buttons ── */}
                  <div style={{
                    padding: '20px 24px', display: 'flex', flexWrap: 'wrap',
                    alignItems: 'center', justifyContent: 'space-between', gap: 20,
                    background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
                  }}>
                    {/* Left: Theme Icon + Title + Cert No */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                        background: theme.iconBg, border: `1.5px solid ${theme.iconBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        <IconComp size={25} color={theme.iconColor} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: theme.titleColor, letterSpacing: '-0.01em' }}>
                            {certTitle}
                          </h3>
                          <span style={{
                            padding: '3px 12px', borderRadius: 20,
                            background: isDownloaded ? '#f5f3ff' : '#f0fdf4',
                            color: isDownloaded ? '#7c3aed' : '#15803d',
                            border: `1px solid ${isDownloaded ? '#ddd6fe' : '#bbf7d0'}`,
                            fontSize: 11, fontWeight: 800
                          }}>
                            {isDownloaded ? 'Downloaded' : 'Ready'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Certificate No:</span>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12, fontWeight: 800,
                            color: theme.badgeText, background: theme.badgeBg,
                            padding: '2px 8px', borderRadius: 6, border: `1px solid ${theme.badgeBorder}`
                          }}>{app.certificateNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Uniform Action Hub (Preview: Blue, Download PDF: Green Everywhere, Print: Slate) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Preview: Royal Blue Gradient */}
                      <button
                        onClick={() => handlePreview(app.id, certTitle)}
                        style={{
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff',
                          border: 'none', padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                        }}
                      >
                        <Eye size={15} color="#ffffff" /> Preview
                      </button>

                      {/* Download PDF: Uniform Emerald Green Gradient EVERYWHERE */}
                      <button
                        onClick={() => handleDownload(app.id, app.certificateNumber, false)}
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          color: '#ffffff',
                          border: 'none', padding: '9px 18px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(22,163,74,0.35)'
                        }}
                      >
                        <Download size={15} color="#ffffff" /> Download PDF
                      </button>

                      {/* Print: Slate Gray / Dark Indigo Gradient */}
                      <button
                        onClick={() => handleDownload(app.id, app.certificateNumber, true)}
                        style={{
                          background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: '#ffffff',
                          border: 'none', padding: '9px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 4px 14px rgba(71,85,105,0.3)'
                        }}
                      >
                        <Printer size={15} color="#ffffff" /> Print
                      </button>
                    </div>
                  </div>

                  {/* ── Tier 2: Embedded Spacious Metadata Strip (Strict Vertical Alignment) ── */}
                  <div style={{
                    padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                    display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 1.5fr 1fr', gap: 16, alignItems: 'center'
                  }}>
                    {/* Applicant Name */}
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Applicant Name
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="#64748b" /> {app.applicantName}
                      </div>
                    </div>

                    {/* Application Number */}
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Application No
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>
                        {app.applicationNumber}
                      </div>
                    </div>

                    {/* Issuing Department */}
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Issuing Department
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={13} color="#64748b" /> {app.department || 'Revenue Dept.'}
                      </div>
                    </div>

                    {/* Download Stats */}
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Downloads
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Download size={13} color="#2563eb" /> {app.downloadCount || 0} downloads
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      
      {/* ── Certificate Preview Modal ── */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.75)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 960, height: '85vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={20} color="#34d399" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  Certificate Viewer — {previewCertTitle}
                </h3>
              </div>
              <button
                onClick={closePreview}
                style={{
                  background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* PDF Viewer Body */}
            <div style={{ flex: 1, background: '#f8fafc' }}>
              {previewUrl ? (
                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Certificate Preview" />
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Certificate PDF...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default MyCertificates;
