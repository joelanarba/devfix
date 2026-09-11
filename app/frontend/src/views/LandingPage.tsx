import { Link } from 'react-router-dom'
import { ArrowRight, Terminal, Zap, Shield, Code2 } from 'lucide-react'
import BackgroundGrid from '../components/BackgroundGrid'

export default function LandingPage() {
  return (
    <div className="landing-layout">
      <BackgroundGrid />
      <header className="landing-header">
        <div className="landing-container header-inner">
          <div className="header-brand">
            <div className="header-logo-badge">
              <Terminal size={16} />
            </div>
            <div className="header-title-group">
              <span className="header-title">DevFix</span>
            </div>
          </div>
          <nav className="header-nav">
            <Link to="/app" className="header-btn btn-primary">
              Launch App <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="landing-container hero-content">
            <div className="hero-badge-row">
              <span className="hero-technical-tag">
                <span className="status-pip status-pip-live" /> SYSTEM ONLINE
              </span>
              <span className="hero-meta-divider">/</span>
              <span>DEVFIX_OS v2.0</span>
            </div>
            <h1 className="hero-heading">
              Turn errors into <span className="hero-heading-gradient">answers.</span>
            </h1>
            <p className="hero-subtext">
              DevFix is a focused developer tool where you paste an error message, stack trace, or problematic code and receive a clear technical explanation and actionable fix in seconds.
            </p>
            <div className="hero-actions">
              <Link to="/app/analyze" className="hero-cta btn-primary btn-large">
                Start Debugging
                <ArrowRight size={16} />
              </Link>
              <Link to="/app/lab" className="hero-cta btn-secondary btn-large">
                View Error Lab
              </Link>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="landing-container">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon"><Zap size={20} /></div>
                <h3>Instant Diagnostics</h3>
                <p>Paste any error and get immediate structured root cause analysis powered by AWS Bedrock.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Code2 size={20} /></div>
                <h3>Actionable Diff Fixes</h3>
                <p>See exactly what code to change with inline diffs and precise file-level context.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon"><Shield size={20} /></div>
                <h3>Secure by Design</h3>
                <p>Enterprise-grade security. No data retention, stateless backend, and zero third-party telemetry.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <p className="footer-text">© {new Date().getFullYear()} DevFix. Built for developers.</p>
        </div>
      </footer>
    </div>
  )
}
