
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  ShieldAlert,
  CheckCircle,
  Bot,
  LayoutDashboard,
  Play,
  Github,
  AlertCircle,
  AlertTriangle,
  Info,
  FileCode2,
  RefreshCw,
  Upload,
  FileArchive,
  Search,
  RotateCcw,
  Eye,
  ShieldCheck,
} from 'lucide-react';

import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';

const severityStyles = {
  error: {
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    icon: AlertCircle,
    label: 'Error',
  },
  warning: {
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.12)',
    icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    color: '#60a5fa',
    background: 'rgba(96, 165, 250, 0.12)',
    icon: Info,
    label: 'Info',
  },
};

const securitySeverityStyles = {
  high: {
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.12)',
    label: 'High',
  },
  medium: {
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.12)',
    label: 'Medium',
  },
  low: {
    color: '#60a5fa',
    background: 'rgba(96, 165, 250, 0.12)',
    label: 'Low',
  },
};

const inputStyle = {
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '0.7rem 0.8rem',
  border: '1px solid var(--border-subtle)',
  borderRadius: '0.5rem',
  color: 'var(--text-primary)',
  background: 'var(--bg-secondary)',
  fontSize: '0.875rem',
};

const normalizeRelativePath = (value) =>
  value.trim().replace(/\\/g, '/');

const validateRelativePath = (value) => {
  const normalized = normalizeRelativePath(value);

  if (!normalized) {
    return 'Enter a relative path.';
  }

  if (
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    normalized.includes(':')
  ) {
    return 'Use a relative path, such as src/main.py.';
  }

  const parts = normalized.split('/');

  if (
    parts.some((part) => !part || part === '.' || part === '..')
  ) {
    return 'The path cannot contain empty, "." or ".." segments.';
  }

  if (
    parts.some((part) =>
      ['.git', '__pycache__', 'node_modules', '.venv', 'venv'].includes(
        part.toLowerCase()
      )
    )
  ) {
    return 'Files inside excluded directories cannot be changed.';
  }

  return '';
};

const getErrorMessage = (error, fallback) =>
  error?.message || fallback;

const getPythonFilePaths = (result) => {
  const rawFiles = Array.isArray(result)
    ? result
    : result?.files || result?.python_files || result?.items || [];

  return rawFiles
    .map((item) => {
      if (typeof item === 'string') return item;
      return item?.path || item?.relative_path || item?.name || '';
    })
    .filter(
      (path) =>
        typeof path === 'string' &&
        path.toLowerCase().endsWith('.py')
    );
};

const StatusMessage = ({ error, children }) => (
  <div
    role={error ? 'alert' : 'status'}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      marginTop: '0.85rem',
      padding: '0.85rem',
      borderRadius: '0.5rem',
      color: error ? '#f87171' : '#34d399',
      background: error
        ? 'rgba(248, 113, 113, 0.1)'
        : 'rgba(52, 211, 153, 0.1)',
      border: `1px solid ${
        error
          ? 'rgba(248, 113, 113, 0.25)'
          : 'rgba(52, 211, 153, 0.2)'
      }`,
      overflowWrap: 'anywhere',
    }}
  >
    {error ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
    <span>{children}</span>
  </div>
);

