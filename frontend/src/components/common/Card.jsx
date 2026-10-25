import React from 'react';

export const Card = ({ children, style = {}, className = '', hoverable = false, ...props }) => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};