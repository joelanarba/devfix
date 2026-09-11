import { useAppContext } from '../AppContext'

export default function OverviewView() {
  const { history } = useAppContext()

  return (
    <div className="view-container">
      <h1 className="view-title">Overview</h1>
      <p className="view-subtitle">Recent activity and quick actions.</p>

      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Total Analyses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{history.filter(h => h.isSaved).length}</div>
          <div className="stat-label">Saved Fixes</div>
        </div>
      </div>
    </div>
  )
}
