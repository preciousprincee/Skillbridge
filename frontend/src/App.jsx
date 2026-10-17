import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import { LinkButton, PageLoading } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Plans from './pages/Plans.jsx'
import Setup from './pages/Setup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Project from './pages/Project.jsx'
import Results from './pages/Results.jsx'

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoading label="Checking your session" />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">We could not find that page</h1>
      <p className="mt-2 text-muted">The link may be wrong, or the plan belongs to a different account.</p>
      <LinkButton to="/setup" className="mt-6">Start a new career plan</LinkButton>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/plans" element={<RequireAuth><Plans /></RequireAuth>} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/plan/:id" element={<Dashboard />} />
        <Route path="/project/:id" element={<Project />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
