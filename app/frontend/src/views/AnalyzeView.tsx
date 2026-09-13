import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import DiagnosticEditor from '../components/DiagnosticEditor'
import DiagnosticReport from '../components/DiagnosticReport'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import SignalTrace from '../components/SignalTrace'
import { useAppContext } from '../AppContext'
import type { AnalysisResult, AppState, ExampleError } from '../types'
import { analyzeError } from '../api'

const REALISTIC_EXAMPLES: ExampleError[] = [
  {
    id: 'ex-modulenotfound',
    label: 'ModuleNotFoundError: requests',
    category: 'python',
    input: "ModuleNotFoundError: No module named 'requests'",
    language: 'python',
    shortDesc: 'Missing dependency in the active Python virtual environment or interpreter.',
  },
  {
    id: 'ex-typeerror-map',
    label: "TypeError: reading 'map'",
    category: 'javascript',
    input: "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.tsx:14:21)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486:18)",
    language: 'javascript',
    shortDesc: 'Attempting to call array mapping on an uninitialized or pending promise payload.',
  },
  {
    id: 'ex-nameerror',
    label: "NameError: name 'user' is not defined",
    category: 'python',
    input: "Traceback (most recent call last):\n  File \"app/auth.py\", line 42, in get_current_user\n    return user.profile.display_name\nNameError: name 'user' is not defined",
    language: 'python',
    shortDesc: 'Referencing a variable or function outside its declared scope or before assignment.',
  },
  {
    id: 'ex-eaddrinuse',
    label: 'Error: listen EADDRINUSE :3000',
    category: 'node',
    input: 'Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1485:16)\n    at listenInCluster (node:net:1533:12)\n    at Server.listen (node:net:1621:7)',
    language: 'javascript',
    shortDesc: 'Local TCP port collision caused by orphaned background process or duplicate dev server.',
  },
  {
    id: 'ex-cors',
    label: 'CORS Preflight Policy Violation',
    category: 'network',
    input: "Access to XMLHttpRequest at 'https://api.internal.service/v1/auth' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
    language: 'auto',
    shortDesc: 'Browser Same-Origin Policy rejecting cross-origin request due to missing API response headers.',
  },
  {
    id: 'ex-sql-syntax',
    label: 'SQL Syntax Error 1064 (42000)',
    category: 'database',
    input: "ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'SELCT id, email, created_at FROM accounts WHERE is_active = 1' at line 1",
    language: 'auto',
    shortDesc: 'Database parser rejection near misspelled keyword or unescaped identifier token.',
  },
]

export default function AnalyzeView() {
  const { triggerToast, addToHistory } = useAppContext()
  const location = useLocation()
  const historyState = location.state as {
    input?: string
    language?: string
    result?: AnalysisResult
  } | null

  const [input, setInput] = useState(historyState?.input || '')
  const [language, setLanguage] = useState(historyState?.language || 'auto')
  const [state, setState] = useState<AppState>(historyState?.result ? 'success' : 'idle')
  const [result, setResult] = useState<AnalysisResult | null>(historyState?.result || null)
  const [error, setError] = useState<string | null>(null)

  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (location.state && (location.state as any).input !== undefined) {
      const s = location.state as { input: string; language?: string; result?: AnalysisResult }
      setInput(s.input)
      if (s.language) setLanguage(s.language)
      if (s.result) {
        setResult(s.result)
        setState('success')
      }
    }
  }, [location.state])

  const handleAnalyze = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setState('loading')
    setError(null)
    setResult(null)

    const startTime = performance.now()

    try {
      const data = await analyzeError(trimmed, language)
      const elapsedMs = Math.round(performance.now() - startTime)
      const finalResult = { ...data, elapsedMs }
      setResult(finalResult)
      setState('success')
      
      addToHistory({
        input: trimmed,
        language,
        result: finalResult
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
      setState('error')
    }
  }, [input, language, addToHistory])

  const handleReset = useCallback(() => {
    setInput('')
    setLanguage('auto')
    setState('idle')
    setResult(null)
    setError(null)
    triggerToast('Workspace reset')
  }, [triggerToast])

  const handleSelectExample = useCallback((example: ExampleError) => {
    setInput(example.input)
    setLanguage(example.language)
    setState('idle')
    setResult(null)
    setError(null)
    triggerToast(`Loaded: ${example.label}`)
    
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [triggerToast])

  return (
    <div className="view-container">
      {error && (
        <div className="alert-container">
          <ErrorBanner
            message={error}
            onRetry={handleAnalyze}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      <SignalTrace
        state={state}
        hasInput={input.trim().length > 0}
        elapsedMs={result?.elapsedMs}
      />

      <div className="workspace-studio" ref={workspaceRef}>
        <div className="studio-col studio-editor-col">
          <div className="col-header-tag">
            <span className="col-tag-pip" />
            <span>RAW DIAGNOSTIC INPUT</span>
          </div>
          <DiagnosticEditor
            input={input}
            language={language}
            loading={state === 'loading'}
            hasSuccess={state === 'success'}
            onInputChange={setInput}
            onLanguageChange={setLanguage}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
          />
        </div>

        <div className="studio-col studio-output-col">
          <div className="col-header-tag">
            <span className="col-tag-pip pip-cyan" />
            <span>STRUCTURED DIAGNOSTIC REPORT</span>
          </div>

          <div className="output-stage">
            {state === 'idle' && !result && (
              <div id="examples-section">
                <EmptyState
                  examples={REALISTIC_EXAMPLES}
                  onSelectExample={handleSelectExample}
                />
              </div>
            )}

            {state === 'loading' && (
              <div className="loading-canvas" aria-live="polite">
                <div className="loading-card-pulse">
                  <div className="loading-pulse-header">
                    <div className="loading-bar w-30" />
                    <div className="loading-bar w-15" />
                  </div>
                  <div className="loading-bar w-80" />
                  <div className="loading-bar w-60" />
                  <div className="loading-skeleton-code">
                    <div className="loading-bar w-50" />
                    <div className="loading-bar w-70" />
                    <div className="loading-bar w-40" />
                  </div>
                </div>
                <p className="loading-caption">
                  Analyzing failure frames with Amazon Bedrock Nova Lite...
                </p>
              </div>
            )}

            {state === 'success' && result && (
              <DiagnosticReport
                result={result}
                onNewAnalysis={handleReset}
                onToast={triggerToast}
              />
            )}

            {state === 'error' && !result && (
              <div className="error-fallback-view">
                <ErrorBanner
                  message={error || 'Analysis service temporarily unavailable.'}
                  onRetry={handleAnalyze}
                  onDismiss={() => {
                    setState('idle')
                    setError(null)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
