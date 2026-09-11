import { useState, useEffect } from 'react'
import { SendIcon } from './Icons'

interface Props {
  loading: boolean
  disabled: boolean
  onClick: () => void
  hasSuccess?: boolean
}

const LOADING_STEPS = [
  'Analyzing...',
  'Tracing cause...',
  'Generating fix...',
]

export default function AnalyzeButton({ loading, disabled, onClick }: Props) {
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
      className={`send-button ${loading ? 'send-button-loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={loading ? LOADING_STEPS[stepIndex] : 'Send'}
    >
      {loading ? (
        <>
          <span className="send-spinner" aria-hidden="true" />
          <span className="send-label">{LOADING_STEPS[stepIndex]}</span>
        </>
      ) : (
        <>
          <span className="send-label">Send</span>
          <SendIcon size={15} className="send-icon" />
        </>
      )}
    </button>
  )
}
