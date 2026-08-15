import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ShieldCheck, Clock, Lock, Search, Building2, Filter, Award, FileCheck, ArrowRight, Receipt, Sparkles, CheckCircle2, Upload, FileText, UploadCloud, Check } from 'lucide-react';

const CERTIFICATE_CONFIG = {
  BIRTH_CERTIFICATE: {
    label: 'Birth Certificate',
    icon: '👶',
    iconBg: 'bg-blue-100',
    badge: 'POPULAR',
    description: 'Official record of birth for school admission, passport, and legal purposes.',
    department: 'Health Department',
    approvalTime: '2 Working Days',
    fee: '₹0',
    fields: [
      { name: 'childName', label: 'Child Name', type: 'text', required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'fatherName', label: 'Father Name', type: 'text', required: true },
      { name: 'motherName', label: 'Mother Name', type: 'text', required: true },
      { name: 'hospitalName', label: 'Hospital Name', type: 'text', required: true },
      { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    documents: [
      { id: 'Hospital Birth Record', label: 'Hospital Birth Record', required: true },
      { id: 'Parent Aadhaar Card', label: 'Parent Aadhaar Card', required: true },
      { id: 'Address Proof', label: 'Address Proof', required: true },
      { id: 'Child Photograph', label: 'Child Photograph', required: false }
    ]
  },
  DEATH_CERTIFICATE: {
    label: 'Death Certificate',
    icon: '📋',
    iconBg: 'bg-purple-100',
    description: 'Legal document certifying death for insurance, property, and legal proceedings.',
    department: 'Health Department',
    approvalTime: '2 Working Days',
    fee: '₹0',
    fields: [
      { name: 'deceasedName', label: 'Deceased Name', type: 'text', required: true },
      { name: 'relationship', label: 'Relationship with Deceased', type: 'text', required: true },
      { name: 'dateOfDeath', label: 'Date of Death', type: 'date', required: true },
      { name: 'placeOfDeath', label: 'Place of Death', type: 'text', required: true },
      { name: 'causeOfDeath', label: 'Cause of Death', type: 'text', required: true },
      { name: 'hospitalName', label: 'Hospital Name', type: 'text', required: false },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    documents: [
      { id: 'Hospital Death Certificate', label: 'Hospital Death Certificate', required: true },
      { id: 'Applicant Aadhaar', label: 'Applicant Aadhaar', required: true },
      { id: 'Address Proof', label: 'Address Proof', required: true }
    ]
  },
  INCOME_CERTIFICATE: {
    label: 'Income Certificate',
    icon: '💰',
    iconBg: 'bg-green-100',
    description: 'Proof of income for scholarships, subsidies, and government schemes.',
    department: 'Revenue Department',
    approvalTime: '5 Working Days',
    fee: '₹50',
    fields: [
      { name: 'occupation', label: 'Occupation', type: 'text', required: true },
      { name: 'employerName', label: 'Employer Name', type: 'text', required: false },
      { name: 'monthlyIncome', label: 'Monthly Income (₹)', type: 'number', required: true },
      { name: 'annualIncome', label: 'Annual Income (₹)', type: 'number', required: true },
      { name: 'familyMembers', label: 'Family Members Count', type: 'number', required: true },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true },
      { name: 'address', label: 'Address', type: 'text', required: true }
    ],
    documents: [
      { id: 'Aadhaar Card', label: 'Aadhaar Card', required: true },
      { id: 'Salary Slip OR Income Proof', label: 'Salary Slip OR Income Proof', required: true },
      { id: 'Bank Statement', label: 'Bank Statement', required: true },
      { id: 'Ration Card', label: 'Ration Card', required: true }
    ]
  },
  RESIDENCE_CERTIFICATE: {
    label: 'Residence Certificate',
    icon: '🏠',
    iconBg: 'bg-rose-100',
    description: 'Proof of residence for ration card, voter ID, and local services.',
    department: 'Revenue Department',
    approvalTime: '3 Working Days',
    fee: '₹20',
    fields: [
      { name: 'currentAddress', label: 'Current Address', type: 'text', required: true },
      { name: 'ward', label: 'Ward', type: 'text', required: true },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'pincode', label: 'Pincode', type: 'text', required: true },
      { name: 'yearsOfResidence', label: 'Years of Residence', type: 'number', required: true }
    ],
    documents: [
      { id: 'Aadhaar Card', label: 'Aadhaar Card', required: true },
      { id: 'Electricity Bill', label: 'Electricity Bill', required: true },
      { id: 'Rental Agreement OR Property Tax Receipt', label: 'Rental Agreement OR Property Tax Receipt', required: true }
    ]
  },
  TRADE_LICENSE: {
    label: 'Trade License',
    icon: '💼',
    iconBg: 'bg-amber-100',
    description: 'License to operate a commercial business within municipal limits.',
    department: 'Municipal Corporation',
    approvalTime: '7 Working Days',
    fee: '₹500',
    fields: [
      { name: 'businessName', label: 'Business Name', type: 'text', required: true },
      { name: 'ownerName', label: 'Owner Name', type: 'text', required: true },
      { name: 'businessType', label: 'Business Type', type: 'text', required: true },
      { name: 'gstNumber', label: 'GST Number', type: 'text', required: false },
      { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
      { name: 'ward', label: 'Ward', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Business Phone Number', type: 'text', required: true },
      { name: 'email', label: 'Business Email', type: 'email', required: true }
    ],
    documents: [
      { id: 'GST Certificate', label: 'GST Certificate', required: true },
      { id: 'Shop Photograph', label: 'Shop Photograph', required: true },
      { id: 'Owner Aadhaar', label: 'Owner Aadhaar', required: true },
      { id: 'Address Proof', label: 'Address Proof', required: true }
    ]
  },
  PERMIT_APPROVAL: {
    label: 'Permit Approval',
    icon: '🏗️',
    iconBg: 'bg-slate-100',
    description: 'Official permit for construction, event organization, or temporary commercial activities.',
    department: 'Urban Planning Department',
    approvalTime: '10 Working Days',
    fee: '₹1000',
    fields: [
      { name: 'permitType', label: 'Permit Type', type: 'select', options: ['Construction', 'Event', 'Commercial', 'Other'], required: true },
      { name: 'location', label: 'Location/Address', type: 'text', required: true },
      { name: 'duration', label: 'Duration (in days)', type: 'number', required: true },
      { name: 'purpose', label: 'Purpose', type: 'text', required: true }
    ],
    documents: [
      { id: 'Aadhaar Card', label: 'Aadhaar Card', required: true },
      { id: 'Property/Location Proof', label: 'Property/Location Proof', required: true },
      { id: 'Site Plan or Layout', label: 'Site Plan or Layout', required: false }
    ]
  }
};

const FORM_STEPS = ['Fill Details', 'Upload Documents', 'Review', 'Submit'];

function UploadCard({ doc, isUploaded, isUploading, uploadErr, fileInfo, onUpload, dragOver, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        background: isUploaded ? '#f0fdf4' : dragOver ? '#eff6ff' : '#ffffff',
        borderRadius: 16,
        border: isUploaded
          ? '1.5px solid #86efac'
          : dragOver
          ? '2px dashed #2563eb'
          : '1.5px solid #e2e8f0',
        padding: '20px 24px',
        boxShadow: dragOver
          ? '0 10px 25px rgba(37,99,235,0.15)'
          : isUploaded
          ? '0 4px 12px rgba(22,163,74,0.06)'
          : '0 2px 8px rgba(15,23,42,0.04)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: isUploaded ? '#dcfce7' : '#f1f5f9',
          color: isUploaded ? '#16a34a' : '#64748b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 20
        }}>
          {isUploaded ? <FileCheck size={24} color="#16a34a" /> : <FileText size={24} color="#64748b" />}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              {doc.label}
            </h5>
            {doc.required ? (
              <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                Required *
              </span>
            ) : (
              <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                Optional
              </span>
            )}
            {isUploaded && (
              <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={12} /> Uploaded
              </span>
            )}
            {isUploading && (
              <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                Uploading...
              </span>
            )}
          </div>

          {isUploaded ? (
            <div style={{ marginTop: 4, fontSize: 12, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📄 {fileInfo?.name}</span>
              <span style={{ color: '#86efac' }}>•</span>
              <span style={{ color: '#15803d' }}>{fileInfo?.size}</span>
            </div>
          ) : (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
              PDF, JPG, PNG — Maximum file size 5MB
            </p>
          )}

          {uploadErr && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
              ⚠️ {uploadErr}
            </div>
          )}
        </div>
      </div>

      <div>
        {!isUploading && (
          <label style={{ cursor: 'pointer', display: 'inline-block' }}>
            <span style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: isUploaded
                ? '#ffffff'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: isUploaded ? '#1e293b' : '#ffffff',
              border: isUploaded ? '1.5px solid #cbd5e1' : 'none',
              fontSize: 13,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isUploaded ? 'none' : '0 4px 10px rgba(15,23,42,0.15)',
              transition: 'all 0.15s ease'
            }}>
              <UploadCloud size={16} /> {isUploaded ? 'Replace File' : 'Browse Files'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(e) => onUpload(e.target.files[0])}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ServiceApplicationForm() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [dragOverDoc, setDragOverDoc] = useState(null);

  const [formData, setFormData] = useState({
    applicantName: '',
    aadhaarNumber: '',
    phoneNumber: '',
    email: '',
    relationship: '',
    applicantDateOfBirth: ''
  });

  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [sortOption, setSortOption] = useState('POPULAR');

  const config = CERTIFICATE_CONFIG[serviceType];

  const filteredServices = Object.entries(CERTIFICATE_CONFIG).filter(([key, svc]) => {
    if (selectedDept !== 'ALL' && svc.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = svc.label?.toLowerCase().includes(q);
      const matchDesc = svc.description?.toLowerCase().includes(q);
      const matchDept = svc.department?.toLowerCase().includes(q);
      if (!matchLabel && !matchDesc && !matchDept) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortOption === 'AZ') {
      return a[1].label.localeCompare(b[1].label);
    }
    const badgeA = a[1].badge ? 1 : 0;
    const badgeB = b[1].badge ? 1 : 0;
    return badgeB - badgeA;
  });

  const requiredDocs = config ? config.documents.filter(d => d.required) : [];
  const uploadedRequiredCount = requiredDocs.filter(d => uploadedDocs[d.id]).length;
  const progressPercent = requiredDocs.length > 0 ? Math.round((uploadedRequiredCount / requiredDocs.length) * 100) : 100;

  const isDetailsValid = () => {
    if (!formData.applicantName || formData.aadhaarNumber.length < 14) return false;
    if (!formData.phoneNumber || !formData.email) return false;
    for (const field of config?.fields || []) {
      if (field.required && !formData[field.name]) return false;
    }
    return true;
  };

  const isFormValid = () => isDetailsValid() && uploadedRequiredCount >= requiredDocs.length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'aadhaarNumber') {
      let val = value.replace(/\D/g, '');
      if (val.length > 12) val = val.slice(0, 12);
      const formatted = val.match(/.{1,4}/g)?.join('-') || '';
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const setFieldValue = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const processFileUpload = (docId, file) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadErrors(prev => ({ ...prev, [docId]: 'Only PDF, JPG, and PNG formats are allowed' }));
      toast.error('Only PDF, JPG, and PNG formats are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [docId]: 'File size must be under 5MB' }));
      toast.error('File size must be under 5MB');
      return;
    }

    setUploadErrors(prev => ({ ...prev, [docId]: null }));
    setUploadingDocs(prev => ({ ...prev, [docId]: true }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadingDocs(prev => ({ ...prev, [docId]: false }));
      setUploadedDocs(prev => ({
        ...prev,
        [docId]: { 
          id: docId, 
          name: file.name, 
          type: file.type, 
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          data: reader.result 
        }
      }));
      toast.success(`${docId} uploaded successfully`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsLoading(true);

    const citizenId = keycloak.tokenParsed?.sub;
    const { applicantName, aadhaarNumber, ...dynamicData } = formData;

    const payload = {
      citizenId,
      serviceType,
      applicantName,
      aadhaarNumber,
      dynamicData,
      documentsSubmitted: JSON.stringify(Object.values(uploadedDocs))
    };

    try {
      const res = await api.post('/service-management-service/api/services/apply', payload);
      toast.success(`Application Submitted Successfully! App No: ${res.data.applicationNumber}`);
      setIsLoading(false);
      setTimeout(() => {
        navigate('/services/tracker');
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409 && err.response?.data?.existingApplication) {
        setDuplicateData(err.response.data.existingApplication);
        toast.error('Duplicate application detected.');
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to submit application.');
      }
      setIsLoading(false);
    }
  };

  const resetSelection = () => {
    setServiceType('');
    setIsStarted(false);
    setFormStep(1);
    setFormData({ applicantName: '', aadhaarNumber: '', phoneNumber: '', email: '' });
    setUploadedDocs({});
    setUploadErrors({});
  };

  const selectService = (key) => {
    setServiceType(key);
    setIsStarted(false);
    setFormStep(1);
    setDuplicateData(null);
  };

  if (duplicateData) {
    return (
      <AppShell title="Apply for Certificates">
        <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
          <div style={{ background: '#fef2f2', padding: '24px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ef4444', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, color: '#fff' }}>⚠️</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#991b1b' }}>Duplicate Application Detected</h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#b91c1c' }}>You already have an active application for this service.</p>
            </div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Application Number</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{duplicateData.applicationNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Status</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{duplicateData.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Applicant Aadhaar</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{duplicateData.aadhaarNumber}</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button 
                onClick={() => setDuplicateData(null)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button 
                onClick={() => navigate('/services/tracker')}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Track Existing Application
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Apply for Certificates">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 40px 24px', margin: '0 auto', boxSizing: 'border-box' }}>

        {serviceType && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={resetSelection}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, background: '#ffffff',
                border: '1.5px solid #cbd5e1', color: '#1e293b', fontSize: 13,
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              ← Change Service
            </button>
          </div>
        )}

        {/* Step 1: Service Selection Cards */}
        {!serviceType && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* ── Page Header (Executive Navy/Emerald Theme matching Civic Services) ── */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
              borderRadius: 20, padding: '28px 32px', color: '#ffffff',
              display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 12px 36px rgba(15,23,42,0.25)', border: '1px solid #334155',
              marginBottom: 16, position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block', marginBottom: 8
                }}>
                  CIVIC SERVICES
                </span>
                <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Apply for Government Certificates
                </h2>
                <p style={{ margin: 0, color: '#94a3b8', maxWidth: 540, fontSize: 14, lineHeight: 1.5 }}>
                  Choose from digitally verifiable municipal certificate services to start your official application.
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Link to="/services/tracker" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: '#ffffff', color: '#0f172a', border: 'none', padding: '10px 22px',
                    borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <Search size={16} /> Track My Applications
                  </button>
                </Link>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div style={{
              background: '#ffffff', borderRadius: 14, padding: '16px 20px',
              border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center'
            }}>
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type="text"
                  placeholder="Search certificates by title or department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10,
                    border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                style={{
                  padding: '9px 14px', borderRadius: 10, border: '1px solid #cbd5e1',
                  fontSize: 13, fontWeight: 600, color: '#334155', background: '#ffffff', cursor: 'pointer'
                }}
              >
                <option value="ALL">All Departments</option>
                <option value="Health Department">Health Department</option>
                <option value="Revenue Department">Revenue Department</option>
                <option value="Municipal Corporation">Municipal Corporation</option>
                <option value="Urban Planning Department">Urban Planning Department</option>
              </select>

              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value)}
                style={{
                  padding: '9px 14px', borderRadius: 10, border: '1px solid #cbd5e1',
                  fontSize: 13, fontWeight: 600, color: '#334155', background: '#ffffff', cursor: 'pointer'
                }}
              >
                <option value="POPULAR">Sort By: Popular</option>
                <option value="AZ">Sort By: Name (A-Z)</option>
              </select>

              <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {filteredServices.length} certificates available
              </span>
            </div>

            {/* Section Header */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '8px 0 2px' }}>
                Popular Certificates
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Select a certificate service to start your official application
              </p>
            </div>

            {/* Certificates Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 20 }}>
              {filteredServices.map(([key, svc]) => (
                <div
                  key={key}
                  onClick={() => selectService(key)}
                  style={{
                    background: '#ffffff', borderRadius: 16, border: '1.5px solid #e2e8f0',
                    padding: 20, cursor: 'pointer', transition: 'all 0.15s ease-in-out',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(37,99,235,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.04)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        background: '#eff6ff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 22, flexShrink: 0
                      }}>
                        {svc.icon}
                      </div>
                      {svc.badge && (
                        <span style={{
                          background: '#dcfce7', color: '#15803d', fontSize: 10,
                          fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                          letterSpacing: '0.05em'
                        }}>
                          {svc.badge}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
                      {svc.label}
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                      {svc.description}
                    </p>
                  </div>

                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#475569', fontWeight: 600
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Building2 size={13} color="#94a3b8" />
                        {svc.department}
                      </span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>
                        {svc.approvalTime}
                      </span>
                    </div>

                    <button style={{
                      width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                      border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                    }}>
                      Apply Now <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Requirements Card (Ultra Premium Design) */}
        {config && !isStarted && (
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0,0,0,0.02)',
            overflow: 'hidden',
            marginBottom: 32
          }}>
            {/* Executive Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
              padding: '32px 36px',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background glow decorative circle */}
              <div style={{
                position: 'absolute',
                top: -50, right: -50,
                width: 250, height: 250,
                background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(255,255,255,0) 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                  }}>
                    {config.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        background: 'rgba(52, 211, 153, 0.15)', color: '#34d399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.06em'
                      }}>
                        OFFICIAL SERVICE REQUISITE
                      </span>
                      {config.badge && (
                        <span style={{
                          background: '#dcfce7', color: '#15803d',
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 800
                        }}>
                          {config.badge}
                        </span>
                      )}
                    </div>

                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                      {config.label} Requirements
                    </h1>
                    <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 14, maxWidth: 600, lineHeight: 1.5 }}>
                      {config.description || 'Please review the service details, estimated SLA timeframe, and document checklist below before launching your official application.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetSelection}
                  style={{
                    background: 'rgba(255,255,255,0.1)', color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px',
                    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    backdropFilter: 'blur(4px)', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  ← Select Different Service
                </button>
              </div>
            </div>

            {/* Key Information Cards Grid */}
            <div style={{ padding: '28px 36px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                
                {/* Department Card */}
                <div style={{
                  background: '#ffffff', borderRadius: 16, padding: '18px 20px',
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
                  display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: '#eff6ff',
                    color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Department
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      {config.department}
                    </div>
                  </div>
                </div>

                {/* Processing Time Card */}
                <div style={{
                  background: '#ffffff', borderRadius: 16, padding: '18px 20px',
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
                  display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: '#f0fdf4',
                    color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Processing Time
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {config.approvalTime}
                      <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                        SLA Guaranteed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Fee Card */}
                <div style={{
                  background: '#ffffff', borderRadius: 16, padding: '18px 20px',
                  border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)',
                  display: 'flex', alignItems: 'center', gap: 14
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: '#faf5ff',
                    color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Receipt size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Application Fee
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {config.fee === '₹0' ? (
                        <span style={{ color: '#16a34a', fontWeight: 900 }}>FREE</span>
                      ) : (
                        <span>{config.fee}</span>
                      )}
                      <span style={{ fontSize: 10, background: '#f3e8ff', color: '#7e22ce', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                        Digital Payment Ready
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Document Checklist & Guidelines Section */}
            <div style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={20} color="#059669" /> Required Documents Checklist
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Have clear scanned copies or photographs (PDF, JPG, PNG under 5MB) ready before starting.
                  </p>
                </div>
                <span style={{
                  background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 700,
                  padding: '5px 12px', borderRadius: 20, border: '1px solid #cbd5e1'
                }}>
                  {config.documents.filter(d => d.required).length} Mandated Documents
                </span>
              </div>

              {/* Documents Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
                {config.documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background: doc.required ? '#f0fdf4' : '#f8fafc',
                      borderRadius: 14, padding: '16px 18px',
                      border: doc.required ? '1.5px solid #bbf7d0' : '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: doc.required ? '#16a34a' : '#94a3b8',
                      color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, flexShrink: 0, marginTop: 2
                    }}>
                      {doc.required ? '✓' : '○'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {doc.label}
                        </span>
                        {doc.required ? (
                          <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                            Required
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                            Optional
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                        Accepted formats: PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security & Verification Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: 16, padding: '16px 20px', border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                marginBottom: 28
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShieldCheck size={24} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1e40af' }}>
                      256-Bit Encrypted & Digitally Verified Application Process
                    </div>
                    <div style={{ fontSize: 12, color: '#3b82f6' }}>
                      Your application and uploaded documents are encrypted and directly routed to officer dashboards.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1d4ed8', fontSize: 12, fontWeight: 800 }}>
                  <Sparkles size={16} /> Instant Tracking Ready
                </div>
              </div>

              {/* Start Application Action Button */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsStarted(true)}
                  style={{
                    flex: '1 1 280px',
                    padding: '16px 28px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  Start Application <ArrowRight size={20} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Multi-step Form Container */}
        {config && isStarted && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
            
            {/* Step Indicator Header */}
            <StepIndicator steps={FORM_STEPS} currentStep={formStep} />

            <div style={{
              background: '#ffffff',
              borderRadius: 24,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden'
            }}>
              {/* Form Section Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
                padding: '24px 32px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {config.icon}
                  </div>
                  <div>
                    <span style={{
                      background: 'rgba(52, 211, 153, 0.15)', color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      padding: '2px 8px', borderRadius: 12,
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.05em'
                    }}>
                      STEP {formStep} OF {FORM_STEPS.length}
                    </span>
                    <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
                      {config.label} — <span style={{ color: '#34d399' }}>{FORM_STEPS[formStep - 1]}</span>
                    </h2>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)', color: '#cbd5e1',
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700
                  }}>
                    {config.department}
                  </span>
                  <span style={{
                    background: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7',
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800
                  }}>
                    Fee: {config.fee}
                  </span>
                </div>
              </div>

              {/* Form Content Area */}
              <div style={{ padding: '32px 36px', background: '#ffffff' }}>

                {/* Step 1: Fill Details (Executive UI) */}
                {formStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                    {/* Section 1: Applicant Personal Details */}
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        paddingBottom: 12, marginBottom: 20, borderBottom: '2px solid #f1f5f9'
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: '#eff6ff',
                          color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800
                        }}>
                          👤
                        </div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                          Applicant Identification & Contact Details
                        </h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {/* Applicant Name */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Applicant Full Name <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            name="applicantName"
                            value={formData.applicantName}
                            onChange={handleInputChange}
                            required
                            placeholder="As per Aadhaar Card"
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 600, background: '#ffffff'
                            }}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Must match official government identity card</p>
                        </div>

                        {/* Aadhaar Number */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Aadhaar Number <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            name="aadhaarNumber"
                            value={formData.aadhaarNumber}
                            onChange={handleInputChange}
                            required
                            placeholder="XXXX-XXXX-XXXX"
                            maxLength={14}
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace'
                            }}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>12-digit unique identification number</p>
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Phone Number <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            required
                            placeholder="10-digit mobile number"
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 600
                            }}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Used for SMS status updates & OTP verification</p>
                        </div>

                        {/* Email Address */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Email Address <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="Email address for notifications"
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 600
                            }}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>Digital certificate copy will be emailed here</p>
                        </div>

                        {/* Relationship */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Applying For (Relationship)
                          </label>
                          <Input
                            name="relationship"
                            value={formData.relationship}
                            onChange={handleInputChange}
                            placeholder="e.g. Self, Son, Daughter, Father"
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 600
                            }}
                          />
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                            Applicant Date of Birth
                          </label>
                          <Input
                            type="date"
                            name="applicantDateOfBirth"
                            value={formData.applicantDateOfBirth}
                            onChange={handleInputChange}
                            style={{
                              padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                              fontSize: 14, color: '#0f172a', fontWeight: 600
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Service Specific Details */}
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        paddingBottom: 12, marginBottom: 20, borderBottom: '2px solid #f1f5f9'
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: '#f0fdf4',
                          color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 800
                        }}>
                          📋
                        </div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                          {config.label} Service Particulars
                        </h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {config.fields.map(field => (
                          <div key={field.name}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                            </label>

                            {field.type === 'select' ? (
                              <Select value={formData[field.name] || ''} onValueChange={val => setFieldValue(field.name, val)}>
                                <SelectTrigger style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1', fontSize: 14, color: '#0f172a', fontWeight: 600, height: 'auto' }}>
                                  <SelectValue placeholder="Select Option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={field.type}
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleInputChange}
                                required={field.required}
                                placeholder={`Enter ${field.label}`}
                                style={{
                                  padding: '12px 14px', borderRadius: 12, border: '1.5px solid #cbd5e1',
                                  fontSize: 14, color: '#0f172a', fontWeight: 600
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Step 2: Upload Documents (Executive UI) */}
                {formStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Document Upload Status Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                      borderRadius: 18, padding: '24px 28px',
                      border: '1.5px solid #bfdbfe',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.05)',
                      display: 'flex', flexDirection: 'column', gap: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileCheck size={20} color="#2563eb" /> Mandatory Document Verification Checklist
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                            Upload high-resolution scans or photos of all required documents to prevent application rejection.
                          </p>
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 900,
                          color: progressPercent === 100 ? '#16a34a' : '#2563eb',
                          background: progressPercent === 100 ? '#dcfce7' : '#dbeafe',
                          padding: '6px 14px', borderRadius: 20
                        }}>
                          {uploadedRequiredCount} / {requiredDocs.length} Mandatory Files Uploaded ({progressPercent}%)
                        </span>
                      </div>

                      <div style={{ width: '100%', height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                          width: `${progressPercent}%`, height: '100%',
                          background: progressPercent === 100 ? 'linear-gradient(90deg, #16a34a, #10b981)' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                          borderRadius: 5, transition: 'width 0.3s ease'
                        }} />
                      </div>

                      {progressPercent === 100 ? (
                        <div style={{ fontSize: 13, color: '#15803d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <CheckCircle2 size={16} /> All mandatory documents uploaded and verified! You can proceed to the final review step.
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                          💡 Drag and drop your document files directly onto each card below, or click <strong>Browse Files</strong>.
                        </div>
                      )}
                    </div>

                    {/* Upload Cards Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {config.documents.map(doc => (
                        <UploadCard
                          key={doc.id}
                          doc={doc}
                          isUploaded={!!uploadedDocs[doc.id]}
                          isUploading={uploadingDocs[doc.id]}
                          uploadErr={uploadErrors[doc.id]}
                          fileInfo={uploadedDocs[doc.id]}
                          dragOver={dragOverDoc === doc.id}
                          onDragOver={(e) => { e.preventDefault(); setDragOverDoc(doc.id); }}
                          onDragLeave={() => setDragOverDoc(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverDoc(null);
                            processFileUpload(doc.id, e.dataTransfer.files[0]);
                          }}
                          onUpload={(file) => processFileUpload(doc.id, file)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Review Application */}
                {formStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={22} color="#16a34a" />
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                        Review Application Information
                      </h3>
                    </div>

                    <div style={{
                      background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0',
                      padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16
                    }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Service Name</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{config.label}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Applicant Name</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{formData.applicantName}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Aadhaar Number</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>{formData.aadhaarNumber}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Contact Number</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{formData.phoneNumber}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Email Address</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{formData.email}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Department</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{config.department}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Attached Documents</span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          ✓ {Object.keys(uploadedDocs).length} files attached ({Object.keys(uploadedDocs).join(', ')})
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Submit Confirmation */}
                {formStep === 4 && (
                  <div style={{ textAlign: 'center', padding: '32px 16px', maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                      📨
                    </div>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                      Ready to Submit Official Application
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                      By clicking submit, your application and attached documents will be registered in the Governance Command Center and assigned to an officer for SLA verification.
                    </p>
                  </div>
                )}

              </div>

              {/* Form Navigation Footer */}
              <div style={{
                padding: '20px 36px', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
              }}>
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(formStep - 1)}
                    style={{
                      padding: '12px 22px', borderRadius: 12, background: '#ffffff',
                      border: '1.5px solid #cbd5e1', color: '#334155', fontSize: 14,
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ← Back to Previous Step
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                  {formStep < 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 1 && !isDetailsValid()) {
                          toast.error('Please fill all required fields before continuing.');
                          return;
                        }
                        if (formStep === 2 && uploadedRequiredCount < requiredDocs.length) {
                          toast.error('Please upload all required documents before continuing.');
                          return;
                        }
                        setFormStep(formStep + 1);
                      }}
                      style={{
                        padding: '12px 28px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff', border: 'none', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                      }}
                    >
                      Continue →
                    </button>
                  )}

                  {formStep === 4 && (
                    <button
                      type="submit"
                      disabled={isLoading || !isFormValid()}
                      style={{
                        padding: '14px 32px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff', border: 'none', fontSize: 15, fontWeight: 800,
                        cursor: isLoading || !isFormValid() ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !isFormValid() ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 6px 16px rgba(16,185,129,0.3)'
                      }}
                    >
                      {isLoading ? 'Submitting Official Application...' : '✓ Submit Application Now'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

export default ServiceApplicationForm;
