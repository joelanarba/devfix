import { useEffect, useRef } from 'react'
import AnalyzeButton from './AnalyzeButton'
import { TerminalIcon, ResetIcon, ChevronDownIcon, CheckIcon } from './Icons'

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect runtime' },
  { value: 'javascript', label: 'JavaScript (Node / V8)' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python (3.x)' },
  { value: 'java', label: 'Java / JVM' },
  { value: 'go', label: 'Go (Golang)' },
  { value: 'rust', label: 'Rust (rustc / cargo)' },
  { value: 'csharp', label: 'C# (.NET)' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
]

interface Props {
  input: string
  language: string
  loading: boolean
  hasSuccess: boolean
  onInputChange: (value: string) => void
  onLanguageChange: (value: string) => void
  onAnalyze: () => void
  onReset: () => void
}

export default function DiagnosticEditor({
  input,
  language,
  loading,
  hasSuccess,
  onInputChange,
  onLanguageChange,
  onAnalyze,
  onReset,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Pressing Enter sends the text (Shift + Enter creates a newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading && input.trim()) {
        onAnalyze()
      }
      return
    }

    // Ctrl/Cmd + Enter also sends
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!loading && input.trim()) {
        onAnalyze()
      }
      return
    }

    if (e.key === 'Escape' && !loading && input) {
      onReset()
    }
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        onInputChange(text)
        textareaRef.current?.focus()
      }
    } catch {
      // noop
    }
  }

  return (
    <div className="editor-window" role="region" aria-label="Diagnostic Editor Console">
      {/* Editor Titlebar / Controls */}
      <div className="editor-titlebar">
        <div className="editor-tabs">
          <div className="editor-tab active-tab">
            <span className={`editor-tab-dot ${input ? 'dot-active' : ''}`} />
            <TerminalIcon size={14} className="editor-tab-icon" />
            <span className="editor-tab-title">Error Input</span>
          </div>
        </div>

        <div className="editor-titlebar-right">
          <div className="editor-lang-picker">
            <label htmlFor="editor-lang-select" className="sr-only">
              Select Language
            </label>
            <select
              id="editor-lang-select"
              className="editor-lang-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              disabled={loading}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={12} className="editor-select-arrow" />
          </div>

          <div className="editor-actions-strip">
            {!input && (
              <button
                type="button"
                className="editor-tool-btn"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
              >
                Paste
              </button>
            )}

            {input && (
              <button
                type="button"
                className="editor-tool-btn"
                onClick={onReset}
                disabled={loading}
                title="Clear input (Esc)"
              >
                <ResetIcon size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Body - Undivided, Full-width */}
      <div className="editor-body">
        <textarea
          ref={textareaRef}
          id="error-input"
          className="editor-textarea"
          placeholder={"Paste your error message, stack trace, or problematic code snippet here...\n\nPress Enter to send (Shift + Enter for new line)"}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Error or code input"
        />
      </div>

      {/* Editor Statusbar & Send Footer */}
      <div className="editor-statusbar">
        <div className="editor-status-left">
          <span className="status-metric">
            <span className="metric-val">{input.length.toLocaleString()} / 10,000 chars</span>
          </span>
          <span className="status-separator">•</span>
          <span className="editor-shortcut-hint">
            <kbd className="kbd-badge">Enter</kbd> to send, <kbd className="kbd-badge">Shift + Enter</kbd> for newline
          </span>
        </div>

        <div className="editor-status-right">
          {hasSuccess && !loading && (
            <span className="diagnosis-ready-badge">
              <CheckIcon size={13} />
              <span>Diagnosis ready</span>
            </span>
          )}

          <AnalyzeButton
            loading={loading}
            disabled={!input.trim()}
            onClick={onAnalyze}
            hasSuccess={hasSuccess}
          />
        </div>
      </div>
    </div>
  )
}
