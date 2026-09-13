import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Theme, HistoryItem } from './types'

interface AppContextType {
  theme: Theme
  toggleTheme: () => void
  history: HistoryItem[]
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp' | 'isSaved'>) => void
  toggleSaveItem: (id: string) => void
  deleteHistoryItem: (id: string) => void
  clearHistory: () => void
  clearAllHistory: () => void
  seedDemoHistory: () => void
  toastMessage: string | null
  triggerToast: (msg: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devfix-theme')
      if (saved === 'dark' || saved === 'light') return saved
    }
    return 'dark'
  })

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devfix-history')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse history', e)
        }
      }
    }
    return []
  })

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('devfix-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('devfix-history', JSON.stringify(history))
  }, [history])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, 2800)
  }, [])

  const addToHistory = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp' | 'isSaved'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isSaved: false,
    }
    setHistory((prev) => [newItem, ...prev].slice(0, 100)) // Keep last 100 items
  }, [])

  const toggleSaveItem = useCallback((id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSaved: !item.isSaved } : item))
    )
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory((prev) => prev.filter((item) => item.isSaved))
  }, [])

  const clearAllHistory = useCallback(() => {
    setHistory([])
  }, [])

  const seedDemoHistory = useCallback(() => {
    const demos: HistoryItem[] = [
      {
        id: 'demo-1',
        timestamp: Date.now() - 1000 * 60 * 18, // 18 mins ago
        input: "ModuleNotFoundError: No module named 'requests'",
        language: 'python',
        isSaved: true,
        result: {
          summary: "ModuleNotFoundError: 'requests' package not installed in the active environment.",
          what_happened: "Python attempted to import the 'requests' HTTP library, but it is not installed in the current virtual environment or interpreter path.",
          why_it_happened: "The package is either missing from the active virtualenv, or the script was invoked using a system Python interpreter rather than the environment where dependencies were installed.",
          how_to_fix: [
            "Activate your virtual environment: source .venv/bin/activate (Linux/macOS) or .venv\\Scripts\\activate (Windows).",
            "Install the missing dependency: pip install requests",
            "If using requirements.txt or poetry: pip install -r requirements.txt or poetry install"
          ],
          example_fix: "# Install via pip:\npip install requests\n\n# Or add to requirements.txt:\nrequests>=2.31.0",
          pitfalls: [
            "Installing globally with sudo pip install can cause conflicts with OS system packages.",
            "Verify that your IDE (e.g., VS Code / PyCharm) interpreter path matches your terminal virtualenv."
          ],
          confidence: 'high',
          elapsedMs: 380,
        },
      },
      {
        id: 'demo-2',
        timestamp: Date.now() - 1000 * 60 * 140, // 2.3 hours ago
        input: "TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList (src/components/UserList.tsx:14:21)\n    at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486:18)",
        language: 'javascript',
        isSaved: true,
        result: {
          summary: "TypeError: Attempted to call .map() on an undefined array reference.",
          what_happened: "The component tried to iterate over a list prop or state variable using .map(), but the variable evaluated to undefined during initial render.",
          why_it_happened: "Asynchronous data fetching has not completed when the initial render cycle triggers, or the API response returned a different schema structure.",
          how_to_fix: [
            "Provide a default empty array in your useState: const [users, setUsers] = useState<User[]>([])",
            "Use optional chaining or fallback before calling map: (users ?? []).map(...)",
            "Add an early return guard for loading state: if (loading) return <Spinner />"
          ],
          example_fix: "// Before (crashes if users is undefined):\n{users.map(u => <UserCard key={u.id} user={u} />)}\n\n// Fixed with optional chaining and fallback:\n{(users ?? []).map(u => (\n  <UserCard key={u.id} user={u} />\n))}",
          pitfalls: [
            "Using users && users.map(...) can render 0 if users evaluates to a numeric zero rather than array.",
            "Ensure the backend API returns an array rather than an error payload object."
          ],
          confidence: 'high',
          elapsedMs: 410,
        },
      },
      {
        id: 'demo-3',
        timestamp: Date.now() - 1000 * 60 * 60 * 26, // 1 day ago
        input: "Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1485:16)\n    at listenInCluster (node:net:1533:12)\n    at Server.listen (node:net:1621:7)",
        language: 'javascript',
        isSaved: false,
        result: {
          summary: "EADDRINUSE: TCP port 3000 is already bound by another running process.",
          what_happened: "The Node.js server attempted to bind to port 3000, but the operating system socket is currently occupied by an active process.",
          why_it_happened: "A previously started dev server was not cleanly killed and remains active in the background, or another application is configured on port 3000.",
          how_to_fix: [
            "Identify and terminate the existing process using the port.",
            "On macOS/Linux: lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9",
            "On Windows (PowerShell): Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force",
            "Alternatively, specify a different port in your environment: PORT=3001 npm start"
          ],
          example_fix: "# Free port 3000 on Windows:\nGet-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess\nStop-Process -Id <PID> -Force\n\n# Free port 3000 on macOS/Linux:\nlsof -ti:3000 | xargs kill -9",
          pitfalls: [
            "Force killing background processes might leave locks or uncommitted file writes in hot-reloaders.",
            "Make sure your process uses process.env.PORT instead of hardcoded 3000."
          ],
          confidence: 'high',
          elapsedMs: 340,
        },
      },
    ]

    setHistory(demos)
  }, [])

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        history,
        addToHistory,
        toggleSaveItem,
        deleteHistoryItem,
        clearHistory,
        clearAllHistory,
        seedDemoHistory,
        toastMessage,
        triggerToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
