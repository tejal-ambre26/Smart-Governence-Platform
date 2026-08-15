import { useState } from 'react';
import { Star, CheckCircle, Send } from 'lucide-react';
import api from '../api.js';
import keycloak from '../keycloak.js';

/**
 * Reusable 5-star rating widget.
 * Props:
 *   value        (number) — controlled value (0 = none selected)
 *   onChange     (fn)     — callback(newRating: number)
 *   readOnly     (bool)   — display-only mode
 *   size         (number) — pixel size of each star (default 24)
 *   label        (string) — optional label above the stars
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = 24, label }) {
  const [hovered, setHovered] = useState(0);

  const active = hovered || value;

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</span>
      )}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange && onChange(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: readOnly ? 'default' : 'pointer',
              padding: 2,
              lineHeight: 0,
              transform: !readOnly && (hovered === star) ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              fill={star <= active ? '#f59e0b' : 'transparent'}
              color={star <= active ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {!readOnly && active > 0 && (
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: active >= 4 ? '#16a34a' : active >= 3 ? '#d97706' : '#ef4444',
          minHeight: 16,
        }}>
          {labels[active]}
        </span>
      )}
    </div>
  );
}

/**
 * Reusable Citizen Feedback Card widget for completed items
 */
export function FeedbackCard({ referenceType, referenceId, title = "Rate your experience" }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const citizenId = keycloak.tokenParsed?.sub || 'citizen-user';

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await api.post('/api/reports/feedback', {
        citizenId,
        referenceType,
        referenceId,
        rating,
        comments: comments.trim() || null
      });
      setSubmitted(true);
    } catch (err) {
      // Fallback try reporting-service prefix if main route fails
      try {
        await api.post('/reporting-service/api/reports/feedback', {
          citizenId,
          referenceType,
          referenceId,
          rating,
          comments: comments.trim() || null
        });
        setSubmitted(true);
      } catch (e) {
        console.error("Failed to submit feedback:", e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        color: '#15803d', fontSize: 13, fontWeight: 600
      }}>
        <CheckCircle size={18} />
        Thank you for your feedback! Your rating has been recorded.
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px 20px', background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>
        {title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <StarRating value={rating} onChange={setRating} size={22} />
      </div>
      {rating > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Additional comments (optional)..."
            value={comments}
            onChange={e => setComments(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
              fontSize: 12, outline: 'none'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <Send size={12} />
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
}
