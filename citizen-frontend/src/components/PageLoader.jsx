import React from 'react';
import { useTheme } from '../context/ThemeContext';

function PageLoader({ message = 'Loading workspace...' }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '280px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '32px',
        borderRadius: '16px',
        background: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
        backdropFilter: 'blur(12px)',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: isDark ? '3px solid rgba(56, 189, 248, 0.15)' : '3px solid rgba(37, 99, 235, 0.15)',
            borderTopColor: isDark ? '#38bdf8' : '#2563eb',
            animation: 'pageLoaderSpin 0.9s linear infinite',
          }}
        />
      </div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
        {message}
      </p>
      <style>{`
        @keyframes pageLoaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PageLoader;
