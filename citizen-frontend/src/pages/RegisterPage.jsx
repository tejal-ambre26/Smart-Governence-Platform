import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import publicApi from '../publicApi.js';

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 2-step form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
    aadhar: '', address: '', ward: '', city: '', state: 'India', pincode: ''
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.includes('@')) return 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phoneNumber)) return 'Phone must be a valid 10-digit Indian number (starting with 6–9).';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const validateStep2 = () => {
    if (!form.address.trim()) return 'Address is required.';
    if (!form.ward.trim()) return 'Ward number is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!/^\d{6}$/.test(form.pincode)) return 'PIN code must be exactly 6 digits.';
    if (form.aadhar && !/^\d{4}-\d{4}-\d{4}$/.test(form.aadhar)) return 'Aadhaar must be in format 1234-5678-9012.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    const payload = {
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      password: form.password,
      aadhar: form.aadhar || null,
      address: form.address,
      ward: form.ward,
      city: form.city,
      state: form.state || 'India',
      pincode: form.pincode,
    };

    try {
      await publicApi.post('/api/citizens/auth/register', payload);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-content">
            <span className="big-icon">🎉</span>
            <h2>Welcome to Smart Governance Platform!</h2>
            <p>Your citizen account has been created. You can now log in and start using all government services.</p>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <div className="auth-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
              <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>Registration Successful!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.7' }}>
                Your account has been created and your Keycloak credentials are ready.
                You can now login with your email and password.
              </p>
              <Link to="/login" className="btn btn-primary btn-full btn-lg">
                🔐 Proceed to Login
              </Link>
              <div style={{ marginTop: '14px' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>← Back to Home</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="big-icon">🏛️</span>
          <h2>Join Smart Governance Platform</h2>
          <p>
            Register as a citizen to file grievances, track status, apply for government
            certificates, and access all e-Governance services.
          </p>
          <div className="auth-trust-badges">
            <div className="trust-badge">🔒 256-bit SSL</div>
            <div className="trust-badge">🛡️ Aadhaar Verified</div>
            <div className="trust-badge">🇮🇳 Govt. Portal</div>
          </div>
          {/* Step indicator */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= 1 ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              color: 'white', fontWeight: '800', fontSize: '14px'
            }}>1</div>
            <div style={{ width: '40px', height: '2px', background: step === 2 ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step === 2 ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
              color: 'white', fontWeight: '800', fontSize: '14px'
            }}>2</div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', opacity: '0.7', color: 'white' }}>
            Step {step} of 2 — {step === 1 ? 'Account Details' : 'Address & Location'}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right" style={{ padding: '24px 40px', overflowY: 'auto' }}>
        <div className="auth-form-container" style={{ maxWidth: '500px' }}>
          <div className="auth-form-header">
            <div className="logo-row">
              <div className="logo-icon">🏛️</div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>Citizen Registration</div>
              </div>
            </div>
            <h2>{step === 1 ? 'Create Your Account' : 'Your Address Details'}</h2>
            <p>{step === 1 ? 'Enter your personal and login information' : 'Enter your residential address'}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <div className="auth-card">
            {step === 1 ? (
              /* Step 1 */
              <div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-control" value={form.name} onChange={set('name')} placeholder="e.g. Ramesh Kumar" />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="e.g. ramesh@email.com" />
                  <div className="form-hint">This will be your login email</div>
                </div>
                <div className="form-group">
                  <label>Phone Number * (10 digits)</label>
                  <input className="form-control" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. 9876543210" maxLength={10} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" className="form-control" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input type="password" className="form-control" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" />
                  </div>
                </div>
                <button type="button" className="btn btn-primary btn-full" style={{ marginTop: '8px' }} onClick={handleNext}>
                  Next — Address Details →
                </button>
              </div>
            ) : (
              /* Step 2 */
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Aadhaar Number (Optional)</label>
                  <input className="form-control" value={form.aadhar} onChange={set('aadhar')} placeholder="Format: 1234-5678-9012" />
                </div>
                <div className="form-group">
                  <label>Residential Address *</label>
                  <input className="form-control" value={form.address} onChange={set('address')} placeholder="Flat no., Street, Area/Locality" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ward *</label>
                    <input className="form-control" value={form.ward} onChange={set('ward')} placeholder="e.g. Ward 12" />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input className="form-control" value={form.city} onChange={set('city')} placeholder="e.g. New Delhi" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" value={form.state} onChange={set('state')} placeholder="e.g. Delhi" />
                  </div>
                  <div className="form-group">
                    <label>PIN Code * (6 digits)</label>
                    <input className="form-control" value={form.pincode} onChange={set('pincode')} placeholder="110001" maxLength={6} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => { setStep(1); setError(''); }}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-accent btn-full" disabled={loading}>
                    {loading ? <><span className="spinner-sm" /> Registering...</> : '✅ Complete Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="auth-footer" style={{ marginTop: '16px' }}>
            Already have an account? <Link to="/login">Login here</Link>
          </div>
          <div className="auth-footer">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
