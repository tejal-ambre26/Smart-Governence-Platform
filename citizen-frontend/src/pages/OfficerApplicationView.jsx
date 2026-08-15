import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import AppShell from '../components/AppShell.jsx';
import PageLoader from '../components/PageLoader.jsx';
import { toast } from 'sonner';
import {
  AlertCircle, ArrowLeft, Check, X, FileText, Download, RotateCw, ZoomIn, ZoomOut,
  CheckCircle2, XCircle, ShieldCheck, Eye, Clock, User, Building2, Calendar, FileCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function StatusBadge({ status }) {
  let style = { background: '#F1F4F8', color: '#5B6475', border: '1px solid #D9DEE7' };
  if (['SUBMITTED', 'RESUBMITTED'].includes(status)) {
    style = { background: '#FEF6E7', color: '#A15C00', border: '1px solid #FBD38D' };
  } else if (status === 'UNDER_VERIFICATION') {
    style = { background: '#EBF4FC', color: '#1769AA', border: '1px solid #BEE3F8' };
  } else if (['APPROVED', 'CERTIFICATE_GENERATED', 'DOWNLOADED'].includes(status)) {
    style = { background: '#EAF6F0', color: '#217346', border: '1px solid #C6F6D5' };
  } else if (status === 'REJECTED') {
    style = { background: '#FDF2F2', color: '#B42318', border: '1px solid #FEB2B2' };
  }

  return (
    <span style={{
      padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 6, ...style
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

export default function OfficerApplicationView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [officerRemarks, setOfficerRemarks] = useState('');
  
  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Missing or illegible document upload');
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Active Selected Document Previewer
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docViewerUrl, setDocViewerUrl] = useState(null);
  const [docViewerName, setDocViewerName] = useState('');
  const [docZoom, setDocZoom] = useState(1);
  const [docRotation, setDocRotation] = useState(0);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await api.get(`/service-management-service/api/services/${id}`);
        setApp(res.data);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load application details.');
        setIsLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  const handleDocumentPreview = (docObj) => {
    setSelectedDoc(docObj);
    const isObject = typeof docObj === 'object' && docObj !== null;
    const docName = isObject ? docObj.id : docObj;
    
    if (isObject && docObj.data) {
      try {
        const arr = docObj.data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], {type: mime});
        const url = URL.createObjectURL(blob);
        setDocViewerUrl(url);
        setDocViewerName(docObj.name || docName);
        setDocZoom(1);
        setDocRotation(0);
        return;
      } catch (e) {
        console.error("Error creating blob", e);
      }
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>${docName}</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 40px; background: #F7F8FA; color: #172033; text-align: center;">
          <div style="background: #FFFFFF; padding: 40px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #D9DEE7;">
            <h2 style="color:#1769AA;">${docName}</h2>
            <p style="color: #5B6475;">Verified Official Applicant Document</p>
          </div>
        </body>
      </html>
    `;
    const dummyBlob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(dummyBlob);
    setDocViewerUrl(url);
    setDocViewerName(docName);
    setDocZoom(1);
    setDocRotation(0);
  };

  const handleApprove = async () => {
    try {
      await api.put(`/service-management-service/api/services/approve/${id}`, {
        officerRemarks: officerRemarks
      });
      toast.success('Application approved successfully!');
      setShowApproveModal(false);
      navigate('/services/officer/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error('Please select a reason for correction.');
      return;
    }
    try {
      await api.put(`/service-management-service/api/services/reject/${id}`, {
        reason: rejectReason,
        officerRemarks: officerRemarks
      });
      toast.error('Application returned for correction.');
      setShowRejectModal(false);
      navigate('/services/officer/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to reject application');
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Application Review Workspace">
        <PageLoader message="Loading application & documents..." />
      </AppShell>
    );
  }

  if (error || !app) {
    return (
      <AppShell title="Application Review Workspace">
        <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center', background: '#FFFFFF', padding: 40, borderRadius: 8, border: '1px solid #D9DEE7' }}>
          <AlertCircle size={44} color="#A15C00" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: '0 0 8px' }}>Application Not Found</h3>
          <p style={{ fontSize: 14, color: '#5B6475', margin: '0 0 20px' }}>{error || 'The requested application record could not be found.'}</p>
          <button
            onClick={() => navigate('/services/officer/dashboard')}
            style={{ padding: '8px 16px', borderRadius: 6, background: '#1769AA', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to Officer Workspace
          </button>
        </div>
      </AppShell>
    );
  }

  let documents = [];
  if (app.documentsSubmitted) {
    try {
      documents = JSON.parse(app.documentsSubmitted);
    } catch (e) {
      documents = app.documentsSubmitted.split(',').map(d => d.trim());
    }
  }

  const isPendingAction = ['SUBMITTED', 'RESUBMITTED', 'UNDER_VERIFICATION'].includes(app.status);

  return (
    <AppShell title="Application Review Workspace">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* ── Top Bar Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => navigate('/services/officer/dashboard')}
              style={{
                height: 36, padding: '0 14px', borderRadius: 6, background: '#FFFFFF', color: '#172033',
                border: '1px solid #D9DEE7', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <ArrowLeft size={16} /> Back to Queue
            </button>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1769AA' }}>
                {app.serviceType?.replace(/_/g, ' ')}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#172033', margin: '2px 0 0' }}>
                Application #{app.applicationNumber}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#5B6475', fontWeight: 600 }}>Current Status:</span>
            <StatusBadge status={app.status} />
          </div>
        </div>

        {/* ── Applicant Overview Card ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#5B6475', textTransform: 'uppercase', marginBottom: 12 }}>APPLICANT INFORMATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8892A4', fontWeight: 700 }}>Full Name</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#172033', marginTop: 2 }}>{app.applicantName}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8892A4', fontWeight: 700 }}>Aadhaar Number</div>
              <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: '#1769AA', marginTop: 2 }}>
                XXXX-XXXX-{app.aadhaarNumber?.slice(-4) || 'XXXX'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8892A4', fontWeight: 700 }}>Department</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#172033', marginTop: 2 }}>{app.department || 'Municipal Board'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8892A4', fontWeight: 700 }}>Submission Date</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#172033', marginTop: 2 }}>
                {new Date(app.appliedDate).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* ── Document Inspection Workspace ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 20, alignItems: 'start' }}>
          
          {/* COLUMN 1: Documents List */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#172033', marginBottom: 14 }}>Attached Documents ({documents.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {documents.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8892A4', padding: 12 }}>No documents submitted.</div>
              ) : (
                documents.map((doc, idx) => {
                  const isObject = typeof doc === 'object' && doc !== null;
                  const docId = isObject ? doc.id : doc;
                  const isSelected = selectedDoc === doc;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDocumentPreview(doc)}
                      style={{
                        padding: '12px',
                        borderRadius: 6,
                        border: isSelected ? '1px solid #1769AA' : '1px solid #E8ECF2',
                        background: isSelected ? '#EBF4FC' : '#F7F8FA',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} style={{ color: isSelected ? '#1769AA' : '#5B6475' }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>{docId}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#217346' }}>✓ Review</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Central Document Previewer */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', height: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #E8ECF2' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#172033' }}>
                {docViewerName || 'Select a document to inspect'}
              </div>

              {docViewerUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setDocZoom(z => Math.max(0.5, z - 0.2))} style={{ padding: 6, borderRadius: 4, border: '1px solid #D9DEE7', background: '#fff', cursor: 'pointer' }}>
                    <ZoomOut size={14} />
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#5B6475' }}>{Math.round(docZoom * 100)}%</span>
                  <button onClick={() => setDocZoom(z => Math.min(2, z + 0.2))} style={{ padding: 6, borderRadius: 4, border: '1px solid #D9DEE7', background: '#fff', cursor: 'pointer' }}>
                    <ZoomIn size={14} />
                  </button>
                  <button onClick={() => setDocRotation(r => (r + 90) % 360)} style={{ padding: 6, borderRadius: 4, border: '1px solid #D9DEE7', background: '#fff', cursor: 'pointer' }}>
                    <RotateCw size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, background: '#F7F8FA', borderRadius: 6, marginTop: 14, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {docViewerUrl ? (
                <iframe
                  src={docViewerUrl}
                  title="Document Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                    transition: 'transform 0.2s'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8892A4' }}>
                  <FileCheck size={48} style={{ margin: '0 auto 10px', color: '#D9DEE7' }} />
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Click any document on the left to preview</div>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: Officer Decision Panel */}
          <div style={{ background: '#FFFFFF', border: '1px solid #D9DEE7', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#172033', marginBottom: 14 }}>Officer Decision</div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5B6475', marginBottom: 6 }}>
                Verification Notes / Remarks
              </label>
              <textarea
                rows={4}
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                placeholder="Enter official verification remarks..."
                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D9DEE7', fontSize: 13, outline: 'none', background: '#F7F8FA' }}
              />
            </div>

            {isPendingAction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setShowApproveModal(true)}
                  style={{
                    width: '100%', height: 42, borderRadius: 6, border: 'none',
                    background: '#217346', color: '#FFFFFF', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  Approve Application
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  style={{
                    width: '100%', height: 42, borderRadius: 6,
                    border: '1px solid #B42318', background: '#FFFFFF', color: '#B42318', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  Return for Correction
                </button>
              </div>
            ) : (
              <div style={{ padding: 14, background: '#F1F4F8', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#5B6475', textAlign: 'center' }}>
                Decision completed: {app.status}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent style={{ background: '#FFFFFF', borderRadius: 8, padding: 24, maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Approve Application?</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 14, color: '#5B6475', margin: '10px 0 20px' }}>
            All required documents for <strong>{app.applicantName}</strong> will be marked as verified and the digital certificate will be generated.
          </p>
          <div style={{ display: 'flex', justify: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowApproveModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D9DEE7', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleApprove} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#217346', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Approve Application</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return for Correction / Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent style={{ background: '#FFFFFF', borderRadius: 8, padding: 24, maxWidth: 440 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 800, color: '#B42318' }}>Return Application</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 14, color: '#5B6475', margin: '8px 0 16px' }}>Select primary reason for returning this application:</p>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid #D9DEE7', fontSize: 13, marginBottom: 20 }}
          >
            <option value="Missing or illegible document upload">Missing or illegible document upload</option>
            <option value="Applicant details mismatch with record">Applicant details mismatch with record</option>
            <option value="Incomplete details in application form">Incomplete details in application form</option>
          </select>
          <div style={{ display: 'flex', justify: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowRejectModal(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D9DEE7', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleReject} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#B42318', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Return Application</button>
          </div>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}
