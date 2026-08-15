import React from 'react';

export const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendType = 'up' }) => (
  <div style={{
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-3)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-2)'
  }}>
    <div style={{
      padding: '12px',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {Icon && <Icon size={24} strokeWidth={2} />}
    </div>
    <div style={{ flexGrow: 1 }}>
      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
        fontWeight: '500',
        margin: '0 0 4px 0'
      }}>{title}</p>
      <h3 style={{
        color: 'var(--color-text-primary)',
        fontWeight: '700',
        fontSize: '28px',
        margin: '0 0 4px 0',
        letterSpacing: '-0.02em'
      }}>{value}</h3>
      {subtitle && (
        <p style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {trend && (
            <span style={{
              color: trendType === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
              fontWeight: '600'
            }}>
              {trend}
            </span>
          )}
          {subtitle}
        </p>
      )}
    </div>
  </div>
);
