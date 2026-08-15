import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { toast } from 'sonner';
import { FileUp, Info, MapPin, Building2, AlertTriangle, PenSquare, ArrowLeft, Image as ImageIcon, FileText, X } from 'lucide-react';

const DEPARTMENTS = ['Health Department', 'Water Department', 'Roads Department', 'Electricity Department', 'Sanitation Department', 'Revenue Department', 'Municipal Corporation', 'Urban Planning Department'];
const CATEGORIES = [
  'Water Leakage', 'Water Shortage', 'No Water Supply', 'Water Tanker Request',
  'Pothole', 'Road Damage', 'Traffic Signal Issue', 'Encroachment',
  'Power Outage', 'Street Light Issue', 'Electricity Billing', 
  'Garbage Not Collected', 'Drain Blocked', 'Public Hygiene',
  'Mosquito Breeding', 'Stray Animals', 'Other'
];

function ComplaintForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', department: '', category: '', priority: 'LOW', location: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const processFiles = (files) => {
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds maximum allowed size of 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            type: file.type,
            dataUrl: reader.result
          }
        ]);
        toast.success(`Attached ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    processFiles(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    processFiles(dropped);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.department || !form.location) {
      toast.error('Please fill in Title, Description, Department, and Location.');
      return;
    }
    setLoading(true);
    try {
      const firstAttachment = attachments[0]?.dataUrl || '';
      await api.post('/grievance-service/api/complaints', {
        ...form,
        attachmentUrl: firstAttachment,
        citizenId: keycloak.tokenParsed?.sub,
      });
      window.dispatchEvent(new Event('refresh-notifications'));
      toast.success('Complaint submitted successfully!');
      navigate('/complaints');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existingApplication) {
        setDuplicateData(err.response.data.existingApplication);
        toast.error('Duplicate application detected.');
      } else if (err.response?.data?.fieldErrors) {
        Object.entries(err.response.data.fieldErrors).forEach(([field, msg]) => {
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error(err.response?.data?.message || 'Submission failed. Make sure your citizen profile is registered.');
      }
      setLoading(false);
    }
  };

  if (duplicateData) {
    return (
      <AppShell title="Raise Complaint">
        <div style={{ maxWidth: 600, margin: '40px auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
          <div style={{ background: '#fef2f2', padding: '24px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ef4444', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#991b1b' }}>Duplicate Complaint Detected</h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#b91c1c' }}>You already have an active complaint for this issue.</p>
            </div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Complaint ID</span>
              <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{duplicateData.complaintId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Status</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{duplicateData.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
              <span style={{ color: '#64748b', fontSize: 14 }}>Department</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{duplicateData.department}</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button 
                onClick={() => setDuplicateData(null)}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Go Back
              </button>
              <button 
                onClick={() => navigate('/complaints')}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Track Existing Complaint
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Raise Complaint">
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px 100px 24px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* ── Welcome Banner (Executive Navy/Emerald Theme matching Civic Services) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #065f46 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#ffffff',
          display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 36px rgba(15,23,42,0.25)', border: '1px solid #334155',
          marginBottom: 30, position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ 
              background: 'rgba(255,255,255,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)',
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', display: 'inline-block', marginBottom: 8
            }}>
              GRIEVANCE REDRESSAL
            </span>
            <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Raise a Complaint
            </h2>
            <p style={{ margin: 0, color: '#94a3b8', maxWidth: 600, fontSize: 14, lineHeight: 1.5 }}>
              Report a civic issue directly to the municipal corporation. Provide accurate details and attach photos for faster resolution by the field officers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
            
            {/* Issue Details Card */}
            <div style={{ background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)', background: 'var(--bg, #f8fafc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenSquare size={20} color="var(--text, #0f172a)" />
                <h3 style={{ margin: 0, color: 'var(--text, #0f172a)', fontSize: '16px', fontWeight: '700' }}>Issue Details</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Complaint Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    value={form.title} 
                    onChange={e => setField('title', e.target.value)} 
                    placeholder="e.g., Unresolved water leakage on Main Street" 
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Detailed Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setField('description', e.target.value)} 
                    placeholder="Please describe the exact issue, how long it has been occurring, and any other relevant information that will assist the field officer..." 
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', minHeight: 140, resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Classification Card */}
            <div style={{ background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)', background: 'var(--bg, #f8fafc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="var(--text, #0f172a)" />
                <h3 style={{ margin: 0, color: 'var(--text, #0f172a)', fontSize: '16px', fontWeight: '700' }}>Classification</h3>
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Target Department <span style={{ color: '#ef4444' }}>*</span></label>
                  <select 
                    value={form.department} 
                    onChange={e => setField('department', e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)', appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                    required
                  >
                    <option value="" disabled>Select Department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Issue Category</label>
                  <select 
                    value={form.category} 
                    onChange={e => setField('category', e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)', appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                  >
                    <option value="" disabled>Select Category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Media Attachments Card */}
            <div style={{ background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)', background: 'var(--bg, #f8fafc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileUp size={20} color="var(--text, #0f172a)" />
                <h3 style={{ margin: 0, color: 'var(--text, #0f172a)', fontSize: '16px', fontWeight: '700' }}>Attachments</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  type="file"
                  id="complaint-file-input"
                  accept="image/svg+xml,image/png,image/jpeg,image/jpg,application/pdf"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div 
                  onClick={() => document.getElementById('complaint-file-input').click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{ 
                    border: isDragging ? '2px dashed #ef4444' : '2px dashed var(--border, #cbd5e1)', 
                    borderRadius: 14, padding: '36px 20px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    background: isDragging ? 'rgba(239,68,68,0.05)' : 'var(--bg, #f8fafc)', 
                    cursor: 'pointer', transition: 'all 0.2s ease' 
                  }} 
                >
                  <FileUp size={36} color="var(--text-secondary, #94a3b8)" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)' }}>Click to upload or drag and drop</p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>SVG, PNG, JPG or PDF (max. 5MB per file)</p>
                </div>

                {/* Selected File Previews */}
                {attachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Uploaded Attachments ({attachments.length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                      {attachments.map((att, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: '10px 14px', background: 'var(--bg, #f8fafc)', borderRadius: 12, border: '1px solid var(--border, #e2e8f0)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            {att.type.startsWith('image/') ? (
                              <img src={att.dataUrl} alt={att.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FileText size={20} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{att.size}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, borderRadius: 6 }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 1' }}>
            
            {/* Location & Priority Card */}
            <div style={{ background: 'var(--surface, #ffffff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)', boxShadow: '0 2px 8px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border, #e2e8f0)', background: 'var(--bg, #f8fafc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={20} color="var(--text, #0f172a)" />
                <h3 style={{ margin: 0, color: 'var(--text, #0f172a)', fontSize: '16px', fontWeight: '700' }}>Location & Impact</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Exact Location <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea 
                    value={form.location} 
                    onChange={e => setField('location', e.target.value)} 
                    placeholder="E.g., Near City Mall, Ward 12..." 
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', minHeight: 80, resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)' }}>Priority Level</label>
                  <select 
                    value={form.priority} 
                    onChange={e => setField('priority', e.target.value)}
                    style={{ padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border, #e2e8f0)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', background: 'var(--surface, #ffffff)', color: 'var(--text, #0f172a)', appearance: 'none', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#ef4444'}
                    onBlur={e => e.target.style.borderColor = 'var(--border, #e2e8f0)'}
                  >
                    <option value="LOW">Low (No immediate danger)</option>
                    <option value="MEDIUM">Medium (Urgent)</option>
                    <option value="HIGH">High (Safety Risk)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Information Cards */}
            <div style={{ background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe', overflow: 'hidden' }}>
              <div style={{ padding: '20px', display: 'flex', gap: 12 }}>
                <Info size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>SLA Guidelines</h4>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                    <li><strong style={{ color: '#dc2626' }}>High:</strong> Resolved within 24 hours</li>
                    <li><strong style={{ color: '#d97706' }}>Medium:</strong> Resolved within 48 hours</li>
                    <li><strong style={{ color: '#16a34a' }}>Low:</strong> Resolved within 72 hours</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Bottom Action Bar */}
          <div style={{ 
            position: 'sticky', bottom: 16, 
            background: '#ffffff', borderRadius: 16,
            border: '1.5px solid #cbd5e1', padding: '16px 24px',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 30,
            marginTop: 20
          }}>
            <button 
              type="button" 
              onClick={() => navigate('/complaints')}
              style={{
                background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '12px 24px',
                borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              <ArrowLeft size={16} /> Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px',
                borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertTriangle size={16} /> {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default ComplaintForm;
