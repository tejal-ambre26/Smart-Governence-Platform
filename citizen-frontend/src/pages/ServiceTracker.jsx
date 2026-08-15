import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { FeedbackCard } from '../components/StarRating.jsx';
import { toast } from 'sonner';
import { 
  Download, AlertTriangle, FileText, CheckCircle2, Upload, 
  Search, FileSignature, Clock, ChevronDown, ChevronUp, 
  Building2, User, UserCheck, ShieldCheck, Award, FileCheck, RefreshCw,
  Sparkles, Layers, ArrowRight, Baby, Landmark, Home, Store
} from 'lucide-react';

function formatServiceType(type) {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Distinct Certificate Type Theme Configurations ──────────────────────────────
const SERVICE_THEMES = {
  BIRTH_CERTIFICATE: {
    icon: Baby,
    titleColor: '#0369a1',
    iconBg: '#f0f9ff',
    iconBorder: '#bae6fd',
    iconColor: '#0284c7',
    cardBorder: '#cbd5e1'
  },
  DEATH_CERTIFICATE: {
    icon: FileText,
    titleColor: '#334155',
    iconBg: '#f8fafc',
    iconBorder: '#cbd5e1',
    iconColor: '#475569',
    cardBorder: '#cbd5e1'
  },
  INCOME_CERTIFICATE: {
    icon: Landmark,
    titleColor: '#15803d',
    iconBg: '#f0fdf4',
    iconBorder: '#bbf7d0',
    iconColor: '#16a34a',
    cardBorder: '#bbf7d0'
  },
  RESIDENCE_CERTIFICATE: {
    icon: Home,
    titleColor: '#6d28d9',
    iconBg: '#f5f3ff',
    iconBorder: '#ddd6fe',
    iconColor: '#7c3aed',
    cardBorder: '#ddd6fe'
  },
  TRADE_LICENSE: {
    icon: Store,
    titleColor: '#c2410c',
    iconBg: '#fff7ed',
    iconBorder: '#fed7aa',
    iconColor: '#ea580c',
    cardBorder: '#fed7aa'
  },
  PERMIT_APPROVAL: {
    icon: ShieldCheck,
    titleColor: '#1d4ed8',
    iconBg: '#eff6ff',
    iconBorder: '#bfdbfe',
    iconColor: '#2563eb',
    cardBorder: '#bfdbfe'
  }
};

function getTheme(serviceType) {
  return SERVICE_THEMES[serviceType] || {
    icon: FileSignature,
    titleColor: '#0f172a',
    iconBg: '#eff6ff',
    iconBorder: '#bfdbfe',
    iconColor: '#2563eb',
    cardBorder: '#e2e8f0'
  };
}

function getRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 172800) return 'Yesterday';
  
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Sleek Status Config ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
  SUBMITTED:             { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Submitted', badgeBg: '#dbeafe' },
  RESUBMITTED:           { bg: '#fefce8', text: '#854d0e', border: '#fde68a', label: 'Resubmitted', badgeBg: '#fef3c7' },
  UNDER_VERIFICATION:    { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: 'Under Review', badgeBg: '#ffedd5' },
  VERIFIED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Verified', badgeBg: '#dcfce7' },
  APPROVED:              { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Approved', badgeBg: '#dcfce7' },
  CERTIFICATE_GENERATED: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Ready to Download', badgeBg: '#dcfce7' },
  DOWNLOADED:            { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', label: 'Downloaded', badgeBg: '#ede9fe' },
  REJECTED:              { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Action Required', badgeBg: '#fee2e2' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 20,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.text }} />
      {cfg.label}
    </span>
  );
}

// ── Premium 4-Stage Stepper Component (Clean Executive Segmented Pill Bar) ────
function PremiumStepper({ status }) {
  const isRejected = status === 'REJECTED';

  const stages = [
    { key: 'SUBMITTED', label: 'Submitted', icon: FileText },
    { key: 'UNDER_VERIFICATION', label: 'Verification', icon: ShieldCheck },
    { key: 'APPROVED', label: 'Approval', icon: UserCheck },
    { key: 'CERTIFICATE_GENERATED', label: 'Issued', icon: Award }
  ];

  // Find active index
  let activeIndex = 0;
  if (['CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(status)) activeIndex = 3;
  else if (['APPROVED'].includes(status)) activeIndex = 2;
  else if (['UNDER_VERIFICATION', 'VERIFIED'].includes(status)) activeIndex = 1;
  else if (isRejected) activeIndex = 1;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
      width: '100%', padding: '6px', background: '#f8fafc',
      border: '1.5px solid #e2e8f0', borderRadius: 14,
      boxShadow: '0 2px 6px rgba(15,23,42,0.03)', boxSizing: 'border-box'
    }}>
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const isDone = i < activeIndex;
        const isCurrent = i === activeIndex;
        const isError = isRejected && isCurrent;

        let bg = '#ffffff';
        let color = '#94a3b8';
        let border = '1px solid #e2e8f0';
        let shadow = 'none';

        if (isError) {
          bg = '#fef2f2';
          color = '#dc2626';
          border = '1px solid #fecaca';
        } else if (isDone) {
          bg = '#f0fdf4';
          color = '#16a34a';
          border = '1px solid #bbf7d0';
        } else if (isCurrent) {
          bg = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
          color = '#ffffff';
          border = 'none';
          shadow = '0 4px 12px rgba(37,99,235,0.3)';
        }

        return (
          <div
            key={stage.key}
            style={{
              padding: '8px 10px', borderRadius: 10,
              background: bg, border: border, boxShadow: shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.25s ease'
            }}
          >
            {isError ? (
              <AlertTriangle size={14} color="#dc2626" />
            ) : isDone ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <Icon size={14} color={color} />
            )}
            <span style={{
              fontSize: 12, fontWeight: (isCurrent || isDone || isError) ? 800 : 600,
              color: color, letterSpacing: '0.01em', whiteSpace: 'nowrap'
            }}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ServiceTracker() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resubmitFile, setResubmitFile] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedAppId, setExpandedAppId] = useState(null);

  const fetchApplications = () => {
    setIsLoading(true);
    const citizenId = keycloak.tokenParsed?.sub;
    api.get(`/service-management-service/api/services/citizen/${citizenId}`)
      .then(r => {
        const sortedApps = (r.data || []).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
        setApplications(sortedApps);
        setIsLoading(false);
      })
      .catch(() => {
        api.get(`/api/services/citizen/${citizenId}`)
          .then(r2 => {
            const sortedApps = (r2.data || []).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
            setApplications(sortedApps);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setError('Could not load applications. Is service-management-service running?');
            setIsLoading(false);
          });
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDownload = async (id, certNum) => {
    try {
      const response = await api.get(`/service-management-service/api/services/download/${id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certNum || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Certificate PDF downloaded successfully!');
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error('Failed to download certificate PDF.');
    }
  };

  const handleResubmit = async (id, app) => {
    const file = resubmitFile[id];
    if (!file) {
      toast.error('No file selected. Please select a file to re-upload.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    let existingDocs = [];
    if (app.documentsSubmitted) {
      try {
        existingDocs = JSON.parse(app.documentsSubmitted);
      } catch (e) {
        existingDocs = app.documentsSubmitted.split(',').map(s => s.trim());
      }
    }
    if (!Array.isArray(existingDocs)) existingDocs = [];

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newDoc = {
        id: `Corrected Document`,
        name: file.name,
        type: file.type,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        data: dataUrl
      };
      existingDocs.push(newDoc);

      await api.put(`/service-management-service/api/services/resubmit/${id}`, {
        citizenId: app.citizenId,
        applicantName: app.applicantName,
        aadhaarNumber: app.aadhaarNumber,
        serviceType: app.serviceType,
        documentsSubmitted: JSON.stringify(existingDocs),
        dynamicData: app.dynamicData ? JSON.parse(app.dynamicData) : {}
      });
      toast.success('Application Resubmitted Successfully. Revised document uploaded.');
      setResubmitFile({ ...resubmitFile, [id]: null });
      fetchApplications();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to resubmit application.');
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'RESUBMITTED'].includes(a.status)).length;
    const ready = applications.filter(a => ['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(a.status)).length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;
    return { total, pending, ready, rejected };
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatServiceType(app.serviceType).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.certificateNumber && app.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesStatus = true;
      if (statusFilter === 'PENDING') matchesStatus = ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'RESUBMITTED'].includes(app.status);
      else if (statusFilter === 'READY') matchesStatus = ['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(app.status);
      else if (statusFilter === 'REJECTED') matchesStatus = app.status === 'REJECTED';
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  return (
    <AppShell title="Track Certificate Applications">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Top Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#ffffff',
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 36px rgba(15,23,42,0.25)', border: '1px solid #334155',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'rgba(99,102,241,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>
                CIVIC SERVICES TRACKER
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Track Certificate Applications
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: 600, fontSize: 14, lineHeight: 1.5 }}>
              Monitor application progress, review verification status, resubmit documents, and download official signed certificates.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12 }}>
            <button
              onClick={fetchApplications}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)'
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <Link to="/services/apply" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#ffffff', border: 'none',
                padding: '10px 22px', borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(59,130,246,0.4)'
              }}>
                + Apply New Certificate
              </button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* ── Summary Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Applications', count: stats.total, color: '#3b82f6', bg: '#eff6ff', icon: FileSignature },
            { label: 'In Progress', count: stats.pending, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
            { label: 'Ready / Issued', count: stats.ready, color: '#10b981', bg: '#f0fdf4', icon: Award },
            { label: 'Action Required', count: stats.rejected, color: '#ef4444', bg: '#fef2f2', icon: AlertTriangle },
          ].map(m => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{
                background: '#ffffff', borderRadius: 16, padding: '18px 22px',
                border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: m.color, marginTop: 4 }}>{m.count}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={m.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div style={{
          background: '#ffffff', borderRadius: 16, padding: '16px 20px',
          border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search application no, certificate type, or certificate number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10,
                border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none',
                background: '#f8fafc', transition: 'border-color 0.2s', boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All (${applications.length})` },
              { id: 'PENDING', label: `In Progress (${stats.pending})` },
              { id: 'READY', label: `Ready for Download (${stats.ready})` },
              { id: 'REJECTED', label: `Action Required (${stats.rejected})` },
            ].map(f => {
              const isSel = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    border: isSel ? 'none' : '1px solid #e2e8f0',
                    background: isSel ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#ffffff',
                    color: isSel ? '#ffffff' : '#475569', cursor: 'pointer',
                    boxShadow: isSel ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading && <PageLoader message="Loading your certificate applications..." />}

        {/* Empty State */}
        {!isLoading && filteredApps.length === 0 && (
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            padding: '60px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileSignature size={32} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Applications Found</h3>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: '0 auto 20px' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? "Try adjusting your search query or filter options."
                : "You haven't submitted any certificate applications yet."}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <Link to="/services/apply" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff',
                  padding: '10px 22px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}>
                  Apply New Certificate
                </button>
              </Link>
            )}
          </div>
        )}

        {/* ── Applications Cards List ── */}
        {!isLoading && filteredApps.map(app => {
          const isExpanded = expandedAppId === app.id;
          const canDownload = app.status === 'CERTIFICATE_GENERATED' || app.status === 'DOWNLOADED';
          const isRejected = app.status === 'REJECTED';
          const theme = getTheme(app.serviceType);
          const IconComp = theme.icon;

          return (
            <div
              key={app.id}
              style={{
                background: '#ffffff', borderRadius: 16,
                border: `1.5px solid ${isRejected ? '#fecaca' : canDownload ? '#bbf7d0' : theme.cardBorder}`,
                boxShadow: isExpanded ? '0 10px 30px rgba(15,23,42,0.1)' : '0 2px 8px rgba(15,23,42,0.04)',
                overflow: 'hidden', transition: 'all 0.2s ease'
              }}
            >
              {/* Top Card Row (Ultra-Sleek & Tight Layout) */}
              <div
                onClick={() => setExpandedAppId(prev => prev === app.id ? null : app.id)}
                style={{
                  padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
                }}
              >
                {/* Left Section: 280px Width (Distinct Theme Icon & Title Color) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 280, flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: canDownload ? '#f0fdf4' : isRejected ? '#fef2f2' : theme.iconBg,
                    border: `1px solid ${canDownload ? '#bbf7d0' : isRejected ? '#fecaca' : theme.iconBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <IconComp size={22} color={canDownload ? '#16a34a' : isRejected ? '#dc2626' : theme.iconColor} />
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: theme.titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatServiceType(app.serviceType)}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>
                        {app.applicationNumber}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                </div>

                {/* Middle Stepper Section: Elongated across middle space */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: 600, padding: '0 8px' }}>
                  <PremiumStepper status={app.status} />
                </div>

                {/* Right Action Hub: 280px Width */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 280, justifyContent: 'flex-end', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <User size={13} color="#64748b" /> {app.applicantName}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{getRelativeTime(app.appliedDate)}</div>
                  </div>

                  {canDownload && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(app.id, app.certificateNumber); }}
                      style={{
                        background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#ffffff',
                        border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 12px rgba(22,163,74,0.3)', flexShrink: 0
                      }}
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  )}
                  {isRejected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedAppId(app.id); }}
                      style={{
                        background: '#dc2626', color: '#ffffff',
                        border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                      }}
                    >
                      <Upload size={14} /> Re-upload
                    </button>
                  )}

                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                  }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* ── Expanded Details Panel ── */}
              {isExpanded && (
                <div style={{
                  padding: '24px', background: '#fafafa', borderTop: '1px solid #f1f5f9',
                  display: 'flex', flexDirection: 'column', gap: 20
                }}>
                  {/* Grid Metadata */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
                    background: '#ffffff', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Applicant Aadhaar</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        XXXX-XXXX-{app.aadhaarNumber?.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Submitted Date</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{app.department || 'Revenue Dept.'}</div>
                    </div>
                    {app.certificateNumber && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Certificate No.</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{app.certificateNumber}</div>
                      </div>
                    )}
                  </div>

                  {/* Rejection Handling Banner */}
                  {isRejected && (
                    <div style={{ padding: 18, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#b91c1c', marginBottom: 8 }}>
                        <AlertTriangle size={18} /> Action Required: Re-upload Corrected Document
                      </div>
                      <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 4 }}>
                        <strong>Rejection Reason:</strong> {app.rejectionReason}
                      </div>
                      {app.officerRemarks && (
                        <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 12 }}>
                          <strong>Officer Remarks:</strong> {app.officerRemarks}
                        </div>
                      )}

                      {/* File Upload Box */}
                      <div style={{ background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                        <Upload size={24} style={{ margin: '0 auto 8px', color: '#64748b' }} />
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Choose corrected document file (PDF / JPG / PNG max 5MB)</div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => setResubmitFile({ ...resubmitFile, [app.id]: e.target.files[0] })}
                          style={{ fontSize: 12, marginBottom: 12 }}
                        />
                        {resubmitFile[app.id] && (
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                              onClick={() => setResubmitFile({ ...resubmitFile, [app.id]: null })}
                              style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            >
                              Remove File
                            </button>
                            <button
                              onClick={() => handleResubmit(app.id, app)}
                              style={{ padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Resubmit Application
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ready for Download Banner */}
                  {canDownload && (
                    <div style={{ padding: 18, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#15803d', marginBottom: 2 }}>
                          <CheckCircle2 size={18} /> Official Signed Certificate Ready
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Digitally signed by Municipal Authority. Valid for official use nationwide.
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(app.id, app.certificateNumber)}
                        style={{
                          background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#ffffff',
                          border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, fontSize: 13,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                          boxShadow: '0 4px 14px rgba(22,163,74,0.35)'
                        }}
                      >
                        <Download size={16} /> Download Official PDF
                      </button>
                    </div>
                  )}

                  {/* Citizen Rating Feedback Component for Completed Items */}
                  {(canDownload || app.status === 'APPROVED') && (
                    <FeedbackCard
                      referenceType="CERTIFICATE_APPLICATION"
                      referenceId={app.id}
                      title="Rate your certificate application experience"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
