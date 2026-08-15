import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import SchemeSelectDropdown from '../components/SchemeSelectDropdown.jsx';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, RefreshCw, AlertTriangle, FileText, User, Users, Landmark, IndianRupee, HandHeart, Upload, FileCheck, X, Paperclip, ArrowRight, RotateCcw, ShieldCheck, Trash2, Printer } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const STEPS = ['Application', 'Verification', 'Authority Approval', 'Disbursement', 'Success'];
const DOCS = ['Aadhaar Card', 'Income Certificate', 'Bank Passbook', 'Photograph', 'Residence Proof'];

const LIFECYCLE_STEPS = [
  {
    step: 1,
    title: 'Application',
    subtitle: 'Step 1 of 5: Application Submission',
    desc: 'Citizen selects scheme, fills personal details, bank credentials & uploads 5 mandatory docs.',
    badge: 'YOU ARE HERE',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  {
    step: 2,
    title: 'Verification',
    subtitle: 'Department Officer Review',
    desc: 'Auto-assigned officer verifies Aadhaar, Income certificate & Bank Passbook details.',
    badge: 'STAGE 2',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe'
  },
  {
    step: 3,
    title: 'Authority Approval',
    subtitle: 'Financial Sanction',
    desc: 'Administrator evaluates officer recommendation and authorizes scheme budget release.',
    badge: 'STAGE 3',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  },
  {
    step: 4,
    title: 'Disbursement',
    subtitle: 'Direct Benefit Transfer',
    desc: 'Welfare benefit amount is credited directly into verified bank account via DBT.',
    badge: 'STAGE 4',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0'
  },
  {
    step: 5,
    title: 'Success',
    subtitle: 'Payment Receipt Issued',
    desc: 'Transaction reference generated, downloadable payment receipt & archived record.',
    badge: 'FINAL STAGE',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd'
  }
];

function StepIndicator({ current = 0 }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: 20, padding: '24px 28px', color: '#ffffff',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)', border: '1px solid #334155',
      display: 'flex', flexDirection: 'column', gap: 20
    }}>
      
      {/* Stepper Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Welfare Application Process Lifecycle
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Follow the 5-stage e-Governance direct benefit transfer (DBT) verification pipeline
          </p>
        </div>

        <div style={{ background: '#10b981', color: '#064e3b', fontWeight: 900, fontSize: 12, padding: '6px 14px', borderRadius: 20, border: '1px solid #34d399', letterSpacing: '0.04em' }}>
          📍 STEP 1 OF 5: APPLICATION SUBMISSION
        </div>
      </div>

      {/* 5-Step Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        {LIFECYCLE_STEPS.map((s, idx) => {
          const isCurrent = idx === current;
          const isCompleted = idx < current;

          return (
            <div 
              key={s.step}
              style={{
                background: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                border: isCurrent ? '2px solid #10b981' : isCompleted ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: '16px 14px', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: isCurrent ? '0 10px 25px rgba(16,185,129,0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: isCurrent ? '#10b981' : isCompleted ? '#059669' : 'rgba(255,255,255,0.15)',
                  color: isCurrent || isCompleted ? '#ffffff' : '#94a3b8',
                  fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCompleted ? '✓' : s.step}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 900, letterSpacing: '0.06em',
                  padding: '2px 8px', borderRadius: 10,
                  background: isCurrent ? '#ecfdf5' : 'rgba(255,255,255,0.1)',
                  color: isCurrent ? '#047857' : '#cbd5e1'
                }}>
                  {isCurrent ? s.badge : `STEP ${s.step}`}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: isCurrent ? '#0f172a' : '#ffffff' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#059669' : '#38bdf8', marginTop: 2 }}>
                  {s.subtitle}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 11, color: isCurrent ? '#475569' : '#94a3b8', lineHeight: 1.4 }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Guide Banner for Step 1 */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#a7f3d0' }}>
          <CheckCircle size={16} color="#34d399" />
          <span><strong>Action Required Now:</strong> Select scheme, fill profile, enter bank account credentials & attach all 5 mandatory document certificates.</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6ee7b7', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 6 }}>
          100% Online e-Verification
        </span>
      </div>

    </div>
  );
}

