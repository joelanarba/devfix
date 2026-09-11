import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, SearchCode, History, Bug, BookOpen, Terminal } from 'lucide-react'

const commands = [
  { id: 'nav-overview', label: 'Go to Overview', path: '/app', icon: LayoutDashboard },
  { id: 'nav-analyze', label: 'Go to Analyze Workspace', path: '/app/analyze', icon: SearchCode },
  { id: 'nav-history', label: 'Go to History', path: '/app/history', icon: History },
  { id: 'nav-stack', label: 'Go to Stack Trace Tool', path: '/app/stack-trace', icon: Bug },
  { id: 'nav-explain', label: 'Go to Code Explainer', path: '/app/explainer', icon: BookOpen },
  { id: 'nav-lab', label: 'Go to Error Lab', path: '/app/lab', icon: Terminal },
]

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const executeCommand = (cmd: typeof commands[0]) => {
    navigate(cmd.path)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="cmd-backdrop" onClick={() => setIsOpen(false)}>
      <div className="cmd-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={18} className="cmd-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="cmd-list">
          {filteredCommands.length === 0 ? (
            <div className="cmd-empty">No results found.</div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                className={`cmd-item ${i === selectedIndex ? 'selected' : ''}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <cmd.icon size={16} className="cmd-item-icon" />
                <span>{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
