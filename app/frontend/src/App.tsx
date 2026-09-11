import { Routes, Route } from 'react-router-dom'
import LandingPage from './views/LandingPage'
import DashboardLayout from './components/DashboardLayout'
import OverviewView from './views/OverviewView'
import AnalyzeView from './views/AnalyzeView'
import HistoryView from './views/HistoryView'
import StackTraceView from './views/StackTraceView'
import ExplainerView from './views/ExplainerView'
import ErrorLabView from './views/ErrorLabView'
import Toast from './components/Toast'
import { useAppContext } from './AppContext'

export default function App() {
  const { toastMessage } = useAppContext()

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<OverviewView />} />
          <Route path="analyze" element={<AnalyzeView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="stack-trace" element={<StackTraceView />} />
          <Route path="explainer" element={<ExplainerView />} />
          <Route path="lab" element={<ErrorLabView />} />
        </Route>
      </Routes>
      <Toast message={toastMessage} />
    </>
  )
}
