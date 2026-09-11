import { useEffect, useRef, useMemo } from 'react'
import AnalyzeButton from './AnalyzeButton'
import { TerminalIcon, ResetIcon, ChevronDownIcon } from './Icons'

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
  const gutterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Calculate lines for line-number gutter
  const lineCount = useMemo(() => {
    if (!input) return 1
    return input.split('\n').length
  }, [input])

  const lineNumbers = useMemo(() => {
    return Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1)
  }, [lineCount])

  // Synchronize scrolling between textarea and gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!loading && input.trim()) {
        onAnalyze()
      }
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

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  return (
    <div className="editor-window" role="region" aria-label="Diagnostic Editor Console">
      {/* Editor Titlebar / Tab Strip */}
      <div className="editor-titlebar">
        <div className="editor-tabs">
          <div className="editor-tab active-tab">
            <span className={`editor-tab-dot ${input ? 'dot-active' : ''}`} />
            <TerminalIcon size={13} className="editor-tab-icon" />
            <span className="editor-tab-title">stdin.err</span>
            <span className="editor-tab-ext">raw</span>
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

      {/* Editor Body with Line-Number Gutter */}
      <div className="editor-body">
        <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
          {lineNumbers.map((num) => (
            <div
              key={num}
              className={`gutter-line ${num <= lineCount && input ? 'gutter-active' : ''}`}
            >
              {num}
            </div>
          ))}
        </div>

        <div className="editor-input-wrapper">
          <textarea
            ref={textareaRef}
            id="error-input"
            className="editor-textarea"
            placeholder={`// Paste your compiler diagnostic, stack trace, or broken code snippet here...\n// Press ${shortcutKey} + Enter to run analysis`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Error or code input"
          />
        </div>
      </div>

      {/* Editor Statusbar & Trigger Footer */}
      <div className="editor-statusbar">
        <div className="editor-status-left">
          <span className="status-metric">
            <span className="metric-label">LN:</span>
            <span className="metric-val">{lineCount}</span>
          </span>
          <span className="status-separator">|</span>
          <span className="status-metric">
            <span className="metric-label">COL:</span>
            <span className="metric-val">{input.length > 0 ? (input.split('\n').pop()?.length ?? 0) : 0}</span>
          </span>
          <span className="status-separator">|</span>
          <span className="status-metric">
            <span className="metric-label">CHARS:</span>
            <span className="metric-val">{input.length.toLocaleString()} / 10,000</span>
          </span>
        </div>

        <div className="editor-status-right">
          <span className="editor-shortcut-hint">
            <kbd className="kbd-badge">{shortcutKey}</kbd> + <kbd className="kbd-badge">Enter</kbd>
          </span>

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
