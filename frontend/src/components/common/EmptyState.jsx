import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      {Icon && (
        <div style={{ padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: '50%', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
          <Icon size={28} />
        </div>
      )}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', lineHeight: 1.5 }}>{description}</p>
      {actionText && onAction && (
        <div style={{ marginTop: '0.5rem' }}>
          <Button onClick={onAction}>{actionText}</Button>
        </div>
      )}
    </Card>
  );
};