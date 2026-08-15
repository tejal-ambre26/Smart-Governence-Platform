import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import { Bell, CheckCheck, Clock, Heart, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

function getNotifTheme(eventType) {
  const type = (eventType || '').toUpperCase();
  if (type.includes('APPROV') || type.includes('RESOLV')) {
    return {
      icon: CheckCheck,
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0'
    };
  }
  if (type.includes('REJECT')) {
    return {
      icon: AlertCircle,
      iconColor: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca'
    };
  }
  if (type.includes('VERIF')) {
    return {
      icon: Clock,
      iconColor: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a'
    };
  }
  if (type.includes('CREDIT') || type.includes('FUND') || type.includes('WELFARE')) {
    return {
      icon: Heart,
      iconColor: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe'
    };
  }
  return {
    icon: Bell,
    iconColor: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe'
  };
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const navigate = useNavigate();

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isOfficer = roles.includes('OFFICER') || roles.includes('officer');
  const isAdmin = roles.includes('ADMIN') || roles.includes('admin');

  const username = keycloak.tokenParsed?.preferred_username;
  const sub = keycloak.tokenParsed?.sub;

  const recipient = (isOfficer || isAdmin) ? (username || 'admin') : (sub || username || 'admin');

  useEffect(() => {
    if (!recipient) return;
    const fetchNotifs = () => {
      const url = username ? `/notification-service/api/notifications/recipient/${recipient}?username=${username}` : `/notification-service/api/notifications/recipient/${recipient}`;
      api.get(url)
        .then(r => {
          setNotifications(r.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchNotifs();
    const t = setInterval(fetchNotifs, 10000);
    
    const handleForceRefresh = () => setTimeout(fetchNotifs, 500);
    window.addEventListener('refresh-notifications', handleForceRefresh);
    
    return () => {
      clearInterval(t);
      window.removeEventListener('refresh-notifications', handleForceRefresh);
    };
  }, [recipient]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.readStatus).length;

  const markRead = async (id) => {
    try {
      await api.put(`/notification-service/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, readStatus: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.readStatus);
    for (const n of unreadItems) {
      await markRead(n.notificationId);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: '50%',
          border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--surface, #ffffff)',
          cursor: 'pointer', transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg, #f8fafc)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface, #ffffff)'}
      >
        <Bell size={18} color="var(--text-secondary, #475569)" />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, padding: '0 4px',
            borderRadius: 10, background: '#ef4444', color: '#ffffff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #ffffff', boxShadow: '0 2px 4px rgba(239,68,68,0.3)',
            lineHeight: 1
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 10px)',
          width: 380, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--surface, #ffffff)', borderRadius: 20,
          boxShadow: '0 20px 40px -10px rgba(15,23,42,0.25), 0 0 0 1px var(--border, rgba(15,23,42,0.08))',
          overflow: 'hidden', zIndex: 1000
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            padding: '16px 20px', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                Notifications
              </h3>
              {unread > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.22)', color: '#ffffff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                  {unread} new
                </span>
              )}
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
                  padding: '5px 10px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <CheckCheck size={14} color="#ffffff" /> Mark all read
              </button>
            )}
          </div>

          {/* List Feed */}
          <div style={{ maxHeight: 380, overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: 13 }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Sparkles size={32} color="#059669" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>You're all caught up!</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #64748b)' }}>No new notifications right now.</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n, idx) => {
                const theme = getNotifTheme(n.eventType);
                const Icon = theme.icon;
                const isUnread = !n.readStatus;

                return (
                  <div
                    key={n.notificationId}
                    onClick={() => {
                      if (!n.readStatus) markRead(n.notificationId);
                      setIsOpen(false);
                      if (n.relatedEntityType === 'COMPLAINT') {
                        navigate(isOfficer ? '/officer' : '/complaints');
                      } else if (n.relatedEntityType === 'CERTIFICATE') {
                        navigate(isOfficer ? '/services/officer/dashboard' : '/services/tracker');
                      } else {
                        navigate(isOfficer ? '/welfare/department-dashboard' : '/welfare/my-applications');
                      }
                    }}
                    style={{
                      padding: '16px 20px',
                      borderBottom: idx < notifications.length - 1 ? '1px solid var(--border, #f1f5f9)' : 'none',
                      background: isUnread ? 'rgba(16,185,129,0.12)' : 'var(--surface, #ffffff)',
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (!isUnread) e.currentTarget.style.background = 'var(--bg, #f8fafc)'; }}
                    onMouseLeave={e => { if (!isUnread) e.currentTarget.style.background = 'var(--surface, #ffffff)'; }}
                  >
                    {/* Icon Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: theme.bgColor, border: `1px solid ${theme.borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={18} color={theme.iconColor} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2, gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: isUnread ? 800 : 700, color: 'var(--text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.title || n.eventType}
                        </h4>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isUnread ? '#059669' : 'var(--text-secondary, #94a3b8)', whiteSpace: 'nowrap' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary, #64748b)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.message}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 6, boxShadow: '0 0 0 3px #d1fae5' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', background: 'var(--bg, #f8fafc)', borderTop: '1px solid var(--border, #e2e8f0)' }}>
            <button 
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              style={{
                width: '100%', padding: '10px 16px',
                background: '#059669', color: '#ffffff',
                border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(5,150,105,0.2)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              View All Notifications <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;

