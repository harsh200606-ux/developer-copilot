import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    borderRadius: '999px',
    fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
    fontWeight: 500,
    padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
  };

  const variants = {
    default: { bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' },
    primary: { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' },
    success: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' },
    danger: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171' },
    info: { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' },
  };

  const current = variants[variant] || variants.default;

  return (
    <span style={{ ...styles, backgroundColor: current.bg, color: current.color }}>
      {children}
    </span>
  );
};