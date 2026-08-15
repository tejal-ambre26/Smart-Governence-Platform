/**
 * Shared premium design primitives for all Report pages.
 * Mirrors the RevenueReports design system.
 */

import { AlertCircle, RefreshCw, Download, WifiOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const PALETTE = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];

export function fmtINR(v) {
  const n = Number(v || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1000)        return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function fmtINRFull(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

// ── Shimmer Skeleton ───────────────────────────────────────────────────────────
export function Skeleton({ h = 80, r = 14 }) {
  return (
    <div style={{
      height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KpiCard({ icon: Icon, label, value, subtitle, color, bg, trend, trendUp, isDark }) {
  return (
    <div
      style={{
        background: isDark ? '#1e293b' : '#fff',
        border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
        borderRadius: 16, padding: '20px 22px',
        boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,23,42,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.07)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700,
            color: trendUp ? '#16a34a' : '#dc2626',
            background: trendUp ? '#dcfce7' : '#fee2e2',
            padding: '3px 9px', borderRadius: 20,
          }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, icon: Icon, children, isDark, action }) {
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
    }}>
      <div style={{
        padding: '18px 22px',
        borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isDark ? '#1e293b' : '#fafbfc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? '#334155' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={15} color={isDark ? '#94a3b8' : '#475569'} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function ReportPageHeader({ title, subtitle, iconBg, icon: Icon, iconColor = '#fff', isDark, lastRefresh, onRefresh, refreshing, onExport, extraButtons }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 18, marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <Icon size={22} color={iconColor} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{title}</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, fontWeight: 500 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {lastRefresh && (
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            Last updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
            background: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
            color: isDark ? '#94a3b8' : '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
        {onExport && (
          <button onClick={onExport} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
            color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}>
            <Download size={14} /> Export CSV
          </button>
        )}
        {extraButtons}
      </div>
    </div>
  );
}

// ── Error / Unavailable states ────────────────────────────────────────────────
export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10,
      background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, marginBottom: 20,
    }}>
      <AlertCircle size={16} />
      <span style={{ fontWeight: 600 }}>{error}</span>
    </div>
  );
}

export function UnavailableBanner({ message, isDark }) {
  return (
    <div style={{
      padding: '48px 32px', textAlign: 'center',
      background: isDark ? '#1e293b' : '#fff',
      borderRadius: 16, border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, marginBottom: 24,
    }}>
      <WifiOff size={44} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
      <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 8 }}>Service Temporarily Unreachable</div>
      <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 380, margin: '0 auto' }}>{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, isDark }) {
  return (
    <div style={{ padding: '56px 0', textAlign: 'center' }}>
      <Icon size={44} color="#e2e8f0" style={{ marginBottom: 14 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 6 }}>{title}</div>
      {desc && <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, margin: '0 auto' }}>{desc}</p>}
    </div>
  );
}

// ── Custom Chart Tooltip ──────────────────────────────────────────────────────
export function ChartTooltip({ active, payload, label, isDark, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: p.fill || p.stroke }} />
          {formatter ? formatter(p.value, p.name) : p.value}
        </div>
      ))}
    </div>
  );
}

// ── Info Footer Card ──────────────────────────────────────────────────────────
export function InfoCard({ icon: Ico, label, value, color, bg, isDark }) {
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
      borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

export const GLOBAL_STYLES = `
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  .rpt-card { animation: fadeIn 0.4s ease both; }
  input, select, textarea { box-sizing: border-box !important; line-height: normal !important; vertical-align: middle !important; }
  input::placeholder, select::placeholder, textarea::placeholder { color: #94a3b8 !important; opacity: 1 !important; line-height: normal !important; }
`;
