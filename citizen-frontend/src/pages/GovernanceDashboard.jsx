import { useEffect, useState, useRef, useCallback } from 'react';
import AppShell from '../components/AppShell.jsx';
import api from '../api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { ReportPageHeader, KpiCard, SectionCard, GLOBAL_STYLES, fmtINR, fmtINRFull, PALETTE } from '../components/ReportShared.jsx';
import {
  Users, AlertTriangle, Award, Wallet, TrendingUp, Layers,
  Activity, RefreshCw, BarChart2, CheckCircle2, Clock,
  Brain, Sparkles, Send, X, ChevronDown, ChevronUp,
  MessageSquare, Zap, AlertCircle, Lightbulb, Shield, Target,
  FileText, Heart, PieChart, BookOpen, ArrowUpRight, ArrowDownRight,
  Building2, Database, AlertOctagon, Info, Download, Calendar, Printer,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart as RePieChart, Pie, Legend,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const DEPT_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4','#f97316'];

const STATUS_COLORS = {
  HIGH_PERFORMANCE: { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: '✅ High Performance' },
  GOOD:             { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd', label: '🔵 Good' },
  NEEDS_ATTENTION:  { bg: '#fef9c3', text: '#a16207', border: '#fde047', label: '⚠️ Needs Attention' },
  CRITICAL:         { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: '🔴 Critical' },
  UNAVAILABLE:      { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', label: '⬜ Unavailable' },
};

const EXAMPLE_QUESTIONS = [
  'Which department needs the most urgent attention?',
  "Summarize today's governance performance.",
  'Why is the resolution rate low?',
  'Analyze welfare budget utilization.',
  'How can SLA performance be improved?',
  'Which service has the most pending applications?',
];

// ─────────────────────────────────────────────────────────────────────────────
// THEME HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function th(isDark) {
  return {
    bg:      isDark ? '#0f172a' : '#f8fafc',
    card:    isDark ? '#1e293b' : '#ffffff',
    subCard: isDark ? '#0f172a' : '#f8fafc',
    border:  isDark ? '#334155' : '#e2e8f0',
    text:    isDark ? '#f1f5f9' : '#0f172a',
    sub:     isDark ? '#94a3b8' : '#64748b',
    muted:   isDark ? '#475569' : '#cbd5e1',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function PerformanceBar({ dept, rate, isDark }) {
  const t = th(isDark);
  const pct = Math.min(100, Math.max(0, rate));
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{dept}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: t.border, borderRadius: 9999 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: color, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function AiPill({ text, color = '#6366f1', bgDark = 'rgba(99,102,241,0.12)', bgLight = '#eef2ff', isDark }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5,
      background: isDark ? bgDark : bgLight,
      color: isDark ? color : color,
      border: `1px solid ${isDark ? color + '40' : color + '30'}`,
    }}>
      {text}
    </div>
  );
}

function InsightSection({ title, items = [], icon: Icon, color, isDark }) {
  if (!items.length) return null;
  const t = th(isDark);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.sub }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => <AiPill key={i} text={item} color={color} isDark={isDark} />)}
      </div>
    </div>
  );
}

