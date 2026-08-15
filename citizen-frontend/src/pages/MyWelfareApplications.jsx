import { useEffect, useState } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { FeedbackCard } from '../components/StarRating.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { Link } from 'react-router-dom';
import { 
  FilePlus, CheckCircle2, Clock, 
  ShieldCheck, AlertCircle, ChevronDown, ChevronUp, FileText, Download, Upload, ThumbsUp, FileQuestion, RefreshCw, Printer, User, Building2, Edit3, Trash2, XCircle, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function getStageIndex(status) {
  if (status === 'DRAFT') return 0;
  if (status === 'SUBMITTED' || status === 'APPLIED') return 1;
  if (status === 'ASSIGNED_TO_DEPARTMENT' || status === 'UNDER_DEPARTMENT_VERIFICATION' || status === 'UNDER_REVIEW' || status === 'DOCUMENTS_REQUESTED') return 2;
  if (status === 'RECOMMENDED' || status === 'ADMIN_APPROVED' || status === 'APPROVED') return 3;
  if (status === 'FUNDS_DISBURSED') return 4;
  if (status === 'COMPLETED') return 5;
  if (status === 'REJECTED') return -1;
  return 1;
}

function statusVariant(s) {
  if (s === 'DRAFT') return 'neutral';
  if (s === 'SUBMITTED' || s === 'APPLIED') return 'info';
  if (s === 'ASSIGNED_TO_DEPARTMENT' || s === 'UNDER_DEPARTMENT_VERIFICATION' || s === 'UNDER_REVIEW') return 'warning';
  if (s === 'RECOMMENDED' || s === 'ADMIN_APPROVED' || s === 'APPROVED') return 'success';
  if (s === 'DOCUMENTS_REQUESTED') return 'warning';
  if (s === 'REJECTED') return 'danger';
  if (s === 'FUNDS_DISBURSED' || s === 'COMPLETED') return 'success';
  if (s === 'WITHDRAWN') return 'neutral';
  return 'neutral';
}

function eligibilityVariant(s) {
  if (s === 'ELIGIBLE') return 'success';
  if (s === 'NOT_ELIGIBLE') return 'danger';
  return 'warning';
}

export default function MyWelfareApplications() {
  const citizenId = keycloak.tokenParsed?.sub;
  const [applications, setApplications] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [histories, setHistories] = useState({});
  const [expandedApp, setExpandedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resubmit Docs State
  const [resubmittingFile, setResubmittingFile] = useState({});

  // Filtering, Sorting, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadData = () => {
    if (!citizenId) return;
    setLoading(true);
    Promise.all([
      api.get(`/welfare-service/api/welfare/beneficiaries/citizen/${citizenId}`).catch(() => api.get(`/api/welfare/beneficiaries/citizen/${citizenId}`)),
      api.get('/welfare-service/api/welfare/schemes').catch(() => api.get('/api/welfare/schemes')),
    ]).then(async ([bRes, sRes]) => {
      const schemeMap = {};
      (sRes?.data || []).forEach(s => { schemeMap[s.schemeId] = s; });
      setSchemes(schemeMap);
      const apps = bRes?.data || [];
      setApplications(apps);

      const histMap = {};
      await Promise.all(
        apps.map(async a => {
          try {
            const hRes = await api.get(`/welfare-service/api/welfare/beneficiaries/${a.beneficiaryId}/history`);
            histMap[a.beneficiaryId] = hRes.data || [];
          } catch { }
        })
      );
      setHistories(histMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [citizenId]);

  const handleWithdraw = async (bId) => {
    if (!window.confirm('Are you sure you want to withdraw this welfare application?')) return;
    try {
      await api.put(`/welfare-service/api/welfare/beneficiaries/${bId}/withdraw?citizenId=${encodeURIComponent(citizenId)}`);
      toast.success('Application withdrawn successfully');
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Withdrawal failed. Officer may have already started review.');
    }
  };

  const handleDeleteApp = async (bId, bCode) => {
    if (!window.confirm(`Are you sure you want to delete application ${bCode}? This will permanently remove it from the database.`)) return;
    try {
      await api.delete(`/welfare-service/api/welfare/beneficiaries/${bId}`);
      toast.success(`Application ${bCode} deleted from database!`);
      loadData();
    } catch (e) {
      toast.error('Failed to delete application.');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('Are you sure you want to DELETE ALL welfare applications from the database to start completely fresh?')) return;
    try {
      await api.delete('/welfare-service/api/welfare/beneficiaries/reset-all');
      toast.success('All welfare applications deleted from database! You can now start fresh.');
      loadData();
    } catch (e) {
      toast.error('Failed to reset applications.');
    }
  };

  const handleResubmitDocs = async (bId, existingDocs) => {
    const file = resubmittingFile[bId];
    if (!file) {
      toast.error('Please select a document file to upload');
      return;
    }
    const updatedDocsList = existingDocs ? `${existingDocs}, ${file.name}` : file.name;
    try {
      await api.post(`/welfare-service/api/welfare/beneficiaries/${bId}/resubmit-docs`, {
        documentsSubmitted: updatedDocsList,
        remarks: 'Citizen uploaded updated missing document'
      });
      toast.success('Revised documents submitted! Application returned to department officer for re-verification.');
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Resubmission failed');
    }
  };

  const handleDownloadReceipt = (app) => {
    const scheme = schemes[app.schemeId];
    
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Page Border
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1);
    doc.rect(5, 5, pageWidth - 10, doc.internal.pageSize.getHeight() - 10);
    
    // Header Banner Background (Green theme for successful disbursement)
    doc.setFillColor(22, 163, 74); // Green-600
    doc.rect(5, 5, pageWidth - 10, 40, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 22, { align: 'center', charSpace: 1.5 });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text("DIRECT BENEFIT TRANSFER (DBT) OFFICIAL RECEIPT", pageWidth / 2, 32, { align: 'center', charSpace: 0.5 });
    
    // Watermark
    doc.setTextColor(240, 253, 244); // Light green watermark
    doc.setFontSize(65);
    doc.text("SUCCESSFUL DBT", pageWidth / 2, 160, { align: 'center', angle: -45 });
    
    // Transaction Highlight Box
    doc.setDrawColor(22, 163, 74);
    doc.setFillColor(240, 253, 244);
    doc.setLineWidth(0.5);
    doc.rect(14, 55, pageWidth - 28, 28, 'FD');
    
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("DBT TRANSACTION ID:", 20, 65);
    
    doc.setFontSize(17);
    doc.setFont('courier', 'bold');
    doc.text(app.transactionId || 'DBT-2026-000001', 20, 75);
    
    // Fix Rupee Symbol by using INR to avoid charset issues in standard jsPDF fonts
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text("DISBURSED AMOUNT:", pageWidth - 20, 65, { align: 'right' });
    
    doc.setFontSize(17);
    doc.setTextColor(22, 163, 74);
    doc.text(`INR ${Number(app.disbursedAmount || 25000).toLocaleString('en-IN')}.00`, pageWidth - 20, 75, { align: 'right' });
    
    // Draw a fake barcode for premium feel
    doc.setFillColor(15, 23, 42);
    for(let i=0; i<30; i++) {
        const width = Math.random() > 0.5 ? 1 : 2.5;
        doc.rect(20 + (i*2.2), 90, width, 12, 'F');
    }
    doc.setFontSize(8);
    doc.setFont('courier', 'normal');
    doc.text(`*${app.beneficiaryCode}*`, 35, 106);
    
    // "CERTIFIED" Stamp
    doc.setDrawColor(22, 163, 74);
    doc.setTextColor(22, 163, 74);
    doc.setLineWidth(1);
    doc.circle(pageWidth - 35, 100, 12, 'S');
    doc.circle(pageWidth - 35, 100, 11, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("CERTIFIED", pageWidth - 35, 101, { align: 'center' });

    // AutoTable for Details
    autoTable(doc, {
      startY: 115,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 65, fillColor: [241, 245, 249], textColor: [15, 23, 42] },
          1: { textColor: [51, 65, 85] }
      },
      body: [
        ['Receipt Number', `REC-${app.beneficiaryCode}`],
        ['Payment Reference', app.paymentReference || 'REF-DBT-SUCCESS'],
        ['Beneficiary Name', app.applicantName],
        ['Aadhaar Number', app.applicantAadhaar],
        ['Scheme Name', scheme?.schemeName || 'Welfare Scheme'],
        ['Department', app.assignedDepartment || scheme?.department || 'Government Department'],
        ['Bank Name', app.bankName || 'State Bank of India'],
        ['Masked Account No.', `**** **** ${(app.accountNumber || '12345678901').slice(-4)}`],
        ['IFSC Code', app.ifscCode || 'SBIN0001234'],
        ['Date of Transfer', app.approvedDate ? new Date(app.approvedDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')],
        ['Transaction Status', 'SUCCESSFUL (CREDITED VIA DBT)'],
        ['Assigned Officer', app.assignedOfficer || 'Department Officer'],
        ['Approved By', 'System Administrator']
      ],
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 15, pageWidth - 14, finalY + 15);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("Verified & Certified by Smart Governance Platform.", pageWidth / 2, finalY + 25, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text("This is an electronically generated DBT payment receipt and does not require a physical signature.", pageWidth / 2, finalY + 31, { align: 'center' });
    
    doc.save(`DBT_Payment_Receipt_${app.beneficiaryCode}.pdf`);
    toast.success(`Downloaded Official Payment Receipt for ${app.beneficiaryCode}`);
  };

  const handlePrintReceipt = (app) => {
    handleDownloadReceipt(app);
  };

  const getOfficerInfo = (dept) => {
    if (dept === 'Education Department') return { name: 'Emily Carter', role: 'Senior Education Verification Officer', avatar: 'EC' };
    if (dept === 'Social Welfare Department') return { name: 'David Wilson', role: 'Social Welfare Verification Officer', avatar: 'DW' };
    if (dept === 'Health Department') return { name: 'John Smith', role: 'Health Assistance Officer', avatar: 'JS' };
    return { name: 'Department Officer', role: 'Welfare Verification Officer', avatar: 'DO' };
  };

  const filteredApps = applications.filter(app => {
    if (!searchQuery) return true;
    const s = schemes[app.schemeId];
    const name = s?.schemeName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedApps = filteredApps.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.appliedDate || 0) - new Date(b.appliedDate || 0);
    } else if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedApps.length / itemsPerPage);
  const paginatedApps = sortedApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  return (
    <AppShell title="My Welfare Applications">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 40px 24px', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: 20, padding: '28px 32px', color: '#fff',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(15,23,42,0.3)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block', marginBottom: 10
            }}>
              DIRECT BENEFIT TRANSFER (DBT) PORTAL
            </span>
            <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              My Welfare Scheme Applications
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: 620, fontSize: 14, lineHeight: 1.5 }}>
              Track real-time departmental verification, view assigned officer cards, inspect step-by-step audit logs, resubmit documents, and download DBT payment receipts.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={loadData}
              style={{
                background: '#334155', color: '#fff', border: 'none', padding: '12px 18px',
                borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            <Link to="/welfare/apply" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', padding: '12px 24px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
              }}>
                <FilePlus size={18} /> Apply for Welfare Scheme
              </button>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '16px 24px', borderRadius: 16, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by Scheme Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Filter size={18} color="#64748b" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {loading ? <PageLoader message="Loading your welfare applications and DBT tracking status..." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {applications.length === 0 && (
              <SectionCard title="">
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 800 }}>No Welfare Applications Found</h3>
                  <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: 14 }}>
                    You haven't submitted any welfare scheme applications yet (or none match your search).
                  </p>
                  <Link to="/welfare/apply" style={{
                    padding: '12px 24px', borderRadius: '10px', backgroundColor: '#2563eb',
                    color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block'
                  }}>Apply Now</Link>
                </div>
              </SectionCard>
            )}

            {paginatedApps.map(app => {
              const scheme = schemes[app.schemeId];
              const historyList = histories[app.beneficiaryId] || [];
              const stageIdx = getStageIndex(app.status);
              const isRejected = app.status === 'REJECTED';
              const isDocsRequested = app.status === 'DOCUMENTS_REQUESTED';
              const isCompleted = app.status === 'FUNDS_DISBURSED' || app.status === 'COMPLETED';
              const isUnderReview = app.status === 'UNDER_DEPARTMENT_VERIFICATION' || app.status === 'UNDER_REVIEW' || app.status === 'ASSIGNED_TO_DEPARTMENT';
              const isWithdrawable = app.status === 'SUBMITTED' || app.status === 'ASSIGNED_TO_DEPARTMENT' || app.status === 'DRAFT';
              const isExpanded = expandedApp === app.beneficiaryId;
              const deptName = app.assignedDepartment || scheme?.department || 'Department';
              const officerInfo = getOfficerInfo(deptName);

              const applicantName = app.applicantName || app.fullName || app.citizenName || keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || 'Applicant';

              const stages = [
                { id: 1, label: 'Application Submission', desc: 'Scheme selection, profile, bank details & 5 docs uploaded' },
                { id: 2, label: 'Department Verification', desc: `${deptName} Officer (${officerInfo.name}) verifies Aadhaar, Income & Bank Passbook` },
                { id: 3, label: 'Administrative Approval', desc: 'Officer recommendation, budget check & financial sanction' },
                { id: 4, label: 'Fund Disbursement', desc: 'Direct Benefit Transfer (DBT) credited to bank account' },
                { id: 5, label: 'Completed', desc: 'Welfare benefit transferred & receipt generated' },
              ];

              return (
                <div key={app.beneficiaryId} style={{
                  background: '#ffffff', borderRadius: 20, border: '1.5px solid #e2e8f0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden'
                }}>
                  {/* Application Top Bar */}
                  <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: 15, background: '#eff6ff', padding: '2px 10px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                          {app.beneficiaryCode}
                        </span>
                        <Badge variant={eligibilityVariant(app.eligibilityStatus)}>
                          Eligibility: {app.eligibilityStatus?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h3 style={{ margin: '8px 0 2px', fontSize: 19, fontWeight: 900, color: '#0f172a' }}>
                        {scheme?.schemeName || 'Government Welfare Scheme'}
                      </h3>
                      <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span><strong>Applicant:</strong> <span style={{ color: '#0f172a', fontWeight: 800 }}>{applicantName}</span></span>
                        <span>•</span>
                        <span><strong>Department:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{deptName}</span></span>
                        <span>•</span>
                        <span><strong>Applied Date:</strong> {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-IN') : 'Recently'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Badge variant={statusVariant(app.status)}>
                        {app.status?.replace('_', ' ')}
                      </Badge>

                      {/* Action Buttons for Citizen */}
                      {isWithdrawable && (
                        <button
                          onClick={() => handleWithdraw(app.beneficiaryId)}
                          style={{
                            background: '#fff5f5', border: '1px solid #fca5a5', color: '#b91c1c',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}
                          title="Withdraw application before officer review starts"
                        >
                          <XCircle size={14} /> Withdraw
                        </button>
                      )}

                      {isRejected && (
                        <Link to="/welfare/apply" style={{ textDecoration: 'none' }}>
                          <button style={{
                            background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8',
                            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}>
                            <Edit3 size={14} /> Edit & Resubmit
                          </button>
                        </Link>
                      )}

                      <button
                        onClick={() => handleDeleteApp(app.beneficiaryId, app.beneficiaryCode)}
                        style={{
                          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                          borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                        title="Delete application from database to start fresh"
                      >
                        <Trash2 size={14} /> Delete
                      </button>

                      <button
                        onClick={() => setExpandedApp(isExpanded ? null : app.beneficiaryId)}
                        style={{
                          background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8,
                          padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#334155',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        {isExpanded ? <>Hide Audit <ChevronUp size={16} /></> : <>Audit Log <ChevronDown size={16} /></>}
                      </button>
                    </div>
                  </div>

                  {/* 5-Step Government Welfare Lifecycle Stepper */}
                  <div style={{ padding: '24px 28px', background: '#ffffff' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                      Government Welfare Application Lifecycle (5-Stage DBT Stepper)
                    </div>

                    {isRejected ? (
                      <div style={{
                        padding: '18px 22px', borderRadius: 14, background: '#fef2f2', border: '1.5px solid #fecaca',
                        display: 'flex', alignItems: 'flex-start', gap: 14
                      }}>
                        <AlertCircle size={26} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 16 }}>Application Rejected by Department Officer</div>
                          <div style={{ fontSize: 14, color: '#b91c1c', marginTop: 4, lineHeight: 1.5 }}>
                            <strong>Official Rejection Reason:</strong> {app.rejectionReason || 'Application criteria could not be verified.'}
                          </div>
                        </div>
                      </div>
                    ) : isDocsRequested ? (
                      <div style={{
                        padding: '18px 22px', borderRadius: 14, background: '#fffbeb', border: '1.5px solid #fde68a',
                        display: 'flex', flexDirection: 'column', gap: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileQuestion size={24} color="#d97706" />
                          <div>
                            <div style={{ fontWeight: 800, color: '#92400e', fontSize: 16 }}>Additional Documents Requested by Department Officer</div>
                            <div style={{ fontSize: 13, color: '#b45309', marginTop: 2 }}>
                              <strong>Officer Remarks:</strong> {app.recommendationRemarks || 'Please upload revised documents for verification.'}
                            </div>
                          </div>
                        </div>

                        {/* Resubmit Box */}
                        <div style={{ background: '#ffffff', padding: 14, borderRadius: 10, border: '1 dashed #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                            <Upload size={16} /> Select Revised Document (PDF/JPG)
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setResubmittingFile(prev => ({ ...prev, [app.beneficiaryId]: e.target.files[0] }));
                                }
                              }}
                            />
                          </label>

                          {resubmittingFile[app.beneficiaryId] && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                              📄 {resubmittingFile[app.beneficiaryId].name}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleResubmitDocs(app.beneficiaryId, app.documentsSubmitted)}
                            style={{ padding: '8px 16px', borderRadius: 8, background: '#d97706', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                          >
                            Resubmit Documents →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                        {stages.map((stage) => {
                          const isDone = stageIdx > stage.id || (stageIdx === 5 && stage.id === 5);
                          const isCurrent = stageIdx === stage.id && !isCompleted;

                          return (
                            <div key={stage.id} style={{
                              background: isCurrent ? '#eff6ff' : isDone ? '#f0fdf4' : '#f8fafc',
                              border: isCurrent ? '1.5px solid #3b82f6' : isDone ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                              borderRadius: 14, padding: '14px 16px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 900,
                                  color: isCurrent ? '#2563eb' : isDone ? '#166534' : '#94a3b8'
                                }}>
                                  STEP {stage.id}
                                </span>
                                {isDone ? (
                                  <CheckCircle2 size={18} color="#16a34a" />
                                ) : isCurrent ? (
                                  <Clock size={18} color="#2563eb" className="animate-spin" />
                                ) : (
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1' }} />
                                )}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: isCurrent ? '#1e40af' : isDone ? '#14532d' : '#475569' }}>
                                {stage.label}
                              </div>
                              <div style={{ fontSize: 11, color: isCurrent ? '#3b82f6' : isDone ? '#15803d' : '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>
                                {stage.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Current Processing Officer Card */}
                  {isUnderReview && (
                    <div style={{ margin: '0 28px 20px', padding: '16px 20px', borderRadius: 14, background: '#f8fafc', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15 }}>
                          {officerInfo.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CURRENT PROCESSING OFFICER</div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{officerInfo.name}</div>
                          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{deptName}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 20, fontSize: 12, borderLeft: '1px solid #cbd5e1', paddingLeft: 20 }}>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: 700 }}>CURRENT STATUS</span><br />
                          <strong style={{ color: '#0369a1' }}>Reviewing Documents & Bank Details</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: 700 }}>EXPECTED COMPLETION</span><br />
                          <strong style={{ color: '#16a34a' }}>Within 2 Working Days</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disbursement Confirmation & Receipt Download Bar */}
                  {isCompleted && (
                    <div style={{ margin: '0 28px 24px', padding: '18px 22px', borderRadius: 14, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1.5px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <ShieldCheck size={22} color="#16a34a" />
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#14532d' }}>Direct Benefit Transfer (DBT) Credited</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#166534' }}>
                          Funds disbursed successfully to applicant <strong style={{ color: '#14532d', fontSize: 14 }}>{applicantName}</strong> at <strong>{app.bankName || 'State Bank of India'}</strong> (Account: **** {(app.accountNumber || '1234').slice(-4)}). Transaction ID: <strong style={{ fontFamily: 'monospace' }}>{app.transactionId || 'DBT-2026-000001'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => handleDownloadReceipt(app)}
                          style={{
                            padding: '10px 18px', borderRadius: 10, background: '#16a34a', color: '#ffffff',
                            border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                          }}
                        >
                          <Download size={16} /> Download Receipt
                        </button>

                        <button
                          onClick={() => handlePrintReceipt(app)}
                          style={{
                            padding: '10px 16px', borderRadius: 10, background: '#ffffff', color: '#15803d',
                            border: '1px solid #86efac', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <Printer size={16} /> Print Receipt
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Audit Log History Panel */}
                  {isExpanded && (
                    <div style={{ padding: '20px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} color="#2563eb" /> Government Audit Log History
                      </h4>

                      {historyList.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                          Application registered in e-Governance Portal. Waiting for initial officer verification audit.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {historyList.map((hist, idx) => (
                            <div key={hist.historyId || idx} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 14, background: '#ffffff',
                              padding: '12px 16px', borderRadius: 12, border: '1px solid #cbd5e1'
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: '#eff6ff',
                                color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 12, flexShrink: 0
                              }}>
                                #{idx + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
                                    {hist.actionTitle || `Status Transition: ${hist.newStatus}`}
                                  </span>
                                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                    {hist.timestamp ? new Date(hist.timestamp).toLocaleString('en-IN') : 'Recent'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginTop: 2 }}>
                                  Actor: {hist.actorName || 'System'}
                                </div>
                                {hist.remarks && (
                                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4, background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>
                                    {hist.remarks}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Citizen 5-Star Feedback Widget for Approved / Disbursed Applications */}
                      {(['APPROVED', 'FUNDS_DISBURSED', 'COMPLETED', 'ADMIN_APPROVED'].includes(app.status)) && (
                        <div style={{ marginTop: 16 }}>
                          <FeedbackCard
                            referenceType="WELFARE_APPLICATION"
                            referenceId={app.beneficiaryId || app.id}
                            title="Rate your welfare scheme application experience"
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>

              );
            })}

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10 }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: 700 }}
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#475569' }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontWeight: 700 }}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
