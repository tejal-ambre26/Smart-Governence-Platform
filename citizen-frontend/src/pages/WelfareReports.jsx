import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, Layers, Wallet, TrendingUp, Printer, BarChart2, CheckCircle2, ShieldAlert, Download } from 'lucide-react';
import {
  KpiCard, SectionCard, ReportPageHeader, ErrorBanner,
  EmptyState, ChartTooltip, Skeleton, InfoCard, GLOBAL_STYLES, PALETTE
} from '../components/ReportShared.jsx';

export default function WelfareReports() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await api.get('/welfare-service/api/welfare/dashboard/stats');
      setStats(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load welfare data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const exportCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) + '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          cell = cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBudgetReport = () => {
    const rows = stats?.budgetByDepartment
      ? Object.entries(stats.budgetByDepartment).map(([dept, amount]) => ({ Department: dept, AllocatedAmount: amount }))
      : [];
    exportCSV('welfare_budget_report.csv', rows);
  };

  const handleExportBeneficiaryReport = () => {
    const rows = stats?.beneficiariesByScheme
      ? Object.entries(stats.beneficiariesByScheme).map(([scheme, count]) => ({ SchemeName: scheme, TotalBeneficiaries: count }))
      : [];
    exportCSV('welfare_beneficiary_report.csv', rows);
  };

  const handleExportPaymentReport = () => {
    const rows = (stats?.recentDisbursements || []).map(d => ({
      TransactionID: d.transactionId,
      Amount: d.amount,
      PaymentMode: d.paymentMode,
      PaymentStatus: d.paymentStatus,
      ApprovedBy: d.approvedBy,
      Date: d.disbursedDate
    }));
    exportCSV('welfare_payment_report.csv', rows);
  };

  const budgetPieData = stats?.budgetByDepartment
    ? Object.entries(stats.budgetByDepartment).map(([name, value], i) => ({ name, value: Number(value), fill: PALETTE[i % PALETTE.length] }))
    : [];

  const beneficiaryBarData = stats?.beneficiariesByScheme
    ? Object.entries(stats.beneficiariesByScheme).map(([name, count]) => ({ name, count }))
    : [];

  const monthlyData = {};
  (stats?.recentDisbursements || []).forEach(d => {
    if (d.disbursedDate) {
      const month = d.disbursedDate.substring(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    }
  });
  const lineData = Object.entries(monthlyData).sort().map(([month, count]) => ({ month, count }));

  // Helper formatter
  function fmt(n) {
    if (!n && n !== 0) return '₹0';
    const num = Number(n);
    if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
    if (num >= 1_00_000)    return `₹${(num / 1_00_000).toFixed(2)} L`;
    if (num >= 1000)        return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  const handleExportExecutiveSummary = () => {
    const summaryRows = [
      { Category: 'EXECUTIVE_SUMMARY', Metric: 'Total Beneficiaries', Value: stats?.totalBeneficiaries || 0 },
      { Category: 'EXECUTIVE_SUMMARY', Metric: 'Total Schemes', Value: stats?.totalSchemes || 0 },
      { Category: 'EXECUTIVE_SUMMARY', Metric: 'Total Budget Allocated (INR)', Value: stats?.totalBudgetAllocated || 0 },
      { Category: 'EXECUTIVE_SUMMARY', Metric: 'Fund Utilization Percent', Value: `${Number(stats?.overallUtilizationPercent || 0).toFixed(1)}%` },
    ];

    if (stats?.budgetByDepartment) {
      Object.entries(stats.budgetByDepartment).forEach(([dept, amount]) => {
        summaryRows.push({ Category: 'DEPARTMENT_BUDGET', Metric: dept, Value: amount });
      });
    }

    if (stats?.beneficiariesByScheme) {
      Object.entries(stats.beneficiariesByScheme).forEach(([scheme, count]) => {
        summaryRows.push({ Category: 'SCHEME_ENROLLMENT', Metric: scheme, Value: count });
      });
    }

    exportCSV('welfare_executive_summary_report.csv', summaryRows);
  };

  const [selectedReport, setSelectedReport] = useState('budget');

  const handleExportSelectedReport = () => {
    if (selectedReport === 'budget') handleExportBudgetReport();
    else if (selectedReport === 'beneficiary') handleExportBeneficiaryReport();
    else if (selectedReport === 'payment') handleExportPaymentReport();
    else handleExportExecutiveSummary();
  };

  const surface = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#f1f5f9';

  return (
    <AppShell title="Welfare Reports">
      <style>{`
        ${GLOBAL_STYLES}
        @media print {
          body { background: #fff !important; color: #000 !important; }
          nav, header, sidebar, .app-sidebar, button, select { display: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
        
        <ReportPageHeader
          title="Government Executive Reports"
          subtitle="Generate official analytical reports for welfare schemes and budgets"
          icon={BarChart2} iconBg="linear-gradient(135deg,#8b5cf6,#6d28d9)"
          isDark={isDark} lastRefresh={lastRefresh}
          onRefresh={() => fetchAll(true)} refreshing={refreshing}
          extraButtons={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                  background: isDark ? '#334155' : '#fff', color: isDark ? '#f1f5f9' : '#374151',
                  fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="budget">Budget Report</option>
                <option value="beneficiary">Beneficiary Report</option>
                <option value="payment">Payment Report</option>
                <option value="summary">Executive Summary</option>
              </select>

              <button
                onClick={handleExportSelectedReport}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                  background: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                  color: isDark ? '#f1f5f9' : '#334155', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                <Download size={14} /> Export CSV
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', border: 'none',
                  color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.35)',
                }}
              >
                <Printer size={14} /> Print Report
              </button>
            </div>
          }
        />

        <ErrorBanner error={error} />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} h={120} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Skeleton h={300} />
              <Skeleton h={300} />
            </div>
            <Skeleton h={300} />
          </div>
        )}

        {!loading && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="rpt-card">
            
            {/* ── KPI Cards ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
              <KpiCard
                icon={Users} label="Total Beneficiaries"
                value={(stats.totalBeneficiaries || 0).toLocaleString()} subtitle="Across all active schemes"
                color="#3b82f6" bg={isDark ? '#1e3a5f' : '#dbeafe'} isDark={isDark}
              />
              <KpiCard
                icon={Layers} label="Total Schemes"
                value={(stats.totalSchemes || 0).toLocaleString()} subtitle="Managed by departments"
                color="#ec4899" bg={isDark ? '#831843' : '#fce7f3'} isDark={isDark}
              />
              <KpiCard
                icon={Wallet} label="Total Budget"
                value={fmt(stats.totalBudgetAllocated)} subtitle="Allocated for welfare"
                color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'} isDark={isDark}
              />
              <KpiCard
                icon={TrendingUp} label="Fund Utilization"
                value={`${Number(stats.overallUtilizationPercent || 0).toFixed(1)}%`} subtitle="Budget spent so far"
                color="#f59e0b" bg={isDark ? '#78350f' : '#fef3c7'} isDark={isDark}
                trend="Healthy" trendUp={true}
              />
            </div>

            {/* ── Top Charts ─────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
              
              <SectionCard title="Budget Allocation" subtitle="Distribution across departments" icon={Wallet} isDark={isDark}>
                {budgetPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={budgetPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        paddingAngle={2} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {budgetPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#111827', borderRadius: '10px', border: `1px solid ${border}`, fontSize: 13, fontWeight: 600 }} formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Wallet} title="No Budget Data" desc="No budget allocations have been made yet." isDark={isDark} />
                )}
              </SectionCard>

              <SectionCard title="Beneficiaries by Scheme" subtitle="Enrollment numbers per program" icon={Users} isDark={isDark}>
                {beneficiaryBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={beneficiaryBarData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#111827', borderRadius: '10px', border: `1px solid ${border}`, fontSize: 13, fontWeight: 600 }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Users} title="No Beneficiary Data" desc="No beneficiaries enrolled in schemes yet." isDark={isDark} />
                )}
              </SectionCard>
            </div>

            {/* ── Bottom Trend Chart ─────────────────────────────────────── */}
            <SectionCard title="Disbursements Over Time" subtitle="Monthly count of welfare payments" icon={TrendingUp} isDark={isDark}>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={lineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="welfareGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#111827', borderRadius: '10px', border: `1px solid ${border}`, fontSize: 13, fontWeight: 600 }} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fill="url(#welfareGrad)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={TrendingUp} title="No Disbursement Data" desc="No payment transactions recorded yet." isDark={isDark} />
              )}
            </SectionCard>

            {/* ── Footer Info ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 16 }}>
              <InfoCard icon={ShieldAlert} label="Data Source" value="welfare-service" color="#f59e0b" bg={isDark ? '#78350f' : '#fef3c7'} isDark={isDark} />
              <InfoCard icon={CheckCircle2} label="Status" value="Live Data" color="#10b981" bg={isDark ? '#064e3b' : '#d1fae5'} isDark={isDark} />
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
