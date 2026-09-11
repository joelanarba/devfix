import type { AppState } from '../types'

interface Props {
  state: AppState
  hasInput: boolean
  elapsedMs?: number
}

export default function SignalTrace({ state, hasInput, elapsedMs }: Props) {
  return (
    <div className={`signal-trace-bar state-${state}`} role="status" aria-label="Diagnostic Signal Bus">
      <div className="trace-node node-input" title="Raw error buffer">
        <span className={`node-dot ${hasInput ? 'node-lit' : ''}`} />
        <span className="node-text">NOISE // INPUT</span>
      </div>

      <div className="trace-track">
        <div className={`trace-beam ${state === 'loading' ? 'beam-pulsing' : ''} ${state === 'success' ? 'beam-resolved' : ''}`} />
      </div>

      <div className="trace-node node-stage" title="Engine status">
        <span className={`node-dot ${state === 'loading' || state === 'success' ? 'node-lit-cyan' : ''}`} />
        <span className="node-text">
          {state === 'loading' ? 'ISOLATING ROOT CAUSE' : state === 'success' ? 'SIGNAL RESOLVED' : 'BUS STANDBY'}
        </span>
      </div>

      <div className="trace-track">
        <div className={`trace-beam ${state === 'loading' ? 'beam-pulsing' : ''} ${state === 'success' ? 'beam-resolved' : ''}`} />
      </div>

      <div className="trace-node node-output" title="Diagnostic report state">
        <span className={`node-dot ${state === 'success' ? 'node-lit-green' : ''}`} />
        <span className="node-text">
          {state === 'success' ? `SIGNAL COMPILED ${elapsedMs ? `(${elapsedMs}ms)` : ''}` : 'OUTPUT // REPORT'}
        </span>
      </div>
    </div>
  )
}
