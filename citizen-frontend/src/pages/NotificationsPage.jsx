import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import keycloak from '../keycloak.js';
import AppShell from '../components/AppShell.jsx';
import { 
  CheckCheck, Bell, Search, Sparkles, Clock, 
  ArrowRight, AlertCircle, Heart, Download, Pin, Star, 
  FileBadge, AlertTriangle, ShieldCheck
} from 'lucide-react';

function getNotifCardStyle(n) {
  const type = (n.eventType || '').toUpperCase();
  const title = (n.title || '').toUpperCase();
  const msg = (n.message || '').toUpperCase();

  if (type.includes('CREDIT') || type.includes('FUND') || title.includes('FUNDS') || msg.includes('CREDITED')) {
    return {
      dot: '🟢',
      accentColor: '#10b981',
      bgLight: '#f0fdf4',
      borderLight: '#bbf7d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
      icon: Heart,
      actionText: 'View Welfare Benefit →',
      category: 'PAYMENTS'
    };
  }

  if (type.includes('CERTIFICATE') || title.includes('CERTIFICATE') || msg.includes('CERTIFICATE')) {
    return {
      dot: '🟦',
      accentColor: '#3b82f6',
      bgLight: '#eff6ff',
      borderLight: '#bfdbfe',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
      icon: FileBadge,
      actionText: 'Download PDF →',
      category: 'CERTIFICATES'
    };
  }

  if (type.includes('COMPLAINT') || type.includes('GRIEVANCE') || title.includes('COMPLAINT') || msg.includes('ROAD')) {
    return {
      dot: '🟠',
      accentColor: '#f97316',
      bgLight: '#fff7ed',
      borderLight: '#fed7aa',
      badgeBg: '#ffedd5',
      badgeText: '#9a3412',
      icon: AlertTriangle,
      actionText: 'Track Complaint →',
      category: 'COMPLAINTS'
    };
  }

  if (type.includes('APPROV') || type.includes('RESOLV')) {
    return {
      dot: '✅',
      accentColor: '#059669',
      bgLight: '#ecfdf5',
      borderLight: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
      icon: CheckCheck,
      actionText: 'View Approval →',
      category: 'APPLICATIONS'
    };
  }

  if (type.includes('VERIF')) {
    return {
      dot: '🟡',
      accentColor: '#eab308',
      bgLight: '#fefce8',
      borderLight: '#fef08a',
      badgeBg: '#fef9c3',
      badgeText: '#854d0e',
      icon: Clock,
      actionText: 'View Application →',
      category: 'APPLICATIONS'
    };
  }

  return {
    dot: '🔔',
    accentColor: '#6366f1',
    bgLight: '#eef2ff',
    borderLight: '#c7d2fe',
    badgeBg: '#e0e7ff',
    badgeText: '#3730a3',
    icon: Bell,
    actionText: 'View Details →',
    category: 'SYSTEM'
  };
}

