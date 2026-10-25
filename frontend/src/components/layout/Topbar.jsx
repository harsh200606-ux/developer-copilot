import React from 'react';
import { Menu, Plus, Bell } from 'lucide-react';
import { Button } from '../common/Button';

export const Topbar = ({ onToggleSidebar, onOpenCreateProject }) => {
  return (
    <header
      style={{
        height: '60px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 20, 34, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="menu-button"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          ENV: <span style={{ color: 'var(--success)' }}>ONLINE</span> (FastAPI + JWT)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onOpenCreateProject && (
          <Button size="sm" icon={Plus} onClick={onOpenCreateProject}>
            New Project
          </Button>
        )}
      </div>

      <style>{`
        @media (max-width: 991px) {
          .menu-button {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
};