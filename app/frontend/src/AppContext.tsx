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
    setHistory((prev) => prev.filter((item) => item.isSaved)) // keep saved ones?
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
