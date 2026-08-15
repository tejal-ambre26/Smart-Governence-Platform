import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Landmark, AlertTriangle, Droplets, Route, Zap, FileText, 
  PenSquare, Search, LogIn, PhoneCall, ArrowRight, Award, 
  ChevronRight, Users, Clock, Bot, ShieldCheck, Check, HelpCircle, X
} from 'lucide-react';

const SERVICE_DIRECTORY = [
  { id: 's1', category: 'Certificates', name: 'Birth Certificate', dept: 'Health Department', time: '2 Working Days', desc: 'Official record of birth for school admission, passport, and legal verification.' },
  { id: 's2', category: 'Certificates', name: 'Death Certificate', dept: 'Health Department', time: '2 Working Days', desc: 'Legal certificate certifying death for insurance, property, and legal claims.' },
  { id: 's3', category: 'Certificates', name: 'Income Certificate', dept: 'Revenue Department', time: '5 Working Days', desc: 'Proof of annual family income for scholarships, subsidies, and schemes.' },
  { id: 's4', category: 'Certificates', name: 'Caste Certificate', dept: 'Revenue Department', time: '7 Working Days', desc: 'Official community verification certificate for reservation and state benefits.' },
  { id: 's5', category: 'Complaints', name: 'Roads, Potholes & Signals', dept: 'Roads Department', time: '48 Hours Target', desc: 'Report damaged roads, broken footpaths, dividers, and traffic signal failures.' },
  { id: 's6', category: 'Complaints', name: 'Water Supply & Quality', dept: 'Water Supply Board', time: '24 Hours Target', desc: 'Report pipeline leaks, low water pressure, contamination, or request tanker.' },
  { id: 's7', category: 'Complaints', name: 'Electricity & Streetlights', dept: 'Electricity Board', time: '12 Hours Target', desc: 'Report power outages, dangerous wiring, transformer issues, and dark streetlights.' },
  { id: 's8', category: 'Complaints', name: 'Garbage & Sanitation', dept: 'Municipal Corporation', time: '24 Hours Target', desc: 'Report uncollected waste, open drains, public toilet maintenance, or mosquito breeding.' },
  { id: 's9', category: 'Welfare', name: 'National Pension Scheme', dept: 'Social Welfare Dept', time: 'Direct Benefit Transfer', desc: 'Financial assistance for senior citizens, widows, and specially-abled individuals.' },
  { id: 's10', category: 'Welfare', name: 'Student Higher Education Grant', dept: 'Education Department', time: 'Direct Benefit Transfer', desc: 'Annual scholarship assistance for eligible undergraduate and vocational students.' },
  { id: 's11', category: 'Permits', name: 'Trade License Renewal', dept: 'Municipal Corporation', time: '3 Working Days', desc: 'Commercial operational license registration and annual municipal renewal.' },
  { id: 's12', category: 'Permits', name: 'Building Plan Approval', dept: 'Urban Planning Dept', time: '14 Working Days', desc: 'Architectural map verification and residential construction approval permit.' },
];

