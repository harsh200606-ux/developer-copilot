import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md',        // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'inherit',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    border: '1px solid transparent',
    padding: size === 'sm' ? '0.35rem 0.75rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.55rem 1rem',
    fontSize: size === 'sm' ? '0.8125rem' : size === 'lg' ? '1rem' : '0.875rem',
  };

  if (variant === 'primary') {
    styles.backgroundColor = 'var(--accent-primary)';
    styles.color = '#ffffff';
    styles.boxShadow = '0 0 15px var(--accent-glow)';
  } else if (variant === 'secondary') {
    styles.backgroundColor = 'var(--bg-tertiary)';
    styles.color = 'var(--text-primary)';
    styles.border = '1px solid var(--border-subtle)';
  } else if (variant === 'outline') {
    styles.backgroundColor = 'transparent';
    styles.color = 'var(--text-primary)';
    styles.border = '1px solid var(--border-subtle)';
  } else if (variant === 'danger') {
    styles.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    styles.color = '#ef4444';
    styles.border = '1px solid rgba(239, 68, 68, 0.3)';
  } else if (variant === 'ghost') {
    styles.backgroundColor = 'transparent';
    styles.color = 'var(--text-secondary)';
  }

  return (
    <button style={styles} disabled={disabled || loading} className={className} {...props}>
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};