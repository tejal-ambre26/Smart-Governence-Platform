import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import OfficerDashboard from './OfficerDashboard.jsx';
import { 
  FileText, Clock, CheckCircle2, PenSquare, 
  List, FilePlus, Search, User, Phone, Inbox,
  AlertTriangle, FileBadge, Gift, Heart, Settings,
  Landmark, ArrowRight, ShieldCheck, Check, Sparkles, Award, ChevronRight, Zap
} from 'lucide-react';

const CITIZEN_MENU = [
  {
    category: 'Certificates & Services',
    subtitle: 'Apply for official government certificates',
    icon: FileBadge,
    color: '#1769AA',
    links: [
      { to: '/services/apply', label: 'Apply for Certificate', icon: FilePlus, desc: 'Birth, Income, Caste & Permits' },
      { to: '/services/tracker', label: 'Track Request', icon: Search, desc: 'Real-time status tracker' },
      { to: '/services/my-certificates', label: 'My Certificates', icon: Award, desc: 'Download issued PDF documents' }
    ]
  },
  {
    category: 'Civic Grievances',
    subtitle: 'Lodge & track municipal complaints',
    icon: AlertTriangle,
    color: '#B42318',
    links: [
      { to: '/complaints/new', label: 'Raise Complaint', icon: PenSquare, desc: 'File new civic or road issue' },
      { to: '/complaints', label: 'My Complaints', icon: List, desc: 'Track resolution timeline' }
    ]
  },
  {
    category: 'Welfare Schemes',
    subtitle: 'Direct Benefit Transfer (DBT) programs',
    icon: Gift,
    color: '#2F7D6D',
    links: [
      { to: '/welfare/apply', label: 'Apply for Welfare', icon: Heart, desc: 'Scholarships & Pensions' },
      { to: '/welfare/my-applications', label: 'Welfare Applications', icon: FileText, desc: 'DBT payment status' }
    ]
  },
  {
    category: 'Account Settings',
    subtitle: 'Manage profile & credentials',
    icon: User,
    color: '#5B6475',
    links: [
      { to: '/profile', label: 'Profile Information', icon: Settings, desc: 'Keycloak Identity & Address' }
    ]
  }
];

