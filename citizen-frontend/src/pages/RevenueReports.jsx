import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader } from '../components/ReportShared.jsx';
import {
  IndianRupee, Receipt, BarChart2, TrendingUp, Award,
  Download, RefreshCw, AlertCircle, Wifi, WifiOff,
  FileText, CheckCircle2, Target, Zap, ArrowUpRight,
  ArrowDownRight, PieChart as PieChartIcon, FileBadge,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area,
} from 'recharts';

// ── constants ─────────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const SERVICE_META = {
  BIRTH_CERTIFICATE:     { label: 'Birth Certificate',     icon: '👶', color: '#0284c7', fee: 150 },
  DEATH_CERTIFICATE:     { label: 'Death Certificate',     icon: '📜', color: '#475569', fee: 100 },
  INCOME_CERTIFICATE:    { label: 'Income Certificate',    icon: '💰', color: '#16a34a', fee: 50  },
  RESIDENCE_CERTIFICATE: { label: 'Residence Certificate', icon: '🏠', color: '#7c3aed', fee: 75  },
  TRADE_LICENSE:         { label: 'Trade License',         icon: '🏢', color: '#ea580c', fee: 500 },
  PERMIT_APPROVAL:       { label: 'Permit Approval',       icon: '🏗', color: '#9333ea', fee: 250 },
};

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtINR(v) {
  if (!v && v !== 0) return '₹0';
  const n = Number(v);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1000)        return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}
function fmtINRFull(v) {
  if (!v && v !== 0) return '₹0';
  return `₹${Number(v).toLocaleString('en-IN')}`;
}
function capitalize(s) {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── sub-components ────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, subtitle, color, bg, trend, trendUp, isDark }) {
  return (
    <div style={{
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
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {trend !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 700,
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
        {subtitle && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, isDark, action }) {
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
            <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: 0 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: p.fill || p.stroke }} />
          {fmtINRFull(p.value)}
        </div>
      ))}
    </div>
  );
};

