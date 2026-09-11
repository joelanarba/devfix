export interface AnalysisResult {
  summary: string
  what_happened: string
  why_it_happened: string
  how_to_fix: string[]
  example_fix: string | null
  pitfalls: string[]
  confidence: 'high' | 'medium' | 'low'
  elapsedMs?: number
}

export type AppState = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'dark' | 'light'

export interface ExampleError {
  id: string
  label: string
  category: 'python' | 'javascript' | 'node' | 'network' | 'database' | 'react'
  input: string
  language: string
  shortDesc: string
}

export interface HistoryItem {
  id: string
  timestamp: number
  input: string
  language: string
  result: AnalysisResult | null
  isSaved: boolean
}
