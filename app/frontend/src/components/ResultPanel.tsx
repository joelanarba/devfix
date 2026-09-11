import { useState } from 'react'
import type { AnalysisResult } from '../types'
import CodeBlock from './CodeBlock'

interface Props {
  result: AnalysisResult
  onNewAnalysis: () => void
}

export default function ResultPanel({ result, onNewAnalysis }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = formatResultAsText(result)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: do nothing
    }
  }

  const confidenceLabel: Record<string, string> = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  }

  return (
    <section className="result-panel" aria-label="Analysis result">
      <div className="result-header">
        <h2 className="result-summary">{result.summary}</h2>
        <span className={`confidence-badge confidence-${result.confidence}`}>
          {confidenceLabel[result.confidence] || result.confidence}
        </span>
      </div>

      <div className="result-section">
        <h3 className="result-section-title">What happened</h3>
        <p className="result-section-body">{result.what_happened}</p>
      </div>

      <div className="result-section">
        <h3 className="result-section-title">Why it happened</h3>
        <p className="result-section-body">{result.why_it_happened}</p>
      </div>

      <div className="result-section">
        <h3 className="result-section-title">How to fix it</h3>
        <ol className="result-steps">
          {result.how_to_fix.map((step, i) => (
            <li key={i} className="result-step">{step}</li>
          ))}
        </ol>
      </div>

      {result.example_fix && (
        <div className="result-section">
          <h3 className="result-section-title">Example fix</h3>
          <CodeBlock code={result.example_fix} />
        </div>
      )}

      {result.pitfalls && result.pitfalls.length > 0 && (
        <div className="result-section">
          <h3 className="result-section-title">Potential pitfalls</h3>
          <ul className="result-pitfalls">
            {result.pitfalls.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-secondary" onClick={handleCopy} type="button">
          {copied ? 'Copied' : 'Copy explanation'}
        </button>
        <button className="btn btn-primary" onClick={onNewAnalysis} type="button">
          New analysis
        </button>
      </div>
    </section>
  )
}

function formatResultAsText(result: AnalysisResult): string {
  let text = `## ${result.summary}\n\n`
  text += `### What happened\n${result.what_happened}\n\n`
  text += `### Why it happened\n${result.why_it_happened}\n\n`
  text += `### How to fix it\n${result.how_to_fix.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`
  if (result.example_fix) {
    text += `### Example fix\n\`\`\`\n${result.example_fix}\n\`\`\`\n\n`
  }
  if (result.pitfalls.length > 0) {
    text += `### Potential pitfalls\n${result.pitfalls.map(p => `- ${p}`).join('\n')}\n\n`
  }
  text += `Confidence: ${result.confidence}`
  return text
}
