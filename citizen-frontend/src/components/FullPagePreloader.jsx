import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FullPagePreloader() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        background: isDark
          ? 'radial-gradient(ellipse at 50% 0%, #0f172a 0%, #090d16 70%, #020617 100%)'
          : 'radial-gradient(ellipse at 50% 0%, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)',
        color: isDark ? '#f8fafc' : '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'background 0.4s ease, color 0.4s ease',
      }}
    >
      {/* Background Ambient Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.05) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(14, 165, 233, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'preloaderOrbFloat 10s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.03) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'preloaderOrbFloat 12s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      />

      {/* MAIN CENTRAL PRELOADER CARD */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 10,
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Main Central Card */}
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            background: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '24px',
            padding: '36px 40px',
            backdropFilter: 'blur(24px)',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.1)'
              : '0 20px 40px -12px rgba(0, 0, 0, 0.08), 0 0 30px rgba(37, 99, 235, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Logo Brand Emblem & Spinner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                }}
              >
                🏛️
              </div>
              {/* Outer Rotating Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '26px',
                  border: '2px solid transparent',
                  borderTopColor: '#38bdf8',
                  borderRightColor: '#818cf8',
                  animation: 'preloaderSpin 1.2s linear infinite',
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Smart Governance <span style={{ color: isDark ? '#38bdf8' : '#2563eb' }}>Platform</span>
                </h2>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#38bdf8' : '#2563eb' }}>
                  {progress}%
                </span>
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                Loading Workspace...
              </p>
            </div>
          </div>

          {/* Smooth Progress Bar Track */}
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Animated Progress Fill Line */}
            <div
              style={{
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #2563eb, #38bdf8, #818cf8, #2563eb)',
                backgroundSize: '200% 100%',
                boxShadow: '0 0 14px rgba(56, 189, 248, 0.7)',
                animation: 'preloaderProgressFill 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite, preloaderShimmer 1.5s linear infinite',
              }}
            />
          </div>
        </div>
      </main>

      {/* Inject Keyframe Animations */}
      <style>{`
        @keyframes preloaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes preloaderOrbFloat {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes preloaderProgressFill {
          0% { width: 10%; }
          30% { width: 45%; }
          65% { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes preloaderShimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}</style>
    </div>
  );
}
