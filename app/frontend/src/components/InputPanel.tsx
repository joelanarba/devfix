import { useEffect, useRef } from 'react'

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
]

interface Props {
  input: string
  language: string
  loading: boolean
  onInputChange: (value: string) => void
  onLanguageChange: (value: string) => void
  onAnalyze: () => void
  onReset: () => void
}

export default function InputPanel({
  input,
  language,
  loading,
  onInputChange,
  onLanguageChange,
  onAnalyze,
  onReset,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!loading && input.trim()) {
        onAnalyze()
      }
    }
  }

  return (
    <section className="input-panel" aria-label="Error input">
      <label htmlFor="error-input" className="input-label">
        Error or code
      </label>
      <textarea
        ref={textareaRef}
        id="error-input"
        className="input-textarea"
        placeholder="Paste an error message, stack trace, or code snippet..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        rows={10}
        spellCheck={false}
        aria-describedby="input-hint"
      />
      <p id="input-hint" className="input-hint">
        {input.length > 0 && `${input.length.toLocaleString()} / 10,000 characters`}
      </p>
      <div className="input-controls">
        <div className="input-language">
          <label htmlFor="language-select" className="sr-only">
            Language or runtime
          </label>
          <select
            id="language-select"
            className="input-select"
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
        </div>
        <div className="input-actions">
          <button
            className="btn btn-secondary"
            onClick={onReset}
            disabled={loading || (!input && language === 'auto')}
            type="button"
          >
            Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={onAnalyze}
            disabled={loading || !input.trim()}
            type="button"
            aria-label="Analyze error"
          >
            {loading ? 'Analyzing...' : 'Analyze error'}
          </button>
        </div>
      </div>
      <p className="input-shortcut">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to analyze
      </p>
    </section>
  )
}
