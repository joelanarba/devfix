import { CheckIcon } from './Icons'

interface Props {
  message: string | null
}

export default function Toast({ message }: Props) {
  if (!message) return null

  return (
    <div className="toast-notification" role="status" aria-live="polite">
      <CheckIcon size={14} className="toast-icon" />
      <span className="toast-text">{message}</span>
    </div>
  )
}
