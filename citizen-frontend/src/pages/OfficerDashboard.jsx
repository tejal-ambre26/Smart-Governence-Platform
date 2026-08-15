import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import {
  FileText, Search, Inbox, CheckCircle2, Clock, ShieldAlert,
  Filter, ArrowRight, UserCheck, RefreshCw, AlertTriangle, Building, Eye
} from 'lucide-react';

const OFFICER_DEPT_MAP = {
  'healthofficer.org': 'Health Department',
  'revenueofficer.org': 'Revenue Department',
  'municipalofficer.org': 'Municipal Corporation',
  'waterofficer.org': 'Water Department',
  'roadsofficer.org': 'Roads Department',
  'electricityofficer.org': 'Electricity Department',
  'socialwelfareofficer.org': 'Social Welfare Department',
  'urbanofficer.org': 'Urban Planning Department',
  'educationofficer.org': 'Education Department',

  john: 'Health Department',
  mark: 'Revenue Department',
  ryan: 'Municipal Corporation',
  chris: 'Water Department',
  ethan: 'Roads Department',
  jack: 'Electricity Department',
  david: 'Sanitation Department',
  will: 'Urban Planning Department',
  emily: 'Education Department'
};

const OFFICER_NAME_MAP = {
  'healthofficer.org': 'John',
  'revenueofficer.org': 'Mark',
  'municipalofficer.org': 'Ryan',
  'waterofficer.org': 'Chris',
  'roadsofficer.org': 'Ethan',
  'electricityofficer.org': 'Jack',
  'socialwelfareofficer.org': 'David',
  'urbanofficer.org': 'Will',
  'educationofficer.org': 'Emily',

  john: 'John',
  mark: 'Mark',
  ryan: 'Ryan',
  chris: 'Chris',
  ethan: 'Ethan',
  jack: 'Jack',
  david: 'David',
  will: 'Will',
  emily: 'Emily'
};

