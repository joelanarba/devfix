import type { ExampleError } from '../types'
import { TerminalIcon, ArrowRightIcon } from './Icons'

interface Props {
  examples: ExampleError[]
  onSelectExample: (example: ExampleError) => void
}

export default function EmptyState({ examples, onSelectExample }: Props) {
  return (
    <section className="empty-workspace" aria-label="Interactive Debugging Examples">
      <div className="empty-header">
        <div className="empty-title-group">
          <span className="empty-eyebrow">// PRELOADED INCIDENTS</span>
          <h2 className="empty-title">What are you debugging?</h2>
          <p className="empty-subtitle">
            Paste your raw error output on the left, or select an incident below to test the diagnostic pipeline.
          </p>
        </div>
      </div>

      <div className="example-grid" role="list">
        {examples.map((ex) => (
          <div
            key={ex.id}
            className="example-card"
            role="listitem"
            onClick={() => onSelectExample(ex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectExample(ex)
              }
            }}
            tabIndex={0}
          >
            <div className="example-card-top">
              <span className={`example-cat-tag cat-${ex.category}`}>
                {ex.category.toUpperCase()}
              </span>
              <span className="example-card-lang">{ex.language}</span>
            </div>

            <div className="example-card-title">{ex.label}</div>
            <p className="example-card-desc">{ex.shortDesc}</p>

            <div className="example-code-preview">
              <code>{ex.input.length > 75 ? ex.input.slice(0, 75) + '...' : ex.input}</code>
            </div>

            <div className="example-card-action">
              <span className="action-text">Load incident</span>
              <ArrowRightIcon size={12} className="action-arrow" />
            </div>
          </div>
        ))}
      </div>

      <div className="empty-hint-card">
        <div className="hint-card-left">
          <TerminalIcon size={16} className="hint-icon" />
          <div className="hint-text">
            <span className="hint-strong">ProTip:</span>
            <span> You can paste full multiline stack traces up to 10,000 characters. Line numbers and compiler traces are automatically parsed.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
