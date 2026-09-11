import { Outlet, Link, useLocation } from 'react-router-dom'
import { Terminal, LayoutDashboard, SearchCode, History, Bug, BookOpen, Settings } from 'lucide-react'
import { useAppContext } from '../AppContext'
import CommandPalette from './CommandPalette'
import BackgroundGrid from './BackgroundGrid'

export default function DashboardLayout() {
  const location = useLocation()
  const { theme, toggleTheme } = useAppContext()

  const navItems = [
    { id: 'overview', path: '/app', icon: LayoutDashboard, label: 'Overview', exact: true },
    { id: 'analyze', path: '/app/analyze', icon: SearchCode, label: 'Analyze Workspace' },
    { id: 'history', path: '/app/history', icon: History, label: 'History & Saved' },
    { id: 'stack-trace', path: '/app/stack-trace', icon: Bug, label: 'Stack Trace Tool' },
    { id: 'explainer', path: '/app/explainer', icon: BookOpen, label: 'Code Explainer' },
    { id: 'lab', path: '/app/lab', icon: Terminal, label: 'Error Lab' },
  ]

  return (
    <div className="dashboard-layout">
      <BackgroundGrid />
      <CommandPalette />

      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <div className="header-logo-badge">
              <Terminal size={16} />
            </div>
            <span className="sidebar-brand-text">DevFix</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">WORKSPACE</div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={16} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item theme-btn" onClick={toggleTheme}>
            <Settings size={16} className="nav-icon" />
            <span className="nav-label">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-context">
            {navItems.find(i => i.exact ? location.pathname === i.path : location.pathname.startsWith(i.path))?.label || 'Workspace'}
          </div>
          <div className="topbar-actions">
            <div className="command-hint">
              <span className="kbd">⌘</span>
              <span className="kbd">K</span>
              <span>to search</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