function StatusBadge({ status }) {
  let style = { background: '#F1F4F8', color: '#5B6475', border: '1px solid #D9DEE7' };
  if (['NEW', 'SUBMITTED', 'APPLIED'].includes(status)) {
    style = { background: '#EBF4FC', color: '#1769AA', border: '1px solid #BEE3F8' };
  } else if (['UNDER_VERIFICATION', 'ASSIGNED', 'IN_PROGRESS'].includes(status)) {
    style = { background: '#FEF6E7', color: '#A15C00', border: '1px solid #FBD38D' };
  } else if (['RESOLVED', 'APPROVED', 'ISSUED', 'CLOSED'].includes(status)) {
    style = { background: '#EAF6F0', color: '#217346', border: '1px solid #C6F6D5' };
  } else if (['REJECTED'].includes(status)) {
    style = { background: '#FDF2F2', color: '#B42318', border: '1px solid #FEB2B2' };
  }

  return (
    <span style={{
      padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6, ...style
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
      {status || '—'}
    </span>
  );
}

function Dashboard() {
  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isOfficer = roles.includes('OFFICER') || roles.includes('officer') || roles.includes('DEPARTMENT_OFFICER');
  const isAdmin = roles.includes('admin') || roles.includes('ADMIN');
  const isFinanceOfficer = roles.includes('FINANCE_OFFICER') || roles.includes('finance_officer');
  const isApprover = roles.includes('APPROVER') || roles.includes('approver');

  if (isFinanceOfficer || isApprover) return <Navigate to="/welfare/dashboard" replace />;
  if (isAdmin) return <AdminDashboard />;
  if (isOfficer) return <OfficerDashboard />;
  return <CitizenDashboard />;
}

/* ==================== INSTITUTIONAL CITIZEN ACCOUNT ==================== */
function CitizenDashboard() {
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const citizenId = keycloak.tokenParsed?.sub;
  const username = keycloak.tokenParsed?.preferred_username || 'Citizen';
  const name = keycloak.tokenParsed?.name || username;
  const firstName = name.split(' ')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grievance-service/api/complaints');
      const own = res.data.filter(c => c.citizenId === citizenId);
      setMyComplaints(own);
    } catch (e) {
      console.error("Failed to load citizen complaints", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [citizenId]);

  if (loading && !myComplaints.length) {
    return (
      <AppShell title="Citizen Account">
        <PageLoader message="Loading citizen services account..." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Citizen Account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* ── Greeting Header ── */}
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
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1769AA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              OFFICIAL CITIZEN SERVICES ACCOUNT
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: '#172033' }}>
              Good morning, {firstName}
            </h1>
            <div style={{ fontSize: 14, color: '#5B6475', marginTop: 4 }}>
              What government service or certificate would you like to access today?
            </div>
          </div>

          <Link to="/services/apply" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#1769AA', color: '#FFFFFF', border: 'none',
              padding: '10px 20px', borderRadius: 6, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}>
              Find a Service <ArrowRight size={16} />
            </button>
          </Link>
        </div>

        {/* ── Active Request Progress Stepper Highlight Card ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D9DEE7',
          borderRadius: 8,
          padding: '24px 28px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#5B6475', textTransform: 'uppercase' }}>YOUR ACTIVE REQUEST</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '2px 0 0' }}>Income Certificate — APP-2026-0022</h2>
            </div>
            <Link to="/services/tracker" style={{ fontSize: 13, fontWeight: 700, color: '#1769AA', textDecoration: 'none' }}>
              View Details →
            </Link>
          </div>

          {/* Horizontal Progress Timeline */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            background: '#F7F8FA',
            padding: '16px',
            borderRadius: 6,
            border: '1px solid #E8ECF2'
          }}>
            <div style={{ borderLeft: '3px solid #217346', paddingLeft: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#217346' }}>✓ COMPLETED</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>Submitted</div>
              <div style={{ fontSize: 12, color: '#8892A4' }}>15 Aug 2026</div>
            </div>

            <div style={{ borderLeft: '3px solid #1769AA', paddingLeft: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1769AA' }}>● CURRENT STAGE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>Under Verification</div>
              <div style={{ fontSize: 12, color: '#5B6475' }}>Revenue Department</div>
            </div>

            <div style={{ borderLeft: '3px solid #D9DEE7', paddingLeft: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#8892A4' }}>○ UPCOMING</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#8892A4' }}>Approval</div>
              <div style={{ fontSize: 12, color: '#8892A4' }}>Pending Sign</div>
            </div>

            <div style={{ borderLeft: '3px solid #D9DEE7', paddingLeft: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#8892A4' }}>○ UPCOMING</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#8892A4' }}>Issued</div>
              <div style={{ fontSize: 12, color: '#8892A4' }}>PDF Download</div>
            </div>
          </div>
        </div>

        {/* ── Services Directory Categories ── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', marginBottom: 16 }}>Services Directory</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {CITIZEN_MENU.map((menu, i) => {
              const IconComp = menu.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D9DEE7',
                    borderRadius: 8,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 6,
                      background: '#F1F4F8', color: menu.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconComp size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#172033' }}>{menu.category}</h3>
                      <div style={{ fontSize: 13, color: '#5B6475', marginTop: 2 }}>{menu.subtitle}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {menu.links.map((link, j) => {
                      const LinkIcon = link.icon;
                      return (
                        <Link
                          key={j} to={link.to}
                          style={{
                            textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: 6,
                            background: '#F7F8FA', border: '1px solid #E8ECF2',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <LinkIcon size={16} style={{ color: menu.color }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>{link.label}</div>
                              <div style={{ fontSize: 11, color: '#8892A4' }}>{link.desc}</div>
                            </div>
                          </div>
                          <ChevronRight size={16} color="#8892A4" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent Activity Timeline Table ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>Recent Grievances & Cases</h2>
            <Link to="/complaints" style={{ fontSize: 13, fontWeight: 700, color: '#1769AA', textDecoration: 'none' }}>
              View All Complaints →
            </Link>
          </div>

          {myComplaints.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: '#F7F8FA', borderRadius: 6, border: '1px solid #E8ECF2' }}>
              <Inbox size={36} color="#8892A4" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#172033' }}>No complaints submitted</div>
              <div style={{ fontSize: 13, color: '#5B6475', marginTop: 4, marginBottom: 16 }}>Raise a grievance to receive civic department assistance</div>
              <Link to="/complaints/new" style={{ textDecoration: 'none' }}>
                <button style={{ background: '#1769AA', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Raise Complaint
                </button>
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #D9DEE7' }}>
                  <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>ID</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Subject</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Department</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#5B6475' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#5B6475', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {myComplaints.slice(0, 5).map(c => (
                  <tr key={c.complaintId} style={{ borderBottom: '1px solid #E8ECF2' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', color: '#1769AA', fontWeight: 700 }}>
                      #{c.complaintId?.slice(0, 8)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#172033' }}>{c.title}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#5B6475' }}>{c.department}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <Link to={`/complaints/${c.complaintId}`} style={{ fontSize: 13, fontWeight: 700, color: '#1769AA', textDecoration: 'none' }}>
                        Track Case →
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

export default Dashboard;
