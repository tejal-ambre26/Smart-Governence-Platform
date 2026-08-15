import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Home, GraduationCap, Heart, HeartPulse, Sprout, Landmark } from 'lucide-react';

function getSchemeIcon(schemeName, department) {
  const name = (schemeName || '').toLowerCase();
  const dept = (department || '').toLowerCase();
  if (name.includes('awas') || name.includes('hous') || dept.includes('hous')) return <Home size={18} color="#3b82f6" />;
  if (name.includes('scholar') || name.includes('edu') || dept.includes('edu')) return <GraduationCap size={18} color="#a855f7" />;
  if (name.includes('old age') || name.includes('pension')) return <Heart size={18} color="#f59e0b" />;
  if (name.includes('women') || name.includes('entrepreneur')) return <Landmark size={18} color="#ec4899" />;
  if (name.includes('health') || name.includes('medic') || dept.includes('health')) return <HeartPulse size={18} color="#ef4444" />;
  if (name.includes('farm') || name.includes('agri') || dept.includes('agri')) return <Sprout size={18} color="#22c55e" />;
  return <Landmark size={18} color="#6366f1" />;
}

export default function SchemeSelectDropdown({ schemes, value, onChange, placeholder = "Choose a welfare scheme..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const selectedScheme = schemes.find(s => s.schemeId === value);

  const filteredSchemes = schemes.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.schemeName?.toLowerCase().includes(term) ||
           s.department?.toLowerCase().includes(term);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '12px 16px',
          border: isOpen ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
          borderRadius: '10px',
          backgroundColor: 'var(--color-white)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none',
        }}
      >
        {selectedScheme ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {getSchemeIcon(selectedScheme.schemeName, selectedScheme.department)}
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                {selectedScheme.schemeName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {selectedScheme.department}
              </div>
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{placeholder}</span>
        )}
        <ChevronDown size={18} style={{ color: 'var(--color-text-secondary)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search scheme or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
              }}
              autoFocus
            />
          </div>

          {/* List of Schemes */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {filteredSchemes.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                No active schemes found matching "{searchTerm}"
              </div>
            ) : (
              filteredSchemes.map((s) => {
                const isSelected = s.schemeId === value;
                return (
                  <div
                    key={s.schemeId}
                    onClick={() => {
                      onChange(s.schemeId);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                      marginBottom: '2px',
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg)';
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getSchemeIcon(s.schemeName, s.department)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                          {s.schemeName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}>
                            {s.department}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--color-primary)" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
