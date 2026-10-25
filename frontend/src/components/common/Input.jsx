import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)', display: 'flex' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          style={{
            width: '100%',
            padding: Icon ? '0.625rem 0.75rem 0.625rem 2.25rem' : '0.625rem 0.75rem',
            background: 'var(--bg-secondary)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          className={className}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
};