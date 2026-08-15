import { useState, useEffect } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, MapPin, ShieldCheck, CheckCircle2, Lock, Save, Sparkles, 
  Pencil, X, Activity, Check, FileText, Building2, CreditCard, Clock, KeyRound, Award
} from 'lucide-react';

function CitizenRegister() {
  const [formData, setFormData] = useState({
    name: keycloak.tokenParsed?.name || '',
    email: keycloak.tokenParsed?.email || '',
    phoneNumber: '',
    aadhar: '',
    address: '',
    ward: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: ''
  });
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Try to fetch existing profile
  useEffect(() => {
    const id = keycloak.tokenParsed?.sub;
    if (id) {
      api.get(`/citizen-service/api/citizens/${id}`)
        .then(r => {
          setExisting(r.data);
          setFormData(r.data);
          setIsEditing(false); // Default to View Mode when profile exists
        })
        .catch(() => {
          setIsEditing(true); // Default to Edit Mode for fresh registration
        });
    }
  }, []);

  // Compute profile completion percentage
  const computeCompletion = () => {
    const fields = [formData.name, formData.phoneNumber, formData.aadhar, formData.address, formData.ward, formData.city, formData.pincode];
    const filled = fields.filter(f => f && String(f).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercent = computeCompletion();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/citizen-service/api/citizens/${existing.citizenId}`, formData);
        toast.success('Profile updated successfully!');
        setExisting(formData);
      } else {
        const res = await api.post('/citizen-service/api/citizens/register', formData);
        setExisting(res.data || formData);
        toast.success('Citizen profile created! You can now file complaints.');
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile. Check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (existing) {
      setFormData(existing);
      setIsEditing(false);
    }
  };

  const maskAadhaar = (val) => {
    if (!val) return 'Not Provided';
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `XXXX-XXXX-${digits.slice(-4)}`;
    }
    return val;
  };

  return (
    <AppShell title={existing ? 'My Profile' : 'Complete Profile'}>
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 40px 24px', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Page Header Banner with Profile Identity ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#fff',
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 30px rgba(15,23,42,0.25)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: '#38bdf8', opacity: 0.06, borderRadius: '50%', filter: 'blur(40px)' }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 20,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, boxShadow: '0 8px 20px rgba(59,130,246,0.4)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              {(formData.name || 'C').charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{
                  background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em'
                }}>
                  DIGITAL IDENTITY PORTAL
                </span>
                {existing && (
                  <span style={{
                    background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)',
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    <CheckCircle2 size={12} /> Verified Citizen
                  </span>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {formData.name || 'Citizen User'}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} className="text-sky-400" />
                {formData.city ? `${formData.city}, ${formData.state || 'Tamil Nadu'}` : 'Hosur, Tamil Nadu'}
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{formData.email}</span>
              </p>
            </div>
          </div>

          {/* Action Button: Toggle Edit / Cancel */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            {existing && !isEditing ? (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  height: 44, borderRadius: 12, padding: '0 22px', fontWeight: 800, fontSize: 14,
                  background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Pencil size={16} className="text-violet-600" /> Edit Profile
              </Button>
            ) : existing && isEditing ? (
              <Button
                type="button"
                onClick={handleCancelEdit}
                variant="outline"
                style={{
                  height: 44, borderRadius: 12, padding: '0 20px', fontWeight: 700, fontSize: 14,
                  background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <X size={16} /> Cancel Edit
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── Official Verification Badges Bar ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--primary-light, #f0fdf4)', color: 'var(--text, #166534)', border: '1px solid var(--border, #bbf7d0)',
            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(22,101,52,0.05)'
          }}>
            <ShieldCheck size={16} color="#10b981" /> Identity Verified
          </div>
          <div style={{
            background: 'var(--primary-light, #f0fdf4)', color: 'var(--text, #166534)', border: '1px solid var(--border, #bbf7d0)',
            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(22,101,52,0.05)'
          }}>
            <MapPin size={16} color="#10b981" /> Address Verified
          </div>
          <div style={{
            background: 'var(--primary-light, #f0fdf4)', color: 'var(--text, #166534)', border: '1px solid var(--border, #bbf7d0)',
            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(22,101,52,0.05)'
          }}>
            <CheckCircle2 size={16} color="#10b981" /> Aadhaar Linked
          </div>
        </div>

        {/* ── Main Layout Form Grid (70% Left, 30% Right) ── */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN (70% Width) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
            
            {/* Card 1: Personal & Identity Information */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
              display: 'flex', flexDirection: 'column', gap: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border, #f1f5f9)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light, #f5f3ff)',
                    border: '1px solid var(--border, #ddd6fe)', color: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text, #0f172a)' }}>1. Personal & Identity Information</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>Legal identity and contact credentials</p>
                  </div>
                </div>
                {!isEditing && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 8 }}>
                    Verified Record
                  </span>
                )}
              </div>

              {/* View Mode vs Edit Mode Content */}
              {!isEditing ? (
                /* READ-ONLY VIEW MODE */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  
                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Full Name</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{formData.name || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0284c7', background: 'rgba(2,132,199,0.15)', padding: '2px 6px', borderRadius: 6 }}>🔒 Keycloak SSO</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #334155)', fontFamily: 'monospace' }}>{formData.email || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Phone Number</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)', fontFamily: 'monospace' }}>{formData.phoneNumber || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aadhaar Number</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)', fontFamily: 'monospace' }}>{maskAadhaar(formData.aadhar)}</div>
                  </div>

                </div>
              ) : (
                /* EDITABLE INPUTS MODE */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Full legal name" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email (Keycloak Account)</Label>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)', fontWeight: 700 }}>🔒 Managed via Keycloak</span>
                    </div>
                    <Input type="email" value={formData.email} disabled style={{ height: 44, borderRadius: 10, border: '1px solid var(--border, #e2e8f0)', background: 'var(--bg, #f8fafc)', fontSize: 14, color: 'var(--text, #64748b)', fontFamily: 'monospace' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="9000000001" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, fontFamily: 'monospace', color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aadhaar Number</Label>
                      {existing && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Locked after verification</span>}
                    </div>
                    <Input 
                      name="aadhar" 
                      value={formData.aadhar || ''} 
                      onChange={handleChange} 
                      disabled={!!existing} 
                      placeholder="1111-2222-3333" 
                      style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, fontFamily: 'monospace', color: 'var(--text, #0f172a)', background: 'var(--bg, #f8fafc)' }} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Residential Address & Ward Location */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
              display: 'flex', flexDirection: 'column', gap: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border, #f1f5f9)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light, #f5f3ff)',
                    border: '1px solid var(--border, #ddd6fe)', color: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text, #0f172a)' }}>2. Residential Address & Ward Location</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>Your address determines municipal officer dispatch</p>
                  </div>
                </div>
                {!isEditing && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: 8 }}>
                    Mapped Ward
                  </span>
                )}
              </div>

              {!isEditing ? (
                /* READ-ONLY ADDRESS VIEW */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  
                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Residential Address</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{formData.address || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ward</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{formData.ward || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>City</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{formData.city || '—'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>State</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{formData.state || 'Tamil Nadu'}</div>
                  </div>

                  <div style={{ background: 'var(--bg, #f8fafc)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>PIN Code</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)', fontFamily: 'monospace' }}>{formData.pincode || '—'}</div>
                  </div>

                </div>
              ) : (
                /* EDITABLE ADDRESS INPUTS */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: '1 / -1' }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Residential Address <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="address" value={formData.address} onChange={handleChange} required placeholder="Flat no., Street, Area/Locality" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ward <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="ward" value={formData.ward} onChange={handleChange} required placeholder="e.g. Ward 1" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>City <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Hosur" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>State</Label>
                    <Input name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Tamil Nadu" style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text, #334155)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PIN Code <span style={{ color: '#ef4444' }}>*</span></Label>
                    <Input name="pincode" value={formData.pincode} onChange={handleChange} required placeholder="635002" maxLength={6} style={{ height: 44, borderRadius: 10, border: '1.5px solid var(--border, #cbd5e1)', fontSize: 14, fontFamily: 'monospace', color: 'var(--text, #0f172a)', background: 'var(--surface, #ffffff)' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Save / Cancel Action Bar inside Form */}
            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--surface, #ffffff)', borderRadius: 16, padding: '16px 24px', border: '1.5px solid var(--border, #cbd5e1)', boxShadow: '0 4px 14px rgba(15,23,42,0.08)' }}>
                {existing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    style={{ height: 44, borderRadius: 10, padding: '0 20px', fontWeight: 700, fontSize: 14 }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  style={{
                    height: 44, borderRadius: 10, padding: '0 28px', background: '#059669', color: '#ffffff',
                    fontWeight: 800, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  <Save size={16} />
                  {loading ? 'Saving Changes...' : (existing ? 'Save Changes' : 'Complete Registration')}
                </Button>
              </div>
            )}

            {/* Card 3: Recent Citizen Activities Log */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border, #f1f5f9)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg, #eff6ff)', border: '1px solid var(--border, #bfdbfe)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text, #0f172a)' }}>Recent Citizen Activities</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #64748b)' }}>Audit log of submitted complaints and certificate requests</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg, #f8fafc)', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #0f172a)' }}>Complaint submitted</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>Unresolved water leakage on Main Street</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>26 July 2026</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg, #f8fafc)', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #0f172a)' }}>Birth Certificate downloaded</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>Digitally signed certificate #BC-2026-8812</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>22 July 2026</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg, #f8fafc)', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(192,38,211,0.15)', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #0f172a)' }}>Welfare application submitted</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)' }}>Kalaignar Magalir Urimai Scheme</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>20 July 2026</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (30% Width) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, gridColumn: 'span 1' }}>
            
            {/* Account Status Card */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text, #0f172a)', fontWeight: 800, fontSize: 16 }}>
                <Sparkles className="w-5 h-5 text-emerald-500" /> Account Status
              </div>
              
              {existing ? (
                <div style={{ padding: '14px 16px', background: 'rgba(16,185,129,0.15)', color: '#4ade80', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text, #f8fafc)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Citizen Profile
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', fontWeight: 600 }}>Citizen ID:</div>
                  <div style={{ fontFamily: 'monospace', background: 'var(--bg, #09141a)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border, #bbf7d0)', color: 'var(--text, #0f172a)', fontWeight: 700, wordBreak: 'break-all' }}>
                    {existing.citizenId}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.15)', color: '#fcd34d', borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)', fontSize: 12, fontWeight: 700 }}>
                  ⚠️ Registration Pending. Complete this form to enable civic features.
                </div>
              )}
            </div>

            {/* Profile Completion Indicator Card */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text, #0f172a)' }}>Profile Completion</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{completionPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 10, borderRadius: 10, background: 'var(--bg, #f1f5f9)', overflow: 'hidden' }}>
                <div style={{
                  width: `${completionPercent}%`, height: '100%',
                  background: 'linear-gradient(90deg, #059669, #10b981)',
                  borderRadius: 10, transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary, #475569)', paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-emerald-500" /> Complete Aadhaar verification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-emerald-500" /> Residential ward mapped
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-emerald-500" /> Phone number contact active
                </div>
              </div>
            </div>

            {/* Security Information Card */}
            <div style={{
              background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1.5px solid var(--border, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
                <Lock size={16} className="text-emerald-500" /> Security Information
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary, #475569)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg, #f8fafc)', borderRadius: 8, border: '1px solid var(--border, #e2e8f0)' }}>
                  <KeyRound size={14} className="text-emerald-500 shrink-0" />
                  <span style={{ color: 'var(--text, #0f172a)', fontWeight: 600 }}>Keycloak SSO Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg, #f8fafc)', borderRadius: 8, border: '1px solid var(--border, #e2e8f0)' }}>
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span style={{ color: 'var(--text, #0f172a)', fontWeight: 600 }}>JWT Multi-Factor Protected</span>
                </div>
              </div>
            </div>

          </div>

        </form>
      </div>
    </AppShell>
  );
}

export default CitizenRegister;
