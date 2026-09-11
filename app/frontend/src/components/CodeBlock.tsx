import { useEffect, useRef, useState, useMemo } from 'react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import csharp from 'highlight.js/lib/languages/csharp'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import { CopyIcon, CheckIcon } from './Icons'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('php', php)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)

interface Props {
  code: string
  language?: string
  title?: string
}

export default function CodeBlock({ code, language, title = 'solution_patch' }: Props) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const lines = useMemo(() => {
    return code.trim().split('\n')
  }, [code])

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current)
    }
  }, [code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // noop
    }
  }

  return (
    <div className="code-surface" role="region" aria-label="Rectified Code Surface">
      <div className="code-surface-header">
        <div className="code-surface-meta">
          <div className="code-surface-dots" aria-hidden="true">
            <span className="dot dot-close" />
            <span className="dot dot-min" />
            <span className="dot dot-max" />
          </div>
          <span className="code-surface-filename">{title}</span>
          {language && <span className="code-surface-lang">{language}</span>}
        </div>

        <button
          className={`code-copy-btn ${copied ? 'copy-success' : ''}`}
          onClick={handleCopy}
          type="button"
          aria-label={copied ? 'Code snippet copied' : 'Copy code snippet'}
        >
          {copied ? (
            <>
              <CheckIcon size={13} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon size={13} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      <div className="code-surface-body">
        <div className="code-line-numbers" aria-hidden="true">
          {lines.map((_, i) => (
            <span key={i} className="code-ln">
              {i + 1}
            </span>
          ))}
        </div>

        <pre className="code-pre">
          <code ref={codeRef} className="code-inner">
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}
