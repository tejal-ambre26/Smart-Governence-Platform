import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FileText, Search, CheckCircle2, Award, FolderOpen } from 'lucide-react';

function getIconComponent(icon) {
  if (typeof icon === 'string') {
    const lower = icon.toLowerCase();
    if (lower.includes('inbox')) return <Inbox size={32} />;
    if (lower.includes('file') || lower.includes('doc')) return <FileText size={32} />;
    if (lower.includes('search')) return <Search size={32} />;
    if (lower.includes('check')) return <CheckCircle2 size={32} />;
    if (lower.includes('award') || lower.includes('cert')) return <Award size={32} />;
    return <FolderOpen size={32} />;
  }
  if (React.isValidElement(icon)) return icon;
  return <FolderOpen size={32} />;
}

function EmptyState({ icon = 'inbox', title = 'No Data Found', message, actionLabel, actionTo, onAction }) {
  const IconComponent = getIconComponent(icon);

  return (
    <div style={{
      background: '#ffffff', borderRadius: 20, border: '1.5px solid #e2e8f0',
      padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
      margin: '12px 0'
    }}>
      {/* Icon Badge Container */}
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
        border: '1.5px solid #bfdbfe', color: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(37,99,235,0.1)'
      }}>
        {IconComponent}
      </div>

      {/* Title */}
      {title && (
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      )}

      {/* Message */}
      {message && (
        <p style={{ margin: '0 auto', color: '#64748b', fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>
          {message}
        </p>
      )}

      {/* Optional Action Button */}
      {actionLabel && (
        <div style={{ marginTop: 20 }}>
          {actionTo ? (
            <Link to={actionTo} style={{ textDecoration: 'none' }}>
              <button type="button" style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                border: 'none', padding: '10px 22px', borderRadius: 12, fontWeight: 800, fontSize: 13,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
                {actionLabel}
              </button>
            </Link>
          ) : (
            <button type="button" onClick={onAction} style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
              border: 'none', padding: '10px 22px', borderRadius: 12, fontWeight: 800, fontSize: 13,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
