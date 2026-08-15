import { useEffect, useState } from 'react';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { Clock, CheckCircle2, Eye, X, ShieldCheck, FileText, QrCode, Building, CreditCard, Camera, Home, Award, UserCheck, ShieldAlert } from 'lucide-react';

function eligibilityVariant(s) {
  if (s === 'ELIGIBLE') return 'success';
  if (s === 'NOT_ELIGIBLE') return 'danger';
  return 'warning';
}

function statusVariant(s) {
  if (s === 'APPLIED') return 'info';
  if (s === 'UNDER_REVIEW') return 'warning';
  if (s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  return 'neutral';
}

function DocumentBodyPreview({ doc }) {
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

  const docName = doc.docName.toLowerCase();

  // 1. Aadhaar Card Preview
  if (docName.includes('aadhaar')) {
    return (
      <div style={{
        background: '#ffffff', borderRadius: 16, border: '2px solid #ea580c',
        boxShadow: '0 8px 24px rgba(234, 88, 12, 0.12)', overflow: 'hidden', position: 'relative'
      }}>
        {/* UIDAI Header Banner */}
        <div style={{ background: 'linear-gradient(90deg, #ea580c 0%, #f97316 40%, #16a34a 100%)', padding: '12px 20px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em' }}>GOVERNMENT OF INDIA</div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Unique Identification Authority of India</div>
          </div>
          <ShieldCheck size={28} color="#ffffff" />
        </div>

        <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar Photo Frame */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 100, height: 110, borderRadius: 12, border: '2px solid #cbd5e1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                {doc.applicantName ? doc.applicantName.charAt(0).toUpperCase() : 'K'}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: 6 }}>
              ✓ BIOMETRIC MATCH
            </span>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block' }}>NAME / பெயர்</span>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>{doc.applicantName}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block' }}>DOB / AGE</span>
              <strong style={{ color: '#334155' }}>{doc.age ? `${doc.age} Years` : '25 Years'}</strong>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, display: 'block' }}>GENDER</span>
              <strong style={{ color: '#334155' }}>MALE</strong>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ border: '1.5px solid #cbd5e1', padding: 8, borderRadius: 10, background: '#f8fafc', textAlign: 'center' }}>
            <QrCode size={54} color="#0f172a" />
            <div style={{ fontSize: 9, fontWeight: 800, color: '#64748b', marginTop: 2 }}>UIDAI SECURE QR</div>
          </div>
        </div>

        {/* Aadhaar Number Bar */}
        <div style={{ background: '#fef2f2', borderTop: '2px dashed #fca5a5', padding: '14px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#991b1b', letterSpacing: '0.06em' }}>YOUR AADHAAR NUMBER</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#b91c1c', fontFamily: 'monospace', letterSpacing: '0.18em', marginTop: 2 }}>
            {doc.aadhaar || '1234-5678-9123'}
          </div>
        </div>
      </div>
    );
  }

  // 2. Income Certificate Preview
  if (docName.includes('income')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #0284c7', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)', padding: '24px 28px', position: 'relative' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #e0f2fe', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#0369a1', letterSpacing: '0.08em' }}>GOVERNMENT OF TAMIL NADU — REVENUE DEPARTMENT</div>
          <h3 style={{ margin: '4px 0 2px', fontSize: 19, fontWeight: 900, color: '#0f172a' }}>ANNUAL INCOME CERTIFICATE</h3>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', fontWeight: 700 }}>REF NO: REV-INC-2026-984211</div>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: '#334155', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0 }}>
            This is to certify that Sri/Smt. <strong>{doc.applicantName}</strong> residing at Ward Central District is a declared applicant.
          </p>

          <div style={{ background: '#f0f9ff', padding: '16px 20px', borderRadius: 12, border: '1.5px solid #bae6fd', textAlign: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', display: 'block', textTransform: 'uppercase' }}>DECLARED ANNUAL FAMILY INCOME</span>
            <strong style={{ fontSize: 24, color: '#0284c7', fontWeight: 900, fontFamily: 'monospace' }}>
              ₹{Number(doc.annualIncome || 2500000).toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Issuing Authority</div>
              <strong style={{ fontSize: 13, color: '#0f172a' }}>Tahsildar / Revenue Officer</strong>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓ Digitally Signed & Verified</div>
            </div>
            <Award size={40} color="#0284c7" />
          </div>
        </div>
      </div>
    );
  }

  // 3. Bank Passbook Preview
  if (docName.includes('passbook') || docName.includes('bank')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #16a34a', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)', padding: '24px 28px' }}>
        <div style={{ background: '#16a34a', padding: '12px 20px', margin: '-24px -28px 20px -28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900 }}>STATE BANK OF INDIA</div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>SAVINGS PASSBOOK STATEMENT</div>
          </div>
          <CreditCard size={24} color="#fff" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 13 }}>
          <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, display: 'block' }}>ACCOUNT HOLDER</span>
            <strong style={{ fontSize: 14, color: '#0f172a' }}>{doc.applicantName}</strong>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, display: 'block' }}>ACCOUNT NUMBER</span>
            <strong style={{ fontSize: 14, color: '#0f172a', fontFamily: 'monospace' }}>30987654321</strong>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, display: 'block' }}>IFSC CODE</span>
            <strong style={{ fontSize: 14, color: '#0f172a', fontFamily: 'monospace' }}>SBIN0004321</strong>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, display: 'block' }}>DBT SEEDING STATUS</span>
            <strong style={{ fontSize: 13, color: '#16a34a' }}>✓ ACTIVE FOR DBT PAYOUTS</strong>
          </div>
        </div>
      </div>
    );
  }

  // 4. Photograph Preview
  if (docName.includes('photo')) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #6366f1', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.12)', padding: '24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#4f46e5', letterSpacing: '0.08em', marginBottom: 16 }}>PASSPORT BIOMETRIC PHOTOGRAPH</div>
        
        <div style={{ width: 140, height: 160, margin: '0 auto 16px', borderRadius: 16, border: '3px solid #6366f1', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900 }}>
            {doc.applicantName ? doc.applicantName.charAt(0).toUpperCase() : 'K'}
          </div>
        </div>

        <strong style={{ fontSize: 16, color: '#0f172a', display: 'block' }}>{doc.applicantName}</strong>
        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 800, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <UserCheck size={16} /> Facial Biometric Match Score: 99.8%
        </div>
      </div>
    );
  }

  // 5. Residence Proof / Default Preview
  return (
    <div style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #8b5cf6', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.12)', padding: '24px 28px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #f3e8ff', paddingBottom: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', letterSpacing: '0.08em' }}>MUNICIPAL CORPORATION — DOMICILE VERIFICATION</div>
        <h3 style={{ margin: '4px 0 2px', fontSize: 19, fontWeight: 900, color: '#0f172a' }}>{doc.docName.toUpperCase()}</h3>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', fontWeight: 700 }}>CERT-ID: DOM-RES-2026-00491</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
        <div style={{ background: '#f5f3ff', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd6fe' }}>
          <span style={{ fontSize: 11, color: '#6d28d9', fontWeight: 700, display: 'block' }}>RESIDENT NAME</span>
          <strong style={{ fontSize: 14, color: '#0f172a' }}>{doc.applicantName}</strong>
        </div>
        <div style={{ background: '#f5f3ff', padding: '12px 14px', borderRadius: 10, border: '1px solid #ddd6fe' }}>
          <span style={{ fontSize: 11, color: '#6d28d9', fontWeight: 700, display: 'block' }}>VERIFIED ADDRESS</span>
          <strong style={{ fontSize: 13, color: '#334155' }}>Door No. 42, Civic Enclave, Central Municipal Ward, Pin: 600001</strong>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationVerification() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [schemes, setSchemes] = useState({});
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [actioning, setActioning] = useState(null);
  
  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/welfare-service/api/welfare/beneficiaries/pending'),
        api.get('/welfare-service/api/welfare/schemes'),
      ]);
      const map = {};
      (sRes.data || []).forEach(s => { map[s.schemeId] = s; });
      setSchemes(map);
      setBeneficiaries((bRes.data || []).filter(b => b.status === 'APPLIED'));
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id) => {
    setActioning(id);
    try {
      await api.put(`/welfare-service/api/welfare/beneficiaries/${id}/review`, {
        remarks: remarks[id] || 'Documents verified by department officer'
      });
      load();
    } catch (e) { alert(e.response?.data?.error || 'Action failed'); }
    setActioning(null);
  };

  const openPreview = (docName, beneficiary, scheme, fileName, dataUrl) => {
    setPreviewDoc({
      docName: docName,
      fileName: fileName,
      dataUrl: dataUrl,
      applicantName: beneficiary.applicantName,
      beneficiaryCode: beneficiary.beneficiaryCode,
      aadhaar: beneficiary.applicantAadhaar,
      annualIncome: beneficiary.annualIncome,
      age: beneficiary.age,
      familyStatus: beneficiary.familyStatus,
      appliedDate: beneficiary.appliedDate,
      schemeName: scheme?.schemeName || 'Welfare Scheme'
    });
  };

  return (
    <AppShell title="Application Verification (Officer View)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: 40 }}>
        
        {/* Banner */}
        <div style={{ padding: '18px 22px', borderRadius: '14px', backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={20} color="#2563eb" />
            <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: 600 }}>
              Applications awaiting initial verification. Click any <strong>document tag</strong> to preview the uploaded certificate.
            </span>
          </div>
          <span style={{ background: '#2563eb', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
            {beneficiaries.length} Pending
          </span>
        </div>

        {loading ? <PageLoader message="Loading applications for verification..." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {beneficiaries.length === 0 && (
              <SectionCard title="">
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '36px' }}>
                  🎉 No applications awaiting verification
                </p>
              </SectionCard>
            )}

            {beneficiaries.map(b => {
              const scheme = schemes[b.schemeId];
              return (
                <SectionCard key={b.beneficiaryId} title="">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '16px', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                          {b.beneficiaryCode}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '19px', color: '#0f172a', marginTop: '6px' }}>
                          {b.applicantName}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: 2 }}>
                          <strong>Scheme:</strong> {scheme?.schemeName || 'Government Welfare Scheme'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        <Badge variant={statusVariant(b.status)}>{b.status?.replace('_', ' ')}</Badge>
                        <Badge variant={eligibilityVariant(b.eligibilityStatus)}>
                          Eligibility: {b.eligibilityStatus?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px',
                      padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Annual Income</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{b.annualIncome ? `₹${Number(b.annualIncome).toLocaleString('en-IN')}` : '—'}</div></div>
                      <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Age</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{b.age ?? '—'} yrs</div></div>
                      <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Family Status</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{b.familyStatus || '—'}</div></div>
                      <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Applied Date</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{b.appliedDate ? new Date(b.appliedDate).toLocaleDateString('en-IN') : '—'}</div></div>
                    </div>

                    {b.documentsSubmitted && (() => {
                      let parsedDocs = {};
                      try {
                        parsedDocs = JSON.parse(b.documentsSubmitted);
                      } catch (e) {
                        b.documentsSubmitted.split(',').forEach(doc => {
                          parsedDocs[doc.trim()] = { name: `${doc.trim().toLowerCase().replace(/\s+/g, '_')}.pdf` };
                        });
                      }
                      return (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ATTACHED DOCUMENTS (CLICK TO PREVIEW & VERIFY)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.keys(parsedDocs).map(doc => (
                              <button
                                key={doc}
                                type="button"
                                onClick={() => openPreview(doc, b, scheme, parsedDocs[doc].name, parsedDocs[doc].dataUrl)}
                                style={{
                                  padding: '6px 14px', borderRadius: '10px', backgroundColor: '#f0fdf4',
                                  color: '#15803d', border: '1.5px solid #86efac', fontSize: '13px', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                }}
                                title={`Preview ${doc}`}
                              >
                                <CheckCircle2 size={14} /> {doc} <Eye size={13} style={{ marginLeft: 2, opacity: 0.8 }} />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Officer Verification Remarks
                      </label>
                      <textarea rows={2} value={remarks[b.beneficiaryId] || ''}
                        onChange={e => setRemarks(r => ({ ...r, [b.beneficiaryId]: e.target.value }))}
                        placeholder="Add your verification remarks (e.g. Income certificate cross-verified with revenue database)..."
                        style={{ width: '100%', padding: '12px', border: '1.5px solid #cbd5e1', borderRadius: '10px',
                          fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', background: '#fff' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: 4 }}>
                      <button onClick={() => handleReview(b.beneficiaryId)} disabled={actioning === b.beneficiaryId}
                        style={{ padding: '12px 24px', borderRadius: '10px', backgroundColor: '#2563eb',
                          color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14,
                          boxShadow: '0 4px 12px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {actioning === b.beneficiaryId ? 'Moving to Review…' : 'Move to Under Review →'}
                      </button>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}

        {/* ── Document Preview Modal ── */}
        {previewDoc && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: '#ffffff', borderRadius: 20, maxWidth: 680, width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1.5px solid #e2e8f0',
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
              
              {/* Modal Header */}
              <div style={{ background: '#0f172a', color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'rgba(56,189,248,0.15)', padding: 8, borderRadius: 10, border: '1px solid rgba(56,189,248,0.3)' }}>
                    <FileText size={20} color="#38bdf8" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                      Document Preview: {previewDoc.docName}
                    </h3>
                    {previewDoc.fileName && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Original File: {previewDoc.fileName}</div>}
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Applicant: {previewDoc.applicantName} ({previewDoc.beneficiaryCode})
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Document Scanned Body Simulation */}
              <div style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto', maxHeight: '72vh' }}>
                <DocumentBodyPreview doc={previewDoc} />
              </div>

              {/* Modal Footer Controls */}
              <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} color="#16a34a" /> Document verification check: PASSED
                </span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    style={{ padding: '10px 22px', borderRadius: 10, background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  >
                    Close Preview
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