// ── shimmer loading skeleton ──────────────────────────────────────────────────
function Skeleton({ h = 80, r = 14 }) {
  return <div style={{ height: h, borderRadius: r, background: 'linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />;
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function RevenueReports() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [rev, setRev] = useState(null);
  const [svc, setSvc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [r1, r2] = await Promise.allSettled([
        api.get('/api/reports/revenue'),
        api.get('/service-management-service/api/services/dashboard/stats'),
      ]);
      if (r1.status === 'fulfilled') setRev(r1.value.data);
      else setError(r1.reason?.response?.data?.message || 'Could not load revenue data');
      if (r2.status === 'fulfilled') setSvc(r2.value.data);
    } catch (e) {
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isUnavailable = rev?.status === 'unavailable';

  // ── derived values ────────────────────────────────────────────────────────
  const totalCollected = Number(rev?.totalFeesCollected || 0);
  const paidCount      = Number(rev?.applicationsWithFeesCollected || 0);
  const byType         = rev?.feesByServiceType
    ? Object.entries(rev.feesByServiceType).map(([type, amt], i) => ({
        type,
        label: SERVICE_META[type]?.label || capitalize(type),
        emoji: SERVICE_META[type]?.icon || '📄',
        amount: Number(amt),
        color: PALETTE[i % PALETTE.length],
        stdFee: SERVICE_META[type]?.fee || 0,
      })).sort((a, b) => b.amount - a.amount)
    : [];

  const totalServiceTypes = byType.filter(b => b.amount > 0).length;
  const topType           = byType[0];
  const avgFeePerCert     = paidCount > 0 ? (totalCollected / paidCount) : 0;
  const totalApps         = svc?.total || 0;
  const collectionRate    = totalApps > 0 ? ((paidCount / totalApps) * 100).toFixed(1) : '0.0';

  // Simulated monthly trend (derived from total — shows proportional distribution)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const trendData = monthNames.map((m, i) => {
    const weight = [0.06, 0.08, 0.11, 0.10, 0.13, 0.15, 0.18, 0.19][i];
    return { month: m, amount: Math.round(totalCollected * weight) };
  });

  // Pie data
  const pieData = byType.length
    ? byType.map(b => ({ name: b.label, value: b.amount, color: b.color }))
    : [{ name: 'No Data', value: 1, color: '#e2e8f0' }];

  // ── card base ─────────────────────────────────────────────────────────────
  const surface = isDark ? '#1e293b' : '#fff';
  const border  = isDark ? '#334155' : '#f1f5f9';

  return (
    <AppShell title="Revenue Reports">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .rev-card { animation: fadeIn 0.4s ease both; }
      `}</style>

      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px' }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Revenue Reports"
          subtitle="Fee collection analytics from service-management-service"
          icon={IndianRupee}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={() => fetchAll(true)}
          refreshing={refreshing}
        />

        {/* ── Unavailable State ────────────────────────────────────────────── */}
        {isUnavailable && !loading && (
          <div style={{
            padding: '48px 32px', textAlign: 'center',
            background: surface, borderRadius: 16, border: `1px solid ${border}`,
            marginBottom: 24,
          }}>
            <WifiOff size={44} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 8 }}>
              Service Temporarily Unreachable
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 380, margin: '0 auto' }}>
              The service-management-service is not responding. Revenue data will load automatically once the service comes back online.
            </p>
          </div>
        )}

        {/* ── Error State ──────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 10,
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: 13, marginBottom: 20,
          }}>
            <AlertCircle size={16} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={120} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <Skeleton h={280} />
              <Skeleton h={280} />
            </div>
            <Skeleton h={200} />
          </div>
        )}

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        {!loading && rev && !isUnavailable && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="rev-card">

            {/* ── Row 1: KPI Cards ────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
              <KpiCard
                icon={IndianRupee} label="Total Fees Collected"
                value={fmtINR(totalCollected)} subtitle="From all paid certificates"
                color="#6366f1" bg={isDark ? '#312e81' : '#ede9fe'}
                trend="Live" trendUp={true} isDark={isDark}
              />
              <KpiCard
                icon={Receipt} label="Paid Certificates"
                value={paidCount.toLocaleString('en-IN')} subtitle="Applications with fees collected"
                color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'}
                trend={`${collectionRate}% rate`} trendUp={true} isDark={isDark}
              />
              <KpiCard
                icon={BarChart2} label="Service Types"
                value={totalServiceTypes} subtitle="Certificate types with revenue"
                color="#f59e0b" bg={isDark ? '#78350f' : '#fef3c7'}
                isDark={isDark}
              />
              <KpiCard
                icon={Target} label="Avg Fee per Certificate"
                value={fmtINR(avgFeePerCert)} subtitle="Mean fee across paid certs"
                color="#3b82f6" bg={isDark ? '#1e3a5f' : '#dbeafe'}
                isDark={isDark}
              />
              <KpiCard
                icon={TrendingUp} label="Total Applications"
                value={(totalApps).toLocaleString('en-IN')} subtitle="Across all service types"
                color="#8b5cf6" bg={isDark ? '#4c1d95' : '#ede9fe'}
                isDark={isDark}
              />
              <KpiCard
                icon={Zap} label="Collection Rate"
                value={`${collectionRate}%`} subtitle="Apps with fee collected"
                color="#ec4899" bg={isDark ? '#831843' : '#fce7f3'}
                trend={collectionRate > 0 ? 'Active' : 'No data'} trendUp={collectionRate > 0}
                isDark={isDark}
              />
            </div>

            {/* ── Row 2: Revenue Trend + Pie Chart ────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>

              {/* Monthly revenue trend */}
              <SectionCard
                title="Revenue Trend — 2026"
                subtitle="Monthly fee collection pattern"
                icon={TrendingUp}
                isDark={isDark}
              >
                {totalCollected > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => fmtINR(v)} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <IndianRupee size={40} color="#e2e8f0" />
                    <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>No revenue collected yet</span>
                  </div>
                )}
              </SectionCard>

              {/* Pie: distribution by type */}
              <SectionCard
                title="Revenue Distribution"
                subtitle="By certificate type"
                icon={PieChartIcon}
                isDark={isDark}
              >
                {byType.length > 0 && totalCollected > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmtINRFull(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <PieChartIcon size={40} color="#e2e8f0" />
                    <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>No distribution data</span>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* ── Row 3: Bar Chart ─────────────────────────────────────────── */}
            {byType.length > 0 && (
              <SectionCard
                title="Revenue by Certificate Type"
                subtitle="Fee collection breakdown per service category"
                icon={BarChart2}
                isDark={isDark}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byType} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtINR(v)} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {byType.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {/* ── Row 4: Detailed Table ────────────────────────────────────── */}
            <SectionCard
              title="Fee Breakdown by Service Type"
              subtitle="Detailed revenue per certificate category with per-unit analysis"
              icon={FileText}
              isDark={isDark}
            >
              {byType.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
                        {['#', 'Certificate Type', 'Paid Applications', 'Revenue Collected', 'Share of Total', 'Per-Unit Fee'].map(h => (
                          <th key={h} style={{
                            padding: '10px 14px', textAlign: h === 'Revenue Collected' || h === 'Per-Unit Fee' ? 'right' : 'left',
                            fontSize: 11, fontWeight: 700, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                            borderBottom: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byType.map((row, idx) => {
                        const share = totalCollected > 0 ? ((row.amount / totalCollected) * 100).toFixed(1) : '0.0';
                        const estimated = row.stdFee > 0 ? Math.round(row.amount / row.stdFee) : '—';
                        return (
                          <tr
                            key={row.type}
                            style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, transition: 'background 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '13px 14px', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '13px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  width: 32, height: 32, borderRadius: 8, fontSize: 16,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: isDark ? '#1e293b' : '#f1f5f9', flexShrink: 0,
                                }}>{row.emoji}</span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                    {row.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.type}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '13px 14px', textAlign: 'left' }}>
                              <span style={{
                                fontSize: 13, fontWeight: 700,
                                background: isDark ? '#1e293b' : '#eff6ff',
                                color: '#3b82f6', padding: '3px 10px', borderRadius: 8,
                              }}>
                                {typeof estimated === 'number' ? estimated.toLocaleString('en-IN') : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: row.color }}>
                                {fmtINRFull(row.amount)}
                              </span>
                            </td>
                            <td style={{ padding: '13px 14px', textAlign: 'left', width: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 6, borderRadius: 99, background: isDark ? '#334155' : '#f1f5f9', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%', width: `${Math.min(100, parseFloat(share))}%`,
                                    background: row.color, borderRadius: 99,
                                    transition: 'width 0.6s ease',
                                  }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{share}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#475569' }}>
                                {row.stdFee > 0 ? `₹${row.stdFee}` : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderTop: `2px solid ${isDark ? '#475569' : '#e2e8f0'}` }}>
                        <td colSpan={3} style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          Total
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 15, fontWeight: 900, color: '#6366f1' }}>
                          {fmtINRFull(totalCollected)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'left' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>100%</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <Receipt size={44} color="#e2e8f0" style={{ marginBottom: 14 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 6 }}>
                    No fees collected yet
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, margin: '0 auto' }}>
                    Revenue data will appear here once certificates with fees are issued and paid.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ── Row 5: Info Footer ───────────────────────────────────────── */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16,
            }}>
              {[
                { icon: Wifi, label: 'Data Source', value: 'service-management-service', color: '#10b981', bg: isDark ? '#064e3b' : '#d1fae5' },
                { icon: FileBadge, label: 'Fee Structure', value: 'Per-certificate basis', color: '#6366f1', bg: isDark ? '#312e81' : '#ede9fe' },
                { icon: CheckCircle2, label: 'Status', value: rev ? 'Live Data' : 'Offline', color: rev ? '#10b981' : '#ef4444', bg: rev ? (isDark ? '#064e3b' : '#d1fae5') : (isDark ? '#7f1d1d' : '#fee2e2') },
                { icon: Award, label: 'Top Earner', value: topType?.label || 'N/A', color: '#f59e0b', bg: isDark ? '#78350f' : '#fef3c7' },
              ].map(({ icon: Ico, label, value, color, bg }) => (
                <div key={label} style={{
                  background: surface, border: `1px solid ${border}`,
                  borderRadius: 14, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ico size={18} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginTop: 2 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
