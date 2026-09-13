import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Star,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Code2,
  AlertCircle,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { useAppContext } from '../AppContext'
import type { HistoryItem } from '../types'

export default function HistoryView() {
  const {
    history,
    toggleSaveItem,
    deleteHistoryItem,
    clearHistory,
    clearAllHistory,
    seedDemoHistory,
    triggerToast,
  } = useAppContext()

  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'saved' | string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Calculate unique languages in history
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    history.forEach((h) => {
      if (h.language && h.language !== 'auto') {
        langs.add(h.language)
      }
    })
    return Array.from(langs)
  }, [history])

  // Filtered & sorted items
  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        // Tab filter
        if (activeFilter === 'saved' && !item.isSaved) return false
        if (activeFilter !== 'all' && activeFilter !== 'saved' && item.language !== activeFilter) {
          return false
        }

        // Search query
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        const inputMatch = item.input.toLowerCase().includes(q)
        const summaryMatch = item.result?.summary?.toLowerCase().includes(q)
        const fixMatch = item.result?.example_fix?.toLowerCase().includes(q)
        const whatMatch = item.result?.what_happened?.toLowerCase().includes(q)
        const langMatch = item.language?.toLowerCase().includes(q)
        return Boolean(inputMatch || summaryMatch || fixMatch || whatMatch || langMatch)
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return b.timestamp - a.timestamp
        }
        return a.timestamp - b.timestamp
      })
  }, [history, activeFilter, searchQuery, sortOrder])

  const savedCount = useMemo(() => history.filter((h) => h.isSaved).length, [history])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyFix = async (item: HistoryItem) => {
    const textToCopy = item.result?.example_fix || item.result?.what_happened || item.input
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedId(item.id)
      triggerToast('Copied fix to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      triggerToast('Failed to copy to clipboard')
    }
  }

  const handleOpenInWorkspace = (item: HistoryItem) => {
    navigate('/app/analyze', {
      state: {
        input: item.input,
        language: item.language,
        result: item.result,
      },
    })
  }

  const handleExportJSON = () => {
    if (history.length === 0) {
      triggerToast('No history to export')
      return
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `devfix-history-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    triggerToast('History exported successfully')
  }

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="view-container history-view-wrap">
      {/* Top Header */}
      <div className="history-header">
        <div className="history-header-titles">
          <h1 className="view-title">History & Saved</h1>
          <p className="view-subtitle">Review, search, and reuse past diagnostic reports and bookmarked fixes.</p>
        </div>

        <div className="history-header-actions">
          {history.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-secondary history-action-btn"
                onClick={handleExportJSON}
                title="Export history as JSON file"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary history-action-btn"
                onClick={() => {
                  if (window.confirm('Clear unsaved history? Starred items will be preserved.')) {
                    clearHistory()
                    triggerToast('Unsaved history cleared')
                  }
                }}
                title="Remove unsaved history items"
              >
                <Trash2 size={14} />
                <span>Clear Unsaved</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary history-action-btn"
                onClick={() => {
                  if (window.confirm('Clear all debugging sessions permanently?')) {
                    clearAllHistory()
                    triggerToast('All history cleared')
                  }
                }}
                title="Remove all history items"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-primary history-action-btn"
            onClick={() => navigate('/app/analyze')}
          >
            <Plus size={14} />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Bar */}
      <div className="history-stats-bar">
        <div className="history-stat-card">
          <div className="history-stat-num">{history.length}</div>
          <div className="history-stat-lbl">
            <Clock size={13} className="stat-icon" />
            <span>Total Sessions</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-num">{savedCount}</div>
          <div className="history-stat-lbl">
            <Star size={13} className="stat-icon star-icon" />
            <span>Saved Fixes</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-num">{availableLanguages.length}</div>
          <div className="history-stat-lbl">
            <Code2 size={13} className="stat-icon" />
            <span>Runtimes Detected</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="history-controls">
        <div className="history-search-box">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search across error inputs, summaries, or fixes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="history-search-clear"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="history-filter-row">
          <div className="history-chips-group">
            <button
              type="button"
              className={`history-filter-chip ${activeFilter === 'all' ? 'chip-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({history.length})
            </button>

            <button
              type="button"
              className={`history-filter-chip ${activeFilter === 'saved' ? 'chip-active' : ''}`}
              onClick={() => setActiveFilter('saved')}
            >
              <Star size={12} className={savedCount > 0 ? 'star-filled' : ''} />
              <span>Saved ({savedCount})</span>
            </button>

            {availableLanguages.map((lang) => {
              const count = history.filter((h) => h.language === lang).length
              return (
                <button
                  key={lang}
                  type="button"
                  className={`history-filter-chip ${activeFilter === lang ? 'chip-active' : ''}`}
                  onClick={() => setActiveFilter(lang)}
                >
                  <span className="chip-lang-dot" />
                  <span>{lang.toUpperCase()} ({count})</span>
                </button>
              )
            })}
          </div>

          <div className="history-sort-select-wrap">
            <select
              className="history-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort order"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main History List or Empty State */}
      {filteredHistory.length === 0 ? (
        <div className="history-empty-container">
          {history.length === 0 ? (
            <div className="empty-history-card">
              <div className="empty-history-icon-wrap">
                <Sparkles size={28} className="empty-history-icon" />
              </div>
              <h3 className="empty-history-title">No debugging sessions recorded yet</h3>
              <p className="empty-history-desc">
                Diagnose runtime errors and stack traces in the Analyze Workspace, and your technical diagnoses and fixes will automatically be saved here.
              </p>
              <div className="empty-history-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/app/analyze')}
                >
                  Start Debugging
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    seedDemoHistory()
                    triggerToast('Sample debugging history loaded!')
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Load Sample History</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-history-card">
              <div className="empty-history-icon-wrap">
                <Filter size={24} />
              </div>
              <h3 className="empty-history-title">No matching sessions found</h3>
              <p className="empty-history-desc">
                No history items match your search &quot;{searchQuery}&quot; with filter &quot;{activeFilter}&quot;.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery('')
                  setActiveFilter('all')
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="history-items-list" role="list">
          {filteredHistory.map((item) => {
            const isExpanded = Boolean(expandedIds[item.id])
            const isCopied = copiedId === item.id

            return (
              <article key={item.id} className="history-card" role="listitem">
                {/* Card Header */}
                <div className="history-card-header">
                  <div className="history-card-header-left">
                    <span className={`history-lang-badge lang-${item.language || 'auto'}`}>
                      {(item.language || 'auto').toUpperCase()}
                    </span>

                    <span className="history-time-badge" title={new Date(item.timestamp).toLocaleString()}>
                      <Clock size={12} />
                      <span>{formatRelativeTime(item.timestamp)}</span>
                    </span>

                    {item.result?.confidence && (
                      <span className={`history-conf-badge conf-${item.result.confidence}`}>
                        {item.result.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    )}

                    {item.result?.elapsedMs && (
                      <span className="history-latency-badge">{item.result.elapsedMs}ms</span>
                    )}
                  </div>

                  <div className="history-card-header-actions">
                    <button
                      type="button"
                      className={`history-icon-btn ${item.isSaved ? 'btn-starred' : ''}`}
                      onClick={() => {
                        toggleSaveItem(item.id)
                        triggerToast(item.isSaved ? 'Removed from saved' : 'Saved to bookmarks')
                      }}
                      title={item.isSaved ? 'Remove from saved' : 'Save fix'}
                      aria-label="Save item"
                    >
                      <Star size={15} fill={item.isSaved ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      className="history-icon-btn history-delete-btn"
                      onClick={() => {
                        deleteHistoryItem(item.id)
                        triggerToast('Item removed from history')
                      }}
                      title="Delete session"
                      aria-label="Delete item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="history-card-body">
                  <h3 className="history-item-summary">
                    {item.result?.summary || 'Raw Diagnostic Session'}
                  </h3>

                  {/* Input preview */}
                  <div className="history-input-snippet">
                    <span className="snippet-prefix">&gt;</span>
                    <code>
                      {item.input.length > 180 ? item.input.slice(0, 180) + '...' : item.input}
                    </code>
                  </div>

                  {/* What Happened explanation */}
                  {item.result?.what_happened && (
                    <p className="history-item-explanation">{item.result.what_happened}</p>
                  )}

                  {/* Code fix preview if present */}
                  {item.result?.example_fix && (
                    <div className="history-fix-preview">
                      <div className="fix-preview-header">
                        <span className="fix-preview-title">PROPOSED FIX</span>
                        <button
                          type="button"
                          className="fix-copy-btn"
                          onClick={() => handleCopyFix(item)}
                          title="Copy fix code"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="fix-preview-code">
                        <code>{item.result.example_fix}</code>
                      </pre>
                    </div>
                  )}

                  {/* Expanded Accordion: Full Steps and Pitfalls */}
                  {isExpanded && item.result && (
                    <div className="history-expanded-content">
                      {item.result.why_it_happened && (
                        <div className="expanded-section">
                          <h4 className="expanded-heading">Root Cause Analysis</h4>
                          <p className="expanded-text">{item.result.why_it_happened}</p>
                        </div>
                      )}

                      {item.result.how_to_fix && item.result.how_to_fix.length > 0 && (
                        <div className="expanded-section">
                          <h4 className="expanded-heading">Remediation Checklist</h4>
                          <ul className="expanded-steps-list">
                            {item.result.how_to_fix.map((step, idx) => (
                              <li key={idx} className="expanded-step-item">
                                <CheckCircle2 size={13} className="step-check-icon" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.result.pitfalls && item.result.pitfalls.length > 0 && (
                        <div className="expanded-section pitfalls-section">
                          <h4 className="expanded-heading">Common Pitfalls</h4>
                          <ul className="expanded-pitfalls-list">
                            {item.result.pitfalls.map((pitfall, idx) => (
                              <li key={idx} className="expanded-pitfall-item">
                                <AlertCircle size={13} className="pitfall-warn-icon" />
                                <span>{pitfall}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="history-card-footer">
                  <div className="history-footer-left">
                    <button
                      type="button"
                      className="history-expand-toggle"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <div className="history-footer-right">
                    <button
                      type="button"
                      className="btn btn-secondary history-btn-sm"
                      onClick={() => handleCopyFix(item)}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Copied' : 'Copy Solution'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary history-btn-sm"
                      onClick={() => handleOpenInWorkspace(item)}
                    >
                      <ExternalLink size={13} />
                      <span>Open in Workspace</span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

