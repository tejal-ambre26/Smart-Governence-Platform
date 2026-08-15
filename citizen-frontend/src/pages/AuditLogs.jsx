import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { BookOpen, X, FileJson, Server } from 'lucide-react';
import { ReportPageHeader, KpiCard, SectionCard, ErrorBanner, Skeleton, EmptyState, GLOBAL_STYLES } from '../components/ReportShared.jsx';

const EVENT_CATEGORY = {
  'complaint-status-changed': { color: '#f97316', bg: '#fff7ed', label: 'Complaint Status' },
  'complaint-escalated':      { color: '#ef4444', bg: '#fef2f2', label: 'Escalation' },
  'application-submitted':    { color: '#3b82f6', bg: '#eff6ff', label: 'Application' },
  'document-verified':        { color: '#8b5cf6', bg: '#f5f3ff', label: 'Document' },
  'certificate-approved':     { color: '#10b981', bg: '#f0fdf4', label: 'Certificate' },
  'certificate-generated':    { color: '#059669', bg: '#ecfdf5', label: 'Certificate' },
  'beneficiary-applied':      { color: '#06b6d4', bg: '#ecfeff', label: 'Welfare' },
  'beneficiary-approved':     { color: '#16a34a', bg: '#f0fdf4', label: 'Welfare' },
  'beneficiary-rejected':     { color: '#dc2626', bg: '#fef2f2', label: 'Welfare' },
  'funds-disbursed':          { color: '#7c3aed', bg: '#f5f3ff', label: 'Finance' },
  'budget-threshold-alert':   { color: '#b45309', bg: '#fffbeb', label: 'Budget Alert' },
};

function EventBadge({ eventType, isDark }) {
  const cat = EVENT_CATEGORY[eventType] || { color: '#64748b', bg: '#f8fafc', label: eventType };
  
  // Adapt background for dark mode (use a slightly darker version with opacity if needed, or predefined dark safe colors)
  // Since EVENT_CATEGORY has light mode bgs, let's just make the text color punchy and bg subtle in dark mode.
  const darkBg = cat.color + '18'; // 18 is hex opacity ~10%

  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isDark ? darkBg : cat.bg, color: cat.color, whiteSpace: 'nowrap',
      border: `1px solid ${isDark ? cat.color + '30' : cat.color + '20'}`
    }}>
      {cat.label}
    </span>
  );
}