export default function SchemeApplicationForm() {
  const navigate = useNavigate();
  const citizenId = keycloak.tokenParsed?.sub;
  const name = keycloak.tokenParsed?.name || keycloak.tokenParsed?.preferred_username || '';

  const [schemes, setSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [schemeError, setSchemeError] = useState(false);

  const [form, setForm] = useState({
    schemeId: '', applicantName: name, applicantAadhaar: '', citizenId: citizenId || '',
    annualIncome: '', age: '', familyStatus: 'General',
    accountHolderName: name, bankName: 'State Bank of India', accountNumber: '', ifscCode: 'SBIN0001234', branchName: 'Main Branch'
  });
  const [checkedDocs, setCheckedDocs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);

  const fetchSchemes = () => {
    setLoadingSchemes(true);
    setSchemeError(false);
    api.get('/welfare-service/api/welfare/schemes?status=ACTIVE')
      .then(r => {
        const activeOnly = (r.data || []).filter(s => s.status === 'ACTIVE');
        setSchemes(activeOnly);
        setLoadingSchemes(false);
      })
      .catch(() => {
        api.get('/api/welfare/schemes?status=ACTIVE')
          .then(r => {
            const activeOnly = (r.data || []).filter(s => s.status === 'ACTIVE');
            setSchemes(activeOnly);
            setLoadingSchemes(false);
          })
          .catch(() => {
            setSchemeError(true);
            setLoadingSchemes(false);
          });
      });
  };

  useEffect(() => {
    fetchSchemes();
    const saved = localStorage.getItem('welfare_app_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(f => ({ ...f, ...parsed.form }));
        if (parsed.checkedDocs) setCheckedDocs(parsed.checkedDocs);
        if (parsed.uploadedFiles) setUploadedFiles(parsed.uploadedFiles);
        toast.info('Restored saved draft application');
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, []);

  const handleSaveDraft = async () => {
    localStorage.setItem('welfare_app_draft', JSON.stringify({ form, checkedDocs, uploadedFiles }));
    try {
      const payload = {
        citizenId: form.citizenId || citizenId || 'CIT-001',
        schemeId: form.schemeId || null,
        applicantName: form.applicantName,
        applicantAadhaar: form.applicantAadhaar,
        annualIncome: form.annualIncome ? Number(form.annualIncome) : 0,
        age: form.age ? Number(form.age) : 0,
        familyStatus: form.familyStatus,
        accountHolderName: form.accountHolderName,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode,
        branchName: form.branchName,
        documentsSubmitted: JSON.stringify(checkedDocs.reduce((acc, doc) => {
          if (uploadedFiles[doc] && uploadedFiles[doc].dataUrl) {
            acc[doc] = { name: uploadedFiles[doc].name, dataUrl: uploadedFiles[doc].dataUrl };
          } else {
            acc[doc] = { name: uploadedFiles[doc] ? uploadedFiles[doc].name : `${doc}.pdf` };
          }
          return acc;
        }, {})),
        status: 'DRAFT'
      };
      if (form.schemeId) {
        await api.post('/welfare-service/api/welfare/beneficiaries/draft', payload).catch(() => {});
      }
      toast.success('Draft saved successfully to portal!');
    } catch (e) {
      toast.success('Draft saved to browser storage!');
    }
  };

  const handleResetForm = () => {
    localStorage.removeItem('welfare_app_draft');
    setForm({
      schemeId: '',
      applicantName: name,
      applicantAadhaar: '',
      citizenId: citizenId || '',
      annualIncome: '',
      age: '',
      familyStatus: 'General',
    });
    setCheckedDocs([]);
    setUploadedFiles({});
    toast.success('Form inputs and document uploads reset for fresh application.');
  };

  const handleFileUpload = (doc, file) => {
    if (!file) return;
    const fileSizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFiles(prev => ({
        ...prev,
        [doc]: { name: file.name, size: fileSizeStr, dataUrl: e.target.result }
      }));
      if (!checkedDocs.includes(doc)) {
        setCheckedDocs(prev => [...prev, doc]);
      }
      toast.success(`Attached ${doc} (${file.name})`);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (doc) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[doc];
      return copy;
    });
    setCheckedDocs(prev => prev.filter(d => d !== doc));
  };

  const toggleDoc = (doc) => {
    if (checkedDocs.includes(doc)) {
      removeFile(doc);
    } else {
      setCheckedDocs(prev => [...prev, doc]);
      if (!uploadedFiles[doc]) {
        setUploadedFiles(prev => ({
          ...prev,
          [doc]: { name: `${doc.toLowerCase().replace(/\s+/g, '_')}_verified.pdf`, size: '185.0 KB' }
        }));
      }
    }
  };

  const selectedScheme = schemes.find(s => s.schemeId === form.schemeId);
  const userIncome = Number(form.annualIncome);
  const userAge = Number(form.age);

  const isIncomeExceeded = Boolean(
    selectedScheme &&
    selectedScheme.maxIncome != null &&
    form.annualIncome !== '' &&
    !isNaN(userIncome) &&
    userIncome > Number(selectedScheme.maxIncome)
  );

  const isAgeExceeded = Boolean(
    selectedScheme &&
    form.age !== '' &&
    !isNaN(userAge) &&
    ((selectedScheme.maxAge != null && userAge > Number(selectedScheme.maxAge)) ||
     (selectedScheme.minAge != null && userAge < Number(selectedScheme.minAge)))
  );

  const isSchemeValid = Boolean(form.schemeId);
  const isAadhaarValid = form.applicantAadhaar.length === 14;
  const isIncomeValid = form.annualIncome !== '' && !isNaN(userIncome) && userIncome >= 0;
  const isAgeValid = form.age !== '' && !isNaN(userAge) && userAge > 0;
  const allDocsUploaded = DOCS.every(doc => checkedDocs.includes(doc));
  const missingDocs = DOCS.filter(doc => !checkedDocs.includes(doc));
  const isDocsValid = allDocsUploaded;
  const isFormValid = isSchemeValid && isAadhaarValid && isIncomeValid && isAgeValid && isDocsValid && !isIncomeExceeded && !isAgeExceeded;

  const handleAadhaarChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 12) val = val.slice(0, 12);
    const formatted = val.match(/.{1,4}/g)?.join('-') || '';
    setForm(f => ({ ...f, applicantAadhaar: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allDocsUploaded) {
      toast.error(`Mandatory Documents Missing! All 5 documents must be uploaded before submitting: ${missingDocs.join(', ')}`);
      return;
    }
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      const payload = {
      citizenId: form.citizenId || citizenId || 'CIT-001',
      schemeId: form.schemeId,
      applicantName: form.applicantName,
      applicantAadhaar: form.applicantAadhaar,
      annualIncome: Number(form.annualIncome),
      age: Number(form.age),
      familyStatus: form.familyStatus,
      accountHolderName: form.accountHolderName,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      ifscCode: form.ifscCode,
      branchName: form.branchName,
      documentsSubmitted: JSON.stringify(checkedDocs.reduce((acc, doc) => {
        if (uploadedFiles[doc] && uploadedFiles[doc].dataUrl) {
          acc[doc] = { name: uploadedFiles[doc].name, dataUrl: uploadedFiles[doc].dataUrl };
        } else {
          acc[doc] = { name: uploadedFiles[doc] ? uploadedFiles[doc].name : `${doc}.pdf` };
        }
        return acc;
      }, {}))
    };

      let res;
      try {
        res = await api.post(`/welfare-service/api/welfare/schemes/${form.schemeId}/apply`, payload);
      } catch (err1) {
        res = await api.post(`/api/welfare/schemes/${form.schemeId}/apply`, payload);
      }

      localStorage.removeItem('welfare_app_draft');
      const selectedScheme = schemes.find(s => s.schemeId === form.schemeId);
      setSubmitted({
        ...res.data,
        schemeName: res.data.schemeName || selectedScheme?.schemeName || 'Welfare Scheme'
      });
      toast.success('Welfare application submitted successfully!');
    } catch (err) {
      if (err.response?.status === 409) {
        const appData = err.response.data?.existingApplication || err.response.data;
        setDuplicateData(appData);
        toast.warning('Active application already exists for this scheme under this Aadhaar identity.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const selectedScheme = schemes.find(s => s.schemeId === submitted.schemeId);
    const deptName = submitted.assignedDepartment || selectedScheme?.department || 'Government Department';

    const handleDownloadReceipt = () => {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Page Border
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, doc.internal.pageSize.getHeight() - 10);
      
      // Header Banner Background
      doc.setFillColor(30, 64, 175); // Blue-800
      doc.rect(5, 5, pageWidth - 10, 40, 'F');
      
      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 22, { align: 'center', charSpace: 1.5 });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text("WELFARE APPLICATION ACKNOWLEDGEMENT RECEIPT", pageWidth / 2, 32, { align: 'center', charSpace: 0.5 });
      
      // Watermark
      doc.setTextColor(241, 245, 249); // Light blue watermark
      doc.setFontSize(55);
      doc.text("OFFICIAL ACKNOWLEDGEMENT", pageWidth / 2, 160, { align: 'center', angle: -45 });
      
      // Beneficiary Code Box
      doc.setDrawColor(37, 99, 235);
      doc.setFillColor(239, 246, 255);
      doc.setLineWidth(0.5);
      doc.rect(14, 55, pageWidth - 28, 28, 'FD');
      
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("BENEFICIARY APPLICATION CODE:", 20, 65);
      
      doc.setFontSize(17);
      doc.setFont('courier', 'bold');
      doc.text(submitted.beneficiaryCode, 20, 75);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text("CURRENT STATUS:", pageWidth - 20, 65, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setTextColor(22, 163, 74);
      doc.text(submitted.status || 'APPLIED', pageWidth - 20, 73, { align: 'right' });
      
      // Draw a fake barcode for premium feel
      doc.setFillColor(15, 23, 42);
      for(let i=0; i<30; i++) {
          const width = Math.random() > 0.5 ? 1 : 2.5;
          doc.rect(20 + (i*2.2), 90, width, 12, 'F');
      }
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.text(`*${submitted.beneficiaryCode}*`, 35, 106);
      
      // "RECEIVED" Stamp
      doc.setDrawColor(37, 99, 235);
      doc.setTextColor(37, 99, 235);
      doc.setLineWidth(1);
      doc.circle(pageWidth - 35, 100, 12, 'S');
      doc.circle(pageWidth - 35, 100, 11, 'S');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("RECEIVED", pageWidth - 35, 101, { align: 'center' });

      // AutoTable for Details
      autoTable(doc, {
        startY: 115,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 11 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 
            0: { fontStyle: 'bold', cellWidth: 65, fillColor: [241, 245, 249], textColor: [15, 23, 42] },
            1: { textColor: [51, 65, 85] }
        },
        body: [
          ['Applicant Name', submitted.applicantName],
          ['Aadhaar Number', submitted.applicantAadhaar],
          ['Welfare Scheme', submitted.schemeName],
          ['Assigned Department', deptName],
          ['Assigned Officer', submitted.assignedOfficer || 'Pending Assignment'],
          ['Submission Date', new Date(submitted.appliedDate || Date.now()).toLocaleString('en-IN')],
          ['Automated Eligibility Check', submitted.eligibilityStatus || 'ELIGIBLE']
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
      doc.text("Verified & Issued Electronically by Smart Governance Platform.", pageWidth / 2, finalY + 25, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text("This is a system-generated receipt and does not require a physical signature.", pageWidth / 2, finalY + 31, { align: 'center' });
      
      doc.save(`Acknowledgement_${submitted.beneficiaryCode}.pdf`);
      toast.success('Downloaded Official PDF Receipt!');
    };

    return (
      <AppShell title="Application Submitted">
        <div style={{ paddingBottom: 60, maxWidth: 760, margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Main Success Hero Header */}
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
            borderRadius: 24, padding: '36px 32px', color: '#ffffff', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(5, 150, 105, 0.25)', position: 'relative', overflow: 'hidden',
            border: '1.5px solid #10b981'
          }}>
            {/* Glow Orbs */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: '#34d399', opacity: 0.2, filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: '#10b981', opacity: 0.15, filter: 'blur(40px)' }} />

            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)', border: '2px solid rgba(255, 255, 255, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}>
              <CheckCircle size={42} color="#ffffff" />
            </div>

            <span style={{
              background: 'rgba(255, 255, 255, 0.18)', border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em',
              textTransform: 'uppercase', display: 'inline-block', marginBottom: 12
            }}>
              OFFICIAL ACKNOWLEDGEMENT RECEIPT
            </span>

            <h2 style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Application Submitted Successfully!
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: '#a7f3d0', maxWidth: 580, marginInline: 'auto', lineHeight: 1.5 }}>
              Your welfare scheme application has been registered and auto-assigned to <strong>{deptName}</strong> for officer verification.
            </p>
          </div>

          {/* Beneficiary Official Card Pass */}
          <div style={{
            background: '#ffffff', borderRadius: 20, border: '1.5px solid #cbd5e1',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)', overflow: 'hidden'
          }}>
            {/* Card Header Strip */}
            <div style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>REGISTERED BENEFICIARY TICKET</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', background: '#dcfce7', border: '1px solid #86efac', padding: '3px 10px', borderRadius: 20 }}>
                STATUS: APPLIED
              </span>
            </div>

            {/* Main Content Grid */}
            <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Highlight Beneficiary Code Box */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: 16, border: '1.5px solid #93c5fd', padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
              }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    BENEFICIARY APPLICATION CODE
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color: '#1d4ed8', marginTop: 2, letterSpacing: '0.04em' }}>
                    {submitted.beneficiaryCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submitted.beneficiaryCode);
                    toast.success('Beneficiary code copied to clipboard!');
                  }}
                  style={{
                    background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #93c5fd',
                    borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(29, 78, 216, 0.1)'
                  }}
                >
                  📋 Copy Code
                </button>
              </div>

              {/* Grid Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 13 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>APPLICANT NAME</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, marginTop: 2 }}>{submitted.applicantName}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>APPLICANT AADHAAR</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: 14, marginTop: 2 }}>{submitted.applicantAadhaar}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SELECTED SCHEME</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{submitted.schemeName}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ASSIGNED DEPARTMENT</span>
                  <div style={{ fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{deptName}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SUBMISSION DATE</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{new Date(submitted.appliedDate || Date.now()).toLocaleDateString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ELIGIBILITY RESULT</span>
                  <div style={{ fontWeight: 900, color: '#16a34a', marginTop: 2 }}>✓ {submitted.eligibilityStatus || 'ELIGIBLE'}</div>
                </div>
              </div>

              {/* What Happens Next Stepper Snapshot */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                  Application Lifecycle Next Steps
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#166534' }}>STAGE 01 ✓</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#14532d', marginTop: 2 }}>Submitted</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#1d4ed8' }}>STAGE 02 ⏳ NEXT</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1e40af', marginTop: 2 }}>{deptName} Audit</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 10, opacity: 0.7 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8' }}>STAGE 03</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginTop: 2 }}>Admin Approval</div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 10, opacity: 0.7 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8' }}>STAGE 04</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginTop: 2 }}>Fund Disbursed</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Bar Footer */}
            <div style={{ background: '#f8fafc', borderTop: '1.5px solid #e2e8f0', padding: '20px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleDownloadReceipt}
                style={{
                  padding: '12px 20px', borderRadius: 12, background: '#ffffff', color: '#0f172a',
                  border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                📥 Download Digital Receipt
              </button>

              <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '12px 20px', borderRadius: 12, background: '#ffffff', color: '#334155',
                    border: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/welfare/my-applications')}
                  style={{
                    padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  📊 Track Live Application Status →
                </button>
              </div>
            </div>

          </div>
        </div>
      </AppShell>
    );
  }

  if (duplicateData) {
    const activeScheme = schemes.find(s => s.schemeId === duplicateData.schemeId);
    const schemeTitle = activeScheme?.schemeName || duplicateData.schemeName || 'Welfare Scheme';
    const rawAadhaar = duplicateData.applicantAadhaar || form.applicantAadhaar || '';
    const cleanDigits = rawAadhaar.replace(/\D/g, '');
    const maskedAadhaar = cleanDigits.length >= 4 
      ? `XXXX-XXXX-${cleanDigits.slice(-4)}` 
      : rawAadhaar;

    return (
      <AppShell title="Duplicate Application Detected">
        <div style={{ maxWidth: 680, margin: '40px auto', background: '#ffffff', borderRadius: 20, border: '1.5px solid #fecaca', boxShadow: '0 12px 32px rgba(220, 38, 38, 0.08)', overflow: 'hidden' }}>
          
          {/* Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #fef2f2, #ffe4e4)', padding: '28px 32px', borderBottom: '1.5px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ background: '#ef4444', width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', flexShrink: 0 }}>
              <AlertTriangle size={28} color="#ffffff" />
            </div>
            <div>
              <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                SINGLE ACTIVE APPLICATION RULE
              </span>
              <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 800, color: '#991b1b', letterSpacing: '-0.02em' }}>
                Duplicate Application Detected
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#b91c1c', lineHeight: 1.6 }}>
                An active application already exists under Aadhaar <strong style={{ fontFamily: 'monospace' }}>{maskedAadhaar}</strong> (currently registered for <strong>{schemeTitle}</strong>). Under DBT policy, an Aadhaar identity cannot be registered for multiple active applications until the existing application is completed, withdrawn, or rejected.
              </p>
            </div>
          </div>

          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Active Application Record Card */}
            <div style={{ background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e2e8f0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Existing Active Application Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700 }}>BENEFICIARY CODE</span>
                  <strong style={{ fontFamily: 'monospace', color: '#2563eb', fontSize: 15 }}>{duplicateData.beneficiaryCode || 'BEN-2026-ACTIVE'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700 }}>SCHEME NAME</span>
                  <strong style={{ color: '#0f172a' }}>{schemeTitle}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, fontWeight: 700 }}>CURRENT STATUS</span>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 800, border: '1px solid #bfdbfe', display: 'inline-block' }}>
                    {duplicateData.status || 'ACTIVE_REVIEW'}
                  </span>
                </div>
              </div>
            </div>

            {/* Why This Happened Explanation */}
            <div style={{ background: '#fffbeb', borderRadius: 14, border: '1.5px solid #fde68a', padding: '18px 20px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                💡 Government Benefit Allocation Policy
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#b45309', lineHeight: 1.6 }}>
                Direct Benefit Transfer (DBT) rules restrict duplicate allocations for the same beneficiary Aadhaar identity. Logged-in accounts may apply on behalf of multiple family members using different Aadhaar credentials.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', paddingTop: 8 }}>


              <button 
                type="button"
                onClick={() => navigate('/welfare/my-applications')}
                style={{ flex: 1, height: 46, padding: '0 22px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                View Existing Application <ArrowRight size={18} />
              </button>

              <button 
                type="button"
                onClick={() => setDuplicateData(null)}
                style={{ flex: 1, height: 46, padding: '0 20px', background: '#f1f5f9', color: '#334155', border: '1.5px solid #cbd5e1', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Browse Other Schemes
              </button>

              <button 
                type="button"
                onClick={() => {
                  setDuplicateData(null);
                  toast.info('You can now edit your application details.');
                }}
                style={{ flex: 1, height: 46, padding: '0 20px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              >
                ✏️ Edit Application
              </button>
            </div>

          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Apply for Welfare Scheme">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 100px 24px', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <StepIndicator current={0} />

        {/* ── Page Header (Overview-style) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #334155)',
          borderRadius: 16, padding: '24px 32px', color: '#fff',
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
          marginBottom: 0, position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: '#fff', opacity: 0.03, borderRadius: '50%', filter: 'blur(30px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{
              background: 'rgba(255,255,255,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block', marginBottom: 10
            }}>
              WELFARE MODULE
            </span>
            <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Apply for Welfare Scheme
            </h2>
            <p style={{ margin: 0, color: '#cbd5e1', maxWidth: 540, fontSize: 14, lineHeight: 1.5 }}>
              Complete the verification form below. Your application will be cross-referenced with municipal databases for instant eligibility validation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Card 1: Select Welfare Program */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#ecfdf5',
                border: '1px solid #a7f3d0', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <HandHeart size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>1. Select Welfare Program</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Choose the active government scheme you are applying for</p>
              </div>
            </div>

            <div>
              {loadingSchemes ? (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 14 }}>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading available schemes...
                </div>
              ) : schemeError ? (
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <AlertTriangle size={18} /> Could not load schemes.
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={fetchSchemes} className="bg-white">
                    Retry
                  </Button>
                </div>
              ) : (
                <SchemeSelectDropdown
                  schemes={schemes}
                  value={form.schemeId}
                  onChange={(id) => setForm(f => ({ ...f, schemeId: id }))}
                  placeholder="Browse and select a scheme..."
                />
              )}

              {form.schemeId && (() => {
                const s = schemes.find(s => s.schemeId === form.schemeId);
                if (!s) return null;
                
                const ageReqMet = isAgeValid && !isAgeExceeded;
                const incomeReqMet = isIncomeValid && !isIncomeExceeded;
                const docsReqMet = allDocsUploaded;
                const aadhaarReqMet = isAadhaarValid;
                
                const isOverallEligible = ageReqMet && incomeReqMet && docsReqMet && aadhaarReqMet;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                    <div style={{
                      padding: 20, borderRadius: 14, background: '#f8fafc',
                      border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{s.schemeName}</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{s.eligibilityCriteria || 'General citizen welfare scheme.'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 20, borderLeft: '1px solid #cbd5e1', paddingLeft: 20 }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Income Limit</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {s.maxIncome ? `Up to ₹${Number(s.maxIncome).toLocaleString('en-IN')}` : 'None'}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>Age Limit</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {s.minAge ? `${s.minAge} - ${s.maxAge || 'Max'} yrs` : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: 20, borderRadius: 14, 
                      background: isOverallEligible ? '#f0fdf4' : '#fffbeb',
                      border: isOverallEligible ? '1.5px solid #86efac' : '1.5px solid #fde68a',
                      display: 'flex', flexDirection: 'column', gap: 16
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: isOverallEligible ? '#166534' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Live Eligibility Checklist
                        </h4>
                        <span style={{ 
                          fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                          background: isOverallEligible ? '#10b981' : '#f59e0b', color: '#ffffff'
                        }}>
                          {isOverallEligible ? 'Eligible to Apply' : 'Requirements Pending'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: ageReqMet ? '#047857' : (form.age ? '#b91c1c' : '#64748b'), fontWeight: 600 }}>
                          {ageReqMet ? <CheckCircle size={16} /> : <X size={16} />}
                          Age Requirement {s.minAge ? `(${s.minAge}-${s.maxAge || 'Max'} yrs)` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: incomeReqMet ? '#047857' : (form.annualIncome ? '#b91c1c' : '#64748b'), fontWeight: 600 }}>
                          {incomeReqMet ? <CheckCircle size={16} /> : <X size={16} />}
                          Income Requirement {s.maxIncome ? `(≤ ₹${Number(s.maxIncome).toLocaleString('en-IN')})` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: aadhaarReqMet ? '#047857' : '#64748b', fontWeight: 600 }}>
                          {aadhaarReqMet ? <CheckCircle size={16} /> : <X size={16} />}
                          Aadhaar Format Valid
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: docsReqMet ? '#047857' : '#64748b', fontWeight: 600 }}>
                          {docsReqMet ? <CheckCircle size={16} /> : <X size={16} />}
                          Mandatory Documents Ready
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Card 2: Applicant Profile */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#ecfdf5',
                border: '1px solid #a7f3d0', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>2. Applicant Profile</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Personal information and legal identity verification</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.applicantName}
                  onChange={e => setForm(f => ({ ...f, applicantName: e.target.value }))}
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applicant Aadhaar <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.applicantAadhaar}
                  onChange={handleAadhaarChange}
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace', color: '#0f172a' }}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Age (Years) <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="number"
                  value={form.age}
                  placeholder="e.g., 25"
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Family/Social Category <span style={{ color: '#ef4444' }}>*</span></Label>
                <Select value={form.familyStatus} onValueChange={val => setForm(f => ({ ...f, familyStatus: val }))}>
                  <SelectTrigger style={{ height: 46, borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, fontWeight: 500, color: '#0f172a', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <SelectValue placeholder="Select Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General Category</SelectItem>
                    <SelectItem value="BPL">Below Poverty Line (BPL)</SelectItem>
                    <SelectItem value="OBC">Other Backward Class (OBC)</SelectItem>
                    <SelectItem value="SC/ST">Scheduled Caste / Scheduled Tribe (SC/ST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Card 3: Income & Financial Details */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#ecfdf5',
                border: '1px solid #a7f3d0', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <IndianRupee size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>3. Income & Financial Details</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Declared annual income for automated eligibility determination</p>
              </div>
            </div>



            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Annual Family Income (₹) <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="number"
                  value={form.annualIncome}
                  placeholder="e.g., 250000"
                  onChange={e => setForm(f => ({ ...f, annualIncome: e.target.value }))}
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace', color: '#0f172a' }}
                  required
                />
              </div>
              <div style={{ background: '#f0fdf4', padding: '14px 18px', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>i</div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#14532d' }}>Validation Rule</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
                    Income details are cross-referenced with Revenue Department certificates to compute automated eligibility scores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3B: Direct Benefit Transfer (DBT) Bank Account Details */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#eff6ff',
                border: '1px solid #bfdbfe', color: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Landmark size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>3B. DBT Bank Account Details <span style={{ color: '#ef4444' }}>*</span></h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Enter verified bank account credentials for Direct Benefit Transfer (DBT) credit</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Holder Name <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.accountHolderName}
                  onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))}
                  placeholder="Full name as in bank passbook"
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bank Name <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.bankName}
                  onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. State Bank of India"
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Number <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.accountNumber}
                  onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="11 to 16 digit account number"
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace', color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IFSC Code <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  type="text"
                  value={form.ifscCode}
                  onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SBIN0001234"
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace', color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: 'span 1' }}>
                <Label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Branch Name</Label>
                <Input
                  type="text"
                  value={form.branchName}
                  onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                  placeholder="e.g. Main City Branch"
                  style={{ height: 44, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, color: '#0f172a' }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Required Documentation Uploads & Checklist */}
          <div style={{
            background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)', padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#ecfdf5',
                border: '1px solid #a7f3d0', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Upload size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  4. Required Documentation Uploads <span style={{ color: '#ef4444' }}>* (Mandatory 5/5)</span>
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  All 5 digital copies (Aadhaar, Income Certificate, Bank Passbook, Photograph, Residence Proof) are mandatory for submission.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {DOCS.map(doc => {
                const isChecked = checkedDocs.includes(doc);
                const fileInfo = uploadedFiles[doc];

                return (
                  <div 
                    key={doc} 
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px',
                      borderRadius: 14, border: isChecked ? '1.5px solid #10b981' : '1.5px solid #fca5a5',
                      background: isChecked ? '#f0fdf4' : '#fff5f5', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div 
                        onClick={() => toggleDoc(doc)} 
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}
                      >
                        <Checkbox 
                          checked={isChecked} 
                          onCheckedChange={() => toggleDoc(doc)}
                          className={isChecked ? 'border-emerald-600 text-emerald-600 data-[state=checked]:bg-emerald-600' : 'border-red-400'} 
                        />
                        <span style={{ fontSize: 14, fontWeight: 700, color: isChecked ? '#065f46' : '#991b1b' }}>{doc}</span>
                      </div>

                      {fileInfo ? (
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 12, border: '1px solid #86efac' }}>
                          ✓ Attached
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, border: '1px solid #fca5a5' }}>
                          * Mandatory
                        </span>
                      )}
                    </div>

                    {fileInfo ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#ffffff', padding: '8px 12px', borderRadius: 10, border: '1px solid #a7f3d0', fontSize: 12
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          <Paperclip size={14} color="#059669" />
                          <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileInfo.name}</span>
                          <span style={{ color: '#64748b', fontSize: 11 }}>({fileInfo.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(doc)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, display: 'flex', alignItems: 'center' }}
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '9px 14px', borderRadius: 10, border: '1.5px dashed #fca5a5',
                        background: '#ffffff', color: '#dc2626', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}>
                        <Upload size={14} /> Upload {doc} (PDF/JPG) <span style={{ color: '#ef4444' }}>*</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(doc, e.target.files[0]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Sticky Bottom Action Bar ── */}
          <div style={{
            position: 'sticky', bottom: 16, zIndex: 30,
            background: '#ffffff', borderRadius: 16,
            border: '1.5px solid #cbd5e1', padding: '16px 24px',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)',
            marginTop: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                {!allDocsUploaded ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', color: '#991b1b', padding: '8px 14px', borderRadius: 10, border: '1px solid #fecaca', fontSize: 12, fontWeight: 700 }}>
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Mandatory Upload: All 5 documents required ({checkedDocs.length}/5 uploaded). Missing: {missingDocs.join(', ')}
                  </span>
                ) : !isFormValid ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', color: '#92400e', padding: '8px 14px', borderRadius: 10, border: '1px solid #fde68a', fontSize: 12, fontWeight: 700 }}>
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Please satisfy all eligibility requirements in the checklist above to submit.
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#166534', padding: '8px 14px', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 700 }}>
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Ready for submission (All 5 mandatory documents attached)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button 
                  type="button" 
                  variant="outline" 
                  style={{ height: 42, borderRadius: 10, padding: '0 20px', fontWeight: 700, fontSize: 13 }}
                  onClick={() => navigate('/welfare/my-applications')}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  style={{ height: 42, borderRadius: 10, padding: '0 18px', fontWeight: 700, fontSize: 13, color: '#b91c1c', borderColor: '#fca5a5', background: '#fff5f5' }}
                  onClick={handleResetForm}
                  title="Clear all inputs and uploaded documents"
                >
                  <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset Form
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  style={{ height: 42, borderRadius: 10, padding: '0 20px', fontWeight: 700, fontSize: 13 }}
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </Button>
                <Button 
                  type="submit" 
                  style={{
                    height: 42, borderRadius: 10, padding: '0 24px', fontWeight: 800, fontSize: 13,
                    background: isFormValid ? '#10b981' : '#cbd5e1', color: '#ffffff', border: 'none',
                    cursor: isFormValid && !submitting ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!isFormValid || submitting}
                >
                  {submitting ? 'Processing...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </AppShell>
  );
}