const FindingsList = ({ result }) => {
  const findings = result?.findings || [];

  if (!findings.length) {
    return (
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        No findings were reported by the analyzer.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {findings.map((finding, index) => {
        const style =
          severityStyles[finding.severity] || severityStyles.info;
        const Icon = style.icon;

        return (
          <div
            key={`${finding.file}-${finding.line}-${finding.rule}-${index}`}
            style={{
              padding: '0.9rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.65rem',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <Icon size={17} style={{ color: style.color }} />
              <strong style={{ fontSize: '0.875rem' }}>
                {finding.rule || 'Code finding'}
              </strong>
              <span
                style={{
                  color: style.color,
                  background: style.background,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                }}
              >
                {style.label}
              </span>
            </div>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                marginTop: '0.55rem',
              }}
            >
              {finding.message}
            </p>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                marginTop: '0.5rem',
                overflowWrap: 'anywhere',
              }}
            >
              {finding.file || 'Unknown file'}
              {finding.line != null ? ` : line ${finding.line}` : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const SecurityFindingsList = ({ findings }) => {
  if (!findings?.length) {
    return (
      <div
        style={{
          padding: '1.25rem',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0.65rem',
        }}
      >
        <CheckCircle
          size={28}
          color="#34d399"
          style={{ margin: '0 auto 0.65rem' }}
        />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          No security findings reported
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            marginTop: '0.4rem',
            lineHeight: 1.6,
          }}
        >
          Bandit did not report any findings in the scanned Python files.
          This does not guarantee that the project is free of vulnerabilities.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {findings.map((finding, index) => {
        const severity = String(finding.severity || 'low').toLowerCase();
        const style =
          securitySeverityStyles[severity] || securitySeverityStyles.low;

        return (
          <div
            key={`${finding.file}-${finding.line}-${finding.rule_id}-${index}`}
            style={{
              padding: '1rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.65rem',
              background: 'var(--bg-secondary)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <ShieldAlert size={18} style={{ color: style.color }} />
              <strong
                style={{
                  fontSize: '0.9rem',
                  overflowWrap: 'anywhere',
                }}
              >
                {finding.title || 'Security finding'}
              </strong>
              <span
                style={{
                  color: style.color,
                  background: style.background,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {style.label} severity
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.85rem',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>File</span>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    marginTop: '0.2rem',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {finding.file || 'Unknown file'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Line</span>
                <p style={{ marginTop: '0.2rem' }}>
                  {finding.line ?? 'Not specified'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rule ID</span>
                <p
                  style={{
                    marginTop: '0.2rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {finding.rule_id || 'Not specified'}
                </p>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                <p style={{ marginTop: '0.2rem', textTransform: 'capitalize' }}>
                  {finding.confidence || 'Unknown'}
                </p>
              </div>
            </div>

            {finding.recommendation && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-primary)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '0.3rem',
                  }}
                >
                  Recommended next step
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {finding.recommendation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Displays the result returned by the isolated Docker test runner.
const TestResultPanel = ({ result }) => {
  const status = String(result?.status || 'unknown').toLowerCase();

  const statusColor =
    status === 'passed'
      ? '#34d399'
      : status === 'failed' || status === 'error'
        ? '#f87171'
        : '#fbbf24';

  const metricCards = [
    {
      label: 'Tests Passed',
      value: result?.tests_passed ?? 0,
      color: '#34d399',
    },
    {
      label: 'Tests Failed',
      value: result?.tests_failed ?? 0,
      color: '#f87171',
    },
    {
      label: 'Coverage',
      value:
        result?.coverage_percent == null
          ? 'N/A'
          : `${Number(result.coverage_percent).toFixed(1)}%`,
      color: 'var(--text-primary)',
    },
    {
      label: 'Test Errors',
      value: result?.tests_errors ?? 0,
      color: '#fbbf24',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '1rem',
          borderRadius: '0.65rem',
          border: `1px solid ${statusColor}55`,
          background: `${statusColor}0d`,
        }}
      >
        {status === 'passed' ? (
          <CheckCircle size={23} color={statusColor} />
        ) : (
          <AlertCircle size={23} color={statusColor} />
        )}

        <div style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
            Test Execution{' '}
            <span style={{ color: statusColor, textTransform: 'capitalize' }}>
              {status}
            </span>
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8125rem',
              marginTop: '0.25rem',
            }}
          >
            {result?.execution_performed === false
              ? 'The runner did not execute the test suite.'
              : 'Results returned by the isolated test runner.'}
          </p>
        </div>

        {result?.exit_code != null && (
          <Badge variant={result.exit_code === 0 ? 'success' : 'danger'}>
            Exit code: {result.exit_code}
          </Badge>
        )}
      </div>

      <div className="dashboard-grid">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              {metric.label}
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: metric.color,
                marginTop: '0.3rem',
              }}
            >
              {metric.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Execution Summary
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            fontSize: '0.875rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Test files</span>
            <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>
              {result?.test_file_count ?? 'N/A'}
            </p>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Skipped tests</span>
            <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>
              {result?.tests_skipped ?? 0}
            </p>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Duration</span>
            <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>
              {result?.duration_seconds == null
                ? 'N/A'
                : `${Number(result.duration_seconds).toFixed(2)} seconds`}
            </p>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Execution</span>
            <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>
              {result?.execution_performed === false
                ? 'Not performed'
                : 'Performed'}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Test Output
        </h3>

        <pre
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.78rem',
            lineHeight: 1.6,
            maxHeight: '500px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {result?.output || 'The runner did not return any output.'}
        </pre>
      </Card>
    </div>
  );
};

export const ProjectDetailPage = () => {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Project analysis.
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [structureResult, setStructureResult] = useState(null);

  // Security analysis using Bandit.
  const [securityResult, setSecurityResult] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState('');

  // Docker-based tests and coverage.
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Project ZIP import.
  const [zipFile, setZipFile] = useState(null);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipMessage, setZipMessage] = useState('');
  const [zipError, setZipError] = useState('');

  // Individual file upload.
  const [selectedFile, setSelectedFile] = useState(null);
  const [relativePath, setRelativePath] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Temporary file analysis.
  const [temporaryFile, setTemporaryFile] = useState(null);
  const [temporaryAnalysis, setTemporaryAnalysis] = useState(null);
  const [temporaryLoading, setTemporaryLoading] = useState(false);
  const [temporaryError, setTemporaryError] = useState('');
  const [temporaryMessage, setTemporaryMessage] = useState('');

  // File replacement.
  const [pythonFiles, setPythonFiles] = useState([]);
  const [loadingPythonFiles, setLoadingPythonFiles] = useState(false);
  const [pythonFilesError, setPythonFilesError] = useState('');
  const [replacementTarget, setReplacementTarget] = useState('');
  const [replacementPreview, setReplacementPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceError, setReplaceError] = useState('');
  const [replaceMessage, setReplaceMessage] = useState('');

  const fetchProject = async () => {
    const data = await api.getProject(id);

    setProject(data);
    setAnalysisResult(data.code_analysis || null);
    setStructureResult(data.project_analysis || null);
    setSecurityResult(data.security_analysis || null);

    return data;
  };

  useEffect(() => {
    let cancelled = false;

    const loadProject = async () => {
      setLoading(true);

      try {
        const data = await api.getProject(id);

        if (!cancelled) {
          setProject(data);
          setAnalysisResult(data.code_analysis || null);
          setStructureResult(data.project_analysis || null);
          setSecurityResult(data.security_analysis || null);
          setSecurityError('');
        }
      } catch (error) {
        console.error('Could not load project:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const runAnalysis = async () => {
    try {
      setRunningAnalysis(true);
      setAnalysisError('');

      const result = await api.analyzeProject(id);

      setAnalysisResult(result?.code_analysis || null);
      setStructureResult(result?.analysis || null);

      await fetchProject();
      setActiveTab('analysis');
    } catch (error) {
      console.error('Project analysis failed:', error);
      setAnalysisError(
        getErrorMessage(error, 'Analysis failed. Please try again.')
      );
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Run the dedicated Bandit security scanner.
  const runSecurityScan = async () => {
    try {
      setSecurityLoading(true);
      setSecurityError('');

      const response = await api.scanProjectSecurity(id);
      const result = response?.security_analysis;

      if (!result) {
        setSecurityError(
          'The scan request completed, but no security report was returned.'
        );
        return;
      }

      setSecurityResult(result);

      try {
        const updatedProject = await api.getProject(id);
        setProject(updatedProject);
        setSecurityResult(updatedProject.security_analysis || result);
      } catch (refreshError) {
        console.warn(
          'Security scan succeeded, but project refresh failed:',
          refreshError
        );
      }
    } catch (error) {
      console.error('Security scan failed:', error);
      setSecurityError(
        getErrorMessage(error, 'Security scan failed. Please try again.')
      );
    } finally {
      setSecurityLoading(false);
    }
  };

  // Run tests inside the backend's isolated Docker test runner.
  const runTests = async () => {
    try {
      setTestLoading(true);
      setTestError('');
      setTestResult(null);

      const response = await api.runProjectTests(id);
      const result = response?.test_results ?? response;

      if (!result || typeof result !== 'object') {
        throw new Error('The test runner returned an invalid response.');
      }

      setTestResult(result);
    } catch (error) {
      console.error('Project test execution failed:', error);
      setTestError(
        getErrorMessage(error, 'Failed to run project tests.')
      );
    } finally {
      setTestLoading(false);
    }
  };

  // ZIP selection and validation.
  const handleZipSelection = (event) => {
    const file = event.target.files?.[0] || null;

    setZipFile(file);
    setZipMessage('');
    setZipError('');

    if (file && !file.name.toLowerCase().endsWith('.zip')) {
      setZipFile(null);
      setZipError('Please select a .zip file.');
      event.target.value = '';
      return;
    }

    if (file && file.size > 100 * 1024 * 1024) {
      setZipFile(null);
      setZipError('The ZIP file must be smaller than 100 MB.');
      event.target.value = '';
    }
  };

  // Upload the whole project ZIP using the dedicated ZIP endpoint.
  const handleZipUpload = async () => {
    if (!zipFile) {
      setZipError('Please select a project ZIP file first.');
      return;
    }

    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      setZipError('Please select a valid .zip file.');
      return;
    }

    try {
      setUploadingZip(true);
      setZipError('');
      setZipMessage('');

      const result = await api.uploadProjectZip(id, zipFile);

      setZipMessage(result?.message || 'Project ZIP uploaded successfully.');
      setZipFile(null);

      const input = document.getElementById('project-zip-input');
      if (input) input.value = '';

      await fetchProject();

      setAnalysisResult(null);
      setStructureResult(null);
      setSecurityResult(null);
      setSecurityError('');
      setTestResult(null);
      setTestError('');
    } catch (error) {
      console.error('Project ZIP upload failed:', error);
      setZipError(getErrorMessage(error, 'Project ZIP upload failed.'));
    } finally {
      setUploadingZip(false);
    }
  };

  // Individual file upload.
  const handleFileSelection = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setRelativePath(file ? file.webkitRelativePath || file.name : '');
    setUploadMessage('');
    setUploadError('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first.');
      return;
    }

    const normalizedPath = normalizeRelativePath(relativePath);
    const validationError = validateRelativePath(normalizedPath);

    if (validationError) {
      setUploadError(validationError);
      setUploadMessage('');
      return;
    }

    try {
      setUploadingFile(true);
      setUploadError('');
      setUploadMessage('');

      const result = await api.uploadProjectFile(
        id,
        selectedFile,
        normalizedPath
      );

      setUploadMessage(
        result?.message ||
          `Uploaded ${normalizedPath}. Run project analysis to refresh results.`
      );

      setSelectedFile(null);
      setRelativePath('');

      const input = document.getElementById('project-file-input');
      if (input) input.value = '';

      await fetchProject();

      setAnalysisResult(null);
      setStructureResult(null);
      setSecurityResult(null);
      setTestResult(null);
      setTestError('');
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadError(getErrorMessage(error, 'File upload failed.'));
    } finally {
      setUploadingFile(false);
    }
  };

  // Temporary file analysis.
  const handleTemporaryFileSelection = (event) => {
    const file = event.target.files?.[0] || null;

    setTemporaryFile(file);
    setTemporaryAnalysis(null);
    setTemporaryError('');
    setTemporaryMessage('');
    setReplaceError('');
    setReplaceMessage('');
    setReplacementPreview('');
  };

  const handleTemporaryAnalysis = async () => {
    if (!temporaryFile) {
      setTemporaryError('Select a file before starting temporary analysis.');
      return;
    }

    if (!temporaryFile.name.toLowerCase().endsWith('.py')) {
      setTemporaryError(
        'Temporary code analysis currently supports Python (.py) files.'
      );
      return;
    }

    if (temporaryFile.size > 1024 * 1024) {
      setTemporaryError(
        'This analyzer supports Python files up to 1 MB. Choose a smaller file.'
      );
      return;
    }

    try {
      setTemporaryLoading(true);
      setTemporaryError('');
      setTemporaryMessage('');
      setTemporaryAnalysis(null);

      const result = await api.analyzeTemporaryFile(id, temporaryFile);

      setTemporaryAnalysis(result);
      setTemporaryMessage(
        result?.message ||
          'Temporary analysis completed. The project files were not changed.'
      );
    } catch (error) {
      console.error('Temporary analysis failed:', error);
      setTemporaryError(
        getErrorMessage(error, 'Temporary analysis failed.')
      );
    } finally {
      setTemporaryLoading(false);
    }
  };

  // Load Python files already in the project.
  const handleLoadPythonFiles = async () => {
    try {
      setLoadingPythonFiles(true);
      setPythonFilesError('');
      setReplaceError('');
      setReplaceMessage('');

      const result = await api.listProjectPythonFiles(id);
      const paths = getPythonFilePaths(result);

      setPythonFiles(paths);

      if (paths.length === 0) {
        setPythonFilesError(
          'No existing Python files were returned by the backend.'
        );
        setReplacementTarget('');
        setReplacementPreview('');
      } else {
        setReplacementTarget((current) =>
          paths.includes(current) ? current : paths[0]
        );
        setReplacementPreview('');
      }
    } catch (error) {
      console.error('Could not list project files:', error);
      setPythonFilesError(
        getErrorMessage(error, 'Could not load project Python files.')
      );
    } finally {
      setLoadingPythonFiles(false);
    }
  };

  // Preview replacement locally.
  const handlePreviewReplacement = async () => {
    if (!temporaryFile) {
      setReplaceError('Select and analyze a replacement file first.');
      return;
    }

    if (!temporaryAnalysis) {
      setReplaceError('Run temporary analysis before previewing a replacement.');
      return;
    }

    if (!replacementTarget) {
      setReplaceError('Choose an existing project Python file to replace.');
      return;
    }

    const validationError = validateRelativePath(replacementTarget);

    if (validationError) {
      setReplaceError(validationError);
      return;
    }

    try {
      setPreviewLoading(true);
      setReplaceError('');
      setReplaceMessage('');

      const content = await temporaryFile.text();
      setReplacementPreview(content);
    } catch (error) {
      setReplaceError(
        getErrorMessage(error, 'Could not preview the selected file.')
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // Write replacement only after confirmation.
  const handleReplaceFile = async () => {
    if (!temporaryFile || !temporaryAnalysis || !replacementTarget) {
      setReplaceError(
        'Analyze a file and select an existing target before replacing it.'
      );
      return;
    }

    if (replacementPreview === '') {
      setReplaceError('Preview the replacement before continuing.');
      return;
    }

    const validationError = validateRelativePath(replacementTarget);

    if (validationError) {
      setReplaceError(validationError);
      return;
    }

    const confirmed = window.confirm(
      `Replace the existing project file?\n\nTarget: ${replacementTarget}\nNew file: ${temporaryFile.name}\n\nThis changes the project on disk. Continue only if you have reviewed the preview and understand the change.`
    );

    if (!confirmed) return;

    try {
      setReplaceLoading(true);
      setReplaceError('');
      setReplaceMessage('');

      const result = await api.replaceProjectFile(
        id,
        temporaryFile,
        replacementTarget
      );

      setReplaceMessage(
        result?.message ||
          `Replacement request completed for ${replacementTarget}.`
      );

      setTemporaryFile(null);
      setTemporaryAnalysis(null);
      setReplacementPreview('');

      const input = document.getElementById('temporary-file-input');
      if (input) input.value = '';

      await fetchProject();
      await handleLoadPythonFiles();

      setAnalysisResult(null);
      setStructureResult(null);
      setSecurityResult(null);
      setTestResult(null);
      setTestError('');
    } catch (error) {
      console.error('File replacement failed:', error);
      setReplaceError(getErrorMessage(error, 'File replacement failed.'));
    } finally {
      setReplaceLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading project details..." />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project Not Found"
        description="The requested project could not be loaded."
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analysis', label: 'Code Analysis', icon: Activity },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'tests', label: 'Tests & Coverage', icon: CheckCircle },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
  ];

  const findings = analysisResult?.findings || [];
  const counts = analysisResult?.severity_counts || {
    error: 0,
    warning: 0,
    info: 0,
  };

  const totalFindings =
    analysisResult?.total_findings ?? findings.length;

  const temporaryFindings =
    temporaryAnalysis?.code_analysis?.findings ||
    temporaryAnalysis?.findings ||
    [];

  const temporarySummary =
    temporaryAnalysis?.code_analysis || temporaryAnalysis;

  const securityFindings = securityResult?.findings || [];
  const securityCounts = securityResult?.severity_counts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={14} />
          Back to Projects
        </Link>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {project.name}
              </h1>
              <Badge variant="primary">
                {project.language || 'Source'}
              </Badge>
              <Badge variant="success">Active</Badge>
            </div>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginTop: '0.35rem',
              }}
            >
              {project.description || 'No description provided.'}
            </p>

            {project.repository_url && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '0.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  overflowWrap: 'anywhere',
                }}
              >
                <Github size={14} />
                {project.repository_url}
              </div>
            )}
          </div>

          <Button
            icon={runningAnalysis ? RefreshCw : Play}
            onClick={runAnalysis}
            disabled={runningAnalysis}
          >
            {runningAnalysis ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {analysisError && (
        <StatusMessage error>{analysisError}</StatusMessage>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderBottom: isActive
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-grid">
            <Card>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Python Files Analyzed
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {analysisResult ? analysisResult.files_analyzed : '—'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analysisResult
                  ? `${analysisResult.lines_analyzed} lines inspected`
                  : 'Run analysis to inspect source code'}
              </span>
            </Card>

            <Card>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Total Findings
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {analysisResult ? totalFindings : '—'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analysisResult
                  ? `${counts.error} errors · ${counts.warning} warnings`
                  : 'No analysis results yet'}
              </span>
            </Card>

            <Card>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Syntax Errors
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color:
                    analysisResult?.syntax_errors > 0
                      ? '#f87171'
                      : 'var(--text-primary)',
                  marginTop: '0.25rem',
                }}
              >
                {analysisResult ? analysisResult.syntax_errors : '—'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analysisResult
                  ? 'Reported by the Python parser'
                  : 'Run analysis to check syntax'}
              </span>
            </Card>
          </div>

          {/* Project ZIP import */}
          <Card>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <FileArchive size={23} color="var(--accent-primary)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Import Project ZIP
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  Upload a ZIP containing your project source code. The archive will be extracted and connected to this project before analysis.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label htmlFor="project-zip-input" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Select project ZIP
                </label>
                <input
                  id="project-zip-input"
                  type="file"
                  accept=".zip,application/zip"
                  onChange={handleZipSelection}
                  disabled={uploadingZip}
                  style={{ ...inputStyle, padding: '0.55rem' }}
                />
              </div>

              {zipFile && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Selected: {zipFile.name} ({(zipFile.size / 1024).toFixed(1)} KB)
                </p>
              )}

              <div>
                <Button
                  icon={uploadingZip ? RefreshCw : Upload}
                  onClick={handleZipUpload}
                  disabled={!zipFile || uploadingZip}
                >
                  {uploadingZip ? 'Importing ZIP...' : 'Upload Project ZIP'}
                </Button>
              </div>
            </div>

            {zipMessage && <StatusMessage>{zipMessage}</StatusMessage>}
            {zipError && <StatusMessage error>{zipError}</StatusMessage>}

            {zipMessage && (
              <div style={{ marginTop: '1rem' }}>
                <Button
                  icon={runningAnalysis ? RefreshCw : Play}
                  onClick={runAnalysis}
                  disabled={runningAnalysis}
                >
                  {runningAnalysis ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            )}

            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
              ZIP files only, up to 100 MB. Importing a new ZIP updates the project's source files. Keep a backup if you need to preserve an earlier upload.
            </p>
          </Card>

          {/* Individual file upload */}
          <Card>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <Upload size={22} color="var(--accent-primary)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Upload Individual Project File
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  Upload one file into the already imported project. Use the ZIP section above to import a whole project.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label htmlFor="project-file-input" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Select file
                </label>
                <input
                  id="project-file-input"
                  type="file"
                  onChange={handleFileSelection}
                  disabled={uploadingFile}
                  style={{ ...inputStyle, padding: '0.55rem' }}
                />
              </div>

              <div>
                <label htmlFor="project-relative-path" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Destination path inside project
                </label>
                <input
                  id="project-relative-path"
                  type="text"
                  value={relativePath}
                  onChange={(event) => {
                    setRelativePath(event.target.value);
                    setUploadError('');
                    setUploadMessage('');
                  }}
                  disabled={uploadingFile}
                  placeholder="e.g. src/main.py"
                  autoComplete="off"
                  spellCheck={false}
                  style={inputStyle}
                />
              </div>

              {selectedFile && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}

              <div>
                <Button
                  icon={uploadingFile ? RefreshCw : Upload}
                  onClick={handleFileUpload}
                  disabled={!selectedFile || !relativePath.trim() || uploadingFile}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>

            {uploadMessage && <StatusMessage>{uploadMessage}</StatusMessage>}
            {uploadError && <StatusMessage error>{uploadError}</StatusMessage>}

            {uploadMessage && (
              <div style={{ marginTop: '1rem' }}>
                <Button
                  icon={runningAnalysis ? RefreshCw : Play}
                  onClick={runAnalysis}
                  disabled={runningAnalysis}
                >
                  {runningAnalysis ? 'Analyzing...' : 'Run Analysis Again'}
                </Button>
              </div>
            )}

            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
              This feature writes to the project. If the destination already exists, the backend may replace it. Check the path carefully.
            </p>
          </Card>

          {/* Temporary analysis and replacement */}
          <Card>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <ShieldCheck size={23} color="var(--accent-primary)" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  Temporary File Analysis & Safe Replacement
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  Analyze a local Python file without adding it to the project. If you decide to use it, select an existing project file and review the replacement before confirming.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label htmlFor="temporary-file-input" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  1. Select a Python file for temporary analysis
                </label>
                <input
                  id="temporary-file-input"
                  type="file"
                  accept=".py,text/x-python"
                  onChange={handleTemporaryFileSelection}
                  disabled={temporaryLoading || replaceLoading}
                  style={{ ...inputStyle, padding: '0.55rem' }}
                />
              </div>

              {temporaryFile && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', overflowWrap: 'anywhere' }}>
                  <FileCode2 size={16} />
                  <span>{temporaryFile.name} ({(temporaryFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              <div>
                <Button
                  icon={temporaryLoading ? RefreshCw : Search}
                  onClick={handleTemporaryAnalysis}
                  disabled={!temporaryFile || temporaryLoading || replaceLoading}
                >
                  {temporaryLoading ? 'Analyzing Temporarily...' : 'Analyze File Temporarily'}
                </Button>
              </div>

              {temporaryError && <StatusMessage error>{temporaryError}</StatusMessage>}
              {temporaryMessage && <StatusMessage>{temporaryMessage}</StatusMessage>}

              {temporaryAnalysis && (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <h4 style={{ fontWeight: 600 }}>Temporary Analysis Results</h4>
                  <div className="dashboard-grid">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files analyzed</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {temporarySummary?.files_analyzed ?? '—'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Findings</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {temporarySummary?.total_findings ?? temporaryFindings.length}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syntax errors</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {temporarySummary?.syntax_errors ?? '—'}
                      </p>
                    </div>
                  </div>
                  <FindingsList result={{ findings: temporaryFindings }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                    Analysis does not execute the selected Python code. These results are separate from the saved project-wide analysis.
                  </p>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                  2. Choose an existing project file
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '0.8rem' }}>
                  This lists Python files already in the project. The replacement target is not written until you confirm the final action.
                </p>

                <Button
                  icon={loadingPythonFiles ? RefreshCw : Search}
                  onClick={handleLoadPythonFiles}
                  disabled={loadingPythonFiles || replaceLoading}
                >
                  {loadingPythonFiles ? 'Loading Files...' : 'Load Existing Python Files'}
                </Button>

                {pythonFilesError && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <StatusMessage error>{pythonFilesError}</StatusMessage>
                  </div>
                )}

                {pythonFiles.length > 0 && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="replacement-target" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Existing file to replace
                    </label>
                    <select
                      id="replacement-target"
                      value={replacementTarget}
                      onChange={(event) => {
                        setReplacementTarget(event.target.value);
                        setReplacementPreview('');
                        setReplaceError('');
                        setReplaceMessage('');
                      }}
                      disabled={replaceLoading}
                      style={inputStyle}
                    >
                      {pythonFiles.map((path) => (
                        <option key={path} value={path}>{path}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                  3. Preview the new file
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '0.8rem' }}>
                  Review the contents of the selected local file before deciding whether to replace the target.
                </p>

                <Button
                  icon={previewLoading ? RefreshCw : Eye}
                  onClick={handlePreviewReplacement}
                  disabled={!temporaryFile || !temporaryAnalysis || !replacementTarget || previewLoading || replaceLoading}
                >
                  {previewLoading ? 'Loading Preview...' : 'Preview Replacement'}
                </Button>

                {replacementPreview !== '' && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
                      New file: <strong>{temporaryFile?.name}</strong>
                      <br />
                      Target: <strong>{replacementTarget}</strong>
                    </p>
                    <pre
                      style={{
                        maxHeight: '320px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        padding: '0.9rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {replacementPreview}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.25rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                  4. Confirm replacement
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: '0.8rem' }}>
                  This action writes to the existing project. Check the selected target and review the preview carefully.
                </p>

                <Button
                  icon={replaceLoading ? RefreshCw : RotateCcw}
                  onClick={handleReplaceFile}
                  disabled={
                    !temporaryFile ||
                    !temporaryAnalysis ||
                    !replacementTarget ||
                    replacementPreview === '' ||
                    replaceLoading ||
                    temporaryLoading
                  }
                >
                  {replaceLoading ? 'Replacing File...' : 'Replace Existing File'}
                </Button>

                {replaceError && <StatusMessage error>{replaceError}</StatusMessage>}
                {replaceMessage && <StatusMessage>{replaceMessage}</StatusMessage>}
              </div>
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Repository Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Project ID:</span>
                <p style={{ fontFamily: 'var(--font-mono)', marginTop: '0.25rem', overflowWrap: 'anywhere' }}>
                  {project._id || project.id || id}
                </p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Primary Language:</span>
                <p style={{ marginTop: '0.25rem' }}>{project.language || 'Not specified'}</p>
              </div>
              {structureResult?.file_count !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Project Files:</span>
                  <p style={{ marginTop: '0.25rem' }}>{structureResult.file_count}</p>
                </div>
              )}
              {structureResult?.framework && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Detected Framework:</span>
                  <p style={{ marginTop: '0.25rem' }}>{structureResult.framework}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Analysis Summary
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {analysisResult
                ? `Project analysis completed. ${totalFindings} finding(s) were reported across ${analysisResult.files_analyzed} Python file(s).`
                : 'No project-wide code-quality analysis is available yet. Run analysis to inspect Python source files.'}
            </p>

            {!analysisResult && (
              <div style={{ marginTop: '1rem' }}>
                <Button icon={Play} onClick={runAnalysis} disabled={runningAnalysis}>
                  {runningAnalysis ? 'Analyzing...' : 'Analyze Project'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Code Analysis */}
      {activeTab === 'analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Static Code Analysis</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                  Checks Python source code. Analysis does not execute the source files.
                </p>
              </div>
              <Button icon={runningAnalysis ? RefreshCw : Play} onClick={runAnalysis} disabled={runningAnalysis}>
                {runningAnalysis ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </div>
          </Card>

          {runningAnalysis && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <RefreshCw size={18} />
                Inspecting project files...
              </div>
            </Card>
          )}

          {!analysisResult && !runningAnalysis && (
            <Card>
              <EmptyState
                icon={Activity}
                title="No Code Analysis Results"
                description="Run analysis to inspect Python files and see findings."
                actionText="Run Analysis"
                onAction={runAnalysis}
              />
            </Card>
          )}

          {analysisResult && (
            <>
              <div className="dashboard-grid">
                {Object.entries(severityStyles).map(([severity, style]) => {
                  const Icon = style.icon;

                  return (
                    <Card key={severity}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: style.color }}>
                        <Icon size={18} />
                        <span style={{ fontSize: '0.875rem' }}>{style.label}</span>
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        {counts[severity] ?? 0}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Findings</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                      {totalFindings} finding(s) reported
                    </p>
                  </div>
                  {analysisResult.findings_truncated && (
                    <Badge variant="warning">Results limited to 500 findings</Badge>
                  )}
                </div>
                <FindingsList result={analysisResult} />
              </Card>

              <Card>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Analysis Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Files analyzed</span>
                    <p style={{ marginTop: '0.25rem' }}>{analysisResult.files_analyzed}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Lines inspected</span>
                    <p style={{ marginTop: '0.25rem' }}>{analysisResult.lines_analyzed}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Syntax errors</span>
                    <p style={{ marginTop: '0.25rem' }}>{analysisResult.syntax_errors}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Source execution</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      {analysisResult.execution_performed ? 'Performed' : 'Not performed'}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                <ShieldCheck
                  size={25}
                  color="var(--accent-primary)"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Python Security Scan
                  </h2>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      marginTop: '0.4rem',
                      lineHeight: 1.6,
                    }}
                  >
                    Run Bandit against the uploaded Python project to identify
                    common security issues. The scanner inspects source code;
                    it does not execute your project.
                  </p>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      lineHeight: 1.6,
                    }}
                  >
                    A clean scan does not guarantee that an application is
                    secure. Review findings in their full context.
                  </p>
                </div>
              </div>

              <Button
                icon={securityLoading ? RefreshCw : ShieldCheck}
                onClick={runSecurityScan}
                disabled={securityLoading}
              >
                {securityLoading
                  ? 'Scanning...'
                  : securityResult
                    ? 'Run Scan Again'
                    : 'Run Security Scan'}
              </Button>
            </div>

            {securityError && (
              <StatusMessage error>{securityError}</StatusMessage>
            )}

            {securityLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginTop: '1rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                <RefreshCw size={17} />
                Scanning Python source files with Bandit. This may take a
                moment...
              </div>
            )}
          </Card>

          {!securityResult && !securityLoading && !securityError && (
            <Card>
              <EmptyState
                icon={ShieldAlert}
                title="No Security Scan Results Yet"
                description="Run the security scan to check your uploaded Python files with Bandit. Your results will be saved with the project."
              />
            </Card>
          )}

          {securityResult && (
            <>
              <div className="dashboard-grid">
                <Card>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Total Findings
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.3rem' }}>
                    {securityResult.total_findings ?? securityFindings.length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reported by Bandit
                  </span>
                </Card>

                <Card>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    High Severity
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f87171', marginTop: '0.3rem' }}>
                    {securityCounts.high ?? securityFindings.filter((item) => String(item.severity).toLowerCase() === 'high').length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Requires careful review
                  </span>
                </Card>

                <Card>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Medium Severity
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.3rem' }}>
                    {securityCounts.medium ?? securityFindings.filter((item) => String(item.severity).toLowerCase() === 'medium').length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Review the affected code
                  </span>
                </Card>

                <Card>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Low Severity
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.3rem' }}>
                    {securityCounts.low ?? securityFindings.filter((item) => String(item.severity).toLowerCase() === 'low').length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Inspect the reported issues
                  </span>
                </Card>
              </div>

              <Card>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                      Security Findings
                    </h3>
                    <p
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.8125rem',
                        marginTop: '0.3rem',
                      }}
                    >
                      {securityFindings.length} finding(s) returned in this report
                    </p>
                  </div>

                  <Badge
                    variant={
                      securityFindings.some(
                        (item) =>
                          String(item.severity).toLowerCase() === 'high'
                      )
                        ? 'danger'
                        : 'primary'
                    }
                  >
                    {securityResult.scanner || 'Bandit'}
                  </Badge>
                </div>

                <SecurityFindingsList findings={securityFindings} />
              </Card>

              <Card>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Scan Details
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Scanner</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      {securityResult.scanner || 'Bandit'}
                    </p>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                    <p
                      style={{
                        marginTop: '0.25rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {securityResult.status || 'completed'}
                    </p>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Lines of code</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      {securityResult.metrics?.loc ?? 'Not reported'}
                    </p>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Skipped tests</span>
                    <p style={{ marginTop: '0.25rem' }}>
                      {securityResult.metrics?.skipped_tests ?? 'Not reported'}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    lineHeight: 1.6,
                    marginTop: '1rem',
                  }}
                >
                  Security scan results are saved separately from static code
                  analysis. If you upload or replace project files, run the
                  security scan again to refresh the report.
                </p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tests and Coverage */}
      {activeTab === 'tests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                <CheckCircle
                  size={25}
                  color="var(--accent-primary)"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Tests &amp; Coverage
                  </h2>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      marginTop: '0.4rem',
                      lineHeight: 1.6,
                    }}
                  >
                    Run the project's test suite in an isolated Docker
                    environment and inspect the test output and coverage report.
                  </p>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      lineHeight: 1.6,
                    }}
                  >
                    Only run tests from projects you trust. Isolation reduces
                    risk but does not guarantee that arbitrary code is harmless.
                  </p>
                </div>
              </div>

              <Button
                icon={testLoading ? RefreshCw : Play}
                onClick={runTests}
                disabled={testLoading}
              >
                {testLoading
                  ? 'Running Tests...'
                  : testResult
                    ? 'Run Tests Again'
                    : 'Run Tests'}
              </Button>
            </div>

            {testError && (
              <StatusMessage error>{testError}</StatusMessage>
            )}

            {testLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginTop: '1rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                <RefreshCw size={17} />
                Running tests in Docker and collecting coverage. Please wait...
              </div>
            )}
          </Card>

          {!testResult && !testLoading && !testError && (
            <Card>
              <EmptyState
                icon={CheckCircle}
                title="No Test Reports Yet"
                description="Select Run Tests to execute the test suite and generate a coverage report."
              />
            </Card>
          )}

          {testResult && !testLoading && (
            <TestResultPanel result={testResult} />
          )}
        </div>
      )}

      {/* AI Copilot */}
      {activeTab === 'copilot' && (
        <Card>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ask questions directly about this project's code structure and architecture.
          </p>
          <Link to="/copilot">
            <Button icon={Bot}>Open AI Copilot for this Project</Button>
          </Link>
        </Card>
      )}
    </div>
  );
};