function JsonDialog({ payload, onClose }) {
  let formatted = payload;
  try { formatted = JSON.stringify(JSON.parse(payload), null, 2); } catch {}
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(8px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        background: '#0f172a', borderRadius: 16, maxWidth: 720, width: '100%', maxHeight: '80vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', 
        border: '1px solid #334155', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileJson size={16} color="#38bdf8" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>Raw Event Payload</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={16} />
          </button>
        </div>
        <pre style={{
          flex: 1, overflowY: 'auto', padding: '20px', margin: 0,
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          fontSize: 13, lineHeight: 1.6, color: '#7dd3fc', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {formatted}
        </pre>
      </div>
    </div>
  );
}

const EVENT_TYPES = [
  'complaint-status-changed','complaint-escalated','application-submitted',
  'document-verified','certificate-approved','certificate-generated',
  'beneficiary-applied','beneficiary-approved','beneficiary-rejected',
  'funds-disbursed','budget-threshold-alert',
];

export default function AuditLogs() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [filterEventType, setFilterEventType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const PAGE_SIZE = 20;

  const load = (p = 0, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({ page: p, size: PAGE_SIZE });
    if (filterEventType) params.set('eventType', filterEventType);
    
    api.get(`/api/reports/audit-logs?${params}`)
      .then(r => {
        setLogs(r.data.content || []);
        setTotal(r.data.totalElements || 0);
        setPage(p);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load audit logs'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        setLastRefresh(new Date());
      });
  };

  useEffect(() => { load(0); }, [filterEventType]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const surface = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const headerBg = isDark ? '#0f172a' : '#f8fafc';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  return (
    <AppShell title="Audit Logs">
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
        
        <ReportPageHeader
          title="System Audit Logs"
          subtitle={`Immutable event trail — ${total.toLocaleString()} total events recorded`}
          icon={Server} iconBg="linear-gradient(135deg,#64748b,#334155)"
          isDark={isDark} lastRefresh={lastRefresh}
          onRefresh={() => load(page, true)} refreshing={refreshing}
          extraButtons={
            <select
              value={filterEventType}
              onChange={e => setFilterEventType(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 10, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                fontSize: 13, fontWeight: 600, background: isDark ? '#334155' : '#fff', color: isDark ? '#f1f5f9' : '#374151',
                cursor: 'pointer', outline: 'none', marginLeft: 8
              }}
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          }
        />

        <ErrorBanner error={error} />

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <KpiCard icon={Server} label="Total Recorded Events" value={total.toLocaleString()} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={BookOpen} label="Kafka Event Topics" value="11 Topics" subtitle="Real-time event stream" color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={FileJson} label="System Event Format" value="JSON Payload" subtitle="Kafka Consumer Service" color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
          <KpiCard icon={Server} label="Active Filter" value={filterEventType ? filterEventType : 'All Events'} color="#f59e0b" bg="#fff7ed" isDark={isDark} />
        </div>

        {/* ── Data Table Container ────────────────────────────────────────── */}
        <SectionCard title="Immutable Audit Trail" subtitle="Logged Kafka stream events across all microservices" icon={Server} isDark={isDark}>
          <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: headerBg, borderBottom: `2px solid ${border}` }}>
                  {['Timestamp', 'Event Type', 'Entity ID', 'Category', 'Payload'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                       <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                         {[1,2,3,4,5].map(i => <Skeleton key={i} h={30} r={6} />)}
                       </div>
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState icon={BookOpen} title="No audit logs yet" desc="Events appear here once services start publishing Kafka messages" isDark={isDark} />
                    </td>
                  </tr>
                )}
                {logs.map(log => (
                  <tr key={log.auditId} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = headerBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 13, color: textMuted, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {log.receivedAt ? new Date(log.receivedAt).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 12, color: isDark ? '#cbd5e1' : '#374151', fontWeight: 600, fontFamily: 'monospace', background: isDark ? '#334155' : '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                        {log.eventType}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: textMuted, fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.entityId || '—'}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <EventBadge eventType={log.eventType} isDark={isDark} />
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => setSelectedPayload(log.payload)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', borderRadius: 8, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                          background: isDark ? '#1e293b' : '#f8fafc', fontSize: 12, fontWeight: 600, color: isDark ? '#818cf8' : '#4f46e5',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#312e81' : '#eef2ff'; e.currentTarget.style.borderColor = isDark ? '#4f46e5' : '#a5b4fc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isDark ? '#1e293b' : '#f8fafc'; e.currentTarget.style.borderColor = isDark ? '#475569' : '#e2e8f0'; }}
                      >
                        <FileJson size={14} /> JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button
              disabled={page === 0}
              onClick={() => load(page - 1)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: `1px solid ${border}`,
                background: page === 0 ? (isDark ? '#334155' : '#f1f5f9') : surface, 
                color: page === 0 ? textMuted : (isDark ? '#f1f5f9' : '#0f172a'),
                cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: '6px 16px', fontSize: 13, fontWeight: 600, color: textMuted, background: surface, border: `1px solid ${border}`, borderRadius: 10 }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => load(page + 1)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: `1px solid ${border}`,
                background: page >= totalPages - 1 ? (isDark ? '#334155' : '#f1f5f9') : surface,
                color: page >= totalPages - 1 ? textMuted : (isDark ? '#f1f5f9' : '#0f172a'),
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {selectedPayload && (
        <JsonDialog payload={selectedPayload} onClose={() => setSelectedPayload(null)} />
      )}
    </AppShell>
  );
}
