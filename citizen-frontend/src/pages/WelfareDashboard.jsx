import { useEffect, useState } from 'react';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import {
  PieChart, Pie, Cell, AreaChart, Area,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import {
  Plus, Wallet, Download, Users, Layers, DollarSign,
  TrendingUp, ArrowUpRight, ClipboardList, RefreshCw, Heart, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import keycloak from '../keycloak.js';

// ── Colour palette ──────────────────────────────────────────────────────────
const SCHEME_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SCHEME_META = [
  { key: 'Farmer Subsidy',     bg: '#dbeafe', color: '#2563eb', emoji: '🌾' },
  { key: 'Health Assistance',  bg: '#dcfce7', color: '#16a34a', emoji: '❤️' },
  { key: 'Women Empowerment',  bg: '#fef3c7', color: '#d97706', emoji: '👩' },
  { key: 'Old Age Pension',    bg: '#fee2e2', color: '#dc2626', emoji: '🧓' },
  { key: 'National Scholarship', bg: '#ede9fe', color: '#7c3aed', emoji: '🎓' },
  { key: 'PM Awas Yojana',     bg: '#fce7f3', color: '#db2777', emoji: '🏠' },
];

function fmt(n) {
  if (!n && n !== 0) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function fmtCompact(n) {
  if (!n) return '₹0';
  const num = Number(n);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(2)} L`;
  return fmt(n);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function generateSparkData(points = 12) {
  let v = 40 + Math.random() * 30;
  return Array.from({ length: points }, () => {
    v = Math.max(5, v + (Math.random() - 0.45) * 15);
    return { v };
  });
}

// ── Stat Card with sparkline ──────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, trend, trendLabel, sparkColor, badge }) {
  const sparkData = generateSparkData(14);
  const gradId = `sg-${label.replace(/\s+/g, '')}`;
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
      padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: iconBg, flexShrink: 0,
        }}>
          <Icon size={20} color={iconColor} />
        </div>
      </div>
      {badge ? (
        <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{badge}</span>
      ) : trend !== undefined ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
          <ArrowUpRight size={13} />
          {trend}% {trendLabel}
        </div>
      ) : null}
      <div style={{ height: 44, marginTop: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={sparkColor} stopOpacity={0.18} />
                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.8}
              fill={`url(#${gradId})`} dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#3b82f6' }) {
  return (
    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Performance badge ─────────────────────────────────────────────────────────
function PerfBadge({ label }) {
  const map = {
    Good:      { bg: '#dcfce7', color: '#16a34a' },
    Average:   { bg: '#fef3c7', color: '#d97706' },
    Poor:      { bg: '#fee2e2', color: '#dc2626' },
    Excellent: { bg: '#dbeafe', color: '#2563eb' },
  };
  const s = map[label] || map.Good;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
      {label}
    </span>
  );
}

export default function WelfareDashboard() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetFilter, setBudgetFilter] = useState('This Financial Year');

  const username = keycloak.tokenParsed?.name ||
    keycloak.tokenParsed?.preferred_username || 'Admin';

  const fetchStats = () => {
    setLoading(true);
    api.get('/welfare-service/api/welfare/dashboard/stats')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading && !stats) return (
    <AppShell title="Welfare & Finance Overview">
      <PageLoader message="Loading welfare statistics…" />
    </AppShell>
  );

  if (error && !stats) return (
    <AppShell title="Welfare & Finance Overview">
      <div style={{ padding: 40, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
        {error}
        <button onClick={fetchStats} style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5',
          background: 'transparent', cursor: 'pointer', color: '#ef4444',
        }}>Retry</button>
      </div>
    </AppShell>
  );

  // ── Derived values ───────────────────────────────────────────────────────
  const utilizationPct  = stats?.overallUtilizationPercent ?? 0;
  const totalAllocated  = stats?.totalBudgetAllocated ?? 0;
  const totalSpent      = stats?.totalBudgetSpent ?? 0;
  const remaining       = Math.max(0, totalAllocated - totalSpent);
  const totalSchemes    = stats?.totalSchemes ?? 0;
  const totalBenef      = stats?.totalBeneficiaries ?? 0;
  const pendingApps     = stats?.pendingApplicationsCount ?? 0;

  const schemeEntries   = stats?.beneficiariesByScheme ? Object.entries(stats.beneficiariesByScheme) : [];
  const totalBenefCount = schemeEntries.reduce((s, [, v]) => s + v, 0);

  const pieData = schemeEntries.length
    ? schemeEntries.map(([name, value]) => ({ name, value }))
    : SCHEME_META.map(m => ({ name: m.key + ' Scheme', value: 0 }));

  const topSchemes         = [...schemeEntries].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const recentDisbursements = stats?.recentDisbursements || [];

  const deptPerf = [{
    dept: 'Social Welfare Department',
    schemes: totalSchemes,
    beneficiaries: totalBenef,
    allocated: totalAllocated,
    utilization: utilizationPct,
    performance: utilizationPct > 60 ? 'Good' : 'Good',
  }];

  // ── Shared style objects ─────────────────────────────────────────────────
  const card = {
    background: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };
  const sectionTitle = { fontSize: 15, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', margin: 0 };
  const viewAll = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#3b82f6', textDecoration: 'none' };
  const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 10,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', fontWeight: 600, fontSize: 14,
    border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99,102,241,.35)', textDecoration: 'none',
  };
  const btnOutline = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 10,
    background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14,
    border: '1px solid #e5e7eb', cursor: 'pointer', textDecoration: 'none',
  };

  return (
    <AppShell title="Welfare &amp; Finance Overview">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ───────────────────────────────────────────── */}
        <ReportPageHeader
          title="Welfare & Finance Overview"
          subtitle="Monitor welfare schemes, budget utilization, and fund disbursements across all departments"
          icon={Wallet}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={new Date()}
          onRefresh={fetchStats}
          refreshing={loading}
          extraButtons={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/welfare/schemes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                <Plus size={15} /> New Scheme
              </Link>
              <Link to="/welfare/budgets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, color: isDark ? '#f1f5f9' : '#475569', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                <Wallet size={15} /> Allocate Budget
              </Link>
            </div>
          }
        />

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={Layers} label="Total Schemes" value={totalSchemes} subtitle="20% from last month" color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Wallet} label="Total Allocated" value={fmtCompact(totalAllocated)} subtitle="15% from last month" color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Users} label="Beneficiaries" value={totalBenef} subtitle={`${pendingApps} pending applications`} color="#f59e0b" bg="#fff7ed" isDark={isDark} />
          <KpiCard icon={DollarSign} label="Total Disbursed" value={fmtCompact(totalSpent)} subtitle="0% from last month" color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
        </div>

        {/* ── Row 2: Budget Utilization + Recent Disbursements ──────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Budget Utilization */}
          <SectionCard
            title="Budget Utilization"
            subtitle="Financial year spending progress"
            icon={Wallet}
            isDark={isDark}
            action={
              <div style={{ position: 'relative' }}>
                <select
                  value={budgetFilter}
                  onChange={e => setBudgetFilter(e.target.value)}
                  style={{
                    border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`, borderRadius: 8, padding: '5px 28px 5px 10px',
                    fontSize: 13, color: isDark ? '#f1f5f9' : '#374151', background: isDark ? '#334155' : '#fff', cursor: 'pointer', appearance: 'none',
                  }}
                >
                  <option>This Financial Year</option>
                  <option>Last Financial Year</option>
                  <option>All Time</option>
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: 11 }}>▾</span>
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {/* Donut */}
              <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Spent', value: Math.max(0.01, Number(utilizationPct)) },
                        { name: 'Remaining', value: Math.max(0, 100 - Number(utilizationPct)) },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={72}
                      startAngle={90} endAngle={-270}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill={isDark ? '#334155' : '#e2e8f0'} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>
                    {Number(utilizationPct).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>Utilized</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { dot: '#3b82f6', label: 'Total Allocated', val: fmtCompact(totalAllocated) },
                  { dot: '#22c55e', label: 'Total Spent', val: fmtCompact(totalSpent) },
                  { dot: '#cbd5e1', label: 'Remaining', val: fmtCompact(remaining) },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.dot, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              <span>{Number(utilizationPct).toFixed(1)}% of budget utilized</span>
              <span>Target: 100%</span>
            </div>
          </SectionCard>

          {/* Recent Disbursements */}
          <SectionCard
            title="Recent Disbursements"
            subtitle="Latest fund transfers"
            icon={ClipboardList}
            isDark={isDark}
            action={<Link to="/welfare/disbursements" style={viewAll}>View All</Link>}
          >
            {recentDisbursements.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 210, gap: 10 }}>
                <div style={{ fontSize: 44 }}>📋</div>
                <div style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#475569', fontSize: 14 }}>No disbursements yet</div>
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  Once payments are made, they will appear here.
                </div>
              </div>
            ) : (
              <div>
                {recentDisbursements.slice(0, 5).map((d, i) => (
                  <div key={d.disbursementId || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: i < 4 ? `1px solid ${isDark ? '#334155' : '#f8fafc'}` : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#374151', fontFamily: 'monospace' }}>
                        {d.transactionId || `TXN-${i + 1}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' }}>
                        {d.paymentMode?.replace('_', ' ')} · <span style={{ color: '#22c55e' }}>{d.paymentStatus}</span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a' }}>{fmt(d.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Row 3: Beneficiaries Mix + Top Active Schemes + Recent Payouts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

          {/* Beneficiaries Mix */}
          <SectionCard title="Beneficiaries Mix" subtitle="Category distribution" icon={Users} isDark={isDark}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.some(d => d.value > 0) ? pieData : [{ name: 'Empty', value: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={68}
                      dataKey="value" stroke="none"
                    >
                      {pieData.some(d => d.value > 0)
                        ? pieData.map((_, i) => <Cell key={i} fill={SCHEME_COLORS[i % SCHEME_COLORS.length]} />)
                        : <Cell fill={isDark ? '#334155' : '#e2e8f0'} />}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>{totalBenefCount}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Total</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {SCHEME_META.map((m, idx) => {
                const entry = pieData.find(p => p.name.toLowerCase().includes(m.key.split(' ')[0].toLowerCase()));
                const val = entry?.value ?? 0;
                const tot = totalBenefCount || 1;
                const pct = ((val / tot) * 100).toFixed(0);
                return (
                  <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: SCHEME_COLORS[idx], display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: isDark ? '#cbd5e1' : '#374151', fontWeight: 500 }}>{m.key}</span>
                    </div>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{val} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Top Active Schemes */}
          <SectionCard
            title="Top Active Schemes"
            subtitle="Most enrolled programs"
            icon={Award}
            isDark={isDark}
            action={<Link to="/welfare/schemes" style={viewAll}>View All</Link>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(topSchemes.length > 0 ? topSchemes : SCHEME_META.map(m => [m.key + ' Scheme', 0])).slice(0, 6).map(([name, count], i) => {
                const meta = SCHEME_META.find(m => name.toLowerCase().includes(m.key.split(' ')[0].toLowerCase())) || SCHEME_META[i % SCHEME_META.length];
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: meta.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    }}>
                      {meta.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1, fontWeight: 500 }}>{count} enrolled</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Recent Payouts */}
          <SectionCard
            title="Recent Payouts"
            subtitle="Disbursement activity"
            icon={DollarSign}
            isDark={isDark}
            action={<Link to="/welfare/disbursements" style={viewAll}>View All</Link>}
          >
            {recentDisbursements.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
                <div style={{ fontSize: 44 }}>👛</div>
                <div style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#475569', fontSize: 14 }}>No recent payouts</div>
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  Payment history will be shown here.
                </div>
              </div>
            ) : (
              <div>
                {recentDisbursements.slice(0, 5).map((d, i) => (
                  <div key={d.disbursementId || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: i < 4 ? `1px solid ${isDark ? '#334155' : '#f8fafc'}` : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#374151', fontFamily: 'monospace' }}>{d.transactionId || `TXN-${i + 1}`}</div>
                      <div style={{ fontSize: 11, color: '#22c55e' }}>{d.paymentStatus}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: isDark ? '#f1f5f9' : '#0f172a' }}>{fmt(d.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Row 4: Department Performance ─────────────────────────────── */}
        <SectionCard
          title="Department Performance"
          subtitle="Departmental budget utilization & scheme distribution"
          icon={TrendingUp}
          isDark={isDark}
          action={<Link to="/welfare/reports" style={viewAll}>View Report</Link>}
        >
          <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                  {['Department', 'Schemes', 'Beneficiaries', 'Allocated Budget', 'Utilization', 'Performance'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptPerf.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{row.dept}</td>
                    <td style={{ padding: '14px 18px', color: isDark ? '#cbd5e1' : '#374151', fontWeight: 600 }}>{row.schemes}</td>
                    <td style={{ padding: '14px 18px', color: isDark ? '#cbd5e1' : '#374151', fontWeight: 600 }}>{row.beneficiaries}</td>
                    <td style={{ padding: '14px 18px', color: isDark ? '#cbd5e1' : '#374151', fontWeight: 600 }}>{fmtCompact(row.allocated)}</td>
                    <td style={{ padding: '14px 18px', minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProgressBar pct={row.utilization} color="#3b82f6" />
                        <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{Number(row.utilization).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PerfBadge label={row.performance} />
                        <TrendingUp size={14} color="#22c55e" />
                      </div>
                    </td>
                  </tr>
                ))}
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