function StatusPill({ status }) {
  let style = { background: '#F1F4F8', color: '#5B6475', border: '1px solid #D9DEE7' };
  if (['SUBMITTED', 'RESUBMITTED'].includes(status)) {
    style = { background: '#FEF6E7', color: '#A15C00', border: '1px solid #FBD38D' };
  } else if (status === 'UNDER_VERIFICATION') {
    style = { background: '#EBF4FC', color: '#1769AA', border: '1px solid #BEE3F8' };
  } else if (['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(status)) {
    style = { background: '#EAF6F0', color: '#217346', border: '1px solid #C6F6D5' };
  } else if (status === 'REJECTED') {
    style = { background: '#FDF2F2', color: '#B42318', border: '1px solid #FEB2B2' };
  }

  return (
    <span style={{
      padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6, ...style
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
      {status}
    </span>
  );
}

export default function OfficerDashboard() {
  const [certStats, setCertStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [officerDept, setOfficerDept] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const navigate = useNavigate();

  const username = keycloak.tokenParsed?.preferred_username || 'Officer';
  const rawName = keycloak.tokenParsed?.name || username;
  const name = OFFICER_NAME_MAP[username.toLowerCase()] || (rawName.includes('.org') ? username : rawName);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, recentRes, complaintsRes] = await Promise.allSettled([
        api.get('/service-management-service/api/services/officer/stats'),
        api.get('/service-management-service/api/services/officer/recent'),
        api.get('/grievance-service/api/complaints/officer?size=50')
      ]);
      
      if (statsRes.status === 'fulfilled') setCertStats(statsRes.value.data);
      if (recentRes.status === 'fulfilled') setRecentApps(recentRes.value.data || []);
      if (complaintsRes.status === 'fulfilled') {
        setComplaints(complaintsRes.value.data.content || complaintsRes.value.data || []);
      }
      
      let dept = keycloak.tokenParsed?.department || OFFICER_DEPT_MAP[username.toLowerCase()] || 'Municipal Department';
      setOfficerDept(dept);
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredApps = recentApps.filter(app => {
    const matchesSearch = !searchQuery || 
      app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'PENDING') return ['SUBMITTED', 'RESUBMITTED'].includes(app.status);
    if (statusFilter === 'VERIFICATION') return app.status === 'UNDER_VERIFICATION';
    if (statusFilter === 'APPROVED') return ['APPROVED', 'CERTIFICATE_GENERATED'].includes(app.status);
    return true;
  });

  if (isLoading && !recentApps.length && !complaints.length) {
    return (
      <AppShell title="Officer Workspace">
        <PageLoader message="Loading Officer Operations Workspace..." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Officer Workspace">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Officer Header ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D9DEE7',
          borderRadius: 8,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#2F7D6D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              DEPARTMENT OPERATIONS WORKSPACE
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#172033', margin: '4px 0 0' }}>
              {officerDept} — Queue Workstation
            </h1>
            <div style={{ fontSize: 14, color: '#5B6475', marginTop: 4 }}>
              Officer: <strong>{name}</strong> · Verification queue & document inspection pipeline
            </div>
          </div>

          <button
            onClick={fetchDashboardData}
            style={{
              height: 38, padding: '0 16px', borderRadius: 6,
              border: '1px solid #D9DEE7', background: '#FFFFFF', color: '#172033',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>

        {/* ── Queue Metric Counters Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#5B6475', fontWeight: 700 }}>Total Verification Queue</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#172033', marginTop: 4 }}>{recentApps.length}</div>
            <div style={{ fontSize: 12, color: '#8892A4', marginTop: 2 }}>Assigned applications</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#A15C00', fontWeight: 700 }}>Pending Review</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#A15C00', marginTop: 4 }}>
              {recentApps.filter(a => ['SUBMITTED', 'RESUBMITTED'].includes(a.status)).length}
            </div>
            <div style={{ fontSize: 12, color: '#8892A4', marginTop: 2 }}>Requires initial action</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#1769AA', fontWeight: 700 }}>Under Verification</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1769AA', marginTop: 4 }}>
              {recentApps.filter(a => a.status === 'UNDER_VERIFICATION').length}
            </div>
            <div style={{ fontSize: 12, color: '#8892A4', marginTop: 2 }}>In active document check</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 12, color: '#217346', fontWeight: 700 }}>Approved & Issued</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#217346', marginTop: 4 }}>
              {recentApps.filter(a => ['APPROVED', 'CERTIFICATE_GENERATED'].includes(a.status)).length}
            </div>
            <div style={{ fontSize: 12, color: '#8892A4', marginTop: 2 }}>Digitally signed</div>
          </div>
        </div>

        {/* ── Queue Filters & Search Toolbar ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D9DEE7',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'ALL', label: 'All Applications' },
              { id: 'PENDING', label: 'Pending Action' },
              { id: 'VERIFICATION', label: 'In Verification' },
              { id: 'APPROVED', label: 'Approved' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: statusFilter === tab.id ? '1px solid #1769AA' : '1px solid #D9DEE7',
                  background: statusFilter === tab.id ? '#EBF4FC' : '#FFFFFF',
                  color: statusFilter === tab.id ? '#1769AA' : '#5B6475',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#8892A4' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or applicant name..."
              style={{
                width: '100%', height: 36, paddingLeft: 36, paddingRight: 12, borderRadius: 6,
                border: '1px solid #D9DEE7', fontSize: 13, color: '#172033', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* ── Queue-First Application Queue Table ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #D9DEE7', fontWeight: 800, fontSize: 15, color: '#172033' }}>
            APPLICATION QUEUE ({filteredApps.length})
          </div>

          {filteredApps.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Inbox size={40} color="#8892A4" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#172033' }}>No applications in queue</div>
              <div style={{ fontSize: 13, color: '#5B6475', marginTop: 4 }}>All department service requests have been reviewed</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #D9DEE7' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Application ID</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Service Type</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Applicant Name</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#5B6475', textAlign: 'right' }}>Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #E8ECF2' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#1769AA' }}>
                      {app.applicationNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#172033' }}>
                      {app.serviceType?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#172033' }}>
                      {app.applicantName}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusPill status={app.status} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link to={`/services/officer/verify/${app.id}`}>
                        <button style={{
                          background: '#1769AA', color: '#FFFFFF', border: 'none',
                          padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                        }}>
                          <Eye size={14} /> Review
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AppShell>
  );
}
