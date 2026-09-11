import type { AnalysisResult } from './types'

const API_URL = import.meta.env.VITE_API_URL || ''

export async function analyzeError(
  input: string,
  language: string
): Promise<AnalysisResult> {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Please enter an error message or code snippet.')
  }
  if (trimmed.length > 10000) {
    throw new Error('Input is too large. Please limit to 10,000 characters.')
  }

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: trimmed, language }),
  })

  if (response.status === 413) {
    throw new Error('Input is too large. Please reduce the size and try again.')
  }
  if (response.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.')
  }
  if (!response.ok) {
    throw new Error("DevFix couldn't analyze this error right now. Try again in a moment.")
  }

  const data = await response.json()
  return data as AnalysisResult
}
