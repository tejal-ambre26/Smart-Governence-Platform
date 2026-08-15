import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import keycloak from '../keycloak.js';
import { 
  Landmark, ShieldAlert, User, Briefcase, Lock, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Globe
} from 'lucide-react';

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginRole, setLoginRole] = useState('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('cp_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Username or email is required.';
    if (!password) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', 'civicpulse-frontend');
      
      let finalUsername = email.trim();
      if (finalUsername === 'citizen4') {
        finalUsername = 'citizen4@gmail.com';
      }
      
      params.append('username', finalUsername);
      params.append('password', password);

      const response = await axios.post(
        'http://localhost:8180/realms/civicpulse/protocol/openid-connect/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, id_token } = response.data;

      // Validate Portal vs Role before accepting tokens
      const payload = decodeJwt(access_token);
      const roles = payload?.realm_access?.roles || [];
      const isCitizenRole = roles.includes('CITIZEN') || roles.includes('citizen');
      const isOfficerRole = roles.includes('OFFICER') || roles.includes('officer');
      const isAdminRole = roles.includes('ADMIN') || roles.includes('admin');

      if (loginRole === 'citizen') {
        if (isOfficerRole || isAdminRole) {
          setError('Access Denied. This account belongs to the Officer Portal. Please login using the Officer Portal.');
          setLoading(false);
          return;
        }
      } else if (loginRole === 'officer') {
        if (isCitizenRole && !isOfficerRole && !isAdminRole) {
          setError('Access Denied. Citizen accounts can only login through the Citizen Portal. Please switch to the Citizen Portal.');
          setLoading(false);
          return;
        }
      }

      // If valid, save credentials
      if (rememberMe) {
        localStorage.setItem('cp_remember_email', email);
      } else {
        localStorage.removeItem('cp_remember_email');
      }

      localStorage.setItem('kc_token', access_token);
      localStorage.setItem('kc_refreshToken', refresh_token);
      if (id_token) {
        localStorage.setItem('kc_idToken', id_token);
      }

      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Direct grant login failed:', err);
      if (err.response) {
        const errorDesc = err.response.data?.error_description || 'Invalid credentials or login flow not supported.';
        setError(errorDesc);
      } else {
        setError('Cannot connect to identity server. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleKeycloakSSORedirect = () => {
    keycloak.login({ redirectUri: window.location.origin + '/dashboard' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F8FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      color: '#172033'
    }}>
      
      {/* ── Brand Logo Header ── */}
      <div style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8, background: '#1769AA', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Landmark size={24} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#172033', letterSpacing: '-0.02em', lineHeight: 1 }}>
            SMART GOVERNANCE PLATFORM
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5B6475', marginTop: 2 }}>
            Digital Citizen Services
          </div>
        </div>
      </div>

      {/* ── Institutional Centered Sign In Card ── */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#FFFFFF',
        border: '1px solid #D9DEE7',
        borderRadius: 8,
        padding: '36px 32px',
        boxShadow: '0 4px 12px rgba(23, 32, 51, 0.05)'
      }}>
        
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172033', margin: 0, textAlign: 'center' }}>
          Sign in to Smart Governance Platform
        </h1>
        <p style={{ fontSize: 14, color: '#5B6475', marginTop: 6, marginBottom: 24, textAlign: 'center' }}>
          Access your official digital government services portal
        </p>

        {/* Role Portal Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          background: '#F1F4F8',
          padding: 4,
          borderRadius: 6,
          marginBottom: 24
        }}>
          <button
            type="button"
            onClick={() => setLoginRole('citizen')}
            style={{
              padding: '10px 12px',
              borderRadius: 4,
              border: 'none',
              background: loginRole === 'citizen' ? '#FFFFFF' : 'transparent',
              color: loginRole === 'citizen' ? '#1769AA' : '#5B6475',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: loginRole === 'citizen' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <User size={16} /> Citizen Portal
          </button>

          <button
            type="button"
            onClick={() => setLoginRole('officer')}
            style={{
              padding: '10px 12px',
              borderRadius: 4,
              border: 'none',
              background: loginRole === 'officer' ? '#FFFFFF' : 'transparent',
              color: loginRole === 'officer' ? '#2F7D6D' : '#5B6475',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: loginRole === 'officer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <Briefcase size={16} /> Officer Portal
          </button>
        </div>

        {/* Alert Message */}
        {error && (
          <div style={{
            background: '#FDF2F2', border: '1px solid #F87171', borderRadius: 6, padding: '12px 14px',
            color: '#B42318', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 20
          }}>
            <ShieldAlert size={18} className="shrink-0" />
            <div style={{ lineHeight: 1.4 }}>{error}</div>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          <div>
            <label htmlFor="login-username" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#172033', marginBottom: 6 }}>
              Username or Email address <span style={{ color: '#B42318' }}>*</span>
            </label>
            <input
              id="login-username"
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors({ ...fieldErrors, email: null }); }}
              placeholder="Enter username"
              style={{
                width: '100%', height: 44, padding: '0 14px', borderRadius: 6,
                border: fieldErrors.email ? '1px solid #B42318' : '1px solid #D9DEE7',
                fontSize: 14, color: '#172033', background: '#FFFFFF', outline: 'none'
              }}
            />
            {fieldErrors.email && <div style={{ fontSize: 12, color: '#B42318', marginTop: 4, fontWeight: 600 }}>{fieldErrors.email}</div>}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>
                Password <span style={{ color: '#B42318' }}>*</span>
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors({ ...fieldErrors, password: null }); }}
                placeholder="••••••••"
                style={{
                  width: '100%', height: 44, paddingLeft: 14, paddingRight: 44, borderRadius: 6,
                  border: fieldErrors.password ? '1px solid #B42318' : '1px solid #D9DEE7',
                  fontSize: 14, color: '#172033', background: '#FFFFFF', outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#5B6475' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <div style={{ fontSize: 12, color: '#B42318', marginTop: 4, fontWeight: 600 }}>{fieldErrors.password}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1769AA' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: 13, color: '#5B6475', cursor: 'pointer', fontWeight: 500 }}>
              Remember my username on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 46, borderRadius: 6, border: 'none',
              background: loginRole === 'citizen' ? '#1769AA' : '#2F7D6D',
              color: '#FFFFFF', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, opacity: loading ? 0.8 : 1, transition: 'background 0.15s'
            }}
          >
            {loading ? 'Authenticating...' : `Sign in as ${loginRole === 'citizen' ? 'Citizen' : 'Officer'}`}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#D9DEE7' }} />
          <span style={{ fontSize: 12, color: '#8892A4', fontWeight: 700, textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#D9DEE7' }} />
        </div>

        {/* SSO Redirect Button */}
        <button
          type="button"
          onClick={handleKeycloakSSORedirect}
          style={{
            width: '100%', height: 44, borderRadius: 6, background: '#FFFFFF', color: '#172033',
            border: '1px solid #D9DEE7', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <Globe size={18} style={{ color: '#1769AA' }} /> Keycloak Single Sign-On (SSO)
        </button>

        <div style={{ textAlign: 'center', fontSize: 14, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E8ECF2' }}>
          <span style={{ color: '#5B6475' }}>New citizen? </span>
          <Link to="/register" style={{ color: '#1769AA', fontWeight: 700, textDecoration: 'none' }}>
            Register for an account
          </Link>
        </div>

      </div>

      <div style={{ fontSize: 12, color: '#8892A4', marginTop: 24, textAlign: 'center' }}>
        Secure authentication powered by Keycloak OIDC Identity Provider
      </div>

    </div>
  );
}

export default LoginPage;
