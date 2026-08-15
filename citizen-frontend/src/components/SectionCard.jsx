import React from 'react';

export const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`} style={{
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    padding: 'var(--space-3)',
  }}>
    {children}
  </div>
);
