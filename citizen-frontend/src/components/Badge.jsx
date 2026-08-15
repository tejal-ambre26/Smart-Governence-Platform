import React from 'react';

export const Badge = ({ variant = 'neutral', label, icon: Icon }) => {
  const variants = {
    success: { bg: 'var(--color-success-light)', text: 'var(--color-success)', border: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', border: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', border: 'var(--color-danger)' },
    info: { bg: 'var(--color-primary-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' },
    neutral: { bg: 'var(--color-bg)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' }
  };
  
  const style = variants[variant] || variants.neutral;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '600',
      border: `1px solid ${style.border}`,
      borderRadius: 'var(--radius-full)',
      backgroundColor: style.bg,
      color: style.text,
      whiteSpace: 'nowrap'
    }}>
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      {label}
    </span>
  );
};
