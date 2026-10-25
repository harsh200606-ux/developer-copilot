
import React, { useEffect, useState } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Copy,
  Check,
  Terminal,
  FolderGit2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../services/api';

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 3500;

export const CopilotPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Developer Copilot. Ask me programming questions, debug errors, or request help writing tests.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError('');

        const data = await api.getProjects();

        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setProjectsError(
            error.message || 'Could not load your projects.'
          );
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const getProjectId = (project) =>
    String(project.id || project._id || '');

  const selectedProject = projects.find(
    (project) => getProjectId(project) === selectedProjectId
  );

  const suggestedPrompts = [
    'Explain the authentication flow',
    'Find potential bugs in project',
    'How can I improve this code?',
    'Generate unit tests for this function',
  ];

  const handleSend = async (text) => {
    const prompt = (text ?? input).trim();

    if (!prompt || loading) return;

    // Keep recent conversation messages and ensure each message
    // stays below the backend's 4000-character limit.
    const history = messages
      .filter(
        (msg) =>
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((msg) => ({
        role: msg.role,
        content:
          msg.content.length > MAX_HISTORY_CHARS
            ? `${msg.content.slice(0, MAX_HISTORY_CHARS)}\n\n[Earlier message truncated to fit chat history limits.]`
            : msg.content,
      }));

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: prompt },
    ]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.request('/api/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: prompt,
          history,
          ...(selectedProjectId
            ? { project_id: selectedProjectId }
            : {}),
        }),
      });

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.reply,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: `Sorry, I couldn't get a response from the AI service.\n\n${error.message || 'Please try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content, index) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Clipboard access failed. Please select and copy the text manually.',
        },
      ]);
    }
  };

  const renderMarkdown = (content) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="copilot-md-heading">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="copilot-md-heading">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="copilot-md-heading">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="copilot-md-paragraph">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="copilot-md-list">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="copilot-md-list">{children}</ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="copilot-md-quote">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="copilot-md-link"
          >
            {children}
          </a>
        ),
        pre: ({ children }) => (
          <pre className="copilot-md-pre">{children}</pre>
        ),
        code({ children, className, ...props }) {
          const match = /language-([\w+-]+)/.exec(className || '');

          if (match) {
            return (
              <SyntaxHighlighter
                language={match[1]}
                style={oneDark}
                PreTag="div"
                customStyle={{
                  margin: '0.75rem 0',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  maxWidth: '100%',
                  overflowX: 'auto',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'Consolas, Monaco, monospace',
                  },
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          }

          return (
            <code className="copilot-md-inline-code" {...props}>
              {children}
            </code>
          );
        },
        table: ({ children }) => (
          <div className="copilot-md-table-wrap">
            <table className="copilot-md-table">{children}</table>
          </div>
        ),
        th: ({ children }) => <th>{children}</th>,
        td: ({ children }) => <td>{children}</td>,
        hr: () => <hr className="copilot-md-divider" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );

  const panelTextStyle = {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.6,
  };

  const selectStyle = {
    width: '100%',
    minWidth: 0,
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '0.65rem',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
  };

  return (
    <div
      className="copilot-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 260px) minmax(0, 1fr)',
        gap: '1.25rem',
        height: 'calc(100vh - 120px)',
        minHeight: '400px',
      }}
    >
      {/* Context Panel */}
      <Card
        className="copilot-sidebar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <Terminal size={18} color="var(--accent-primary)" />
          <span>Context Panel</span>
        </div>

        <div>
          <label
            htmlFor="copilot-project-select"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            SELECT PROJECT
          </label>

          <select
            id="copilot-project-select"
            aria-label="Select project for AI context"
            value={selectedProjectId}
            onChange={(event) =>
              setSelectedProjectId(event.target.value)
            }
            disabled={projectsLoading || loading}
            style={selectStyle}
          >
            <option value="">General chat (no project)</option>
            {projects.map((project) => {
              const id = getProjectId(project);

              if (!id) return null;

              return (
                <option key={id} value={id}>
                  {project.name || 'Untitled project'}
                </option>
              );
            })}
          </select>

          {projectsLoading && (
            <p style={{ ...panelTextStyle, marginTop: '0.5rem' }}>
              Loading projects...
            </p>
          )}

          {!projectsLoading && projectsError && (
            <p
              role="alert"
              style={{
                ...panelTextStyle,
                color: 'var(--danger, #fb7185)',
                marginTop: '0.5rem',
              }}
            >
              {projectsError}
            </p>
          )}

          {!projectsLoading &&
            !projectsError &&
            projects.length === 0 && (
              <p style={{ ...panelTextStyle, marginTop: '0.5rem' }}>
                No projects found. Create a project and upload its ZIP first.
              </p>
            )}
        </div>

        <div
          style={{
            padding: '0.75rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 600,
              fontSize: '0.8125rem',
              marginBottom: '0.45rem',
            }}
          >
            <FolderGit2
              size={16}
              color="var(--accent-primary)"
            />
            {selectedProject
              ? selectedProject.name || 'Selected project'
              : 'General conversation'}
          </div>

          <p style={panelTextStyle}>
            {selectedProject
              ? selectedProject.source_filename
                ? `Selected project: ${selectedProject.source_filename}. Relevant uploaded source files will be provided to the AI.`
                : 'The AI will try to use this project’s uploaded source files. If no ZIP has been uploaded, the backend will ask you to upload one.'
              : 'No project selected. The AI will answer using your question and conversation history.'}
          </p>
        </div>

        <p style={panelTextStyle}>
          When a project is selected, Copilot retrieves a limited set of
          relevant source files for each question. It does not execute
          project code as part of chat.
        </p>

        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            SUGGESTED QUESTIONS
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  textAlign: 'left',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Chat Interface */}
      <Card
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <FolderGit2
            size={17}
            color="var(--accent-primary)"
          />
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            {selectedProject
              ? `Project context: ${selectedProject.name || 'Untitled project'}`
              : 'General AI chat'}
          </span>
        </div>

        {/* Messages */}
        <div
          className="copilot-messages"
          aria-live="polite"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '0 0.5rem 0.5rem 0',
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                  width: 'fit-content',
                  minWidth: 0,
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={16} color="#fff" />
                  </div>
                )}

                <div
                  className="copilot-message-bubble"
                  style={{
                    background: isUser
                      ? 'var(--accent-primary)'
                      : 'var(--bg-tertiary)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    lineHeight: 1.65,
                    border: isUser
                      ? 'none'
                      : '1px solid var(--border-subtle)',
                    position: 'relative',
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  <div className="copilot-markdown">
                    {renderMarkdown(msg.content)}
                  </div>

                  {!isUser && (
                    <button
                      type="button"
                      aria-label="Copy assistant response"
                      title="Copy response"
                      onClick={() => handleCopy(msg.content, index)}
                      style={{
                        position: 'absolute',
                        top: '0.4rem',
                        right: '0.4rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '5px',
                        padding: '0.35rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {copiedIndex === index ? (
                        <Check size={14} color="var(--success)" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} color="var(--text-secondary)" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} color="#fff" />
              </div>

              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                }}
              >
                AI Copilot is thinking...
              </span>
            </div>
          )}
        </div>

        {/* Input form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
          }}
        >
          <input
            type="text"
            aria-label="Message to AI Copilot"
            placeholder={
              selectedProject
                ? `Ask about ${selectedProject.name || 'this project'}...`
                : 'Ask a programming question...'
            }
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '0.75rem 1rem',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
            }}
          />

          <Button
            type="submit"
            icon={Send}
            disabled={loading || !input.trim()}
          >
            Send
          </Button>
        </form>
      </Card>

      {/* Markdown and responsive styling */}
      <style>{`
        .copilot-grid {
          min-width: 0;
        }

        .copilot-markdown {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .copilot-markdown > :first-child {
          margin-top: 0;
        }

        .copilot-markdown > :last-child {
          margin-bottom: 0;
        }

        .copilot-markdown p {
          margin: 0 0 0.8rem;
          white-space: pre-wrap;
        }

        .copilot-markdown .copilot-md-heading {
          margin: 1rem 0 0.5rem;
          padding-right: 1.5rem;
          font-weight: 650;
          line-height: 1.35;
        }

        .copilot-markdown h1 {
          font-size: 1.25rem;
        }

        .copilot-markdown h2 {
          font-size: 1.1rem;
        }

        .copilot-markdown h3 {
          font-size: 1rem;
        }

        .copilot-markdown .copilot-md-list {
          padding-left: 1.5rem;
          margin: 0.5rem 0 1rem;
        }

        .copilot-markdown li {
          margin: 0.25rem 0;
          padding-left: 0.15rem;
        }

        .copilot-markdown .copilot-md-quote {
          margin: 0.75rem 0;
          padding: 0.25rem 0 0.25rem 0.75rem;
          border-left: 3px solid var(--accent-primary);
          color: var(--text-secondary);
        }

        .copilot-markdown .copilot-md-link {
          color: var(--accent-primary);
          text-decoration: underline;
        }

        .copilot-markdown .copilot-md-pre {
          max-width: 100%;
          overflow-x: auto;
          white-space: pre;
        }

        .copilot-markdown .copilot-md-inline-code {
          background: var(--bg-secondary);
          padding: 0.12rem 0.3rem;
          border-radius: 4px;
          font-family: Consolas, Monaco, monospace;
          font-size: 0.9em;
          overflow-wrap: anywhere;
        }

        .copilot-markdown .copilot-md-table-wrap {
          max-width: 100%;
          overflow-x: auto;
          margin: 0.75rem 0;
        }

        .copilot-markdown .copilot-md-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.85rem;
        }

        .copilot-markdown .copilot-md-table th,
        .copilot-markdown .copilot-md-table td {
          border: 1px solid var(--border-subtle);
          padding: 0.5rem;
          text-align: left;
        }

        .copilot-markdown .copilot-md-divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 1rem 0;
        }

        @media (max-width: 768px) {
          .copilot-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .copilot-sidebar {
            display: none !important;
          }

          .copilot-message-bubble {
            max-width: calc(100vw - 100px);
          }
        }
      `}</style>
    </div>
  );
};
