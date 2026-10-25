import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: 0,
        }}
        className="layout-content-wrapper"
      >
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenCreateProject={() => setCreateModalOpen(true)}
        />
        <main style={{ flex: 1, padding: '1.75rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet context={{ openCreateProject: () => setCreateModalOpen(true) }} />
        </main>
      </div>

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          // Trigger refresh event for pages
          window.dispatchEvent(new CustomEvent('project-created'));
        }}
      />

      <style>{`
        @media (min-width: 992px) {
          .layout-content-wrapper {
            margin-left: 240px !important;
          }
        }
      `}</style>
    </div>
  );
};