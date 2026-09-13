import { Link, useNavigate } from 'react-router-dom'
import { SearchCode, History, Star, ArrowRight, Clock, Plus, Sparkles, Terminal } from 'lucide-react'
import { useAppContext } from '../AppContext'

export default function OverviewView() {
  const { history, seedDemoHistory, triggerToast } = useAppContext()
  const navigate = useNavigate()

  const savedFixes = history.filter((h) => h.isSaved)
  const recentSessions = history.slice(0, 4)

  const formatTime = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / (1000 * 60))
    if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="view-container overview-view-wrap">
      <div className="overview-header">
        <div>
          <h1 className="view-title">Overview</h1>
          <p className="view-subtitle">Monitor developer debugging throughput, recent fixes, and quick actions.</p>
        </div>

        <div className="overview-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/app/analyze')}
          >
            <Plus size={14} />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="history-stats-bar">
        <div className="history-stat-card">
          <div className="history-stat-num">{history.length}</div>
          <div className="history-stat-lbl">
            <Clock size={13} className="stat-icon" />
            <span>Total Analyses Run</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-num">{savedFixes.length}</div>
          <div className="history-stat-lbl">
            <Star size={13} className="stat-icon star-icon" />
            <span>Bookmarked Fixes</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-num">
            {new Set(history.map((h) => h.language).filter((l) => l && l !== 'auto')).size}
          </div>
          <div className="history-stat-lbl">
            <Terminal size={13} className="stat-icon" />
            <span>Active Runtimes</span>
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent Grid */}
      <div className="overview-grid">
        {/* Recent Activity Card */}
        <div className="overview-panel">
          <div className="overview-panel-header">
            <div className="panel-title-wrap">
              <History size={16} className="panel-icon" />
              <h2 className="panel-title">Recent Debugging Sessions</h2>
            </div>
            {history.length > 0 && (
              <Link to="/app/history" className="panel-link">
                <span>View all ({history.length})</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          <div className="overview-panel-body">
            {recentSessions.length === 0 ? (
              <div className="overview-empty-box">
                <p className="overview-empty-text">No debugging sessions recorded yet.</p>
                <div className="overview-empty-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/app/analyze')}
                  >
                    Analyze an Error
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      seedDemoHistory()
                      triggerToast('Sample debugging sessions loaded!')
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Load Demo Data</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-session-list">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="overview-session-row"
                    onClick={() =>
                      navigate('/app/analyze', {
                        state: {
                          input: session.input,
                          language: session.language,
                          result: session.result,
                        },
                      })
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="session-row-left">
                      <span className={`history-lang-badge lang-${session.language || 'auto'}`}>
                        {(session.language || 'auto').toUpperCase()}
                      </span>
                      <div className="session-row-info">
                        <div className="session-row-summary">
                          {session.result?.summary || session.input.slice(0, 60)}
                        </div>
                        <div className="session-row-meta">
                          <span>{formatTime(session.timestamp)}</span>
                          {session.result?.confidence && (
                            <span>• {session.result.confidence} confidence</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="session-row-right">
                      {session.isSaved && (
                        <Star size={14} className="star-icon star-filled" fill="currentColor" />
                      )}
                      <ArrowRight size={14} className="session-row-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tools Card */}
        <div className="overview-panel">
          <div className="overview-panel-header">
            <div className="panel-title-wrap">
              <Sparkles size={16} className="panel-icon" />
              <h2 className="panel-title">Developer Quick Tools</h2>
            </div>
          </div>

          <div className="overview-tools-list">
            <Link to="/app/analyze" className="overview-tool-card">
              <div className="tool-card-icon">
                <SearchCode size={18} />
              </div>
              <div className="tool-card-info">
                <div className="tool-card-name">Analyze Workspace</div>
                <div className="tool-card-desc">Paste compiler logs, runtime exceptions, or stack traces for AI synthesis.</div>
              </div>
              <ArrowRight size={14} className="tool-card-arrow" />
            </Link>

            <Link to="/app/history" className="overview-tool-card">
              <div className="tool-card-icon">
                <History size={18} />
              </div>
              <div className="tool-card-info">
                <div className="tool-card-name">History & Saved Fixes</div>
                <div className="tool-card-desc">Search, filter, bookmark, and export your personal repository of bug fixes.</div>
              </div>
              <ArrowRight size={14} className="tool-card-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
