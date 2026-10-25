import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';

export const AnalysesPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analysis History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Historical logs of code quality, security audits, and automated runs.
        </p>
      </div>

      <Card>
        <EmptyState
          icon={Activity}
          title="No Analysis Records Yet"
          description="When projects are analyzed via CI/CD or the dashboard, execution timestamps, duration, and issue reports will be recorded here."
        />
      </Card>
    </div>
  );
};