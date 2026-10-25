import React from 'react';
import { User, Lock, Palette, Shield } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage your account profile, preferences, and developer tools.
        </p>
      </div>

      {/* Profile */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <User size={18} color="var(--accent-primary)" />
          <span>Profile Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Input label="Username" defaultValue={user?.username || 'Developer'} disabled />
          <Input label="Email Address" defaultValue={user?.email || 'dev@example.com'} disabled />
        </div>
      </Card>

      {/* Security */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Shield size={18} color="var(--info)" />
          <span>Authentication & Security</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Authenticated via FastAPI JWT Bearer tokens stored in browser local state.
        </p>
        <div>
          <Button variant="secondary" size="sm" icon={Lock} onClick={() => alert('Password update form.')}>
            Update Password
          </Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Palette size={18} color="var(--warning)" />
          <span>Appearance</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Theme: <strong>Dark Developer Theme</strong> (Default)
        </p>
      </Card>
    </div>
  );
};