function MiniStatRow({ label, value, color, isDark }) {
  const t = th(isDark);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 12, color: t.sub }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || t.text }}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color, isDark }) {
  const t = th(isDark);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: t.sub, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function AiChatDrawer({ open, onClose, isDark }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const t = th(isDark);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = async (question) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const r = await api.post('/api/ai/governance/chat', { question: q });
      const d = r.data;
      let responseText = d.summary || '';
      if (d.insights?.length)        responseText += '\n\n**Key points:**\n' + d.insights.map(i => `• ${i}`).join('\n');
      if (d.recommendations?.length) responseText += '\n\n**Recommendations:**\n' + d.recommendations.map(r => `→ ${r}`).join('\n');
      setMessages(prev => [...prev, { role: 'ai', text: responseText, status: d.overallStatus, unavailable: d.aiUnavailable }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'AI insights temporarily unavailable. Please try again shortly.', unavailable: true }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999, backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease' }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: t.card, borderLeft: `1px solid ${t.border}`,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>CivicPulse AI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Governance Intelligence</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 12 }}>Try asking:</div>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendQuestion(q)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${t.border}`, background: t.subCard, color: '#6366f1',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', marginBottom: 6, transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = isDark ? '#1e293b' : '#f0f0ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.subCard; }}
                >{q}</button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'user' ? (
                <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{msg.text}</div>
              ) : (
                <div style={{ maxWidth: '95%', padding: '12px 14px', borderRadius: '14px 14px 14px 4px', background: msg.unavailable ? (isDark ? '#291400' : '#fff7ed') : t.subCard, border: `1px solid ${msg.unavailable ? '#f97316' : t.border}`, fontSize: 13, color: t.text, lineHeight: 1.6 }}>
                  {msg.unavailable ? <span style={{ color: '#f97316' }}>⚠️ {msg.text}</span> : <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: t.subCard, border: `1px solid ${t.border}`, width: 'fit-content', fontSize: 13, color: '#8b5cf6' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
              AI is analyzing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ fontSize: 11, color: t.sub, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0, fontWeight: 500 }}>Clear conversation</button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuestion(input)}
              placeholder="Ask about governance…" disabled={loading}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.border}`, background: t.subCard, color: t.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => sendQuestion(input)} disabled={loading || !input.trim()} style={{
              width: 40, height: 40, borderRadius: 10, border: 'none', flexShrink: 0,
              background: loading || !input.trim() ? t.border : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: loading || !input.trim() ? t.sub : '#fff',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Send size={16} />
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: t.sub, textAlign: 'center' }}>AI answers using only live CivicPulse data</div>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} } @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtCurrencyPdf(val) {
  const n = Number(val) || 0;
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `\u20B9${(n / 100000).toFixed(2)} L`;
  if (n > 0)         return `\u20B9${n.toLocaleString('en-IN')}`;
  return '\u20B90';
}

function exportPDF(aiData, govData) {
  const now    = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const gd     = govData || {};

  const sec = (title, content) => `
    <div class="sec">
      <div class="sec-title">${title}</div>
      <div class="sec-rule"></div>
      ${content}
    </div>`;

  const listItems = (items, prefix) => items?.length
    ? items.map((t, i) => `<div class="li">${prefix !== undefined ? prefix : (i + 1) + '.'} ${t}</div>`).join('')
    : '<div class="na">No data available</div>';

  const warnItems = (items) => items?.length
    ? items.map(w => `<div class="wi">\u26A0 ${w}</div>`).join('')
    : '<div class="na">No critical warnings</div>';

  const mr = (label, value) =>
    `<div class="mr"><span class="ml">${label}</span><span class="mv">${value}</span></div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Smart Governance Platform — Governance Intelligence Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia',serif;color:#1a1a2e;background:#fff;padding:48px 56px;font-size:13px;line-height:1.7}
.header{text-align:center;border-bottom:3px solid #1a1a2e;padding-bottom:24px;margin-bottom:32px}
.logo{font-size:10px;font-weight:bold;letter-spacing:.3em;color:#6366f1;text-transform:uppercase;margin-bottom:6px}
.report-title{font-size:22px;font-weight:bold;letter-spacing:.06em;color:#1a1a2e;text-transform:uppercase;margin-bottom:18px}
.meta-grid{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
.meta-item{display:flex;flex-direction:column;align-items:center;gap:1px}
.meta-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:bold}
.meta-value{font-size:12px;font-weight:bold;color:#1a1a2e}
.badge{display:inline-block;margin-top:14px;padding:5px 18px;border-radius:4px;font-size:10px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;border:1.5px solid #1a1a2e;color:#1a1a2e}
.sec{margin-bottom:26px;page-break-inside:avoid}
.sec-title{font-size:9.5px;font-weight:bold;letter-spacing:.22em;text-transform:uppercase;color:#6366f1;margin-bottom:3px}
.sec-rule{height:1px;background:#e2e8f0;margin-bottom:12px}
.summary{font-size:13px;line-height:1.8;color:#334155}
.li{padding:5px 0;font-size:12.5px;color:#1e293b;border-bottom:1px solid #f1f5f9}
.li:last-child{border-bottom:none}
.wi{padding:5px 0;font-size:12.5px;color:#991b1b;border-bottom:1px solid #fee2e2}
.wi:last-child{border-bottom:none}
.mr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px}
.mr:last-child{border-bottom:none}
.ml{color:#64748b}
.mv{font-weight:bold;color:#1a1a2e}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:26px}
.box{border:1px solid #e2e8f0;border-radius:6px;padding:14px}
.box-title{font-size:9px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase;color:#6366f1;margin-bottom:8px}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.tag{padding:3px 10px;border:1px solid #cbd5e1;border-radius:12px;font-size:9px;font-weight:bold;color:#475569;text-transform:uppercase;letter-spacing:.06em}
.na{font-size:12px;color:#94a3b8;font-style:italic}
.footer{margin-top:40px;padding-top:18px;border-top:2px solid #1a1a2e;text-align:center}
.footer-name{font-size:14px;font-weight:bold;color:#1a1a2e;letter-spacing:.05em}
.footer-sub{font-size:10px;color:#64748b;margin-top:4px;letter-spacing:.12em;text-transform:uppercase}
.disclaimer{margin-top:18px;padding:14px 18px;border:1px solid #fbbf24;border-radius:6px;background:#fffbeb;font-size:11px;color:#92400e;line-height:1.65;text-align:left}
.disclaimer strong{display:block;margin-bottom:4px;font-size:9px;letter-spacing:.12em;text-transform:uppercase}
@media print{body{padding:32px 40px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sec{page-break-inside:avoid}}
</style></head><body>

<div class="header">
  <div class="logo">Smart Governance Platform</div>
  <div class="report-title">Governance Intelligence Report</div>
  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Generated</span><span class="meta-value">${dateStr}</span></div>
    <div class="meta-item"><span class="meta-label">Time</span><span class="meta-value">${timeStr}</span></div>
    <div class="meta-item"><span class="meta-label">Data Period</span><span class="meta-value">All available records</span></div>
    <div class="meta-item"><span class="meta-label">Data Sources</span><span class="meta-value">7 services</span></div>
    <div class="meta-item"><span class="meta-label">AI Engine</span><span class="meta-value">Google Gemini</span></div>
  </div>
  <div class="badge">${(aiData.overallStatus || 'COMPLETE').replace(/_/g, ' ')}</div>
</div>

${sec('Executive Summary', `<div class="summary">${aiData.summary || 'No summary available.'}</div>`)}

<div class="two-col">
  <div class="box">
    <div class="box-title">\uD83D\uDCA1 Key Insights</div>
    ${listItems(aiData.insights, '\uD83D\uDCA1')}
  </div>
  <div class="box">
    <div class="box-title">\u26A0 Critical Warnings</div>
    ${warnItems(aiData.warnings)}
  </div>
</div>

${sec('AI Recommendations', listItems(aiData.recommendations, '\u2192'))}

${sec('Department Priorities', listItems(aiData.departmentPriorities))}

<div class="two-col">
  <div class="box">
    <div class="box-title">\u2665 Welfare Intelligence</div>
    ${mr('Budget Allocated', fmtCurrencyPdf(gd.budgetAllocated))}
    ${mr('Disbursed', fmtCurrencyPdf(gd.budgetDisbursed))}
    ${mr('Utilization', (gd.budgetUtilizationPercent || 0).toFixed(1) + '%')}
    ${mr('Beneficiaries', (gd.welfareBeneficiaries || 0).toLocaleString())}
    ${mr('Active Schemes', (gd.activeSchemes || 0).toLocaleString())}
    ${mr('Pending Applications', (gd.welfarePendingApplications || 0).toLocaleString())}
    ${aiData.welfareInsights?.length ? '<div style="margin-top:8px">' + listItems(aiData.welfareInsights) + '</div>' : ''}
  </div>
  <div class="box">
    <div class="box-title">\uD83D\uDCB0 Financial Intelligence</div>
    ${mr('Revenue Collected', fmtCurrencyPdf(gd.totalRevenue))}
    ${aiData.financialInsights?.length ? '<div style="margin-top:8px">' + listItems(aiData.financialInsights) + '</div>' : ''}
  </div>
</div>

<div class="two-col">
  <div class="box">
    <div class="box-title">\uD83D\uDCC4 Service Intelligence</div>
    ${mr('Total Applications', (gd.totalApplications || 0).toLocaleString())}
    ${mr('Issued / Approved', (gd.certificatesIssued || 0).toLocaleString())}
    ${mr('Pending', (gd.pendingApplications || 0).toLocaleString())}
    ${mr('Under Verification', (gd.underVerificationApplications || 0).toLocaleString())}
    ${mr('Rejected', (gd.rejectedApplications || 0).toLocaleString())}
    ${aiData.serviceInsights?.length ? '<div style="margin-top:8px">' + listItems(aiData.serviceInsights) + '</div>' : ''}
  </div>
  <div class="box">
    <div class="box-title">\uD83D\uDD52 SLA Intelligence</div>
    ${mr('Total Grievances', (gd.totalComplaints || 0).toLocaleString())}
    ${mr('Overdue / Escalated', (gd.overdueComplaints || 0).toLocaleString())}
    ${mr('Resolved', (gd.resolvedComplaints || 0).toLocaleString())}
    ${mr('Resolution Rate', (gd.grievanceResolutionRate || 0).toFixed(1) + '%')}
    ${aiData.slaInsights?.length ? '<div style="margin-top:8px">' + listItems(aiData.slaInsights) + '</div>' : ''}
  </div>
</div>

${sec('Data Sources', `<div class="tags">${['Grievance','Services','Welfare','Budget','Revenue','Citizen','Audit'].map(s => `<span class="tag">${s}</span>`).join('')}</div>`)}

<div class="footer">
  <div class="footer-name">Smart Governance Platform</div>
  <div class="footer-sub">Governance Analytics &amp; Intelligence</div>
  <div class="disclaimer">
    <strong>\u26A0 AI Disclaimer</strong>
    AI-generated insights are decision-support recommendations based on current CivicPulse data. Official decisions remain the responsibility of authorized administrators. This report is auto-generated and should be reviewed by qualified personnel before use in official proceedings.
  </div>
</div>
</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 500);
}

function exportCSV(aiData, govData) {
  const gd  = govData || {};
  const now = new Date();
  const rows = [
    ['Smart Governance Platform — Governance Intelligence Report'],
    ['Generated', now.toLocaleString('en-IN')],
    ['Data Period', 'All available records'],
    ['AI Engine', 'Google Gemini'],
    ['Overall Status', aiData.overallStatus || ''],
    [''],
    ['=== EXECUTIVE SUMMARY ==='],
    ['Summary', aiData.summary || ''],
    [''],
    ['=== KEY INSIGHTS ==='],
    ...(aiData.insights?.map((t, i) => [`Insight ${i + 1}`, t]) || []),
    [''],
    ['=== CRITICAL WARNINGS ==='],
    ...(aiData.warnings?.map((t, i) => [`Warning ${i + 1}`, t]) || []),
    [''],
    ['=== RECOMMENDATIONS ==='],
    ...(aiData.recommendations?.map((t, i) => [`Recommendation ${i + 1}`, t]) || []),
    [''],
    ['=== DEPARTMENT PRIORITIES ==='],
    ...(aiData.departmentPriorities?.map((t, i) => [`Priority ${i + 1}`, t]) || []),
    [''],
    ['=== WELFARE METRICS ==='],
    ['Budget Allocated (INR)', Number(gd.budgetAllocated) || 0],
    ['Budget Disbursed (INR)', Number(gd.budgetDisbursed) || 0],
    ['Budget Utilization %', (gd.budgetUtilizationPercent || 0).toFixed(2)],
    ['Beneficiaries', gd.welfareBeneficiaries || 0],
    ['Active Schemes', gd.activeSchemes || 0],
    ['Welfare Pending Applications', gd.welfarePendingApplications || 0],
    ...(aiData.welfareInsights?.map((t, i) => [`Welfare Insight ${i + 1}`, t]) || []),
    [''],
    ['=== FINANCIAL METRICS ==='],
    ['Total Revenue (INR)', Number(gd.totalRevenue) || 0],
    ...(aiData.financialInsights?.map((t, i) => [`Financial Insight ${i + 1}`, t]) || []),
    [''],
    ['=== SERVICE METRICS ==='],
    ['Total Applications', gd.totalApplications || 0],
    ['Certificates Issued', gd.certificatesIssued || 0],
    ['Pending Applications', gd.pendingApplications || 0],
    ['Under Verification', gd.underVerificationApplications || 0],
    ['Approved', gd.approvedApplications || 0],
    ['Rejected', gd.rejectedApplications || 0],
    ...(aiData.serviceInsights?.map((t, i) => [`Service Insight ${i + 1}`, t]) || []),
    [''],
    ['=== SLA & GRIEVANCE METRICS ==='],
    ['Total Grievances', gd.totalComplaints || 0],
    ['Resolved', gd.resolvedComplaints || 0],
    ['Pending', gd.pendingComplaints || 0],
    ['Overdue / Escalated', gd.overdueComplaints || 0],
    ['Resolution Rate %', (gd.grievanceResolutionRate || 0).toFixed(2)],
    ...(aiData.slaInsights?.map((t, i) => [`SLA Insight ${i + 1}`, t]) || []),
    [''],
    ['=== CITIZEN OVERVIEW ==='],
    ['Total Citizens', gd.totalCitizens || 0],
    ['Total Requests', gd.totalRequests || 0],
    ['Overall Resolution Rate %', (gd.overallResolutionRate || 0).toFixed(2)],
    ['Satisfaction Score', gd.citizenSatisfactionScore || 0],
    [''],
    ['=== AUDIT ==='],
    ['Total Events', gd.auditTotalEvents || 0],
    ['Events Last 24h', gd.auditRecentEvents24h || 0],
    [''],
    ['=== DISCLAIMER ==='],
    ['', 'AI-generated insights are decision-support recommendations based on current CivicPulse data.'],
    ['', 'Official decisions remain the responsibility of authorized administrators.'],
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `CivicPulse_Governance_Report_${now.toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function ExportDropdown({ aiData, govData, isDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t   = th(isDark);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { icon: '📄', label: 'Download PDF',  action: () => { exportPDF(aiData, govData);  setOpen(false); } },
    { icon: '📊', label: 'Download CSV',  action: () => { exportCSV(aiData, govData);  setOpen(false); } },
    { icon: '🖨',  label: 'Print Report', action: () => { exportPDF(aiData, govData);  setOpen(false); } },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="btn-export-report"
        onClick={() => setOpen(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
          border: `1px solid ${t.border}`,
          background: open ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
          color: t.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#1e293b' : '#f1f5f9'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <Download size={13} />
        Export Report
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: t.card, border: `1px solid ${t.border}`, borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)', zIndex: 300, minWidth: 190, overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `1px solid ${t.border}` }}>
            Export Report
          </div>
          {items.map(({ icon, label, action }) => (
            <button key={label} onClick={action} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 16px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: t.text, fontWeight: 500,
              textAlign: 'left', transition: 'background 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI EXECUTIVE BRIEF CARD
// ─────────────────────────────────────────────────────────────────────────────
function AiExecutiveBrief({ isDark, aiData, analyzing, aiError, onGenerate, onChat, govData }) {
  const [expanded, setExpanded] = useState(true);
  const t = th(isDark);
  const sc = aiData && !aiData.aiUnavailable ? STATUS_COLORS[aiData.overallStatus] || STATUS_COLORS.UNAVAILABLE : null;

  return (
    <div style={{ background: t.card, borderRadius: 18, border: `1px solid ${t.border}`, boxShadow: '0 4px 24px rgba(99,102,241,0.1)', overflow: 'hidden', marginBottom: 24 }}>
      {/* Gradient accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,#10b981)' }} />

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: expanded ? `1px solid ${t.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} color="#fff" />
            </div>
            <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: aiData && !aiData.aiUnavailable ? '#10b981' : '#94a3b8', border: `2px solid ${t.card}` }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: t.text, letterSpacing: '-0.02em' }}>CivicPulse AI Executive Brief</div>
            <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>
              {aiData && !aiData.aiUnavailable
                ? `Analysis generated · ${new Date(aiData.dataTimestamp).toLocaleTimeString()} · Powered by Gemini`
                : 'Powered by Google Gemini · Uses live governance data only'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {sc && (
            <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
          )}
          <button id="btn-generate-ai-analysis" onClick={onGenerate} disabled={analyzing} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none',
            background: analyzing ? t.border : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: analyzing ? t.sub : '#fff', fontWeight: 700, fontSize: 12,
            cursor: analyzing ? 'not-allowed' : 'pointer',
            boxShadow: analyzing ? 'none' : '0 4px 14px rgba(99,102,241,0.35)', transition: 'all 0.2s',
          }}>
            {analyzing ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />Analyzing…</> : <><Sparkles size={13} />Generate AI Analysis</>}
          </button>
          <button id="btn-ask-civicpulse-ai" onClick={onChat} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
            border: `1px solid #6366f1`, background: 'transparent', color: '#6366f1',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <MessageSquare size={13} />Ask CivicPulse AI
          </button>
          {aiData && !aiData.aiUnavailable && (
            <ExportDropdown aiData={aiData} govData={govData} isDark={isDark} />
          )}
          {aiData && (
            <button onClick={() => setExpanded(x => !x)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {aiError && (
        <div style={{ margin: '0 24px 16px', padding: '12px 16px', borderRadius: 10, background: isDark ? '#1c1917' : '#fff7ed', border: '1px solid #f97316', fontSize: 13, color: '#ea580c', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>{aiError}</span>
        </div>
      )}

      {/* Empty state */}
      {!aiData && !analyzing && !aiError && (
        <div style={{ padding: '44px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px', background: isDark ? '#1e293b' : '#f5f3ff', border: `1px dashed ${isDark ? '#6366f1' : '#a5b4fc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={26} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 8 }}>AI Governance Analysis Ready</div>
          <div style={{ fontSize: 13, color: t.sub, maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
            Click <strong>Generate AI Analysis</strong> to get an executive brief, department insights, and recommendations from your live CivicPulse data.
            All numbers shown here come from your database — Gemini only interprets them.
          </div>
        </div>
      )}

      {/* Loading shimmer */}
      {analyzing && (
        <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 14, borderRadius: 8, background: isDark ? '#334155' : '#f1f5f9', width: ['100%','88%','94%','72%','82%'][i-1], animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      )}

      {/* AI Results */}
      {aiData && !aiData.aiUnavailable && expanded && (
        <div style={{ padding: '0 24px 24px' }}>

          {/* Report Period Metadata */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16, marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
            {[
              { icon: Calendar,  label: 'Data Period',   value: 'All available records' },
              { icon: Clock,     label: 'Generated',     value: new Date(aiData.dataTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) },
              { icon: Database,  label: 'Data Sources',  value: '7 services' },
              { icon: Brain,     label: 'AI Engine',     value: 'Google Gemini' },
            ].map(({ icon: Icon, label, value }, i, arr) => (
              <div key={label} style={{
                flex: 1, padding: '12px 14px', background: t.subCard,
                borderRight: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? '#1e293b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginTop: 1 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div style={{ padding: '16px 18px', borderRadius: 12, background: t.subCard, border: `1px solid ${t.border}`, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Executive Summary</div>
            <p style={{ fontSize: 13, color: t.text, lineHeight: 1.7, margin: 0 }}>{aiData.summary}</p>
          </div>

          {/* Insights + Warnings row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {aiData.insights?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Lightbulb size={13} color="#f59e0b" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Insights</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiData.insights.map((ins, i) => (
                    <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: isDark ? '#0f172a' : '#fffbeb', border: `1px solid ${isDark ? '#78350f' : '#fde68a'}`, fontSize: 12, color: isDark ? '#fcd34d' : '#92400e', lineHeight: 1.5 }}>
                      💡 {ins}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aiData.warnings?.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <AlertTriangle size={13} color="#ef4444" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Warnings</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiData.warnings.map((w, i) => (
                    <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: isDark ? '#1c0a0a' : '#fff1f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, fontSize: 12, color: isDark ? '#fca5a5' : '#dc2626', lineHeight: 1.5 }}>
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {aiData.recommendations?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Shield size={13} color="#10b981" />
                <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommendations</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 8 }}>
                {aiData.recommendations.map((rec, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: isDark ? '#0f172a' : '#f0fdf4', border: `1px solid ${isDark ? '#14532d' : '#86efac'}`, fontSize: 12, color: isDark ? '#86efac' : '#15803d', lineHeight: 1.5 }}>
                    → {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section-level intelligence panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <InsightSection title="Department Priorities" items={aiData.departmentPriorities} icon={Building2} color="#6366f1" isDark={isDark} />
            <InsightSection title="Welfare Intelligence" items={aiData.welfareInsights} icon={Heart} color="#10b981" isDark={isDark} />
            <InsightSection title="Financial Intelligence" items={aiData.financialInsights} icon={Wallet} color="#f59e0b" isDark={isDark} />
            <InsightSection title="Service Intelligence" items={aiData.serviceInsights} icon={FileText} color="#3b82f6" isDark={isDark} />
            <InsightSection title="SLA Intelligence" items={aiData.slaInsights} icon={Clock} color="#ef4444" isDark={isDark} />
          </div>

          {/* Data Sources + Gemini attribution */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>Data sources:</span>
              {['Grievance', 'Services', 'Welfare', 'Budget', 'Revenue', 'Citizen', 'Audit'].map(s => (
                <span key={s} style={{ padding: '2px 8px', borderRadius: 20, background: isDark ? '#334155' : '#f1f5f9', fontSize: 11, fontWeight: 600, color: t.sub }}>{s}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: t.sub, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Brain size={10} color="#8b5cf6" />
              <span>Powered by <strong style={{ color: '#8b5cf6' }}>Google Gemini</strong></span>
            </div>
          </div>

          {/* AI Disclaimer */}
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: isDark ? '#1c1400' : '#fffbeb', border: `1px solid ${isDark ? '#78350f' : '#fde68a'}`, fontSize: 11, color: isDark ? '#fcd34d' : '#92400e', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>AI Disclaimer: </strong>AI-generated insights are decision-support recommendations based on current CivicPulse data. Official decisions remain the responsibility of authorized administrators.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE SECTION CARDS
// ─────────────────────────────────────────────────────────────────────────────
function GrievanceIntelCard({ data, isDark }) {
  const t = th(isDark);
  if (!data || data.grievanceDataUnavailable) return null;
  const resRate = data.grievanceResolutionRate || 0;
  const rateColor = resRate >= 75 ? '#10b981' : resRate >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <SectionHeader icon={AlertTriangle} title="Grievance Intelligence" subtitle="Live complaint analytics" color="#ef4444" isDark={isDark} />
      <MiniStatRow label="Total Complaints" value={(data.totalComplaints || 0).toLocaleString()} isDark={isDark} />
      <MiniStatRow label="Resolved" value={(data.resolvedComplaints || 0).toLocaleString()} color="#10b981" isDark={isDark} />
      <MiniStatRow label="Pending" value={(data.pendingComplaints || 0).toLocaleString()} color="#f59e0b" isDark={isDark} />
      <MiniStatRow label="Overdue / Escalated" value={(data.overdueComplaints || 0).toLocaleString()} color="#ef4444" isDark={isDark} />
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: t.sub }}>Resolution Rate</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: rateColor }}>{resRate.toFixed(1)}%</span>
        </div>
        <div style={{ height: 6, background: t.border, borderRadius: 9999 }}>
          <div style={{ width: `${Math.min(100, resRate)}%`, height: '100%', borderRadius: 9999, background: rateColor }} />
        </div>
      </div>
    </div>
  );
}

function CertificateIntelCard({ data, isDark }) {
  const t = th(isDark);
  if (!data || data.certificateDataUnavailable) return null;
  const total = data.totalApplications || 0;
  const issued = data.certificatesIssued || 0;
  const issueRate = total > 0 ? Math.round((issued / total) * 100) : 0;
  const rateColor = issueRate >= 70 ? '#10b981' : issueRate >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <SectionHeader icon={FileText} title="Certificate & Permit Intelligence" subtitle="Application pipeline analytics" color="#3b82f6" isDark={isDark} />
      <MiniStatRow label="Total Applications" value={total.toLocaleString()} isDark={isDark} />
      <MiniStatRow label="Pending" value={(data.pendingApplications || 0).toLocaleString()} color="#f97316" isDark={isDark} />
      <MiniStatRow label="Under Verification" value={(data.underVerificationApplications || 0).toLocaleString()} color="#f59e0b" isDark={isDark} />
      <MiniStatRow label="Approved" value={(data.approvedApplications || 0).toLocaleString()} color="#10b981" isDark={isDark} />
      <MiniStatRow label="Rejected" value={(data.rejectedApplications || 0).toLocaleString()} color="#ef4444" isDark={isDark} />
      <MiniStatRow label="Certificates Issued" value={issued.toLocaleString()} color="#6366f1" isDark={isDark} />
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: t.sub }}>Issuance Rate</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: rateColor }}>{issueRate}%</span>
        </div>
        <div style={{ height: 6, background: t.border, borderRadius: 9999 }}>
          <div style={{ width: `${issueRate}%`, height: '100%', borderRadius: 9999, background: rateColor }} />
        </div>
      </div>
    </div>
  );
}

function WelfareIntelCard({ data, isDark }) {
  const t = th(isDark);
  if (!data || data.welfareDataUnavailable) return null;
  const utilization = data.budgetUtilizationPercent || 0;
  const utilColor = utilization >= 80 ? '#ef4444' : utilization >= 60 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <SectionHeader icon={Heart} title="Welfare Intelligence" subtitle="Scheme & beneficiary analytics" color="#10b981" isDark={isDark} />
      <MiniStatRow label="Active Schemes" value={(data.activeSchemes || 0).toLocaleString()} color="#6366f1" isDark={isDark} />
      <MiniStatRow label="Total Beneficiaries" value={(data.welfareBeneficiaries || 0).toLocaleString()} isDark={isDark} />
      <MiniStatRow label="Pending Applications" value={(data.welfarePendingApplications || 0).toLocaleString()} color="#f59e0b" isDark={isDark} />
      <MiniStatRow label="Budget Allocated" value={fmtINR(data.budgetAllocated)} isDark={isDark} />
      <MiniStatRow label="Budget Disbursed" value={fmtINR(data.budgetDisbursed)} color="#10b981" isDark={isDark} />
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: t.sub }}>Budget Utilization</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: utilColor }}>{utilization.toFixed(1)}%</span>
        </div>
        <div style={{ height: 6, background: t.border, borderRadius: 9999 }}>
          <div style={{ width: `${Math.min(100, utilization)}%`, height: '100%', borderRadius: 9999, background: utilColor }} />
        </div>
      </div>
    </div>
  );
}

function RevenueIntelCard({ data, isDark }) {
  const t = th(isDark);
  const revenue = data?.totalRevenue || 0;

  return (
    <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <SectionHeader icon={Wallet} title="Revenue Intelligence" subtitle="Fees collected from certificate & permit services" color="#8b5cf6" isDark={isDark} />
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: t.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total Revenue Collected</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#8b5cf6', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtINR(revenue)}</div>
        <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{fmtINRFull(revenue)}</div>
      </div>
      <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: isDark ? '#1e293b' : '#f5f3ff', border: `1px solid ${isDark ? '#4c1d95' : '#ddd6fe'}` }}>
        <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700 }}>
          {revenue > 0 ? `Revenue collected from ${(data?.totalApplications || 0).toLocaleString()} applications` : 'No revenue data available yet'}
        </div>
      </div>
    </div>
  );
}

function AuditRiskCard({ data, isDark }) {
  const t = th(isDark);

  return (
    <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <SectionHeader icon={Database} title="Audit & Activity" subtitle="System event tracking" color="#06b6d4" isDark={isDark} />
      <MiniStatRow label="Total Events Logged" value={(data?.auditTotalEvents || 0).toLocaleString()} isDark={isDark} />
      <MiniStatRow label="Events (Last 24h)" value={(data?.auditRecentEvents24h || 0).toLocaleString()} color="#06b6d4" isDark={isDark} />
      <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 9, background: isDark ? '#0c1929' : '#ecfeff', border: `1px solid ${isDark ? '#164e63' : '#a5f3fc'}`, fontSize: 12, color: isDark ? '#67e8f9' : '#0e7490' }}>
        ℹ️ All citizen actions and admin operations are tracked in real-time via the Audit Log system.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GOVERNANCE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function GovernanceDashboard() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const t = th(isDark);

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [aiData, setAiData]       = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError]     = useState(null);
  const [chatOpen, setChatOpen]   = useState(false);

  // Load governance data
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/api/reports/governance/summary')
      .then(r => { setData(r.data); setLastRefresh(new Date()); })
      .catch(e => setError(e.response?.data?.message || 'Failed to load governance data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Generate AI analysis
  const runAiAnalysis = async () => {
    setAnalyzing(true);
    setAiError(null);
    try {
      const r = await api.post('/api/ai/governance/analyze');
      setAiData(r.data);
      if (r.data.aiUnavailable) setAiError(r.data.errorMessage);
    } catch {
      setAiError('AI insights temporarily unavailable. Dashboard data remains available.');
      setAiData(null);
    } finally { setAnalyzing(false); }
  };

  // Department chart data — normalized names
  const deptData = data?.departmentPerformance
    ? Object.values(data.departmentPerformance).map(d => ({
        name: (d.department || 'Unknown').replace(/\s+[Dd]epartment\s*$/, '').replace(/\s+[Dd]ept\.?\s*$/, ''),
        rate: Math.round(d.resolutionRate * 10) / 10,
        total: d.totalHandled,
      }))
    : [];

  return (
    <AppShell title="Governance Analytics Dashboard">
      <div style={{ maxWidth: 1640, margin: '0 auto', padding: '12px 0 60px' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <ReportPageHeader
          title="Governance Analytics Dashboard"
          subtitle="Executive intelligence layer · AI-powered insights from live CivicPulse data"
          icon={BarChart2}
          iconBg="linear-gradient(135deg, #0f172a, #1e293b)"
          iconColor="#38bdf8"
          isDark={isDark}
          lastRefresh={lastRefresh}
          onRefresh={load}
          refreshing={loading}
        />

        {/* ── Service availability banners ──────────────────────────────────── */}
        {data && (data.grievanceDataUnavailable || data.welfareDataUnavailable || data.certificateDataUnavailable) && (
          <div style={{ padding: '10px 18px', borderRadius: 12, background: isDark ? '#1c1400' : '#fef9c3', border: '1px solid #fde047', marginBottom: 20, fontSize: 13, color: isDark ? '#fde047' : '#713f12', display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
            <AlertCircle size={16} />
            ⚠️ Some services are temporarily unreachable — partial data shown.
            {data.grievanceDataUnavailable    && ' [Grievance Service]'}
            {data.certificateDataUnavailable  && ' [Certificate Service]'}
            {data.welfareDataUnavailable      && ' [Welfare Service]'}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 18px', borderRadius: 12, background: isDark ? '#1c0000' : '#fef2f2', border: '1px solid #fecaca', marginBottom: 20, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ── Executive KPI Row ─────────────────────────────────────────────── */}
        {loading && !data ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 28 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: isDark ? 'linear-gradient(90deg,#1e293b,#334155,#1e293b)' : 'linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
          </div>
        ) : data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
            <KpiCard icon={Users}         label="Total Citizens"       value={data.totalCitizens?.toLocaleString()         || '—'}  color="#3b82f6" bg={isDark ? '#1e3a5f' : '#eff6ff'} isDark={isDark} />
            <KpiCard icon={AlertTriangle} label="Total Requests"       value={data.totalRequests?.toLocaleString()         || '—'}  color="#f97316" bg={isDark ? '#431407' : '#fff7ed'} isDark={isDark} />
            <KpiCard icon={CheckCircle2}  label="Resolution Rate"      value={`${(data.overallResolutionRate  || 0).toFixed(1)}%`} subtitle="Across all services" color="#10b981" bg={isDark ? '#064e3b' : '#f0fdf4'} isDark={isDark} />
            <KpiCard icon={Wallet}        label="Revenue Collected"    value={fmtINR(data.totalRevenue)}                          color="#8b5cf6" bg={isDark ? '#3b0764' : '#f5f3ff'} isDark={isDark} />
            <KpiCard icon={Heart}         label="Welfare Beneficiaries" value={data.welfareBeneficiaries?.toLocaleString() || '0'} color="#10b981" bg={isDark ? '#064e3b' : '#ecfdf5'} isDark={isDark} />
            <KpiCard icon={Activity}      label="Satisfaction Score"   value={data.citizenSatisfactionScore > 0 ? `${data.citizenSatisfactionScore.toFixed(1)} / 5 ★` : 'No data'} subtitle="Based on feedback" color="#ec4899" bg={isDark ? '#500724' : '#fdf2f8'} isDark={isDark} />
          </div>
        )}

        {/* ── AI Executive Brief ────────────────────────────────────────────── */}
        <AiChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} isDark={isDark} />
        <AiExecutiveBrief
          isDark={isDark} aiData={aiData} analyzing={analyzing} aiError={aiError}
          onGenerate={runAiAnalysis} onChat={() => setChatOpen(true)}
          govData={data}
        />

        {/* ── Charts Row ────────────────────────────────────────────────────── */}
        {data && deptData.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <SectionCard title="Resolution Rates by Department" subtitle="Comparative resolution percentages" icon={BarChart2} isDark={isDark}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={deptData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: t.sub }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: t.sub }} domain={[0,100]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v}%`, 'Resolution Rate']} contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 12 }} />
                  <Bar dataKey="rate" radius={[6,6,0,0]} maxBarSize={56}>
                    {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Department Performance Progress" subtitle="Live completion status per department" icon={TrendingUp} isDark={isDark}>
              <div style={{ maxHeight: 230, overflowY: 'auto', paddingRight: 4 }}>
                {deptData.map((d, i) => <PerformanceBar key={i} dept={d.name} rate={d.rate} isDark={isDark} />)}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Intelligence Section Cards (2×2 grid) ─────────────────────────── */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 20, marginBottom: 28 }}>
            <GrievanceIntelCard    data={data} isDark={isDark} />
            <CertificateIntelCard  data={data} isDark={isDark} />
            <WelfareIntelCard      data={data} isDark={isDark} />
            <RevenueIntelCard      data={data} isDark={isDark} />
            <AuditRiskCard         data={data} isDark={isDark} />
          </div>
        )}

        {/* ── Department Summary Table ──────────────────────────────────────── */}
        {data && deptData.length > 0 && (
          <SectionCard title="Department Summary Table" subtitle="Detailed breakdown of workload and resolution rates" icon={Award} isDark={isDark}>
            <div style={{ overflowX: 'auto', margin: '-20px -22px -20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${t.border}` }}>
                    {['Department','Total Cases','Resolution Rate','Status','Avg Turnaround'].map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: t.sub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.departmentPerformance).map(([key, d]) => {
                    const rate = d.resolutionRate || 0;
                    const rateColor = rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
                    const rateBg = rate >= 75 ? (isDark ? '#064e3b' : '#dcfce7') : rate >= 50 ? (isDark ? '#78350f' : '#fef9c3') : (isDark ? '#7f1d1d' : '#fee2e2');
                    const statusLabel = rate >= 75 ? 'High Perf.' : rate >= 50 ? 'Needs Attn' : 'Critical';
                    return (
                      <tr key={key} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: t.text }}>{d.department}</td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: t.text, fontWeight: 600 }}>{(d.totalHandled || 0).toLocaleString()}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: rateBg, color: rateColor }}>
                            {rate.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: rateColor }}>{statusLabel}</td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: t.sub, fontWeight: 600 }}>
                          {d.avgTurnaroundHours > 0 ? `${d.avgTurnaroundHours}h` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Empty state */}
        {data && !deptData.length && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.sub }}>
            <BarChart2 size={44} style={{ margin: '0 auto 14px', opacity: 0.25 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No department data available yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Data populates as complaints and applications are processed</p>
          </div>
        )}

      </div>

      <style>{`
        ${GLOBAL_STYLES}
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </AppShell>
  );
}
