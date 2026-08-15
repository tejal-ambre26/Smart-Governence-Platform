import React, { useState, useEffect } from 'react';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { Building2, Users, CheckCircle2, Clock, Award, ShieldAlert, HeartPulse, Landmark, Droplets, Car, Zap, Trash2, MapPin } from 'lucide-react';

const DEPT_ICONS = {
  'Health Department': { icon: HeartPulse, color: '#ef4444', bg: '#fef2f2' },
  'Revenue Department': { icon: Landmark, color: '#3b82f6', bg: '#eff6ff' },
  'Municipal Corporation': { icon: Building2, color: '#8b5cf6', bg: '#f5f3ff' },
  'Water Department': { icon: Droplets, color: '#06b6d4', bg: '#ecfeff' },
  'Roads Department': { icon: Car, color: '#f59e0b', bg: '#fff7ed' },
  'Electricity Department': { icon: Zap, color: '#eab308', bg: '#fefce8' },
  'Sanitation Department': { icon: Trash2, color: '#10b981', bg: '#f0fdf4' },
  'Urban Planning Department': { icon: MapPin, color: '#ec4899', bg: '#fdf2f8' }
};

function AdminDepartments() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const predefinedDepartments = [
    { name: 'Health Department', head: 'John' },
    { name: 'Revenue Department', head: 'Mark' },
    { name: 'Municipal Corporation', head: 'Ryan' },
    { name: 'Water Department', head: 'Chris' },
    { name: 'Roads Department', head: 'Ethan' },
    { name: 'Electricity Department', head: 'Jack' },
    { name: 'Sanitation Department', head: 'David' },
    { name: 'Urban Planning Department', head: 'Will' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [officersRes, appsRes, compRes] = await Promise.all([
        api.get('/service-management-service/api/officers'),
        api.get('/service-management-service/api/services'),
        api.get('/grievance-service/api/complaints?page=0&size=1000')
      ]);

      const officers = officersRes.data || [];
      const applications = appsRes.data || [];
      const complaints = compRes.data.content || compRes.data || [];

      const deptData = predefinedDepartments.map(dept => {
        const deptOfficers = officers.filter(o => o.department === dept.name);
        const deptApps = applications.filter(a => a.department === dept.name);
        const deptComps = complaints.filter(c => c.department === dept.name);
        
        const pendingApps = deptApps.filter(a => ['SUBMITTED', 'UNDER_VERIFICATION'].includes(a.status)).length;
        const resolvedApps = deptApps.filter(a => ['APPROVED', 'REJECTED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(a.status)).length;

        const pendingComps = deptComps.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status)).length;
        const resolvedComps = deptComps.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

        return {
          ...dept,
          officerCount: deptOfficers.length,
          pending: pendingApps + pendingComps,
          resolved: resolvedApps + resolvedComps
        };
      });

      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to fetch department data', err);
      setDepartments(predefinedDepartments.map(d => ({ ...d, officerCount: 0, pending: 0, resolved: 0 })));
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDepts = departments.length;
  const totalOfficers = departments.reduce((sum, d) => sum + d.officerCount, 0);
  const totalPending = departments.reduce((sum, d) => sum + d.pending, 0);
  const totalResolved = departments.reduce((sum, d) => sum + d.resolved, 0);

  if (loading && !departments.length) {
    return <AppShell title="Manage Departments"><PageLoader message="Loading Departments..." /></AppShell>;
  }

  return (
    <AppShell title="Manage Departments">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Manage Departments"
          subtitle="Real-time operational status, head officer assignments, and workload resolution across municipal departments"
          icon={Building2}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={fetchData}
          refreshing={loading}
        />

        {/* ── KPI Stat Cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <KpiCard icon={Building2} label="Municipal Departments" value={totalDepts} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Users} label="Total Assigned Officers" value={totalOfficers} color="#10b981" bg="#f0fdf4" isDark={isDark} />
          <KpiCard icon={Clock} label="Pending Complaints/Apps" value={totalPending} color="#f59e0b" bg="#fff7ed" isDark={isDark} />
          <KpiCard icon={CheckCircle2} label="Resolved Cases" value={totalResolved} color="#8b5cf6" bg="#f5f3ff" isDark={isDark} />
        </div>

        {/* ── Colorful Department Cards Grid ────────────────────────────────── */}
        <SectionCard
          title="Municipal Departments Overview"
          subtitle="Detailed performance grid for civic service management"
          icon={Building2}
          isDark={isDark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {departments.map((dept, idx) => {
              const config = DEPT_ICONS[dept.name] || { icon: Building2, color: '#3b82f6', bg: '#eff6ff' };
              const IconComp = config.icon;
              const totalCases = dept.pending + dept.resolved;
              const rate = totalCases > 0 ? Math.round((dept.resolved / totalCases) * 100) : (dept.officerCount > 0 ? 100 : 0);

              return (
                <div
                  key={idx}
                  style={{
                    background: isDark ? '#0f172a' : '#ffffff',
                    borderRadius: 16,
                    border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    padding: 22,
                    display: 'flex', flexDirection: 'column', gap: 16,
                    boxShadow: '0 4px 12px rgba(15,23,42,0.03)',
                    transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {/* Top Color Strip */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: config.color }} />

                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: isDark ? 'rgba(255,255,255,0.05)' : config.bg,
                        color: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                          {dept.name}
                        </h4>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
                          Head: <span style={{ color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 800 }}>{dept.head}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                    background: isDark ? '#1e293b' : '#f8fafc', padding: 12, borderRadius: 12,
                    border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Officers</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', marginTop: 2 }}>{dept.officerCount}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Pending</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{dept.pending}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Resolved</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{dept.resolved}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Resolution Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: config.color }}>{rate}%</span>
                    </div>
                    <div style={{ height: 7, width: '100%', background: isDark ? '#334155' : '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${rate}%`,
                        background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                        borderRadius: 4, transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </SectionCard>

      </div>
      <style>{`${GLOBAL_STYLES}`}</style>
    </AppShell>
  );
}

export default AdminDepartments;
