import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, UserCheck, AlertTriangle, CheckCircle, FileText,
  Clock, ShieldCheck, XCircle, Building, Activity,
  Briefcase, Calendar, BarChart2, Hash, Award
} from 'lucide-react';

const COLORS = ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#0dcaf0', '#adb5bd'];

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Fetch all raw data for client-side aggregation
        const [complaintsRes, appsRes, officersRes] = await Promise.all([
          api.get('/grievance-service/api/complaints?page=0&size=1000'),
          api.get('/service-management-service/api/services'),
          api.get('/service-management-service/api/officers')
        ]);

        const complaints = complaintsRes.data.content || complaintsRes.data || [];
        const applications = appsRes.data || [];
        const officers = officersRes.data || [];

        // Aggregation Engine
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Citizens
        const citizenIds = new Set([
          ...complaints.map(c => c.citizenId),
          ...applications.map(a => a.citizenId)
        ]);
        const totalCitizens = citizenIds.size;

        // 2. Complaints Metrics
        const totalComplaints = complaints.length;
        const resolvedComplaints = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;
        const openComplaints = totalComplaints - resolvedComplaints;
        const todaysComplaints = complaints.filter(c => c.createdAt && c.createdAt.startsWith(todayStr)).length;
        
        let totalResolutionDays = 0;
        let slaMetCount = 0;
        
        complaints.forEach(c => {
          if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
            const created = new Date(c.createdAt);
            const updated = new Date(c.updatedAt);
            const days = (updated - created) / (1000 * 60 * 60 * 24);
            totalResolutionDays += days;
            
            // Assume SLA met if not OVERDUE, or if resolved before SLA deadline
            if (c.slaDeadline) {
              if (updated <= new Date(c.slaDeadline)) slaMetCount++;
            } else {
              slaMetCount++;
            }
          }
        });

        const avgResolutionTime = resolvedComplaints > 0 ? (totalResolutionDays / resolvedComplaints).toFixed(1) : 0;
        const slaCompliance = resolvedComplaints > 0 ? Math.round((slaMetCount / resolvedComplaints) * 100) : 100;

        // 3. Applications Metrics
        const certApps = applications.filter(a => a.serviceType !== 'PERMIT_APPROVAL');
        const permitApps = applications.filter(a => a.serviceType === 'PERMIT_APPROVAL');
        
        const certsApproved = certApps.filter(a => ['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(a.status)).length;
        const certsRejected = certApps.filter(a => a.status === 'REJECTED').length;
        const certsPending = certApps.length - certsApproved - certsRejected;

        const permitsApproved = permitApps.filter(a => ['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(a.status)).length;
        const permitsRejected = permitApps.filter(a => a.status === 'REJECTED').length;
        const permitsPending = permitApps.length - permitsApproved - permitsRejected;

        const todaysApplications = applications.filter(a => a.appliedDate && a.appliedDate.startsWith(todayStr)).length;

        // 4. Department Metrics
        const depts = [...new Set([...complaints.map(c => c.department), ...applications.map(a => a.department)])].filter(Boolean);
        const activeDepartments = depts.length;

        // Chart 1: Complaint Trend (Last 30 Days)
        const past30Days = [...Array(30)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (29 - i));
          return d.toISOString().split('T')[0];
        });

        const complaintTrendData = past30Days.map(date => {
          return {
            date: date.substring(5),
            complaints: complaints.filter(c => c.createdAt && c.createdAt.startsWith(date)).length
          };
        });

        const monthlyApplicationsData = past30Days.map(date => {
          return {
            date: date.substring(5),
            applications: applications.filter(a => a.appliedDate && a.appliedDate.startsWith(date)).length
          };
        });

        // Chart: Complaints by Department
        const compByDeptData = depts.map(dept => ({
          name: dept.replace(' Department', ''),
          Count: complaints.filter(c => c.department === dept).length
        })).sort((a, b) => b.Count - a.Count);

        // Chart: Applications by Department
        const appByDeptData = depts.map(dept => ({
          name: dept.replace(' Department', ''),
          Certificates: certApps.filter(a => a.department === dept).length,
          Permits: permitApps.filter(a => a.department === dept).length
        })).sort((a, b) => (b.Certificates + b.Permits) - (a.Certificates + a.Permits));

        // Chart: Officer Workload
        const officerWorkloadData = officers.map(o => {
          const pending = complaints.filter(c => c.assignedOfficer === o.username && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length 
                        + applications.filter(a => a.status === 'UNDER_VERIFICATION' && a.department === o.department).length;
          return {
            name: o.officerName || o.username,
            PendingCases: pending
          };
        }).sort((a, b) => b.PendingCases - a.PendingCases);

        // Donut Data
        const certDonut = [
          { name: 'Approved', value: certsApproved },
          { name: 'Pending', value: certsPending },
          { name: 'Rejected', value: certsRejected }
        ];

        const permitDonut = [
          { name: 'Approved', value: permitsApproved },
          { name: 'Pending', value: permitsPending },
          { name: 'Rejected', value: permitsRejected }
        ];

        // Timeline (Top 10 Recent)
        const allEvents = [
          ...complaints.map(c => ({ time: new Date(c.createdAt), type: 'Complaint', title: `Complaint Raised: ${c.title}`, status: c.status, assignedTo: c.assignedOfficer })),
          ...applications.map(a => ({ time: new Date(a.appliedDate), type: 'Application', title: `App Submitted: ${a.serviceType}`, status: a.status, assignedTo: a.department }))
        ].sort((a, b) => b.time - a.time).slice(0, 10);

        setStats({
          totalCitizens,
          totalOfficers: officers.length,
          systemUsers: totalCitizens + officers.length,
          activeDepartments,
          totalComplaints,
          openComplaints,
          resolvedComplaints,
          todaysComplaints,
          certApps: certApps.length,
          permitApps: permitApps.length,
          certsApproved,
          certsPending,
          certsRejected,
          todaysApplications,
          avgResolutionTime,
          slaCompliance,
          charts: {
            complaintTrendData,
            monthlyApplicationsData,
            compByDeptData,
            appByDeptData,
            officerWorkloadData,
            certDonut,
            permitDonut
          },
          timeline: allEvents
        });

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleExportCSV = () => {
    if (!stats) return;
    const header = "Department,Total Complaints,Resolved Complaints,Certificates,Permits\n";
    const csvContent = stats.charts.compByDeptData.map(dept => {
      const appDept = stats.charts.appByDeptData.find(a => a.name === dept.name) || { Certificates: 0, Permits: 0 };
      const resolvedComps = stats.timeline.filter(t => t.type === 'Complaint' && t.status === 'RESOLVED' && t.assignedTo?.includes(dept.name)).length;
      return `${dept.name},${dept.Count},${resolvedComps},${appDept.Certificates},${appDept.Permits}`;
    }).join("\n");
    
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civicpulse_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !stats) {
    return <AppShell title="Admin Dashboard"><PageLoader message="Generating Enterprise Analytics..." /></AppShell>;
  }

  const KpiCard = ({ title, value, sub, icon: Icon, color }) => (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 22px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 200px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <AppShell title="Enterprise Analytics">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 40px 24px', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ── Welcome Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #334155)',
        borderRadius: 16, padding: '24px 32px', color: '#fff',
        display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
        marginBottom: 30, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: '#fff', opacity: 0.03, borderRadius: '50%', filter: 'blur(30px)' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ background: 'rgba(255,255,255,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block' }}>
            ADMINISTRATION
          </span>
          <h2 style={{ margin: '10px 0 6px', fontSize: 28, fontWeight: 800, color: '#ffffff' }}>City Administration Dashboard</h2>
          <p style={{ margin: 0, color: '#cbd5e1', maxWidth: 500, fontSize: 14 }}>
            Real-time municipal performance, application tracking & civic analytics.
          </p>
        </div>
        
        <button onClick={handleExportCSV} style={{
          background: '#fff', color: '#0f172a', border: 'none', padding: '12px 20px',
          borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative', zIndex: 1
        }}>
          Export Report
        </button>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
        <KpiCard title="Total Citizens" value={stats.totalCitizens} icon={Users} color="#3b82f6" />
        <KpiCard title="Total Officers" value={stats.totalOfficers} icon={Briefcase} color="#8b5cf6" />
        <KpiCard title="System Users" value={stats.systemUsers} icon={Hash} color="#64748b" />
        <KpiCard title="Active Depts" value={stats.activeDepartments} icon={Building} color="#0f172a" />
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applications & Permits</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
        <KpiCard title="Certificates Applied" value={stats.certApps} sub={`+${stats.todaysApplications} today`} icon={FileText} color="#3b82f6" />
        <KpiCard title="Permits Applied" value={stats.permitApps} icon={ShieldCheck} color="#f59e0b" />
        <KpiCard title="Certs Approved" value={stats.certsApproved} icon={CheckCircle} color="#10b981" />
        <KpiCard title="Pending Review" value={stats.certsPending} icon={Clock} color="#f59e0b" />
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complaints & SLA</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 30 }}>
        <KpiCard title="Total Complaints" value={stats.totalComplaints} sub={`+${stats.todaysComplaints} today`} icon={AlertTriangle} color="#ef4444" />
        <KpiCard title="Resolved Cases" value={stats.resolvedComplaints} icon={UserCheck} color="#10b981" />
        <KpiCard title="Avg Resolution (Days)" value={stats.avgResolutionTime} icon={Activity} color="#0ea5e9" />
        <KpiCard title="SLA Compliance" value={`${stats.slaCompliance}%`} icon={Award} color={stats.slaCompliance > 90 ? '#10b981' : '#ef4444'} />
      </div>

      {/* Charts Row 1 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><Activity size={20} className="me-2 text-primary"/> Complaint Trend (Last 30 Days)</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.charts.complaintTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="complaints" stroke="#dc3545" fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><PieChart size={20} className="me-2 text-primary"/> Certificates Status</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.charts.certDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#20c997" />
                    <Cell fill="#ffc107" />
                    <Cell fill="#dc3545" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><PieChart size={20} className="me-2 text-warning"/> Permits Status</h5>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.charts.permitDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#20c997" />
                    <Cell fill="#ffc107" />
                    <Cell fill="#dc3545" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><BarChart2 size={20} className="me-2 text-primary"/> Complaints by Dept</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.compByDeptData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={80} />
                  <RechartsTooltip />
                  <Bar dataKey="Count" fill="#dc3545" radius={[0,4,4,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><Activity size={20} className="me-2 text-primary"/> Dept Performance</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3 mt-2">
                {stats.charts.compByDeptData.slice(0, 5).map((d, i) => (
                  <div key={i}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-semibold">{d.name}</span>
                      <span className="small text-muted">{d.Count} Cases</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-success" style={{ width: `${Math.min(100, (d.Count / stats.totalComplaints) * 100 * 2)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><BarChart2 size={20} className="me-2 text-primary"/> Applications by Department</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.appByDeptData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Certificates" stackId="a" fill="#0d6efd" radius={[0,0,4,4]} />
                  <Bar dataKey="Permits" stackId="a" fill="#fd7e14" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold"><Briefcase size={20} className="me-2 text-primary"/> Officer Workload (Pending Cases)</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.officerWorkloadData.slice(0,10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 12}} />
                  <RechartsTooltip />
                  <Bar dataKey="PendingCases" fill="#6f42c1" radius={[0,4,4,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden', marginBottom: 24
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} color="#0f172a" />
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px', fontWeight: '700' }}>Recent Activity Timeline</h3>
        </div>
        <div style={{ padding: 0 }}>
          {stats.timeline.map((evt, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  padding: 10, borderRadius: '50%',
                  background: evt.type === 'Complaint' ? '#fef2f2' : '#eff6ff',
                  color: evt.type === 'Complaint' ? '#ef4444' : '#3b82f6',
                }}>
                  {evt.type === 'Complaint' ? <AlertTriangle size={20}/> : <FileText size={20}/>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{evt.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Assigned to: <span style={{ fontWeight: 600 }}>{evt.assignedTo || 'Unassigned'}</span></div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', marginBottom: 4
                }}>{evt.status?.replace('_', ' ')}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {evt.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {evt.time.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          {stats.timeline.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No recent activity found.</div>}
        </div>
      </div>
      </div>
    </AppShell>
  );
}

export default AdminDashboard;
