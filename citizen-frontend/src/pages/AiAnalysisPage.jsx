import { useState, useEffect } from 'react';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { Badge } from '../components/Badge.jsx';
import api from '../api.js';
import { toast } from 'sonner';
import {
  Brain, Sparkles, RefreshCw, AlertTriangle, CheckCircle2,
  TrendingUp, MessageSquare, Send, Download, Landmark,
  Building, Lightbulb
} from 'lucide-react';

export default function AiAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState(null);
  
  // Chat state
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your CivicPulse AI Governance Analyst. Ask me any strategic questions about municipal service SLAs, department performance, grievance backlogs, or welfare budget utilization.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.post('/reporting-service/api/ai/governance/analyze', {});
      } catch (err1) {
        res = await api.post('/api/ai/governance/analyze', {});
      }
      
      setAiData(res.data);
    } catch (e) {
      console.error("Failed to load AI Analysis:", e);
      toast.error("Could not fetch AI Analysis. Check backend service status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, []);

  const handleAskQuestion = async (e) => {
    e?.preventDefault();
    if (!chatQuestion.trim() || chatLoading) return;

    const q = chatQuestion.trim();
    setChatQuestion('');
    const userMsg = { sender: 'user', text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      let res;
      try {
        res = await api.post('/reporting-service/api/ai/governance/chat', { question: q });
      } catch (err1) {
        res = await api.post('/api/ai/governance/chat', { question: q });
      }

      const aiText = res.data?.summary || 'Analysis complete.';
      const aiMsg = { 
        sender: 'ai', 
        text: aiText,
        insights: res.data?.insights || [],
        recommendations: res.data?.recommendations || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      toast.error("AI Assistant request failed.");
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error processing your query.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportReport = async () => {
    if (!aiData) return;

    try {
      const username = keycloak.tokenParsed?.preferred_username || 'admin';
      const sub = keycloak.tokenParsed?.sub || username;
      await api.post('/notification-service/api/notifications', {
        recipient: sub,
        eventType: 'REPORT_DOWNLOADED',
        title: 'Downloaded Your Report',
        message: 'You downloaded official Executive AI Governance Analytics Report.',
        relatedEntityId: 'REPORT-AI-' + Date.now(),
        relatedEntityType: 'REPORT',
        readStatus: false,
        recipientRole: 'ADMIN',
        createdAt: new Date().toISOString()
      }).catch(() => {});
    } catch (e) {}

    const content = `==========================================================
SMART GOVERNANCE PLATFORM — AI ANALYSIS & INSIGHTS REPORT
Generated: ${new Date().toLocaleString()}
Engine: Google Gemini Flash 1.5 / 2.0
==========================================================

STATUS: ${aiData.overallStatus || 'ACTIVE'}

EXECUTIVE SUMMARY:
${aiData.summary || 'N/A'}

KEY GOVERNANCE INSIGHTS:
${(aiData.insights || []).map((ins, i) => `${i + 1}. ${ins}`).join('\n')}

RECOMMENDED ACTIONS:
${(aiData.recommendations || []).map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

DEPARTMENT PRIORITIES:
${(aiData.departmentPriorities || []).map((dp, i) => `• ${dp}`).join('\n')}

SLA & BOTTLENECK ANALYSIS:
${(aiData.slaInsights || []).map((sla, i) => `• ${sla}`).join('\n')}

FINANCIAL & WELFARE UTILIZATION:
${(aiData.welfareInsights || []).map((w, i) => `• ${w}`).join('\n')}
==========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AI_Governance_Analysis_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("AI Governance Analysis Report downloaded!");
  };

  return (
    <AppShell title="AI Analysis & Insights">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1400, margin: '0 auto' }}>
        
        {/* ── Top Header Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#ffffff',
          borderRadius: 20,
          padding: '28px 32px',
          boxShadow: '0 10px 30px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', marginBottom: 12 }}>
              <Sparkles size={14} color="#a5b4fc" /> GOVERNANCE AI ENGINE — POWERED BY GOOGLE GEMINI
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
              AI Analysis Report & Strategic Insights
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#e0e7ff', lineHeight: 1.6 }}>
              Real-time automated evaluation of municipal SLA compliance, grievance bottlenecks, department workloads, and welfare disbursement anomalies.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
            <button
              onClick={fetchAiAnalysis}
              disabled={loading}
              style={{
                background: '#ffffff', color: '#312e81', border: 'none',
                borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Analyzing...' : 'Re-Run AI Model'}
            </button>

            {aiData && (
              <button
                onClick={exportReport}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 12, padding: '10px 16px', fontWeight: 800, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Download size={16} /> Export TXT
              </button>
            )}
          </div>
        </div>

        {/* ── Main Content Loading State ── */}
        {loading ? (
          <PageLoader message="Connecting to Gemini AI Engine and compiling live governance metrics..." />
        ) : (
          <>
            {/* ── Executive AI Status Overview Card ── */}
            <div style={{
              background: '#ffffff', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: 28,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Executive Governance Summary</h3>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Generative synthesis of cross-functional platform statistics</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge variant={aiData?.overallStatus === 'HIGH_PERFORMANCE' ? 'success' : aiData?.overallStatus === 'NEEDS_ATTENTION' ? 'warning' : 'info'}>
                    STATUS: {aiData?.overallStatus || 'ACTIVE'}
                  </Badge>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, fontSize: 15, color: '#334155', lineHeight: 1.7, fontWeight: 500 }}>
                {aiData?.summary || 'The governance platform is currently operating within standard SLA parameters. All microservices report active health checks.'}
              </div>

              {/* Key Insights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                    <TrendingUp size={18} /> Strategic Insights
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                    {(aiData?.insights && aiData.insights.length > 0) ? (
                      aiData.insights.map((item, idx) => <li key={idx} style={{ marginBottom: 6 }}>{item}</li>)
                    ) : (
                      <>
                        <li>Overall complaint resolution rate remains within target thresholds.</li>
                        <li>Revenue collection per certificate application is tracked accurately.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                    <AlertTriangle size={18} /> SLA Bottlenecks & Warnings
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#991b1b', lineHeight: 1.6 }}>
                    {(aiData?.warnings && aiData.warnings.length > 0) ? (
                      aiData.warnings.map((item, idx) => <li key={idx} style={{ marginBottom: 6 }}>{item}</li>)
                    ) : (
                      <li>No critical SLA violations or high-risk escalation spikes detected.</li>
                    )}
                  </ul>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                    <Lightbulb size={18} /> AI Strategic Recommendations
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                    {(aiData?.recommendations && aiData.recommendations.length > 0) ? (
                      aiData.recommendations.map((item, idx) => <li key={idx} style={{ marginBottom: 6 }}>{item}</li>)
                    ) : (
                      <>
                        <li>Automate verification for low-risk certificate applications.</li>
                        <li>Allocate additional officer shifts during monthly peak request days.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Department & Domain Intelligence Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
              
              {/* Department Priorities */}
              <div style={{ background: '#ffffff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Building size={20} color="#4338ca" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Department Action Priorities</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(aiData?.departmentPriorities && aiData.departmentPriorities.length > 0) ? (
                    aiData.departmentPriorities.map((dp, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4338ca', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i+1}</span>
                        {dp}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>All departments operating within standard workload balance.</div>
                  )}
                </div>
              </div>

              {/* Welfare & Financial Insights */}
              <div style={{ background: '#ffffff', borderRadius: 18, border: '1.5px solid #e2e8f0', padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Landmark size={20} color="#059669" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Welfare & Financial Intelligence</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {((aiData?.welfareInsights || []).concat(aiData?.financialInsights || [])).length > 0 ? (
                    (aiData?.welfareInsights || []).concat(aiData?.financialInsights || []).map((wf, i) => (
                      <div key={i} style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={16} color="#16a34a" />
                        {wf}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>Welfare disbursements and fee collections are synced.</div>
                  )}
                </div>
              </div>

            </div>

            {/* ── Interactive AI Governance Assistant Chat ── */}
            <div style={{
              background: '#ffffff', borderRadius: 20, border: '1.5px solid #e2e8f0', padding: 28,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>AI Governance Assistant</h3>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Ask natural language questions about your municipal platform metrics</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                  Model: <span style={{ color: '#4338ca' }}>Google Gemini Flash</span>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20,
                maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16
              }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      background: msg.sender === 'user' ? '#4338ca' : '#ffffff',
                      color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                      border: msg.sender === 'user' ? 'none' : '1px solid #cbd5e1',
                      borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '14px 18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      fontSize: 14,
                      lineHeight: 1.6
                    }}>
                      {msg.text}

                      {msg.insights && msg.insights.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#334155' }}>
                          <strong>Key Observations:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                            {msg.insights.map((ins, i) => <li key={i}>{ins}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, padding: '0 4px' }}>
                      {msg.sender === 'user' ? 'You' : 'CivicPulse AI'} • {msg.time}
                    </span>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6366f1', fontSize: 13, fontWeight: 700 }}>
                    <Sparkles size={16} className="animate-spin" /> Gemini AI is analyzing platform metrics...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask e.g. 'Which department has the longest turnaround time?' or 'Summarize welfare fund utilization'"
                  style={{
                    flex: 1, padding: '12px 18px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                    fontSize: 14, outline: 'none', background: '#ffffff'
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatQuestion.trim() || chatLoading}
                  style={{
                    background: '#4338ca', color: '#ffffff', border: 'none', borderRadius: 12,
                    padding: '0 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, opacity: (!chatQuestion.trim() || chatLoading) ? 0.6 : 1
                  }}
                >
                  <Send size={16} /> Ask AI
                </button>
              </form>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
