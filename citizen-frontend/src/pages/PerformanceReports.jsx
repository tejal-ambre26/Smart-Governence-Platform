import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { Activity, Clock, TrendingUp, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  KpiCard, SectionCard, ReportPageHeader, ErrorBanner, UnavailableBanner,
  EmptyState, ChartTooltip, Skeleton, GLOBAL_STYLES, PALETTE
} from '../components/ReportShared.jsx';

function PerformanceBadge({ rate, isDark }) {
  const isGood = rate >= 85;
  const isWarn = rate >= 60 && rate < 85;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: isGood ? (isDark ? '#064e3b' : '#dcfce7') : isWarn ? (isDark ? '#78350f' : '#fef9c3') : (isDark ? '#7f1d1d' : '#fee2e2'),
      color: isGood ? (isDark ? '#34d399' : '#15803d') : isWarn ? (isDark ? '#fbbf24' : '#a16207') : (isDark ? '#f87171' : '#dc2626'),
      border: `1px solid ${isGood ? (isDark ? '#047857' : '#bbf7d0') : isWarn ? (isDark ? '#92400e' : '#fef08a') : (isDark ? '#991b1b' : '#fecaca')}`,
    }}>
      {isGood ? <CheckCircle size={12} /> : <ShieldAlert size={12} />}
      {isGood ? 'Excellent' : isWarn ? 'Acceptable' : 'Needs Attention'}
    </span>
  );
}

export default function PerformanceReports() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/reports/performance');
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isUnavailable = data?.grievanceDataUnavailable;

  const depts = data?.departmentPerformance ? Object.values(data.departmentPerformance) : [];

  const chartData = depts.map((d, i) => ({
    name: (d.department || 'Unknown').replace(' Department', '').replace(' Dept', ''),
    rate: Math.round(d.resolutionRate * 10) / 10,
    total: d.totalHandled,
    fill: PALETTE[i % PALETTE.length],
  }));

  const overallRate = data?.overallResolutionRate || 0;
  const totalCasesHandled = depts.reduce((sum, d) => sum + (d.totalHandled || 0), 0);
  const topDept = [...depts].sort((a, b) => (b.resolutionRate || 0) - (a.resolutionRate || 0))[0];

  const surface = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';

  return (
    <AppShell title="Performance Reports">
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
        
        <ReportPageHeader
          title="Department Performance"
          subtitle="SLA compliance and resolution metrics across departments"
          icon={Activity} iconBg="linear-gradient(135deg,#3b82f6,#2563eb)"
          isDark={isDark} lastRefresh={lastRefresh}
          onRefresh={() => fetchAll(true)} refreshing={refreshing}
        />

        {isUnavailable && !loading && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            background: isDark ? '#78350f' : '#fef9c3', border: `1px solid ${isDark ? '#92400e' : '#fde047'}`,
            color: isDark ? '#fde68a' : '#713f12', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ShieldAlert size={16} />
            <span style={{ fontWeight: 600 }}>Grievance service is temporarily unreachable. Performance data may be incomplete.</span>
          </div>
        )}

        <ErrorBanner error={error} />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} h={120} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} h={160} />)}
            </div>
            <Skeleton h={300} />
          </div>
        )}

        {!loading && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="rpt-card">
            
            {/* ── Overview KPIs ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
              <KpiCard
                icon={TrendingUp} label="Overall Resolution Rate"
                value={`${overallRate.toFixed(1)}%`} subtitle="Average across all departments"
                color="#6366f1" bg={isDark ? '#312e81' : '#ede9fe'} isDark={isDark}
                trend={overallRate >= 85 ? 'Healthy' : 'Needs work'} trendUp={overallRate >= 85}
              />
              <KpiCard
                icon={Activity} label="Total Cases Handled"
                value={totalCasesHandled.toLocaleString()} subtitle="By all tracking departments"
                color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'} isDark={isDark}
              />
              <KpiCard
                icon={Zap} label="Top Performing Dept"
                value={topDept ? topDept.department.replace(' Department','') : 'N/A'} 
                subtitle={topDept ? `${topDept.resolutionRate.toFixed(1)}% Resolution Rate` : 'No data'}
                color="#f59e0b" bg={isDark ? '#78350f' : '#fef3c7'} isDark={isDark}
              />
            </div>

            {/* ── Department Detail Cards ──────────────────────────────────── */}
            {depts.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 16 }}>Detailed Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
                  {depts.map((dept, i) => {
                    const rate = dept.resolutionRate || 0;
                    const color = rate >= 85 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
                    
                    return (
                      <div key={dept.department} style={{
                        background: surface, borderRadius: 16, padding: 22,
                        border: `1px solid ${border}`, boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
                        display: 'flex', flexDirection: 'column', gap: 16,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10, background: isDark ? '#334155' : '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: 16
                            }}>
                              {dept.department.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{dept.department}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{(dept.totalHandled || 0).toLocaleString()} cases</div>
                            </div>
                          </div>
                          <PerformanceBadge rate={rate} isDark={isDark} />
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Resolution Rate</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color }}>{rate.toFixed(1)}%</span>
                          </div>
                          <div style={{ height: 8, background: isDark ? '#334155' : '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, rate)}%`, height: '100%', background: color, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>

                        {dept.avgTurnaroundHours > 0 && (
                          <div style={{ padding: '10px 12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={14} color="#6366f1" />
                            <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#475569', fontWeight: 600 }}>
                              Avg Turnaround: <span style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{dept.avgTurnaroundHours}h</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Comparison Chart ────────────────────────────────────────── */}
            {chartData.length > 0 && (
              <SectionCard title="Department Comparison" subtitle="Resolution rates side-by-side" icon={BarChart2} isDark={isDark}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip isDark={isDark} formatter={v => `${v}%`} />} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            )}

            {depts.length === 0 && !error && (
              <EmptyState icon={Activity} title="No Performance Data" desc="Performance metrics will appear here once cases are resolved by departments." isDark={isDark} />
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}

// Ensure BarChart2 is available for the SectionCard icon
import { BarChart2 } from 'lucide-react';
