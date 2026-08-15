import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, AlertOctagon, Activity, Server, FileBadge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import {
  KpiCard, SectionCard, ReportPageHeader, ErrorBanner, UnavailableBanner,
  EmptyState, ChartTooltip, InfoCard, Skeleton, GLOBAL_STYLES, PALETTE
} from '../components/ReportShared.jsx';

const STATUS_COLORS = {
  NEW: '#3b82f6', ASSIGNED: '#f97316', IN_PROGRESS: '#8b5cf6',
  RESOLVED: '#10b981', CLOSED: '#64748b', REJECTED: '#ef4444',
};

export default function GrievanceReports() {
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
      const res = await api.get('/api/reports/grievances');
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load grievance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const isUnavailable = data?.status === 'unavailable';

  // Build chart data
  const statusData = data?.byStatus
    ? Object.entries(data.byStatus)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, count: v, fill: STATUS_COLORS[k] || '#94a3b8' }))
        .sort((a, b) => b.count - a.count)
    : [];

  const deptData = data?.byDepartment
    ? Object.entries(data.byDepartment)
        .filter(([, v]) => v > 0)
        .map(([k, v], i) => ({ name: k.replace(' Department', ''), value: v, fill: PALETTE[i % PALETTE.length] }))
        .sort((a, b) => b.value - a.value)
    : [];

  const surface = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';

  return (
    <AppShell title="Grievance Reports">
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
        
        <ReportPageHeader
          title="Grievance Reports"
          subtitle="Complaint analytics aggregated from grievance-service"
          icon={AlertTriangle} iconBg="linear-gradient(135deg,#ef4444,#f97316)"
          isDark={isDark} lastRefresh={lastRefresh}
          onRefresh={() => fetchAll(true)} refreshing={refreshing}
        />

        {isUnavailable && !loading && (
          <UnavailableBanner message="The grievance-service is not responding. Data will load automatically once the service is online." isDark={isDark} />
        )}

        <ErrorBanner error={error} />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={120} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Skeleton h={300} />
              <Skeleton h={300} />
            </div>
          </div>
        )}

        {!loading && data && !isUnavailable && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="rpt-card">
            
            {/* ── KPI Cards ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
              <KpiCard
                icon={AlertTriangle} label="Total Complaints"
                value={(data.totalComplaints || 0).toLocaleString()} subtitle="All-time recorded grievances"
                color="#6366f1" bg={isDark ? '#312e81' : '#ede9fe'} isDark={isDark}
              />
              <KpiCard
                icon={CheckCircle2} label="Resolved & Closed"
                value={(data.resolvedComplaints || 0).toLocaleString()} subtitle="Successfully handled cases"
                color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'} isDark={isDark}
              />
              <KpiCard
                icon={Clock} label="Pending Resolution"
                value={(data.pendingComplaints || 0).toLocaleString()} subtitle="Currently being processed"
                color="#f59e0b" bg={isDark ? '#78350f' : '#fef3c7'} isDark={isDark}
              />
              <KpiCard
                icon={TrendingUp} label="Resolution Rate"
                value={`${(data.resolutionRate || 0).toFixed(1)}%`} subtitle="Of total complaints"
                color="#8b5cf6" bg={isDark ? '#4c1d95' : '#ede9fe'} isDark={isDark}
              />
              {data.overdueCount != null && (
                <KpiCard
                  icon={AlertOctagon} label="Overdue Cases"
                  value={data.overdueCount.toLocaleString()} subtitle="Passed SLA timeframe"
                  color="#ef4444" bg={isDark ? '#7f1d1d' : '#fef2f2'} isDark={isDark}
                  trend="Urgent" trendUp={false}
                />
              )}
            </div>

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
              
              <SectionCard title="Complaints by Status" subtitle="Distribution of current case lifecycles" icon={Activity} isDark={isDark}>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={statusData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip isDark={isDark} formatter={v => v.toLocaleString()} />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Activity} title="No Status Data" desc="No complaints have been recorded yet." isDark={isDark} />
                )}
              </SectionCard>

              <SectionCard title="Department Distribution" subtitle="Volume of complaints assigned per department" icon={Server} isDark={isDark}>
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={deptData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false} paddingAngle={2}
                      >
                        {deptData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#111827', borderRadius: '10px', border: `1px solid ${border}`, fontSize: 13, fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Server} title="No Department Data" desc="No complaints have been routed to departments yet." isDark={isDark} />
                )}
              </SectionCard>
            </div>

            {/* ── Footer Info ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 16 }}>
              <InfoCard icon={Server} label="Data Source" value="grievance-service" color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'} isDark={isDark} />
              <InfoCard icon={FileBadge} label="Update Frequency" value="Real-time" color="#3b82f6" bg={isDark ? '#1e3a5f' : '#dbeafe'} isDark={isDark} />
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
