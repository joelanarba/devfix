import type { Theme } from '../types'
import { LogoIcon, MoonIcon, SunIcon, ExternalLinkIcon, ResetIcon } from './Icons'

interface Props {
  theme: Theme
  onToggleTheme: () => void
  onNewAnalysis: () => void
  onScrollToExamples: () => void
  hasActiveInput: boolean
}

export default function Header({
  theme,
  onToggleTheme,
  onNewAnalysis,
  onScrollToExamples,
  hasActiveInput,
}: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <div className="header-brand">
            <div className="header-logo-badge">
              <LogoIcon className="header-logo-icon" size={18} />
            </div>
            <div className="header-title-group">
              <span className="header-title">DevFix</span>
              <span className="header-version">v1.2 // STABLE</span>
            </div>
          </div>

          <div className="header-status-indicator" title="Bedrock Nova runtime connected">
            <span className="status-pip status-pip-live" />
            <span className="status-text">DIAGNOSTIC ENGINE ACTIVE</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Main Navigation">
          <button
            type="button"
            className="header-btn"
            onClick={onScrollToExamples}
            title="Browse common error examples"
          >
            <span>Examples</span>
            <kbd className="header-kbd">⌘E</kbd>
          </button>

          {hasActiveInput && (
            <button
              type="button"
              className="header-btn"
              onClick={onNewAnalysis}
              title="Reset workspace (Esc)"
            >
              <ResetIcon size={13} />
              <span>Reset</span>
              <kbd className="header-kbd">Esc</kbd>
            </button>
          )}

          <div className="header-divider" />

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          >
            {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>

          <a
            href="https://github.com"
            className="header-icon-link"
            target="_blank"
            rel="noopener noreferrer"
            title="Documentation & Architecture"
            aria-label="Documentation on GitHub"
          >
            <span>Docs</span>
            <ExternalLinkIcon size={12} />
          </a>
        </nav>
      </div>
    </header>
  )
}
