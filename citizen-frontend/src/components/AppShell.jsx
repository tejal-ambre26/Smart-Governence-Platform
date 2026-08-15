import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import keycloak from '../keycloak.js';
import NotificationCenter from './NotificationCenter.jsx';
import { 
  Landmark, Search, Bell, User, LogOut, Menu, X, ShieldCheck, 
  FileText, Heart, CheckCircle2, ChevronDown, Award, Clock, ArrowRight
} from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function AppShell({ children, title }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const username = keycloak.tokenParsed?.preferred_username || 'User';
  const name     = keycloak.tokenParsed?.name || username;
  const email    = keycloak.tokenParsed?.email || username;
  const roles    = keycloak.tokenParsed?.realm_access?.roles || [];
  
  const isAdmin     = roles.includes('admin') || roles.includes('ADMIN');
  const isOfficer   = roles.includes('OFFICER') || roles.includes('officer') || roles.includes('DEPARTMENT_OFFICER');
  const isApprover  = roles.includes('APPROVER') || roles.includes('approver');
  const isFinance   = roles.includes('FINANCE_OFFICER') || roles.includes('finance_officer');

  // Horizontal Navigation Links based on role
  let navItems = [];
  if (isAdmin) {
    navItems = [
      { to: '/admin/dashboard', label: 'Admin Home' },
      { to: '/admin/officers', label: 'Officers' },
      { to: '/admin/certificates', label: 'Certificates Setup' },
      { to: '/welfare/admin-dashboard', label: 'Budget & Fund' },
      { to: '/reports', label: 'Governance Reports' },
      { to: '/admin/ai-analysis', label: 'AI Analysis & Insights' },
    ];
  } else if (isOfficer) {
    navItems = [
      { to: '/services/officer/dashboard', label: 'Officer Workspace' },
      { to: '/welfare/department-dashboard', label: 'Welfare Verification' },
      { to: '/notifications', label: 'Notifications' },
    ];
  } else if (isFinance || isApprover) {
    navItems = [
      { to: '/welfare/dashboard', label: 'Welfare Dashboard' },
      { to: '/welfare/approve', label: 'Approval Queue' },
      { to: '/notifications', label: 'Notifications' },
    ];
  } else {
    // Citizen Navigation
    navItems = [
      { to: '/dashboard', label: 'Home' },
      { to: '/services/apply', label: 'Services' },
      { to: '/welfare/apply', label: 'Welfare & Schemes' },
      { to: '/services/my-certificates', label: 'My Applications' },
      { to: '/welfare/my-applications', label: 'My Schemes' },
      { to: '/services/tracker', label: 'Track Request' },
      { to: '/complaints', label: 'Grievances' },
      { to: '/notifications', label: 'Notifications' },
    ];
  }

  const handleLogout = () => {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refreshToken');
    localStorage.removeItem('kc_idToken');
    keycloak.logout({ redirectUri: window.location.origin + '/login' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', color: '#172033', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      
      {/* ── Institutional Top Bar ── */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #D9DEE7',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(23,32,51,0.05)'
      }}>
        
        {/* Brand & Utility Top Strip */}
        <div style={{
          maxWidth: '96%',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Brand Logo & Tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <NavLink to={isOfficer ? '/services/officer/dashboard' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#1769AA',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 18
              }}>
                <Landmark size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#172033', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  SMART GOVERNANCE PLATFORM
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5B6475', letterSpacing: '0.02em' }}>
                  Digital Citizen Services
                </div>
              </div>
            </NavLink>
          </div>

          {/* Search & Actions Bar (Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Quick Service Search */}
            <div className="hidden md:flex" style={{ position: 'relative', width: 260 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#8892A4' }} />
              <input
                type="text"
                placeholder="Search services or requests..."
                onClick={() => navigate('/services/apply')}
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 36,
                  paddingRight: 12,
                  borderRadius: 6,
                  border: '1px solid #D9DEE7',
                  background: '#F7F8FA',
                  fontSize: 13,
                  color: '#172033',
                  outline: 'none'
                }}
              />
            </div>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* User Profile Info Chip */}
            <div className="hidden sm:flex" style={{
              alignItems: 'center',
              gap: 10,
              padding: '4px 10px 4px 6px',
              borderRadius: 20,
              background: '#F1F4F8',
              border: '1px solid #D9DEE7'
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1769AA',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800
              }}>
                {getInitials(name)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#172033', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 6,
                border: '1px solid #D9DEE7',
                background: '#FFFFFF',
                color: '#B42318',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                border: '1px solid #D9DEE7',
                background: '#FFFFFF',
                color: '#172033',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Horizontal Service Navigation Links Strip */}
        <div style={{ background: '#FFFFFF', borderTop: '1px solid #E8ECF2' }}>
          <div style={{
            maxWidth: '96%',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            overflowX: 'auto'
          }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 0',
                  fontSize: 14,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#1769AA' : '#5B6475',
                  textDecoration: 'none',
                  borderBottom: isActive ? '3px solid #1769AA' : '3px solid transparent',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #D9DEE7',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }} className="md:hidden">
          <div style={{ fontSize: 12, fontWeight: 800, color: '#8892A4', textTransform: 'uppercase' }}>Navigation Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '10px 14px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#1769AA' : '#172033',
                background: isActive ? '#EBF4FC' : 'transparent',
                textDecoration: 'none'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* ── Main Service Content Workspace ── */}
      <main style={{ maxWidth: '96%', margin: '0 auto', padding: '24px 20px 60px' }}>
        {children}
      </main>

      {/* ── Institutional Footer ── */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid #D9DEE7',
        padding: '24px 0',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '96%',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 13, color: '#5B6475', fontWeight: 500 }}>
            © 2026 <strong>Smart Governance Platform</strong>. Official Public Service Platform.
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#1769AA', fontWeight: 600 }}>
            <NavLink to="/services/apply" style={{ color: '#1769AA', textDecoration: 'none' }}>Services Directory</NavLink>
            <NavLink to="/services/tracker" style={{ color: '#1769AA', textDecoration: 'none' }}>Track Application</NavLink>
            <NavLink to="/notifications" style={{ color: '#1769AA', textDecoration: 'none' }}>Notifications</NavLink>
          </div>
        </div>
      </footer>

    </div>
  );
}
