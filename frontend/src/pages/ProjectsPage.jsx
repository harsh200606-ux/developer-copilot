import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Code2,
  GitBranch,
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle,
  Clock3,
  X,
} from 'lucide-react';

import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { api } from '../services/api';

export const ProjectsPage = () => {
  const { openCreateProject } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [error, setError] = useState('');

  const fetchProjects = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err.message || 'Could not load projects. Please try again.');
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

  const getProjectId = (project) => project._id || project.id;

  const getLanguage = (project) => {
    const language = project.language || project.framework || 'General';
    return String(language);
  };

  const languages = useMemo(() => {
    return [...new Set(projects.map(getLanguage))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        String(project.name || '').toLowerCase().includes(term) ||
        String(project.repository_url || '').toLowerCase().includes(term) ||
        String(project.description || '').toLowerCase().includes(term) ||
        getLanguage(project).toLowerCase().includes(term);

      const matchesLanguage =
        languageFilter === 'all' ||
        getLanguage(project) === languageFilter;

      return matchesSearch && matchesLanguage;
    });
  }, [projects, search, languageFilter]);

  const handleDelete = async (id) => {
    const project = projects.find(
      (item) => String(getProjectId(item)) === String(id)
    );

    const projectName = project?.name || 'this project';

    if (
      !window.confirm(
        `Delete "${projectName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.deleteProject(id);

      setProjects((current) =>
        current.filter(
          (item) => String(getProjectId(item)) !== String(id)
        )
      );
    } catch (err) {
      window.alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCreateProject = () => {
    if (typeof openCreateProject === 'function') {
      openCreateProject();
    } else {
      window.alert('The project creation form is not available on this page.');
    }
  };

  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    width: '100%',
    minWidth: 0,
  };

  const panelStyle = {
    background: 'var(--bg-card, #101522)',
    border: '1px solid var(--border-subtle, rgba(148,163,184,0.12))',
    borderRadius: '18px',
    padding: '1.25rem',
  };

  const inputStyle = {
    width: '100%',
    minWidth: 0,
    background: 'var(--bg-secondary, #0e1220)',
    color: 'var(--text-primary, #f1f5f9)',
    border: '1px solid var(--border-subtle, rgba(148,163,184,0.16))',
    borderRadius: '10px',
    padding: '0.75rem 0.85rem',
    outline: 'none',
    fontSize: '0.875rem',
  };

  const projectCardStyle = {
    background: 'var(--bg-card, #101522)',
    border: '1px solid var(--border-subtle, rgba(148,163,184,0.12))',
    borderRadius: '16px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: 0,
    transition: 'border-color 160ms ease, transform 160ms ease',
  };

  return (
    <div style={pageStyle}>
      {/* Page heading */}
      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-primary, #7775ff)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            <FolderGit2 size={15} />
            Your workspace
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Software Projects
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginTop: '0.55rem',
              maxWidth: '620px',
              lineHeight: 1.6,
            }}
          >
            Open your codebases, manage projects, launch previews, and prepare
            your code for analysis.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchProjects(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button icon={Plus} size="sm" onClick={handleCreateProject}>
            Create Project
          </Button>
        </div>
      </section>

      {/* Summary cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '1rem',
        }}
      >
        {[
          {
            label: 'Total projects',
            value: projects.length,
            icon: FolderGit2,
            color: '#818cf8',
          },
          {
            label: 'Languages / frameworks',
            value: languages.length,
            icon: Code2,
            color: '#38bdf8',
          },
          {
            label: 'Search results',
            value: filteredProjects.length,
            icon: Search,
            color: '#34d399',
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              style={{
                ...panelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `${stat.color}18`,
                  color: stat.color,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={21} />
              </div>

              <div>
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {stat.value}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Search and filters */}
      <section style={panelStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 210px) auto',
            gap: '0.75rem',
            alignItems: 'center',
          }}
          className="projects-toolbar"
        >
          <div style={{ position: 'relative', minWidth: 0 }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />

            <input
              aria-label="Search projects"
              type="search"
              placeholder="Search projects, languages, repositories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.5rem' }}
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: 0,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            aria-label="Filter projects by language"
            value={languageFilter}
            onChange={(event) => setLanguageFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All languages</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>

          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant={view === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              icon={LayoutGrid}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            />
            <Button
              variant={view === 'list' ? 'primary' : 'secondary'}
              size="sm"
              icon={List}
              onClick={() => setView('list')}
              aria-label="List view"
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginTop: '0.9rem',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
          }}
        >
          <span>
            Showing <strong>{filteredProjects.length}</strong> of{' '}
            <strong>{projects.length}</strong> projects
          </span>

          {(search || languageFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setLanguageFilter('all');
              }}
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Loading / error / empty states */}
      {loading ? (
        <LoadingSpinner text="Loading your projects..." />
      ) : error ? (
        <div
          role="alert"
          style={{
            ...panelStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
          }}
        >
          <AlertCircle color="#fb7185" size={22} />
          <div style={{ flex: 1 }}>
            <strong>Couldn't load projects</strong>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              {error}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={() => fetchProjects()}
          >
            Try again
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="Your workspace is ready"
          description="Create your first project to browse its code, run the application, and explore analysis tools."
          actionText="Create Project"
          onAction={handleCreateProject}
        />
      ) : filteredProjects.length === 0 ? (
        <div
          style={{
            ...panelStyle,
            textAlign: 'center',
            padding: '3rem 1.5rem',
          }}
        >
          <Search
            size={30}
            color="var(--text-muted)"
            style={{ marginBottom: '0.8rem' }}
          />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            No matching projects
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            Try a different search term or clear your filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setLanguageFilter('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Grid view */}
          {view === 'grid' && (
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
                gap: '1rem',
              }}
            >
              {filteredProjects.map((project) => {
                const id = getProjectId(project);
                const language = getLanguage(project);
                const repositoryUrl = project.repository_url;

                return (
                  <article
                    key={id}
                    style={projectCardStyle}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor =
                        'var(--accent-primary, #7775ff)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor =
                        'var(--border-subtle, rgba(148,163,184,0.12))';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '13px',
                          color: '#a5b4fc',
                          background: 'rgba(99,102,241,0.14)',
                          flexShrink: 0,
                        }}
                      >
                        <FolderGit2 size={23} />
                      </div>

                      <Badge variant="primary">{language}</Badge>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/projects/${id}`}
                        style={{
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          fontSize: '1.05rem',
                          fontWeight: 750,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {project.name || 'Untitled project'}
                      </Link>

                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.84rem',
                          lineHeight: 1.6,
                          marginTop: '0.55rem',
                          minHeight: '2.6em',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {project.description ||
                          'Open this project to explore its files and runtime.'}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.7rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        borderTop:
                          '1px solid var(--border-subtle, rgba(148,163,184,0.12))',
                        borderBottom:
                          '1px solid var(--border-subtle, rgba(148,163,184,0.12))',
                        padding: '0.85rem 0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <GitBranch size={15} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {repositoryUrl || 'Local project'}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Clock3 size={15} />
                        <span>Project workspace</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        marginTop: 'auto',
                      }}
                    >
                      <Button
                        size="sm"
                        icon={ExternalLink}
                        onClick={() =>
                          (window.location.href = `/projects/${id}`)
                        }
                      >
                        Open Project
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        aria-label={`Delete ${project.name || 'project'}`}
                        onClick={() => handleDelete(id)}
                      />
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* List view */}
          {view === 'list' && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Language</th>
                      <th>Repository</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const id = getProjectId(project);

                      return (
                        <tr key={id}>
                          <td>
                            <Link
                              to={`/projects/${id}`}
                              style={{
                                color: 'var(--text-primary)',
                                fontWeight: 650,
                              }}
                            >
                              {project.name || 'Untitled project'}
                            </Link>
                          </td>
                          <td>
                            <Badge variant="primary">
                              {getLanguage(project)}
                            </Badge>
                          </td>
                          <td
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              maxWidth: '280px',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {project.repository_url || 'Local project'}
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <Link to={`/projects/${id}`}>
                                <Button size="sm" variant="outline">
                                  Open
                                  <ChevronRight size={15} />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="danger"
                                icon={Trash2}
                                aria-label={`Delete ${project.name || 'project'}`}
                                onClick={() => handleDelete(id)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 760px) {
          .projects-toolbar {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};
