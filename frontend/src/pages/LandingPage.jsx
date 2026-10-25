import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Code2, Cpu, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #161c2e, #0a0d14 70%)' }}>
      {/* Header */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>DevCopilot</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: '900px', margin: '4rem auto 3rem', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '999px', fontSize: '0.8125rem', color: '#818cf8', marginBottom: '1.5rem' }}>
          <Sparkles size={14} /> Next-Gen AI Software Engineering Platform
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Understand your code. <br />
          <span style={{ background: 'linear-gradient(135deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Build better software.
          </span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Connect your GitHub repositories, analyze your code, detect bugs and security issues, run tests, and use AI to understand and improve your projects.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/register">
            <Button size="lg" icon={ArrowRight}>Get Started Free</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Product Preview Mockup */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
          </div>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>DevCopilot Workspace</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Active</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FastAPI • MongoDB • JWT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Card style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code Quality</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>98.4%</div>
              </Card>
              <Card style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vulnerabilities</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>0 Critical</div>
              </Card>
              <Card style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Test Coverage</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#818cf8' }}>92.8%</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <Code2 size={28} color="#6366f1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Code Analysis</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Detect code quality issues, style violations, and architectural anti-patterns across pull requests.
            </p>
          </Card>
          <Card>
            <ShieldCheck size={28} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Security Scanning</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Identify vulnerabilities, secrets leaks, and outdated packages before deploying to production.
            </p>
          </Card>
          <Card>
            <Terminal size={28} color="#38bdf8" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Test & Coverage</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Inspect test execution matrices, skipped suites, and line-by-line coverage progression.
            </p>
          </Card>
          <Card>
            <Cpu size={28} color="#f59e0b" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Copilot</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Interactive natural language assistant with repository context to explain errors and generate fixes.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};