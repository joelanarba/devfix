import { useState } from 'react'
import type { AnalysisResult } from '../types'
import CodeBlock from './CodeBlock'
import { CopyIcon, CheckIcon, ResetIcon, AlertCircleIcon, ActivityIcon } from './Icons'

interface Props {
  result: AnalysisResult
  onNewAnalysis: () => void
  onToast: (msg: string) => void
}

export default function DiagnosticReport({ result, onNewAnalysis, onToast }: Props) {
  const [copiedReport, setCopiedReport] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleCopyFullReport = async () => {
    const markdown = formatMarkdownReport(result)
    try {
      await navigator.clipboard.writeText(markdown)
      setCopiedReport(true)
      onToast('Full diagnostic report copied to clipboard')
      setTimeout(() => setCopiedReport(false), 2200)
    } catch {
      onToast('Failed to copy to clipboard')
    }
  }

  const confidenceScore = {
    high: { label: 'High Confidence', score: '98%', bars: 3, class: 'conf-high' },
    medium: { label: 'Medium Confidence', score: '75%', bars: 2, class: 'conf-med' },
    low: { label: 'Tentative Isolation', score: '40%', bars: 1, class: 'conf-low' },
  }[result.confidence] || { label: result.confidence, score: '60%', bars: 2, class: 'conf-med' }

  return (
    <article className="report-window" aria-label="DevFix Diagnostic Report">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-header-top">
          <div className="report-badge-cluster">
            <span className="report-status-badge">
              <span className="status-pip-static" />
              <span>DIAGNOSIS COMPILED</span>
            </span>
            {result.elapsedMs && (
              <span className="report-latency-badge">
                <ActivityIcon size={12} />
                <span>{result.elapsedMs}ms</span>
              </span>
            )}
          </div>

          <div className={`confidence-meter ${confidenceScore.class}`} title={`Isolation confidence: ${confidenceScore.label}`}>
            <div className="confidence-bars" aria-hidden="true">
              <span className={`conf-bar ${confidenceScore.bars >= 1 ? 'bar-active' : ''}`} />
              <span className={`conf-bar ${confidenceScore.bars >= 2 ? 'bar-active' : ''}`} />
              <span className={`conf-bar ${confidenceScore.bars >= 3 ? 'bar-active' : ''}`} />
            </div>
            <span className="confidence-label">{confidenceScore.label}</span>
          </div>
        </div>

        <h2 className="report-incident-title">{result.summary}</h2>
      </div>

      {/* Report Sections with Progressive Cascade */}
      <div className="report-content-flow">
        {/* Section 1: Event Synopsis */}
        <section className="report-section reveal-step-1" aria-labelledby="heading-synopsis">
          <div className="section-title-strip">
            <span className="section-index">[01]</span>
            <h3 id="heading-synopsis" className="section-title">What happened</h3>
          </div>
          <p className="section-body">{result.what_happened}</p>
        </section>

        {/* Section 2: Root Cause Isolation */}
        <section className="report-section reveal-step-2" aria-labelledby="heading-rootcause">
          <div className="section-title-strip">
            <span className="section-index">[02]</span>
            <h3 id="heading-rootcause" className="section-title">Why it happened</h3>
          </div>
          <p className="section-body">{result.why_it_happened}</p>
        </section>

        {/* Section 3: Actionable Steps */}
        <section className="report-section reveal-step-3" aria-labelledby="heading-actionplan">
          <div className="section-title-strip">
            <span className="section-index">[03]</span>
            <h3 id="heading-actionplan" className="section-title">How to fix it</h3>
            <span className="section-counter">{result.how_to_fix.length} steps</span>
          </div>

          <div className="action-checklist">
            {result.how_to_fix.map((step, idx) => {
              const isChecked = !!completedSteps[idx]
              return (
                <div
                  key={idx}
                  className={`checklist-item ${isChecked ? 'item-checked' : ''}`}
                  onClick={() => toggleStep(idx)}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggleStep(idx)
                    }
                  }}
                >
                  <div className="checklist-box" aria-hidden="true">
                    {isChecked ? <CheckIcon size={12} /> : <span className="checklist-num">{idx + 1}</span>}
                  </div>
                  <div className="checklist-text">{step}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 4: Rectified Code */}
        {result.example_fix && (
          <section className="report-section reveal-step-4" aria-labelledby="heading-codefix">
            <div className="section-title-strip">
              <span className="section-index">[04]</span>
              <h3 id="heading-codefix" className="section-title">Example fix</h3>
            </div>
            <CodeBlock code={result.example_fix} title="rectified_solution" />
          </section>
        )}

        {/* Section 5: Potential Pitfalls */}
        {result.pitfalls && result.pitfalls.length > 0 && (
          <section className="report-section reveal-step-5" aria-labelledby="heading-pitfalls">
            <div className="section-title-strip">
              <span className="section-index">[05]</span>
              <h3 id="heading-pitfalls" className="section-title">Potential pitfalls</h3>
            </div>
            <div className="pitfall-callout">
              <AlertCircleIcon size={16} className="pitfall-icon" />
              <ul className="pitfall-list">
                {result.pitfalls.map((pitfall, i) => (
                  <li key={i} className="pitfall-item">
                    {pitfall}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* Report Footer / Actions */}
      <div className="report-footer">
        <div className="report-footer-left">
          <button
            type="button"
            className="report-btn report-btn-secondary"
            onClick={handleCopyFullReport}
            aria-label="Copy entire markdown report"
          >
            {copiedReport ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copiedReport ? 'Report Copied' : 'Copy Full Report (MD)'}</span>
          </button>
        </div>

        <div className="report-footer-right">
          <button
            type="button"
            className="report-btn report-btn-primary"
            onClick={onNewAnalysis}
            aria-label="Reset workspace for another error"
          >
            <ResetIcon size={13} />
            <span>New Analysis</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function formatMarkdownReport(result: AnalysisResult): string {
  let md = `# DevFix Incident Diagnosis\n\n`
  md += `**Summary**: ${result.summary}\n`
  md += `**Confidence**: ${result.confidence.toUpperCase()}\n\n`
  md += `## 01. What Happened\n${result.what_happened}\n\n`
  md += `## 02. Why It Happened (Root Cause)\n${result.why_it_happened}\n\n`
  md += `## 03. How To Fix It\n`
  result.how_to_fix.forEach((step, idx) => {
    md += `${idx + 1}. ${step}\n`
  })
  md += `\n`

  if (result.example_fix) {
    md += `## 04. Corrected Code\n\`\`\`\n${result.example_fix}\n\`\`\`\n\n`
  }

  if (result.pitfalls && result.pitfalls.length > 0) {
    md += `## 05. Potential Pitfalls\n`
    result.pitfalls.forEach((p) => {
      md += `- ${p}\n`
    })
    md += `\n`
  }

  md += `*Diagnosed with DevFix*`
  return md
}
