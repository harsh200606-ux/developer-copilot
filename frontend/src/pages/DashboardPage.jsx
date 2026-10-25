
import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderGit2,
  Activity,
  Bug,
  CheckCircle2,
  Plus,
  Github,
  Bot,
  ExternalLink,
  Play,
  Square,
  Loader,
  ArrowUpRight,
  Sparkles,
  Terminal,
  RefreshCw,
  AlertCircle,
  Code2,
  Zap,
  Clock3,
  Layers3,
  ChevronRight,
} from 'lucide-react';

import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getProjectId = (project) => project?._id || project?.id;

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '100%',
    maxWidth: '1600px',
    paddingBottom: '32px',
    color: 'var(--text-primary)',
  },
  muted: {
    color: 'var(--text-secondary)',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    color: '#a5a3ff',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 750,
    letterSpacing: '-0.035em',
    margin: 0,
  },
  panel: {
    minWidth: 0,
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '17px',
    padding: '21px',
    background: 'linear-gradient(145deg, #131a2a 0%, #0e1320 100%)',
    boxShadow: '0 10px 35px rgba(0,0,0,0.12)',
  },
  action: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: '9px',
    padding: '9px 12px',
    background: '#111827',
    color: '#e2e8f0',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 160ms ease, border-color 160ms ease',
  },
  primaryAction: {
    background: 'linear-gradient(135deg, #7775ff, #625cf0)',
    border: '1px solid #7775ff',
    color: '#fff',
    boxShadow: '0 5px 18px rgba(99,102,241,0.2)',
  },
  smallLabel: {
    color: '#8290a9',
    fontSize: '11px',
    fontWeight: 600,
  },
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const { openCreateProject } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runtimeByProject, setRuntimeByProject] = useState({});
  const [notice, setNotice] = useState(null);

  const fetchProjects = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Could not load projects:', error);
      setNotice({
        type: 'error',
        text: error.message || 'Could not load your projects.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const handleRefresh = () => fetchProjects(true);
    window.addEventListener('project-created', handleRefresh);

    return () => {
      window.removeEventListener('project-created', handleRefresh);
    };
  }, []);

  const updateRuntime = (projectId, updates) => {
    setRuntimeByProject((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        ...updates,
      },
    }));
  };

  const runProject = async (project) => {
    const projectId = getProjectId(project);

    if (!projectId) {
      setNotice({ type: 'error', text: 'This project has no valid ID.' });
      return;
    }

    setNotice(null);
    updateRuntime(projectId, {
      loading: true,
      error: null,
      message: 'Starting application...',
    });

    try {
      const result = await api.startProject(projectId);

      if (result?.success === false || result?.status === 'error') {
        throw new Error(result.message || 'The application could not start.');
      }

      updateRuntime(projectId, {
        loading: false,
        running: true,
        previewUrl: result?.preview_url || null,
        containerName: result?.container_name || null,
        message: result?.message || 'Application started.',
        error: null,
      });

      setNotice({
        type: 'success',
        text: `${project.name || 'Project'} started successfully.`,
      });
    } catch (error) {
      updateRuntime(projectId, {
        loading: false,
        running: false,
        error: error.message || 'Could not start the application.',
        message: null,
      });

      setNotice({
        type: 'error',
        text: error.message || 'Could not start the application.',
      });
    }
  };

  const stopProject = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId) return;

    setNotice(null);
    updateRuntime(projectId, {
      loading: true,
      error: null,
      message: 'Stopping application...',
    });

    try {
      const result = await api.stopProject(projectId);

      if (result?.success === false || result?.status === 'error') {
        throw new Error(result.message || 'The application could not stop.');
      }

      updateRuntime(projectId, {
        loading: false,
        running: false,
        previewUrl: null,
        containerName: null,
        message: 'Application stopped.',
        error: null,
      });

      setNotice({
        type: 'success',
        text: `${project.name || 'Project'} stopped successfully.`,
      });
    } catch (error) {
      updateRuntime(projectId, {
        loading: false,
        error: error.message || 'Could not stop the application.',
        message: null,
      });

      setNotice({
        type: 'error',
        text: error.message || 'Could not stop the application.',
      });
    }
  };

  const openPreview = (previewUrl) => {
    if (!previewUrl) return;

    try {
      const parsedUrl = new URL(previewUrl);

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Unsupported preview URL.');
      }

      window.open(parsedUrl.href, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.message || 'Could not open the preview.',
      });
    }
  };

  const runningCount = Object.values(runtimeByProject).filter(
    (runtime) => runtime.running
  ).length;

  const stats = [
    {
      label: 'Total projects',
      value: projects.length,
      caption: 'Your workspace',
      icon: FolderGit2,
      color: '#a5a3ff',
      background: 'rgba(124, 117, 255, 0.12)',
    },
    {
      label: 'Running apps',
      value: runningCount,
      caption: 'Current session',
      icon: Activity,
      color: '#34d399',
      background: 'rgba(52, 211, 153, 0.10)',
    },
    {
      label: 'Code analyses',
      value: '—',
      caption: 'Not connected yet',
      icon: Bug,
      color: '#fbbf24',
      background: 'rgba(251, 191, 36, 0.10)',
    },
    {
      label: 'Test coverage',
      value: '—',
      caption: 'No report available',
      icon: CheckCircle2,
      color: '#38bdf8',
      background: 'rgba(56, 189, 248, 0.10)',
    },
  ];

  return (
    <div style={styles.page}>
      {/* Welcome hero */}
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '25px',
          flexWrap: 'wrap',
          padding: '30px',
          minHeight: '220px',
          border: '1px solid rgba(139, 132, 255, 0.25)',
          borderRadius: '22px',
          background:
            'radial-gradient(ellipse at 85% 10%, rgba(126,111,255,0.27), transparent 38%), linear-gradient(120deg, #171b35 0%, #11172a 52%, #101423 100%)',
          boxShadow: '0 15px 45px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px' }}>
          <div
            style={{
              ...styles.eyebrow,
              marginBottom: '16px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: '1px solid rgba(165,163,255,0.2)',
              background: 'rgba(124,117,255,0.09)',
            }}
          >
            <Sparkles size={13} />
            Your AI development workspace
          </div>

          <h1
            style={{
              fontSize: 'clamp(27px, 3.2vw, 39px)',
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: '-0.055em',
              margin: 0,
            }}
          >
            Build better.
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #b5b2ff, #8b9dff, #77d5ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Ship with confidence.
            </span>
          </h1>

          <p
            style={{
              color: '#a5b1c8',
              fontSize: '13px',
              lineHeight: 1.8,
              margin: '13px 0 20px',
              maxWidth: '440px',
            }}
          >
            Welcome back, {user?.username || 'Developer'}. Manage your
            codebases, launch applications, and get ready to improve your
            development workflow.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button icon={Plus} size="sm" onClick={openCreateProject}>
              Create a project
            </Button>

            <Link
              to="/projects"
              style={{
                ...styles.action,
                background: 'rgba(255,255,255,0.045)',
                borderColor: 'rgba(255,255,255,0.13)',
              }}
            >
              Explore projects <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            width: '150px',
            height: '150px',
            margin: '0 22px 0 0',
            borderRadius: '35px',
            border: '1px solid rgba(165,163,255,0.25)',
            background:
              'linear-gradient(145deg, rgba(139,132,255,0.20), rgba(56,189,248,0.06))',
            boxShadow:
              '0 0 65px rgba(124,117,255,0.12), inset 0 0 35px rgba(124,117,255,0.06)',
          }}
        >
          <Code2 size={65} strokeWidth={1.15} color="#b6b2ff" />
          <div
            style={{
              position: 'absolute',
              right: '-10px',
              bottom: '8px',
              display: 'grid',
              placeItems: 'center',
              width: '39px',
              height: '39px',
              borderRadius: '12px',
              background: '#172b2a',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399',
            }}
          >
            <Zap size={19} />
          </div>
        </div>
      </header>

      {/* Notification */}
      {notice && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '13px 15px',
            borderRadius: '12px',
            border: `1px solid ${
              notice.type === 'error'
                ? 'rgba(251,113,133,0.25)'
                : notice.type === 'success'
                  ? 'rgba(52,211,153,0.25)'
                  : 'rgba(148,163,184,0.15)'
            }`,
            background:
              notice.type === 'error'
                ? 'rgba(251,113,133,0.06)'
                : notice.type === 'success'
                  ? 'rgba(52,211,153,0.06)'
                  : '#111827',
            color:
              notice.type === 'error'
                ? '#fb7185'
                : notice.type === 'success'
                  ? '#34d399'
                  : 'var(--text-primary)',
            fontSize: '12px',
          }}
        >
          {notice.type === 'error' ? (
            <AlertCircle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}
          <span style={{ flex: 1 }}>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
            style={{
              ...styles.action,
              padding: '5px 9px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics */}
      <section aria-label="Workspace statistics">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '13px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={styles.sectionTitle}>Workspace overview</h2>
            <p style={{ ...styles.muted, fontSize: '11px', marginTop: '4px' }}>
              A snapshot of your development workspace
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchProjects(true)}
            disabled={refreshing}
            style={{
              ...styles.action,
              opacity: refreshing ? 0.65 : 1,
            }}
          >
            <RefreshCw
              size={13}
              className={refreshing ? 'animate-spin' : undefined}
            />
            {refreshing ? 'Refreshing' : 'Refresh data'}
          </button>
        </div>

        <div
          className="dashboard-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '14px',
          }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                style={{
                  ...styles.panel,
                  padding: '19px',
                  background:
                    'linear-gradient(145deg, #141b2c 0%, #0f1421 100%)',
                  transition:
                    'transform 180ms ease, border-color 180ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span style={styles.smallLabel}>{stat.label}</span>

                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '37px',
                      height: '37px',
                      borderRadius: '11px',
                      color: stat.color,
                      background: stat.background,
                      border: `1px solid ${stat.color}22`,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    fontSize: '32px',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: '-0.06em',
                  }}
                >
                  {stat.value}
                </div>

                <div
                  style={{
                    color: '#6f7e97',
                    fontSize: '10px',
                    marginTop: '8px',
                  }}
                >
                  {stat.caption}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Main workspace */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '15px',
          }}
        >
          <div>
            <div style={{ ...styles.eyebrow, marginBottom: '7px' }}>
              <Layers3 size={13} />
              Development
            </div>
            <h2 style={styles.sectionTitle}>Your projects</h2>
            <p style={{ ...styles.muted, fontSize: '12px', marginTop: '5px' }}>
              Launch, preview, and manage your applications.
            </p>
          </div>

          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#aaa7ff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            All projects <ChevronRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div style={styles.panel}>
            <LoadingSpinner text="Loading your projects..." />
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              ...styles.panel,
              padding: '35px 20px',
              textAlign: 'center',
            }}
          >
            <EmptyState
              icon={FolderGit2}
              title="Your workspace is ready"
              description="Create your first project or upload a codebase to get started."
              actionText="Create project"
              onAction={openCreateProject}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
              gap: '16px',
            }}
          >
            {projects.slice(0, 6).map((project) => {
              const projectId = getProjectId(project);
              const runtime = runtimeByProject[projectId] || {};
              const isRunning = Boolean(runtime.running);
              const isBusy = Boolean(runtime.loading);

              return (
                <article
                  key={projectId}
                  style={{
                    ...styles.panel,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '20px',
                    background:
                      'linear-gradient(145deg, #141b2b 0%, #101522 70%, #111626 100%)',
                  }}
                >
                  {/* Project title */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          width: '45px',
                          height: '45px',
                          flexShrink: 0,
                          borderRadius: '13px',
                          color: '#aaa7ff',
                          background:
                            'linear-gradient(145deg, rgba(124,117,255,0.17), rgba(124,117,255,0.06))',
                          border: '1px solid rgba(124,117,255,0.2)',
                        }}
                      >
                        <FolderGit2 size={21} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h3
                          title={project.name}
                          style={{
                            fontSize: '14px',
                            fontWeight: 750,
                            lineHeight: 1.45,
                            overflowWrap: 'anywhere',
                            margin: 0,
                          }}
                        >
                          {project.name || 'Untitled project'}
                        </h3>
                        <p
                          style={{
                            color: '#73819a',
                            fontSize: '10px',
                            margin: '5px 0 0',
                          }}
                        >
                          {project.repository_url
                            ? 'Git repository'
                            : 'Local project'}
                        </p>
                      </div>
                    </div>

                    <Badge variant="primary">
                      {project.language || 'Code'}
                    </Badge>
                  </div>

                  <p
                    style={{
                      color: '#9aa8be',
                      fontSize: '12px',
                      lineHeight: 1.75,
                      minHeight: '42px',
                      overflowWrap: 'anywhere',
                      margin: 0,
                    }}
                  >
                    {project.description ||
                      'Your codebase is ready to explore, run, and analyze.'}
                  </p>

                  {/* Runtime status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        isRunning
                          ? 'rgba(52,211,153,0.19)'
                          : 'rgba(148,163,184,0.10)'
                      }`,
                      background: isRunning
                        ? 'rgba(52,211,153,0.045)'
                        : 'rgba(255,255,255,0.018)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                      }}
                    >
                      {isBusy ? (
                        <Loader
                          size={14}
                          className="animate-spin"
                          color="#a5a3ff"
                        />
                      ) : (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: isRunning ? '#34d399' : '#64748b',
                            boxShadow: isRunning
                              ? '0 0 10px rgba(52,211,153,0.45)'
                              : 'none',
                          }}
                        />
                      )}

                      <span
                        style={{
                          fontSize: '11px',
                          color: isRunning ? '#6ee7b7' : '#8c9bb2',
                          fontWeight: 650,
                        }}
                      >
                        {isBusy
                          ? runtime.message || 'Working...'
                          : isRunning
                            ? 'Application running'
                            : 'Application stopped'}
                      </span>
                    </div>

                    {isRunning && (
                      <span
                        style={{
                          color: '#34d399',
                          fontSize: '9px',
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>

                  {runtime.error && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '7px',
                        alignItems: 'flex-start',
                        color: '#fb7185',
                        fontSize: '11px',
                        lineHeight: 1.6,
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{runtime.error}</span>
                    </div>
                  )}

                  {/* Project actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: 'auto',
                      paddingTop: '3px',
                    }}
                  >
                    {!isRunning ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runProject(project)}
                        style={{
                          ...styles.action,
                          ...styles.primaryAction,
                          flex: '1 1 110px',
                          opacity: isBusy ? 0.65 : 1,
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        {isBusy ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        {isBusy ? 'Starting...' : 'Run project'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => stopProject(project)}
                        style={{
                          ...styles.action,
                          flex: '1 1 95px',
                          opacity: isBusy ? 0.65 : 1,
                          cursor: isBusy ? 'wait' : 'pointer',
                        }}
                      >
                        {isBusy ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Square size={13} />
                        )}
                        {isBusy ? 'Stopping...' : 'Stop'}
                      </button>
                    )}

                    {isRunning && runtime.previewUrl && (
                      <button
                        type="button"
                        onClick={() => openPreview(runtime.previewUrl)}
                        style={{
                          ...styles.action,
                          color: '#6ee7b7',
                          borderColor: 'rgba(52,211,153,0.22)',
                        }}
                      >
                        <ExternalLink size={13} />
                        Preview
                      </button>
                    )}

                    <Link
                      to={`/projects/${projectId}`}
                      style={styles.action}
                    >
                      Open <ArrowUpRight size={13} />
                    </Link>
                  </div>

                  {isRunning && !runtime.previewUrl && (
                    <p
                      style={{
                        color: '#8190a8',
                        fontSize: '10px',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      The backend did not return a preview URL for this
                      application.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!loading && projects.length > 6 && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link
              to="/projects"
              style={{
                color: '#aaa7ff',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              View all {projects.length} projects <ArrowUpRight size={13} />
            </Link>
          </div>
        )}
      </section>

      {/* Developer tools */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '14px',
        }}
      >
        <Link
          to="/copilot"
          style={{
            ...styles.panel,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '19px',
            background:
              'linear-gradient(120deg, rgba(124,117,255,0.10), #111725)',
            borderColor: 'rgba(124,117,255,0.18)',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              color: '#b0adff',
              background: 'rgba(124,117,255,0.14)',
              flexShrink: 0,
            }}
          >
            <Bot size={21} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13px', fontWeight: 750, margin: 0 }}>
              AI Assistant
            </h3>
            <p style={{ color: '#8492aa', fontSize: '11px', marginTop: '4px' }}>
              Explore your AI workspace
            </p>
          </div>

          <ArrowUpRight size={16} color="#aaa7ff" />
        </Link>

        <button
          type="button"
          onClick={() =>
            setNotice({
              type: 'info',
              text: 'GitHub connection is not yet wired to this dashboard action.',
            })
          }
          style={{
            ...styles.panel,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              color: '#c4d0e2',
              background: 'rgba(148,163,184,0.09)',
              flexShrink: 0,
            }}
          >
            <Github size={21} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13px', fontWeight: 750, margin: 0 }}>
              GitHub integration
            </h3>
            <p style={{ color: '#8492aa', fontSize: '11px', marginTop: '4px' }}>
              Repository connection setup
            </p>
          </div>

          <ArrowUpRight size={16} color="#8492aa" />
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '11px',
          padding: '15px 17px',
          borderRadius: '12px',
          border: '1px solid rgba(148,163,184,0.10)',
          background: 'rgba(15,20,34,0.65)',
          color: '#8492aa',
          fontSize: '11px',
          lineHeight: 1.8,
        }}
      >
        <Terminal
          size={16}
          color="#aaa7ff"
          style={{ flexShrink: 0, marginTop: '2px' }}
        />

        <span>
          <strong style={{ color: '#dbe4f1' }}>Developer tip:</strong>{' '}
          Launch a project to test its configured runtime, use Preview to open
          the running application, and stop it when you finish testing. Runtime
          status shown here reflects actions taken during this dashboard
          session.
        </span>
      </footer>
    </div>
  );
};