function getTimeGroup(dateStr) {
  if (!dateStr) return 'Older';
  const date = new Date(dateStr);
  const now = new Date();
  
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = today - d;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  if (diffDays > 1 && diffDays <= 7) return 'EARLIER THIS WEEK';
  return 'OLDER';
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState([]);
  const navigate = useNavigate();

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];
  const isOfficer = roles.includes('OFFICER') || roles.includes('officer');
  const isAdmin = roles.includes('ADMIN') || roles.includes('admin');

  const username = keycloak.tokenParsed?.preferred_username;
  const sub = keycloak.tokenParsed?.sub;

  const recipient = (isOfficer || isAdmin) ? (username || 'admin') : (sub || username || 'admin');

  useEffect(() => {
    if (!recipient) return;
    const fetchNotifs = async () => {
      try {
        const url = username ? `/notification-service/api/notifications/recipient/${recipient}?username=${username}` : `/notification-service/api/notifications/recipient/${recipient}`;
        const res = await api.get(url);
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifs();
    const t = setInterval(fetchNotifs, 10000);
    return () => clearInterval(t);
  }, [recipient]);

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

  const togglePin = (id, e) => {
    e.stopPropagation();
    setPinnedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleNotifClick = (n) => {
    if (!n.readStatus) markRead(n.notificationId);
    const style = getNotifCardStyle(n);
    if (style.category === 'COMPLAINTS') {
      navigate(isOfficer ? '/officer' : '/complaints');
    } else if (style.category === 'CERTIFICATES') {
      navigate(isOfficer ? '/services/officer/dashboard' : '/services/my-certificates');
    } else {
      navigate(isOfficer ? '/welfare/department-dashboard' : '/welfare/my-applications');
    }
  };

  // Filtering
  const filteredNotifications = notifications.filter(n => {
    const style = getNotifCardStyle(n);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q);
      const matchType = (n.eventType || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchType) return false;
    }

    if (activeTab === 'UNREAD') return !n.readStatus;
    if (activeTab === 'PAYMENTS') return style.category === 'PAYMENTS';
    if (activeTab === 'APPLICATIONS') return style.category === 'APPLICATIONS';
    if (activeTab === 'COMPLAINTS') return style.category === 'COMPLAINTS';
    if (activeTab === 'CERTIFICATES') return style.category === 'CERTIFICATES';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  // Split Pinned and Regular
  const pinnedNotifs = filteredNotifications.filter(n => pinnedIds.includes(n.notificationId));
  const regularNotifs = filteredNotifications.filter(n => !pinnedIds.includes(n.notificationId));

  // Grouping Regular
  const grouped = regularNotifs.reduce((acc, n) => {
    const group = getTimeGroup(n.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const groupOrder = ['TODAY', 'YESTERDAY', 'EARLIER THIS WEEK', 'OLDER'];

  return (
    <AppShell title="Notifications">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Telegram/WhatsApp Header Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '24px 28px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
          marginBottom: 20
        }}>
          {/* Top Row: Title + Unread Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Notifications
              </h1>
              <span style={{
                background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Bell size={14} color="#2563eb" /> {unreadCount} Unread
              </span>
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{
                  background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                  padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
              >
                <CheckCheck size={16} color="#16a34a" /> Mark all as read
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search notifications, Application IDs, or amounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 46px',
                borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#f8fafc',
                color: '#0f172a', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: 'All', count: notifications.length },
              { id: 'UNREAD', label: 'Unread', count: unreadCount },
              { id: 'PAYMENTS', label: 'Payments' },
              { id: 'APPLICATIONS', label: 'Applications' },
              { id: 'COMPLAINTS', label: 'Complaints' },
              { id: 'CERTIFICATES', label: 'Certificates' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s ease',
                    background: isActive ? '#0f172a' : '#ffffff',
                    color: isActive ? '#ffffff' : '#64748b',
                    border: isActive ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                    boxShadow: isActive ? '0 4px 12px rgba(15,23,42,0.15)' : 'none'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#475569',
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading notification feed...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 56, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={28} color="#3b82f6" />
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>You're all caught up!</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No notifications match your filter or search query.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Pinned Notifications (Telegram feature) */}
            {pinnedNotifs.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 10px 4px' }}>
                  <Pin size={14} color="#f59e0b" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PINNED NOTIFICATIONS</span>
                </div>
                <div style={{ background: '#ffffff', borderRadius: 20, border: '2px solid #fde68a', overflow: 'hidden', boxShadow: '0 4px 16px rgba(245,158,11,0.08)' }}>
                  {pinnedNotifs.map((n, idx) => (
                    <NotificationCard 
                      key={n.notificationId} 
                      n={n} 
                      idx={idx} 
                      total={pinnedNotifs.length} 
                      isPinned={true} 
                      onTogglePin={togglePin}
                      onClick={() => handleNotifClick(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Date Grouped Notifications */}
            {groupOrder.map(group => {
              const groupNotifs = grouped[group];
              if (!groupNotifs || groupNotifs.length === 0) return null;

              return (
                <div key={group}>
                  {/* WhatsApp/Telegram Centered Date Divider */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 12px' }}>
                    <span style={{
                      background: '#e2e8f0', color: '#475569',
                      padding: '4px 16px', borderRadius: 20,
                      fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase'
                    }}>
                      {group}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div style={{ background: '#ffffff', borderRadius: 20, border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
                    {groupNotifs.map((n, idx) => (
                      <NotificationCard 
                        key={n.notificationId} 
                        n={n} 
                        idx={idx} 
                        total={groupNotifs.length} 
                        isPinned={false} 
                        onTogglePin={togglePin}
                        onClick={() => handleNotifClick(n)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// Separate Rich Notification Card Component (Telegram & WhatsApp Style)
function NotificationCard({ n, idx, total, isPinned, onTogglePin, onClick }) {
  const style = getNotifCardStyle(n);
  const Icon = style.icon;
  const isUnread = !n.readStatus;

  // Extract application ID or detail strings if present
  const appIdMatch = n.message?.match(/BEN-\d{4}-\d+|COMP-\d{4}-\d+|SRV-\d{4}-\d+/i);
  const appId = appIdMatch ? appIdMatch[0] : null;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '22px 24px',
        borderBottom: idx < total - 1 ? '1px solid #f1f5f9' : 'none',
        background: isUnread ? style.bgLight : '#ffffff',
        display: 'flex', gap: 18, alignItems: 'flex-start',
        cursor: 'pointer', transition: 'background 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={e => { if (!isUnread) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!isUnread) e.currentTarget.style.background = '#ffffff'; }}
    >
      {/* Icon Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: 16, flexShrink: 0,
        background: style.badgeBg, border: `1px solid ${style.borderLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20
      }}>
        <Icon size={22} color={style.accentColor} />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        
        {/* Header Row: Dot + Title + Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <span style={{ fontSize: 16 }}>{style.dot}</span>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: isUnread ? 800 : 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {n.title || n.eventType}
            </h4>
          </div>

          <span style={{ fontSize: 12, fontWeight: 700, color: isUnread ? style.accentColor : '#94a3b8', whiteSpace: 'nowrap', shrink: 0 }}>
            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message body */}
        <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
          {n.message}
        </p>

        {/* Details & Action Badges Row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {appId && (
            <span style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, fontFamily: 'monospace' }}>
              ID: {appId}
            </span>
          )}

          <span style={{ background: style.badgeBg, color: style.badgeText, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
            {style.category}
          </span>

          <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: style.accentColor, display: 'flex', alignItems: 'center', gap: 4 }}>
            {style.actionText}
          </span>
        </div>
      </div>

      {/* Right Controls: Pin & Unread Dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, shrink: 0 }}>
        <button
          type="button"
          onClick={(e) => onTogglePin(n.notificationId, e)}
          title={isPinned ? 'Unpin' : 'Pin notification'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isPinned ? 1 : 0.4, padding: 4 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => { if (!isPinned) e.currentTarget.style.opacity = '0.4'; }}
        >
          <Pin size={15} color={isPinned ? '#f59e0b' : '#94a3b8'} fill={isPinned ? '#f59e0b' : 'none'} />
        </button>

        {isUnread && (
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: style.accentColor, boxShadow: `0 0 0 3px ${style.borderLight}` }} />
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;

