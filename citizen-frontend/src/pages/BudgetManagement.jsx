import { useEffect, useState } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { toast } from 'sonner';
import {
  Wallet, TrendingDown, PieChart, AlertTriangle, Plus, Edit2, Building2, X
} from 'lucide-react';

function fmt(n) {
  if (!n) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function StatCard({ label, value, icon: Icon, color, sub, alert }) {
  return (
    <div style={{
      background: alert ? '#fef2f2' : '#fff', borderRadius: 14, padding: '18px 22px',
      border: `1.5px solid ${alert ? '#fecaca' : '#e2e8f0'}`, 
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 160px',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: alert ? '#fecaca' : color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={alert ? '#dc2626' : color} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: alert ? '#991b1b' : '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: alert ? '#b91c1c' : '#64748b', marginTop: 3, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: alert ? '#dc2626' : color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const DEPT_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4','#f97316','#6366f1'];
function deptColor(dept = '') {
  let h = 0;
  for (let i = 0; i < dept.length; i++) h = (h * 31 + dept.charCodeAt(i)) & 0xffff;
  return DEPT_COLORS[h % DEPT_COLORS.length];
}

export default function BudgetManagement() {
  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isFinance = roles.includes('FINANCE_OFFICER') || roles.includes('finance_officer');
  const isAdmin = roles.includes('ADMIN') || roles.includes('admin');
  const canManage = isFinance || isAdmin;

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState({ department: '', fiscalYear: '2025-26', totalAllocated: '', alertThresholdPercent: 85 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        api.get('/welfare-service/api/welfare/budgets'),
        api.get('/welfare-service/api/welfare/budgets/alerts'),
      ]);
      setBudgets(bRes.data || []);
      setAlerts(aRes.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalAllocated = budgets.reduce((s, b) => s + Number(b.totalAllocated || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.totalSpent || 0), 0);
  const remaining = totalAllocated - totalSpent;
  const overallUtil = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : '0';

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editBudget) {
        await api.put(`/welfare-service/api/welfare/budgets/${editBudget.budgetId}/allocate`, {
          totalAllocated: Number(form.totalAllocated)
        });
        toast.success('Budget allocation updated!');
      } else {
        await api.post('/welfare-service/api/welfare/budgets', {
          ...form,
          totalAllocated: Number(form.totalAllocated),
          alertThresholdPercent: Number(form.alertThresholdPercent),
        });
        toast.success('Department budget created!');
      }
      setShowCreateForm(false); setEditBudget(null);
      setForm({ department: '', fiscalYear: '2025-26', totalAllocated: '', alertThresholdPercent: 85 });
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); } 
    finally { setSaving(false); }
  };

  const openEdit = (b) => {
    setEditBudget(b);
    setForm({ department: b.department, fiscalYear: b.fiscalYear, totalAllocated: b.totalAllocated, alertThresholdPercent: b.alertThresholdPercent });
    setShowCreateForm(true);
  };

  const alertIds = new Set(alerts.map(a => a.budgetId));

  const thStyle = {
    padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
    background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left'
  };

  return (
    <AppShell title="Budget Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 40 }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <Wallet size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Budget Management
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, marginTop: 2 }}>
                Allocate departmental funds and monitor utilization limits.
              </p>
            </div>
          </div>
          {canManage && (
            <button onClick={() => { setEditBudget(null); setForm({ department: '', fiscalYear: '2025-26', totalAllocated: '', alertThresholdPercent: 85 }); setShowCreateForm(true); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <Plus size={15} /> Allocate Budget
            </button>
          )}
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <StatCard label="Total Allocated" value={fmt(totalAllocated)} icon={Wallet} color="#3b82f6" />
          <StatCard label="Total Spent" value={fmt(totalSpent)} icon={TrendingDown} color="#ec4899" />
          <StatCard label="Remaining Budget" value={fmt(remaining)} icon={PieChart} color="#10b981" />
          <StatCard label="Overall Utilization" value={`${overallUtil}%`} icon={AlertTriangle} color="#f59e0b" alert={alerts.length > 0} sub={alerts.length > 0 ? `${alerts.length} alert(s)` : 'Within limits'} />
        </div>

        {alerts.length > 0 && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b'
          }}>
            <AlertTriangle size={20} color="#dc2626" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {alerts.length} department(s) have exceeded their budget alert threshold.
            </span>
          </div>
        )}

        {/* ── Main Card ────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(15,23,42,0.07)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 18px', borderBottom: '2px solid #f1f5f9',
            background: '#fafbfc',
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Department Budgets ({budgets.length})
            </h3>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px',
                border: '3px solid #e2e8f0', borderTopColor: '#10b981', animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ color: '#64748b', fontSize: 14 }}>Loading budgets…</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : budgets.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>💼</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6 }}>No budgets allocated</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Fiscal Year</th>
                    <th style={thStyle}>Allocated</th>
                    <th style={thStyle}>Spent</th>
                    <th style={thStyle}>Remaining</th>
                    <th style={{ ...thStyle, width: 160 }}>Utilization</th>
                    <th style={thStyle}>Threshold</th>
                    <th style={{ ...thStyle, width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(b => {
                    const isAlert = alertIds.has(b.budgetId);
                    const util = Number(b.utilizationPercent || 0);
                    const dc = deptColor(b.department);
                    return (
                      <tr key={b.budgetId} style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isAlert ? '#fef2f2' : 'transparent',
                        transition: 'background 0.12s'
                      }} onMouseEnter={e => e.currentTarget.style.background = isAlert ? '#fee2e2' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = isAlert ? '#fef2f2' : 'transparent'}>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20,
                            background: isAlert ? '#fff' : dc + '15', color: isAlert ? '#dc2626' : dc,
                            border: `1px solid ${isAlert ? '#fecaca' : dc+'33'}`, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                          }}>
                            {isAlert ? <AlertTriangle size={10} /> : <Building2 size={10} />}
                            {b.department}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{b.fiscalYear}</td>
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: '#1e293b' }}>{fmt(b.totalAllocated)}</td>
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: isAlert ? '#dc2626' : '#3b82f6' }}>{fmt(b.totalSpent)}</td>
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: '#10b981' }}>{fmt(b.remainingBudget)}</td>
                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 6, flex: 1, background: isAlert ? '#fecaca' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(util, 100)}%`, background: isAlert ? '#dc2626' : '#10b981', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: isAlert ? '#dc2626' : '#64748b' }}>{util.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 14px', fontWeight: 600, color: '#64748b' }}>{b.alertThresholdPercent}%</td>
                        <td style={{ padding: '13px 14px' }}>
                          {canManage && (
                            <button onClick={() => openEdit(b)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                              background: '#fff', color: '#1e293b', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              border: '1.5px solid #e2e8f0', transition: 'background 0.12s',
                            }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                              <Edit2 size={13} /> Adjust
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
        </div>

        {/* Form Modal */}
        {showCreateForm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, width: '100%', maxWidth: 450,
              display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  {editBudget ? 'Adjust Budget Allocation' : 'Create Budget Allocation'}
                </h3>
                <button onClick={() => setShowCreateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!editBudget && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Department *</label>
                      <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Fiscal Year *</label>
                      <input type="text" value={form.fiscalYear} onChange={e => setForm(f => ({ ...f, fiscalYear: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Total Allocated (₹) *</label>
                  <input type="number" value={form.totalAllocated} onChange={e => setForm(f => ({ ...f, totalAllocated: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                {!editBudget && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Alert Threshold % (default 85)</label>
                    <input type="number" value={form.alertThresholdPercent} onChange={e => setForm(f => ({ ...f, alertThresholdPercent: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#1e293b', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
                <button onClick={() => setShowCreateForm(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff', fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1
                }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
