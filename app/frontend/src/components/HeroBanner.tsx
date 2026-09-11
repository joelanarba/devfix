import { TerminalIcon, ActivityIcon, CodeIcon } from './Icons'

export default function HeroBanner() {
  return (
    <section className="hero-banner" aria-label="DevFix Introduction">
      <div className="hero-badge-row">
        <span className="hero-technical-tag">
          <TerminalIcon size={12} />
          <span>SYS.DIAG // 0xFIX</span>
        </span>
        <span className="hero-meta-divider">•</span>
        <span className="hero-meta-item">Root-Cause Isolation</span>
        <span className="hero-meta-divider">•</span>
        <span className="hero-meta-item">Actionable Code Patch</span>
      </div>

      <h1 className="hero-heading">
        Turn runtime errors <br />
        <span className="hero-heading-gradient">into verified solutions.</span>
      </h1>

      <p className="hero-subtext">
        Paste any stack trace, compiler diagnostic, or unhandled exception. DevFix isolates the underlying root cause and synthesizes a production-ready fix in seconds.
      </p>

      <div className="hero-telemetry-bar">
        <div className="telemetry-chip">
          <span className="telemetry-pip" />
          <span className="telemetry-label">INFERENCE:</span>
          <span className="telemetry-val">Amazon Bedrock Nova</span>
        </div>
        <div className="telemetry-chip">
          <ActivityIcon size={13} className="telemetry-icon" />
          <span className="telemetry-label">STATE:</span>
          <span className="telemetry-val">Stateless (No Storage)</span>
        </div>
        <div className="telemetry-chip">
          <CodeIcon size={13} className="telemetry-icon" />
          <span className="telemetry-label">LANGUAGES:</span>
          <span className="telemetry-val">JavaScript, Python, Go, Rust, SQL+</span>
        </div>
      </div>
    </section>
  )
}
