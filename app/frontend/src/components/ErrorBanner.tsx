import { AlertCircleIcon, ResetIcon } from './Icons'

interface Props {
  message: string
  onRetry: () => void
  onDismiss: () => void
}

export default function ErrorBanner({ message, onRetry, onDismiss }: Props) {
  return (
    <div className="diagnostic-alert" role="alert" aria-live="assertive">
      <div className="alert-content-left">
        <div className="alert-icon-wrapper">
          <AlertCircleIcon size={16} />
        </div>
        <div className="alert-text-group">
          <span className="alert-title">Analysis Interrupted</span>
          <span className="alert-body">{message}</span>
        </div>
      </div>

      <div className="alert-actions">
        <button
          type="button"
          className="alert-btn alert-btn-retry"
          onClick={onRetry}
          aria-label="Retry analysis"
        >
          <ResetIcon size={12} />
          <span>Try again</span>
        </button>
        <button
          type="button"
          className="alert-btn alert-btn-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error message"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