const NOTICES = [
  { id: 1, category: 'WATER SUPPLY', dept: 'Municipal Water Board', date: '15 Aug 2026', title: 'Scheduled Pipeline Maintenance in Ward 7–12', details: 'Ultrasonic flow monitor installation and pipeline cleaning scheduled. Water supply will be restored by 6:00 PM.' },
  { id: 2, category: 'ROADS', dept: 'Roads Directorate', date: '14 Aug 2026', title: 'Monsoon Drain Pre-Clearing & Highway Lane Advisory', details: 'Pre-monsoon drainage clearing active across 42 municipal wards. Drivers advised to use alternate ring road route.' },
  { id: 3, category: 'WELFARE', dept: 'Social Welfare Directorate', date: '13 Aug 2026', title: 'Phase 4 Direct Benefit Transfer Disbursed', details: 'Direct bank transfer credited for senior pension beneficiaries via Aadhaar-enabled payment bridge.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackNumber, setTrackNumber] = useState('');
  const [trackResult, setTrackResult] = useState(null);

  // AI Assistant Modal State
  const [showAiModal, setShowAiModal] = useState(false);

  const filteredServices = SERVICE_DIRECTORY.filter(s => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    setTrackResult({
      id: trackNumber.trim().toUpperCase(),
      status: 'Under Verification',
      department: 'Revenue Department',
      date: '15 Aug 2026',
      stage: 'Documents being verified by Field Verification Officer'
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', color: '#172033', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      
      {/* ── Institutional Top Bar ── */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #D9DEE7', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '96%', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#1769AA', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Landmark size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#172033', letterSpacing: '-0.02em', lineHeight: 1 }}>
                SMART GOVERNANCE PLATFORM
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#5B6475', marginTop: 2 }}>
                Unified Citizen Services Portal
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#services" style={{ fontSize: 14, fontWeight: 600, color: '#5B6475', textDecoration: 'none' }}>Services</a>
            <a href="#tracker" style={{ fontSize: 14, fontWeight: 600, color: '#5B6475', textDecoration: 'none' }}>Track Application</a>
            <a href="#notices" style={{ fontSize: 14, fontWeight: 600, color: '#5B6475', textDecoration: 'none' }}>Notices</a>
            <a href="#emergency" style={{ fontSize: 14, fontWeight: 600, color: '#5B6475', textDecoration: 'none' }}>Emergency</a>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 700, color: '#1769AA', textDecoration: 'none' }}>Sign in</Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button style={{ height: 36, padding: '0 16px', borderRadius: 6, background: '#1769AA', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Register
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Government Information Sub-Banner ── */}
      <div style={{ background: '#EBF4FC', borderBottom: '1px solid #BEE3F8', padding: '10px 20px', textAlign: 'center', fontSize: 13, color: '#1769AA', fontWeight: 700 }}>
        Government Services Portal — Access municipal services, certificates, welfare schemes and civic complaint services online.
      </div>

      <main style={{ maxWidth: '96%', margin: '0 auto', padding: '24px 20px 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* ── Hero Section ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: '36px 32px' }}>
          <div style={{ maxWidth: '100%' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1769AA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              DIGITAL GOVERNMENT SERVICES
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#172033', margin: '8px 0 12px', lineHeight: 1.25 }}>
              Access public services, submit applications, report civic issues and track your requests online.
            </h1>
            <p style={{ fontSize: 15, color: '#5B6475', margin: '0 0 24px', lineHeight: 1.6 }}>
              Smart Governance Platform is the official single-window portal for digital municipal certificates, civic grievances, and direct welfare benefit transfers.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#services" style={{ textDecoration: 'none' }}>
                <button style={{ height: 44, padding: '0 20px', borderRadius: 6, background: '#1769AA', color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Find a Service <ArrowRight size={16} />
                </button>
              </a>
              <a href="#tracker" style={{ textDecoration: 'none' }}>
                <button style={{ height: 44, padding: '0 20px', borderRadius: 6, background: '#FFFFFF', color: '#172033', border: '1px solid #D9DEE7', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Track an Application
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* ── Primary Action Panels (3 Columns) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <FileText size={28} style={{ color: '#1769AA', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '0 0 6px' }}>Find a Service</h3>
              <p style={{ fontSize: 14, color: '#5B6475', margin: 0, lineHeight: 1.5 }}>Browse government services, certificate applications, and trade permits.</p>
            </div>
            <a href="#services" style={{ textDecoration: 'none', marginTop: 20 }}>
              <button style={{ height: 38, width: '100%', borderRadius: 6, border: '1px solid #1769AA', background: '#EBF4FC', color: '#1769AA', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Browse Services →
              </button>
            </a>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <Search size={28} style={{ color: '#2F7D6D', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '0 0 6px' }}>Track a Request</h3>
              <p style={{ fontSize: 14, color: '#5B6475', margin: 0, lineHeight: 1.5 }}>Check the status of an application or complaint in real time.</p>
            </div>
            <a href="#tracker" style={{ textDecoration: 'none', marginTop: 20 }}>
              <button style={{ height: 38, width: '100%', borderRadius: 6, border: '1px solid #2F7D6D', background: '#E8F5F2', color: '#2F7D6D', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Track Request →
              </button>
            </a>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <PenSquare size={28} style={{ color: '#B42318', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '0 0 6px' }}>Report a Civic Issue</h3>
              <p style={{ fontSize: 14, color: '#5B6475', margin: 0, lineHeight: 1.5 }}>Report problems with roads, water, electricity or sanitation to field officers.</p>
            </div>
            <Link to="/login" style={{ textDecoration: 'none', marginTop: 20 }}>
              <button style={{ height: 38, width: '100%', borderRadius: 6, border: '1px solid #B42318', background: '#FDF2F2', color: '#B42318', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Report Issue →
              </button>
            </Link>
          </div>
        </div>

        {/* ── Government Services Directory (Main Section) ── */}
        <div id="services" style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#172033', margin: 0 }}>Government Services</h2>
              <div style={{ fontSize: 14, color: '#5B6475', marginTop: 2 }}>Find the service or certificate application you need</div>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#8892A4' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                style={{ width: '100%', height: 36, paddingLeft: 36, paddingRight: 12, borderRadius: 6, border: '1px solid #D9DEE7', fontSize: 13, color: '#172033', outline: 'none' }}
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E8ECF2', paddingBottom: 14, marginBottom: 20, overflowX: 'auto' }}>
            {['All', 'Certificates', 'Complaints', 'Welfare', 'Permits'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: selectedCategory === cat ? '1px solid #1769AA' : '1px solid #D9DEE7',
                  background: selectedCategory === cat ? '#EBF4FC' : '#FFFFFF',
                  color: selectedCategory === cat ? '#1769AA' : '#5B6475',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Service List Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredServices.map(s => (
              <div
                key={s.id}
                style={{
                  padding: '16px 20px', borderRadius: 6, border: '1px solid #E8ECF2', background: '#F7F8FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
                }}
              >
                <div style={{ maxWidth: 720 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: 0 }}>{s.name}</h4>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#5B6475', background: '#E8ECF2', padding: '2px 8px', borderRadius: 4 }}>{s.dept}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#5B6475', margin: '4px 0 0', lineHeight: 1.5 }}>{s.desc}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 12, color: '#217346', fontWeight: 700, background: '#EAF6F0', padding: '4px 10px', borderRadius: 4 }}>
                    {s.time}
                  </div>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <button style={{ height: 34, padding: '0 14px', borderRadius: 6, background: '#FFFFFF', color: '#1769AA', border: '1px solid #1769AA', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      View Service →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Application Tracker Section ── */}
        <div id="tracker" style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#172033', margin: 0 }}>Track Your Application</h2>
          <p style={{ fontSize: 14, color: '#5B6475', margin: '4px 0 20px' }}>
            Enter your application or complaint reference number to check real-time status
          </p>

          <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: 12, maxWidth: 540 }}>
            <input
              type="text"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              placeholder="e.g. APP-2026-0022 or CP-2026-8941"
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 6, border: '1px solid #D9DEE7', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" style={{ height: 42, padding: '0 20px', borderRadius: 6, background: '#1769AA', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Track Request
            </button>
          </form>

          {trackResult && (
            <div style={{ marginTop: 20, padding: 20, background: '#F7F8FA', borderRadius: 6, border: '1px solid #E8ECF2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1769AA' }}>{trackResult.id}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#A15C00', background: '#FEF6E7', padding: '3px 10px', borderRadius: 4 }}>
                  {trackResult.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#172033', fontWeight: 600 }}>Department: {trackResult.department}</div>
              <div style={{ fontSize: 13, color: '#5B6475', marginTop: 4 }}>Current Stage: {trackResult.stage}</div>
            </div>
          )}
        </div>

        {/* ── Official Notices & Advisories ── */}
        <div id="notices" style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#172033', margin: '0 0 16px' }}>Official Notices & Advisories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NOTICES.map(n => (
              <div key={n.id} style={{ borderBottom: '1px solid #E8ECF2', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1769AA', background: '#EBF4FC', padding: '2px 8px', borderRadius: 4 }}>{n.category}</span>
                  <span style={{ fontSize: 12, color: '#8892A4' }}>{n.dept} · {n.date}</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#172033', margin: '4px 0' }}>{n.title}</h4>
                <p style={{ fontSize: 13, color: '#5B6475', margin: 0, lineHeight: 1.5 }}>{n.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How CivicPulse Works ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#172033', margin: '0 0 20px' }}>How to Use Smart Governance Platform</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { step: '01', title: 'Find a Service', desc: 'Browse the service directory to locate your required certificate or grievance portal.' },
              { step: '02', title: 'Submit Application', desc: 'Fill in required details and upload supporting identity documents digitally.' },
              { step: '03', title: 'Track Progress', desc: 'Monitor department verification status and field officer approval logs in real time.' },
              { step: '04', title: 'Receive Result', desc: 'Download digitally signed PDF certificates or receive resolved complaint confirmations.' }
            ].map(st => (
              <div key={st.step} style={{ background: '#F7F8FA', padding: 20, borderRadius: 6, border: '1px solid #E8ECF2' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#1769AA', marginBottom: 8 }}>{st.step}</div>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#172033', margin: '0 0 6px' }}>{st.title}</h4>
                <p style={{ fontSize: 13, color: '#5B6475', margin: 0, lineHeight: 1.5 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Emergency Information & AI Help Cards Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Emergency Panel */}
          <div id="emergency" style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#B42318', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneCall size={20} /> Emergency Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#172033', fontWeight: 600 }}>
              <div>Emergency Services: <strong style={{ color: '#B42318' }}>112</strong></div>
              <div>Ambulance Helpline: <strong style={{ color: '#B42318' }}>108</strong></div>
              <div>Citizen Support Toll-Free: <strong>1800-11-2026</strong></div>
            </div>
          </div>

          {/* AI Help Panel */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1769AA', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={20} /> Need Assistance?
            </h3>
            <p style={{ fontSize: 14, color: '#5B6475', margin: '0 0 16px', lineHeight: 1.5 }}>
              Smart Governance AI Assistant can help you find services and understand application requirements.
            </p>
            <button
              onClick={() => setShowAiModal(true)}
              style={{ height: 38, padding: '0 16px', borderRadius: 6, background: '#1769AA', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Bot size={16} />
              Ask Smart Governance AI →
            </button>
          </div>
        </div>

        {/* ── Smart Governance Platform at a Glance (Small Official Stats Strip) ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: '20px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#8892A4', textTransform: 'uppercase', marginBottom: 12 }}>
            CIVICPULSE AT A GLANCE
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#172033' }}>12,847</div>
              <div style={{ fontSize: 13, color: '#5B6475' }}>Requests resolved</div>
            </div>
            <div style={{ borderLeft: '1px solid #D9DEE7', paddingLeft: 48 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#172033' }}>4,200+</div>
              <div style={{ fontSize: 13, color: '#5B6475' }}>Registered citizens</div>
            </div>
            <div style={{ borderLeft: '1px solid #D9DEE7', paddingLeft: 48 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#172033' }}>98.5%</div>
              <div style={{ fontSize: 13, color: '#5B6475' }}>SLA compliance</div>
            </div>
          </div>
        </div>

      </main>

      {/* ── AI Assistant Dialog Modal ── */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 8, width: '100%', maxWidth: 480, padding: 24, border: '1px solid #D9DEE7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#172033' }}>Smart Governance AI Assistant</h3>
              <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5B6475' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: '#5B6475', margin: '0 0 16px' }}>
              How can I assist you with government services today?
            </p>
            <div style={{ background: '#F7F8FA', padding: 14, borderRadius: 6, fontSize: 13, color: '#172033', marginBottom: 16 }}>
              🤖 "You can ask me about document requirements for Income Certificates, Birth Certificates, or how to file a road repair complaint."
            </div>
            <input
              type="text"
              placeholder="Ask a question..."
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid #D9DEE7', fontSize: 13, outline: 'none' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  alert('AI Assistant response: Please refer to the Services Directory for official eligibility criteria.');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ── Official Government Footer ── */}
      <footer style={{ background: '#FFFFFF', borderTop: '1px solid #D9DEE7', padding: '36px 0 24px' }}>
        <div style={{ maxWidth: '96%', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#172033' }}>SMART GOVERNANCE PLATFORM</div>
            <div style={{ fontSize: 13, color: '#5B6475', marginTop: 4 }}>Unified Citizen Services Portal</div>
            <p style={{ fontSize: 13, color: '#8892A4', marginTop: 12, lineHeight: 1.5 }}>
              Official single-window portal for municipal services, certificates, grievances, and welfare benefit transfers.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', textTransform: 'uppercase', marginBottom: 12 }}>Services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#5B6475' }}>
              <a href="#services" style={{ color: '#5B6475', textDecoration: 'none' }}>Complaints</a>
              <a href="#services" style={{ color: '#5B6475', textDecoration: 'none' }}>Certificates</a>
              <a href="#services" style={{ color: '#5B6475', textDecoration: 'none' }}>Welfare</a>
              <a href="#services" style={{ color: '#5B6475', textDecoration: 'none' }}>Permits</a>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', textTransform: 'uppercase', marginBottom: 12 }}>Support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#5B6475' }}>
              <a href="#tracker" style={{ color: '#5B6475', textDecoration: 'none' }}>Track Application</a>
              <a href="#notices" style={{ color: '#5B6475', textDecoration: 'none' }}>Notices & Advisories</a>
              <Link to="/login" style={{ color: '#5B6475', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', textTransform: 'uppercase', marginBottom: 12 }}>Emergency</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#5B6475' }}>
              <div>Emergency: <strong>112</strong></div>
              <div>Ambulance: <strong>108</strong></div>
              <div>Support: <strong>1800-11-2026</strong></div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '96%', margin: '24px auto 0', padding: '16px 20px 0', borderTop: '1px solid #E8ECF2', fontSize: 12, color: '#8892A4', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Smart Governance Platform. All rights reserved.</span>
          <span>Official Public Services Platform</span>
        </div>
      </footer>

    </div>
  );
}
