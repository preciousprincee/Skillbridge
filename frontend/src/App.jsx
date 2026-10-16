import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { LinkButton } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Setup from './pages/Setup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Project from './pages/Project.jsx'
import Results from './pages/Results.jsx'
import Auth from './pages/Auth.jsx'

function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">We could not find that page</h1>
      <p className="mt-2 text-muted">The link may be wrong, or the plan was created on a different server.</p>
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
        <Route path="/setup" element={<Setup />} />
        <Route path="/plan/:id" element={<Dashboard />} />
        <Route path="/project/:id" element={<Project />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
