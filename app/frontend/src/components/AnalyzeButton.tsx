import { useState, useEffect } from 'react'
import { ArrowRightIcon, CheckIcon } from './Icons'

interface Props {
  loading: boolean
  disabled: boolean
  onClick: () => void
  hasSuccess?: boolean
}

const LOADING_STEPS = [
  'Parsing error syntax...',
  'Tracing failure frames...',
  'Isolating root cause...',
  'Synthesizing fix & patch...',
]

export default function AnalyzeButton({ loading, disabled, onClick, hasSuccess }: Props) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!loading) {
      setStepIndex(0)
      return
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 900)

    return () => clearInterval(interval)
  }, [loading])

  return (
    <button
      type="button"
      className={`analyze-btn ${loading ? 'analyze-btn-loading' : ''} ${hasSuccess ? 'analyze-btn-success' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={loading ? LOADING_STEPS[stepIndex] : 'Analyze Error'}
    >
      <span className="analyze-btn-surface">
        {loading ? (
          <span className="analyze-btn-content">
            <span className="analyze-spinner" aria-hidden="true" />
            <span className="analyze-step-text">{LOADING_STEPS[stepIndex]}</span>
          </span>
        ) : hasSuccess ? (
          <span className="analyze-btn-content">
            <CheckIcon size={15} />
            <span>Diagnosis Ready</span>
          </span>
        ) : (
          <span className="analyze-btn-content">
            <span className="analyze-btn-label">Analyze Error</span>
            <ArrowRightIcon size={14} className="analyze-btn-arrow" />
          </span>
        )}
      </span>
      <span className="analyze-btn-glow" aria-hidden="true" />
    </button>
  )
}
