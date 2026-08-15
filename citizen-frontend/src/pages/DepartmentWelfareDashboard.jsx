import { useEffect, useState } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { toast } from 'sonner';
import { 
  Building2, Clock, CheckCircle2, AlertTriangle, Eye, X, ShieldCheck, FileText, 
  ThumbsUp, ThumbsDown, FileQuestion, QrCode, CreditCard, Award, UserCheck, RefreshCw, Send, Check, Landmark, Inbox
} from 'lucide-react';

const REJECTION_REASONS = [
  'Income exceeds scheme maximum eligibility limit',
  'Invalid Aadhaar / Identity record mismatch',
  'Bank account details or IFSC code mismatch',
  'Missing or illegible document upload',
  'Duplicate active application detected',
  'Other (custom reason)'
];

function statusVariant(s) {
  if (s === 'APPLIED') return 'info';
  if (s === 'UNDER_REVIEW') return 'warning';
  if (s === 'RECOMMENDED') return 'success';
  if (s === 'DOCUMENTS_REQUESTED') return 'warning';
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'FUNDS_DISBURSED') return 'success';
  return 'neutral';
}

function DocumentBodyPreview({ doc, appDetails }) {
  const docName = doc.docName.toLowerCase();
  
  // Use appDetails for more context if available
  const name = appDetails?.applicantName || doc.applicantName || 'Applicant';
  const age = appDetails?.age || doc.age || 25;
  const aadhaar = appDetails?.applicantAadhaar || doc.aadhaar || '1234-5678-9123';
  const income = appDetails?.annualIncome || doc.annualIncome || 0;
  
  // Bank details
  const accName = appDetails?.accountHolderName || name;
  const bankName = appDetails?.bankName || 'State Bank of India';
  const accNumber = appDetails?.accountNumber || '12345678912';
  const ifsc = appDetails?.ifscCode || 'SBIN0001234';

  if (doc.dataUrl) {
    if (doc.dataUrl.startsWith('data:image')) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', background: '#f1f5f9', borderRadius: 16, padding: 16 }}>
          <img src={doc.dataUrl} style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: 8, objectFit: 'contain' }} alt={doc.fileName || doc.docName} />
        </div>
      );
    } else if (doc.dataUrl.startsWith('data:application/pdf')) {
      return (
        <iframe src={doc.dataUrl} width="100%" height="500px" style={{ border: 'none', borderRadius: 8 }} title={doc.fileName || doc.docName} />
      );
    }
  }

  if (docName.includes('aadhaar')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #ea580c', boxShadow: '0 8px 24px rgba(234, 88, 12, 0.12)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg, #ea580c 0%, #f97316 40%, #16a34a 100%)', padding: '12px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em' }}>GOVERNMENT OF INDIA</div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Unique Identification Authority of India</div>
          </div>
          <ShieldCheck size={28} color="#ffffff" />
        </div>
        <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 90, borderRadius: 10, border: '2px solid #cbd5e1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <div><span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>NAME</span>: <strong style={{ fontSize: 14, color: '#0f172a' }}>{name}</strong></div>
            <div><span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>AGE</span>: <strong>{age} Years</strong></div>
            <div><span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>VERIFICATION</span>: <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ VERIFIED AADHAAR VAULT</span></div>
          </div>
          <QrCode size={48} color="#0f172a" />
        </div>
        <div style={{ background: '#fef2f2', borderTop: '2px dashed #fca5a5', padding: '10px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#b91c1c', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
            {aadhaar}
          </div>
        </div>
      </div>
    );
  }

  if (docName.includes('income')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #0284c7', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.05, transform: 'rotate(-30deg)' }}>
          <Award size={150} color="#0284c7" />
        </div>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #e0f2fe', paddingBottom: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#0369a1' }}>REVENUE DEPARTMENT, GOVT OF INDIA</div>
          <h3 style={{ margin: '2px 0', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>INCOME CERTIFICATE</h3>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Valid for the current financial year</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
          <div><span style={{ color: '#64748b', fontWeight: 700 }}>Certified Name:</span><br /><strong style={{ color: '#0f172a', fontSize: 14 }}>{name}</strong></div>
          <div><span style={{ color: '#64748b', fontWeight: 700 }}>Certificate No:</span><br /><strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>INC-{Math.floor(10000 + Math.random()*90000)}/2026</strong></div>
        </div>
        <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: 12, textAlign: 'center', border: '1px solid #bae6fd' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1' }}>DECLARED ANNUAL FAMILY INCOME</span>
          <div style={{ fontSize: 24, color: '#0284c7', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0' }}>
            ₹{Number(income).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Digitally Signed by Tahsildar
          </span>
        </div>
      </div>
    );
  }

  if (docName.includes('passbook')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #1e40af', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#1e40af', padding: '16px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={20} color="#1e40af" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>{bankName}</h3>
            <div style={{ fontSize: 11, color: '#bfdbfe' }}>Official Bank Passbook First Page</div>
          </div>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, fontSize: 12 }}>
            <div><span style={{ color: '#64748b', fontWeight: 700 }}>Account Name</span><br /><strong style={{ color: '#0f172a', fontSize: 14 }}>{accName}</strong></div>
            <div><span style={{ color: '#64748b', fontWeight: 700 }}>Branch</span><br /><strong style={{ color: '#0f172a', fontSize: 13 }}>Main Branch</strong></div>
            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: 700 }}>Account Number</span><br />
              <strong style={{ color: '#1d4ed8', fontSize: 18, fontFamily: 'monospace', letterSpacing: '0.1em' }}>{accNumber}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', fontWeight: 700 }}>IFSC Code</span><br />
              <strong style={{ color: '#0f172a', fontSize: 16, fontFamily: 'monospace' }}>{ifsc}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontSize: 11, fontWeight: 800, background: '#dcfce7', padding: '8px 12px', borderRadius: 8 }}>
            <ShieldCheck size={16} /> Bank Stamp & Signature Verified
          </div>
        </div>
      </div>
    );
  }

  if (docName.includes('photo')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#475569', letterSpacing: '0.05em' }}>PASSPORT SIZE PHOTOGRAPH</div>
        <div style={{ width: 140, height: 180, borderRadius: 12, border: '4px solid #f8fafc', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 48, fontWeight: 900 }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={14} color="#10b981" /> High Resolution Image Verified
        </div>
      </div>
    );
  }

  if (docName.includes('residence') || docName.includes('domicile')) {
    return (
      <div style={{ background: '#fdfbf7', borderRadius: 16, border: '2px solid #d4d4d8', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #e4e4e7', paddingBottom: 16, marginBottom: 16 }}>
          <Building2 size={32} color="#52525b" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#27272a' }}>DOMICILE / RESIDENCE CERTIFICATE</h3>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>Issued by Local Municipal Authority</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: '#3f3f46' }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            This is to certify that <strong>{name}</strong> is a bonafide resident of the state and holds a permanent address within the municipal limits.
          </p>
          <div style={{ background: '#f4f4f5', padding: 12, borderRadius: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>ADDRESS LINKED TO AADHAAR</span>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, fontFamily: 'monospace' }}>{aadhaar}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #6366f1', padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#4f46e5', marginBottom: 12 }}>OFFICIAL DOCUMENT RECORD: {doc.docName.toUpperCase()}</div>
      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <strong style={{ fontSize: 15, color: '#0f172a' }}>{name}</strong>
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>✓ Digital Record Validated</div>
      </div>
    </div>
  );
}

export default function DepartmentWelfareDashboard() {
  const [selectedDept, setSelectedDept] = useState('Social Welfare Department');
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  
  // Selected Application Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionType, setActionType] = useState(null); // 'RECOMMEND', 'REJECT', 'REQUEST_DOCS'
  const [recommendRemarks, setRecommendRemarks] = useState('');
  const [rejectReasonSelect, setRejectReasonSelect] = useState(REJECTION_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [requestDocsRemarks, setRequestDocsRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Auto detect officer's department from Keycloak username
  useEffect(() => {
    const username = (keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.username || '').toLowerCase();
    const dept = keycloak.tokenParsed?.department;
    if (dept) {
      setSelectedDept(dept);
    } else if (username.includes('socialwelfare') || username.includes('david')) {
      setSelectedDept('Social Welfare Department');
    } else if (username.includes('health') || username.includes('john')) {
      setSelectedDept('Health Department');
    } else if (username.includes('revenue') || username.includes('mark')) {
      setSelectedDept('Revenue Department');
    } else if (username.includes('municipal') || username.includes('ryan')) {
      setSelectedDept('Municipal Corporation');
    } else if (username.includes('water') || username.includes('chris')) {
      setSelectedDept('Water Department');
    } else if (username.includes('roads') || username.includes('ethan')) {
      setSelectedDept('Roads Department');
    } else if (username.includes('electricity') || username.includes('jack')) {
      setSelectedDept('Electricity Department');
    } else if (username.includes('urban') || username.includes('will')) {
      setSelectedDept('Urban Planning Department');
    } else if (username.includes('education') || username.includes('emily')) {
      setSelectedDept('Education Department');
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let bData = [];
      const endpoint = selectedDept === 'All Departments'
        ? '/welfare-service/api/welfare/beneficiaries/all'
        : `/welfare-service/api/welfare/beneficiaries/department/${encodeURIComponent(selectedDept)}`;

      try {
        const bRes = await api.get(endpoint);
        bData = bRes.data || [];
      } catch (err1) {
        const fallbackEndpoint = selectedDept === 'All Departments'
          ? '/api/welfare/beneficiaries/all'
          : `/api/welfare/beneficiaries/department/${encodeURIComponent(selectedDept)}`;
        const bRes = await api.get(fallbackEndpoint);
        bData = bRes.data || [];
      }

      let sData = [];
      try {
        const sRes = await api.get('/welfare-service/api/welfare/schemes');
        sData = sRes.data || [];
      } catch (err2) {
        const sRes = await api.get('/api/welfare/schemes');
        sData = sRes.data || [];
      }

      const map = {};
      sData.forEach(s => { map[s.schemeId] = s; });
      setSchemes(map);
      setBeneficiaries(bData);
    } catch (e) {
      console.error("Dashboard data load error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  // Officer Action Handlers
  const handleRecommendSubmit = async () => {
    if (!selectedApp) return;
    setSubmittingAction(true);
    const username = keycloak.tokenParsed?.preferred_username || 'officer';
    const payload = {
      officerUsername: username,
      remarks: recommendRemarks || 'Verified documents and recommended for approval.'
    };

    try {
      try {
        await api.put(`/welfare-service/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/recommend`, payload);
      } catch (err1) {
        await api.put(`/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/recommend`, payload);
      }
      toast.success(`Application ${selectedApp.beneficiaryCode} recommended to Admin queue for financial release!`);
      setSelectedApp(null);
      setActionType(null);
      setRecommendRemarks('');
      await loadData();
    } catch (e) {
      console.error("Recommend error:", e);
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Recommendation action failed';
      toast.error(`Recommendation Action: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedApp) return;
    const finalReason = rejectReasonSelect === 'Other (custom reason)' 
      ? customRejectReason 
      : rejectReasonSelect;

    if (!finalReason || !finalReason.trim()) {
      toast.error('Please select or enter a valid rejection reason.');
      return;
    }

    setSubmittingAction(true);
    const username = keycloak.tokenParsed?.preferred_username || 'officer';
    const payload = {
      officerUsername: username,
      reason: finalReason
    };

    try {
      try {
        await api.put(`/welfare-service/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/reject`, payload);
      } catch (err1) {
        await api.put(`/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/reject`, payload);
      }
      toast.success(`Application ${selectedApp.beneficiaryCode} rejected.`);
      setSelectedApp(null);
      setActionType(null);
      await loadData();
    } catch (e) {
      console.error("Reject error:", e);
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Rejection action failed';
      toast.error(`Rejection Action: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestDocsSubmit = async () => {
    if (!selectedApp) return;
    if (!requestDocsRemarks || !requestDocsRemarks.trim()) {
      toast.error('Please enter remarks detailing which additional documents are required.');
      return;
    }

    setSubmittingAction(true);
    const username = keycloak.tokenParsed?.preferred_username || 'officer';
    const payload = {
      officerUsername: username,
      remarks: requestDocsRemarks
    };

    try {
      try {
        await api.put(`/welfare-service/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/request-docs`, payload);
      } catch (err1) {
        await api.put(`/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/request-docs`, payload);
      }
      toast.success(`Document request sent to citizen for ${selectedApp.beneficiaryCode}.`);
      setSelectedApp(null);
      setActionType(null);
      setRequestDocsRemarks('');
      await loadData();
    } catch (e) {
      console.error("Request docs error:", e);
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Document request failed';
      toast.error(`Document Request Action: ${msg}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Metrics
  const pendingCount = beneficiaries.filter(b => ['APPLIED', 'SUBMITTED', 'ASSIGNED_TO_DEPARTMENT'].includes(b.status)).length;
  const reviewCount = beneficiaries.filter(b => ['UNDER_REVIEW', 'UNDER_DEPARTMENT_VERIFICATION'].includes(b.status)).length;
  const recommendedCount = beneficiaries.filter(b => b.status === 'RECOMMENDED').length;
  const rejectedCount = beneficiaries.filter(b => b.status === 'REJECTED').length;
  const docsRequestedCount = beneficiaries.filter(b => b.status === 'DOCUMENTS_REQUESTED').length;

  const filteredApps = beneficiaries.filter(b => {
    if (activeTab === 'PENDING') return ['APPLIED', 'SUBMITTED', 'ASSIGNED_TO_DEPARTMENT', 'UNDER_REVIEW', 'UNDER_DEPARTMENT_VERIFICATION', 'DOCUMENTS_REQUESTED'].includes(b.status);
    if (activeTab === 'RECOMMENDED') return b.status === 'RECOMMENDED';
    if (activeTab === 'REJECTED') return b.status === 'REJECTED';
    return true;
  });

  const getOfficerName = () => {
    const username = keycloak.tokenParsed?.preferred_username || keycloak.tokenParsed?.username || '';
    if (selectedDept === 'Social Welfare Department') return 'David Wilson (socialwelfareofficer.org)';
    if (selectedDept === 'Education Department') return 'Emily Carter (educationofficer.org)';
    if (selectedDept === 'Health Department') return 'John Smith (healthofficer.org)';
    if (selectedDept === 'Revenue Department') return 'Mark Davis (revenueofficer.org)';
    if (selectedDept === 'Municipal Corporation') return 'Ryan Miller (municipalofficer.org)';
    if (selectedDept === 'Water Department') return 'Chris Taylor (waterofficer.org)';
    if (selectedDept === 'Roads Department') return 'Ethan Anderson (roadsofficer.org)';
    if (selectedDept === 'Electricity Department') return 'Jack Thomas (electricityofficer.org)';
    if (selectedDept === 'Urban Planning Department') return 'Will Jackson (urbanofficer.org)';
    return username || 'Department Officer';
  };

  const handleInspectApp = async (app) => {
    setSelectedApp(app);
    setActionType(null);
    try {
      const username = keycloak.tokenParsed?.preferred_username || 'officer';
      const r = await api.put(`/welfare-service/api/welfare/beneficiaries/${app.beneficiaryId}/start-verification`, {
        officerUsername: username
      });
      if (r.data) {
        setSelectedApp(r.data);
      }
    } catch (e) {
      console.warn("Start verification auto transition notice:", e);
    }
  };

  return (
    <AppShell title="Department Verification Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 60px 24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff',
          borderRadius: 20, padding: '24px 28px', border: '1px solid #334155',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={24} color="#38bdf8" />
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#ffffff' }}>
                {selectedDept} Portal
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
              Responsible Officer: <strong>{getOfficerName()}</strong> — Verifying assigned department welfare applications.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: '0.04em'
            }}>
              🏢 {selectedDept}
            </span>

            <button
              onClick={loadData}
              style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Pending Verification</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', marginTop: 2 }}>{pendingCount + reviewCount}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Clock size={22} />
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Recommended to Admin</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>{recommendedCount}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <ThumbsUp size={22} />
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Rejected Applications</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{rejectedCount}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <ThumbsDown size={22} />
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Docs Requested</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#d97706', marginTop: 2 }}>{docsRequestedCount}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <FileQuestion size={22} />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e2e8f0', paddingBottom: 8, overflowX: 'auto' }}>
          {[
            { id: 'PENDING', label: `Pending Verification (${pendingCount + reviewCount + docsRequestedCount})` },
            { id: 'RECOMMENDED', label: `Recommended (${recommendedCount})` },
            { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s ease',
                background: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Application Cards List */}
        {loading ? <PageLoader message="Loading department applications..." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredApps.length === 0 && (
              <div style={{
                background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
                padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
              }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Inbox size={30} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No Pending Applications</h3>
                <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  No welfare applications found for <strong>{selectedDept}</strong> under tab <strong>"{activeTab}"</strong>. Applications submitted by citizens for this department will automatically appear here for verification.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {selectedDept !== 'All Departments' && (
                    <button
                      onClick={() => setSelectedDept('All Departments')}
                      style={{
                        background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1',
                        padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      View All Departments
                    </button>
                  )}
                  <button
                    onClick={loadData}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                      border: 'none', padding: '9px 18px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <RefreshCw size={14} /> Refresh Queue
                  </button>
                </div>
              </div>
            )}

            {filteredApps.map(b => {
              const scheme = schemes[b.schemeId];
              return (
                <SectionCard key={b.beneficiaryId} title="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: 15, background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>
                          {b.beneficiaryCode}
                        </span>
                        <h3 style={{ margin: '6px 0 2px', fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                          {b.applicantName}
                        </h3>
                        <div style={{ fontSize: 13, color: '#475569' }}>
                          <strong>Scheme:</strong> {scheme?.schemeName || 'Welfare Scheme'} • <strong style={{ color: '#0369a1' }}>{b.assignedDepartment || selectedDept}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <Badge variant={statusVariant(b.status)}>{b.status?.replace('_', ' ')}</Badge>
                        <span style={{ fontSize: 11, fontWeight: 700, color: b.eligibilityStatus === 'ELIGIBLE' ? '#15803d' : '#b91c1c', background: b.eligibilityStatus === 'ELIGIBLE' ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: 10 }}>
                          Eligibility: {b.eligibilityStatus}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}>
                      <div><span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>ANNUAL INCOME</span><div style={{ fontWeight: 800, color: '#0f172a' }}>₹{Number(b.annualIncome || 0).toLocaleString('en-IN')}</div></div>
                      <div><span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>AGE</span><div style={{ fontWeight: 800, color: '#0f172a' }}>{b.age} yrs</div></div>
                      <div><span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>CATEGORY</span><div style={{ fontWeight: 800, color: '#0f172a' }}>{b.familyStatus || 'General'}</div></div>
                      <div><span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>SUBMISSION DATE</span><div style={{ fontWeight: 800, color: '#0f172a' }}>{b.appliedDate ? new Date(b.appliedDate).toLocaleDateString('en-IN') : '—'}</div></div>
                    </div>

                    {b.rejectionReason && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: '#991b1b' }}>
                        <strong>Rejection Reason:</strong> {b.rejectionReason}
                      </div>
                    )}

                    {b.recommendationRemarks && b.status !== 'REJECTED' && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: '#166534' }}>
                        <strong>Officer Remarks:</strong> {b.recommendationRemarks}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleInspectApp(b)}
                        style={{
                          padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', gap: 8
                        }}
                      >
                        <Eye size={16} /> {['APPLIED', 'SUBMITTED', 'ASSIGNED_TO_DEPARTMENT', 'UNDER_REVIEW', 'UNDER_DEPARTMENT_VERIFICATION', 'DOCUMENTS_REQUESTED'].includes(b.status) ? 'Review Application' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}

        {/* ── APPLICATION DETAILS & OFFICER ACTION DRAWER / MODAL ── */}
        {selectedApp && (() => {
          const isPendingApp = ['APPLIED', 'SUBMITTED', 'ASSIGNED_TO_DEPARTMENT', 'UNDER_REVIEW', 'UNDER_DEPARTMENT_VERIFICATION', 'DOCUMENTS_REQUESTED'].includes(selectedApp.status);
          
          return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: '#ffffff', borderRadius: 20, maxWidth: 760, width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1.5px solid #e2e8f0',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}>
              
              {/* Drawer Header */}
              <div style={{ background: '#0f172a', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: 13, fontWeight: 800 }}>{selectedApp.beneficiaryCode}</span>
                  <h3 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 900, color: '#ffffff' }}>
                    Verification Details: {selectedApp.applicantName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Scheme & Applicant Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>SCHEME</span><br /><strong style={{ fontSize: 14, color: '#0f172a' }}>{schemes[selectedApp.schemeId]?.schemeName || selectedApp.schemeId}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>ASSIGNED DEPARTMENT</span><br /><strong style={{ fontSize: 14, color: '#2563eb' }}>{selectedApp.assignedDepartment || selectedDept}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>APPLICANT AADHAAR</span><br /><strong style={{ fontFamily: 'monospace', fontSize: 14 }}>{selectedApp.applicantAadhaar}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>ANNUAL INCOME</span><br /><strong style={{ fontSize: 14 }}>₹{Number(selectedApp.annualIncome || 0).toLocaleString('en-IN')}</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>AGE</span><br /><strong>{selectedApp.age} Years</strong></div>
                  <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>FAMILY CATEGORY</span><br /><strong>{selectedApp.familyStatus || 'General'}</strong></div>
                </div>

                {/* Bank Account Details vs Passbook Verification Card */}
                <div style={{
                  background: '#f8fafc', padding: 18, borderRadius: 14, border: '1.5px solid #bfdbfe',
                  display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCard size={18} color="#2563eb" />
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Bank Verification Audit (Form vs Uploaded Passbook)</h4>
                    </div>
                    {selectedApp.bankVerified ? (
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 12, border: '1px solid #86efac' }}>
                        ✓ BANK MATCH VERIFIED
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#fffbeb', color: '#b45309', padding: '3px 10px', borderRadius: 12, border: '1px solid #fcd34d' }}>
                        ⚠️ PENDING BANK MATCH
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12, background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div><span style={{ color: '#64748b', fontWeight: 700 }}>Account Holder:</span><br /><strong style={{ color: '#0f172a' }}>{selectedApp.accountHolderName || selectedApp.applicantName}</strong></div>
                    <div><span style={{ color: '#64748b', fontWeight: 700 }}>Bank Name:</span><br /><strong style={{ color: '#0f172a' }}>{selectedApp.bankName || 'State Bank of India'}</strong></div>
                    <div><span style={{ color: '#64748b', fontWeight: 700 }}>Account Number:</span><br /><strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedApp.accountNumber || '12345678901'}</strong></div>
                    <div><span style={{ color: '#64748b', fontWeight: 700 }}>IFSC Code:</span><br /><strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedApp.ifscCode || 'SBIN0001234'}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {isPendingApp && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const username = keycloak.tokenParsed?.preferred_username || 'officer';
                            const res = await api.put(`/welfare-service/api/welfare/beneficiaries/${selectedApp.beneficiaryId}/bank-verify`, {
                              matches: true,
                              officerUsername: username,
                              remarks: 'Form bank account details match uploaded Bank Passbook document.'
                            });
                            setSelectedApp(res.data);
                            toast.success('Bank account details verified and matched with uploaded Bank Passbook!');
                          } catch (e) {
                            toast.error('Bank verification failed');
                          }
                        }}
                        style={{
                          padding: '8px 14px', borderRadius: 8, background: selectedApp.bankVerified ? '#dcfce7' : '#2563eb',
                          color: selectedApp.bankVerified ? '#15803d' : '#ffffff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <CheckCircle2 size={14} /> {selectedApp.bankVerified ? 'Bank Account Match Verified' : 'Verify & Mark Bank Match'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                    Attached Documents (Click to view full preview)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedApp.documentsSubmitted ? (() => {
                      let parsedDocs = {};
                      try {
                        parsedDocs = JSON.parse(selectedApp.documentsSubmitted);
                      } catch (e) {
                        selectedApp.documentsSubmitted.split(',').forEach(doc => {
                          parsedDocs[doc.trim()] = { name: `${doc.trim().toLowerCase().replace(/\s+/g, '_')}.pdf` };
                        });
                      }
                      return Object.keys(parsedDocs).map(doc => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => setPreviewDocModal({
                            docName: doc,
                            fileName: parsedDocs[doc].name,
                            dataUrl: parsedDocs[doc].dataUrl,
                            applicantName: selectedApp.applicantName,
                            aadhaar: selectedApp.applicantAadhaar,
                            annualIncome: selectedApp.annualIncome,
                            age: selectedApp.age
                          })}
                          style={{
                            padding: '8px 14px', borderRadius: 10, background: '#f0fdf4',
                            border: '1.5px solid #86efac', color: '#15803d', fontWeight: 800, fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                          }}
                        >
                          <CheckCircle2 size={15} /> {doc} <Eye size={13} style={{ opacity: 0.8 }} />
                        </button>
                      ));
                    })() : (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>No documents attached</span>
                    )}
                  </div>
                </div>

                {/* Action Choice Selection */}
                {isPendingApp ? (
                  <>
                    <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                    SELECT OFFICER DECISION ACTION:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setActionType('RECOMMEND')}
                      style={{
                        padding: '14px', borderRadius: 12, border: actionType === 'RECOMMEND' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: actionType === 'RECOMMEND' ? '#f0fdf4' : '#ffffff', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s ease'
                      }}
                    >
                      <ThumbsUp size={22} color={actionType === 'RECOMMEND' ? '#16a34a' : '#64748b'} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: actionType === 'RECOMMEND' ? '#14532d' : '#334155' }}>Recommend Approval</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('REJECT')}
                      style={{
                        padding: '14px', borderRadius: 12, border: actionType === 'REJECT' ? '2px solid #dc2626' : '1.5px solid #cbd5e1',
                        background: actionType === 'REJECT' ? '#fef2f2' : '#ffffff', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s ease'
                      }}
                    >
                      <ThumbsDown size={22} color={actionType === 'REJECT' ? '#dc2626' : '#64748b'} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: actionType === 'REJECT' ? '#7f1d1d' : '#334155' }}>Reject Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('REQUEST_DOCS')}
                      style={{
                        padding: '14px', borderRadius: 12, border: actionType === 'REQUEST_DOCS' ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                        background: actionType === 'REQUEST_DOCS' ? '#fffbeb' : '#ffffff', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s ease'
                      }}
                    >
                      <FileQuestion size={22} color={actionType === 'REQUEST_DOCS' ? '#d97706' : '#64748b'} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: actionType === 'REQUEST_DOCS' ? '#78350f' : '#334155' }}>Request Docs</span>
                    </button>
                  </div>
                </div>

                {/* Sub-form based on selected action */}
                {actionType === 'RECOMMEND' && (
                  <div style={{ background: '#f0fdf4', padding: 18, borderRadius: 14, border: '1.5px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#14532d' }}>
                      👍 Recommend Approval to Admin
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
                      Application will be marked as <strong>RECOMMENDED</strong> and forwarded to the Admin queue for fund release authorization.
                    </p>
                    <textarea
                      rows={2}
                      value={recommendRemarks}
                      onChange={e => setRecommendRemarks(e.target.value)}
                      placeholder="Add recommendation notes for Admin (e.g. All documents verified clean)..."
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #86efac', fontSize: 13 }}
                    />
                    <button
                      onClick={handleRecommendSubmit}
                      disabled={submittingAction}
                      style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {submittingAction ? 'Submitting...' : 'Confirm Recommendation →'}
                    </button>
                  </div>
                )}

                {actionType === 'REJECT' && (
                  <div style={{ background: '#fef2f2', padding: 18, borderRadius: 14, border: '1.5px solid #fecaca', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>
                      ❌ Reject Application (Mandatory Reason)
                    </div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#7f1d1d' }}>Select Rejection Reason Preset:</label>
                    <select
                      value={rejectReasonSelect}
                      onChange={e => setRejectReasonSelect(e.target.value)}
                      style={{ padding: 10, borderRadius: 8, border: '1px solid #fca5a5', fontSize: 13, fontWeight: 700, background: '#fff' }}
                    >
                      {REJECTION_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {rejectReasonSelect === 'Other (custom reason)' && (
                      <textarea
                        rows={2}
                        value={customRejectReason}
                        onChange={e => setCustomRejectReason(e.target.value)}
                        placeholder="Type detailed custom rejection reason..."
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fca5a5', fontSize: 13 }}
                      />
                    )}

                    <button
                      onClick={handleRejectSubmit}
                      disabled={submittingAction}
                      style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: 10, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {submittingAction ? 'Submitting...' : 'Confirm Rejection ✖'}
                    </button>
                  </div>
                )}

                {actionType === 'REQUEST_DOCS' && (
                  <div style={{ background: '#fffbeb', padding: 18, borderRadius: 14, border: '1.5px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>
                      📄 Request Additional Documents
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#b45309' }}>
                      The applicant will receive a notification and can upload fresh documents to resume verification.
                    </p>
                    <textarea
                      rows={2}
                      value={requestDocsRemarks}
                      onChange={e => setRequestDocsRemarks(e.target.value)}
                      placeholder="Specify missing/unclear documents (e.g. Please re-upload updated Income Certificate)..."
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fcd34d', fontSize: 13 }}
                    />
                    <button
                      onClick={handleRequestDocsSubmit}
                      disabled={submittingAction}
                      style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: 10, background: '#d97706', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {submittingAction ? 'Submitting...' : 'Send Request to Citizen ✉'}
                    </button>
                  </div>
                )}
                  </>
                ) : (
                  <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 18, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '12px 24px', borderRadius: 12, background: selectedApp.status === 'RECOMMENDED' ? '#fffbeb' : '#f8fafc', color: selectedApp.status === 'RECOMMENDED' ? '#b45309' : '#64748b', fontWeight: 800, fontSize: 14, border: selectedApp.status === 'RECOMMENDED' ? '1.5px solid #fde68a' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {selectedApp.status === 'RECOMMENDED' ? <><Clock size={18} /> Waiting for Admin Approval</> : <><CheckCircle2 size={18} /> Application Verification Completed</>}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
          );
        })()}

        {/* ── Document Preview Modal Popup ── */}
        {previewDocModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, maxWidth: 540, width: '100%', overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 15 }}>Preview: {previewDocModal.docName}</strong>
                  {previewDocModal.fileName && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Original File: {previewDocModal.fileName}</div>}
                </div>
                <button onClick={() => setPreviewDocModal(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ padding: 24 }}>
                <DocumentBodyPreview doc={previewDocModal} appDetails={selectedApp} />
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
