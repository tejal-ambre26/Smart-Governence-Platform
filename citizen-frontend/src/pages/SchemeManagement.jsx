import { useEffect, useState, useMemo } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES } from '../components/ReportShared.jsx';
import { toast } from 'sonner';
import {
  Layers, Plus, Edit2, Search, X, Users, Wallet, Target, Building2, TrendingUp, ShieldCheck
} from 'lucide-react';

// ── colour maps ───────────────────────────────────────────────────────────────
const DEPT_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#6366f1'];
function deptColor(dept = '') {
  let h = 0;
  for (let i = 0; i < dept.length; i++) h = (h * 31 + dept.charCodeAt(i)) & 0xffff;
  return DEPT_COLORS[h % DEPT_COLORS.length];
}

function StatusBadge({ status }) {
  const isAct = status === 'ACTIVE';
  const bg = isAct ? '#f0fdf4' : '#f1f5f9';
  const text = isAct ? '#16a34a' : '#64748b';
  const border = isAct ? '#bbf7d0' : '#e2e8f0';
  const dot = isAct ? '#22c55e' : '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: bg, color: text,
      border: `1px solid ${border}`,
      fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
      {status || '—'}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '18px 22px',
      border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 160px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const initialForm = {
  schemeName: '', department: '', description: '', eligibilityCriteria: '',
  minIncome: '', maxIncome: '', minAge: '', maxAge: '', budgetAllocated: ''
};

export default function SchemeManagement() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isAdmin = roles.includes('ADMIN') || roles.includes('admin');

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editScheme, setEditScheme] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/welfare-service/api/welfare/schemes')
      .then(r => { setSchemes(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load schemes.'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(initialForm); setEditScheme(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      schemeName: s.schemeName || '', department: s.department || '',
      description: s.description || '', eligibilityCriteria: s.eligibilityCriteria || '',
      minIncome: s.minIncome || '', maxIncome: s.maxIncome || '',
      minAge: s.minAge || '', maxAge: s.maxAge || '',
      budgetAllocated: s.budgetAllocated || ''
    });
    setEditScheme(s);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        minIncome: form.minIncome !== '' ? Number(form.minIncome) : null,
        maxIncome: form.maxIncome !== '' ? Number(form.maxIncome) : null,
        minAge: form.minAge !== '' ? Number(form.minAge) : null,
        maxAge: form.maxAge !== '' ? Number(form.maxAge) : null,
        budgetAllocated: Number(form.budgetAllocated),
      };
      if (editScheme) {
        await api.put(`/welfare-service/api/welfare/schemes/${editScheme.schemeId}`, body);
        toast.success('Scheme updated successfully!');
      } else {
        await api.post('/welfare-service/api/welfare/schemes', body);
        toast.success('Scheme created successfully!');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return schemes;
    const q = search.toLowerCase();
    return schemes.filter(s => 
      s.schemeName?.toLowerCase().includes(q) || 
      s.department?.toLowerCase().includes(q)
    );
  }, [schemes, search]);

  const totalBudget = schemes.reduce((sum, s) => sum + Number(s.budgetAllocated || 0), 0);
  const activeCount = schemes.filter(s => s.status === 'ACTIVE').length;
  const totalBen = schemes.reduce((sum, s) => sum + (s.beneficiaryCount || 0), 0);

  const thStyle = {
    padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left'
  };

  return (
    <AppShell title="Scheme Management">
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 0 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Welfare Schemes"
          subtitle="Manage active welfare programs and view allocations"
          icon={Layers}
          iconBg="linear-gradient(135deg, #0f172a, #334155)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={new Date()}
          onRefresh={load}
          refreshing={loading}
          extraButtons={
            isAdmin && (
              <button onClick={openNew} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                borderRadius: 10, background: 'linear-gradient(135deg,#ec4899,#db2777)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                boxShadow: '0 4px 12px rgba(236,72,153,0.35)',
              }}>
                <Plus size={15} /> New Scheme
              </button>
            )
          }
        />

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <KpiCard icon={Layers} label="Total Schemes" value={schemes.length} subtitle={`${activeCount} active`} color="#ec4899" bg="#fce7f3" isDark={isDark} />
          <KpiCard icon={Users} label="Total Beneficiaries" value={totalBen} color="#3b82f6" bg="#eff6ff" isDark={isDark} />
          <KpiCard icon={Wallet} label="Total Budget Allocated" value={`₹${(totalBudget/100000).toFixed(1)}L`} color="#10b981" bg="#f0fdf4" isDark={isDark} />
        </div>

        {/* ── Main Section Card ────────────────────────────────────────────── */}
        <SectionCard
          title="Welfare Schemes Directory"
          subtitle="All active and pending welfare programs across departments"
          icon={Layers}
          isDark={isDark}
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  placeholder="Search schemes or departments..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px 6px 32px', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: 8,
                    fontSize: 13, color: isDark ? '#f1f5f9' : '#1e293b', background: isDark ? '#1e293b' : '#fff', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                {filtered.length} of {schemes.length} shown
              </div>
            </div>
          }
        >
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px',
                border: '3px solid #e2e8f0', borderTopColor: '#ec4899', animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ color: '#64748b', fontSize: 14 }}>Loading schemes…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#f1f5f9' : '#334155', marginBottom: 6 }}>No schemes found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '-20px -22px', marginTop: '-20px', marginBottom: '-20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Scheme Name</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Beneficiaries</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Budget Allocated</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Spent</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', width: 140 }}>Utilization</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const util = s.budgetAllocated > 0 ? Number(((s.budgetSpent || 0) / s.budgetAllocated * 100).toFixed(1)) : 0;
                    const dc = deptColor(s.department);
                    return (
                      <tr key={s.schemeId} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}` }} onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 13 }}>
                          {s.schemeName}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20,
                            background: dc + '15', color: dc,
                            border: `1px solid ${dc}33`, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                          }}>
                            <Building2 size={10} /> {s.department || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#475569' }}>
                          {s.beneficiaryCount || 0}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#10b981' }}>
                          ₹{Number(s.budgetAllocated || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6' }}>
                          ₹{Number(s.budgetSpent || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 6, flex: 1, background: isDark ? '#334155' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(util, 100)}%`, background: '#10b981', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{util}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={s.status} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isAdmin && (
                            <button onClick={() => openEdit(s)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                              background: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#1e293b', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`, transition: 'background 0.12s',
                            }}>
                              <Edit2 size={13} /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Form Modal (HTML/CSS Modal) */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  {editScheme ? 'Edit Scheme' : 'New Welfare Scheme'}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['schemeName', 'Scheme Name *', 'text'],
                  ['department', 'Department *', 'select', [
                    'Education Department',
                    'Health Department',
                    'Social Welfare Department',
                    'Revenue Department',
                    'Municipal Corporation',
                    'Water Department',
                    'Roads Department',
                    'Electricity Department',
                    'Urban Planning Department'
                  ]],
                  ['description', 'Description', 'text'],
                  ['eligibilityCriteria', 'Eligibility Criteria', 'text'],
                  ['budgetAllocated', 'Budget Allocated (₹) *', 'number'],
                  ['minIncome', 'Min Annual Income (₹)', 'number'],
                  ['maxIncome', 'Max Annual Income (₹)', 'number'],
                  ['minAge', 'Min Age', 'number'],
                  ['maxAge', 'Max Age', 'number'],
                ].map(([field, label, type, options]) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</label>
                    {type === 'select' ? (
                      <select
                        value={form[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8,
                          fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none', background: '#fff',
                          cursor: 'pointer'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                      >
                        <option value="" disabled>Select Department...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={type}
                        value={form[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8,
                          fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                <button onClick={() => setShowForm(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff',
                  fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ec4899',
                  fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1
                }}>
                  {saving ? 'Saving...' : 'Save Scheme'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
