import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { useLoad } from '../useLoad.js'
import { Card, ErrorBanner, LinkButton, PageLoading } from '../components/ui.jsx'

const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const pill = 'inline-flex items-center rounded-full border border-line px-3 py-1 text-sm font-semibold text-ink hover:bg-paper'

export default function Plans() {
  const { user } = useAuth()
  const { loading, data, error, reload } = useLoad(() => api.myPlans(), [])

  if (loading) return <PageLoading label="Loading your plans" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back, {user?.name}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">My career plans</h1>
        </div>
        <LinkButton to="/setup"><Plus className="h-4 w-4" aria-hidden="true" /> New career plan</LinkButton>
      </header>

      {data.plans.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-xl font-bold">No plans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Pick the job you want, and we will show where you stand and what to build next. Your plans will be saved here.
          </p>
          <LinkButton to="/setup" className="mt-5">Build my first plan</LinkButton>
        </Card>
      ) : (
        <ul className="space-y-4">
          {data.plans.map((p) => (
            <li key={p.profile_id}>
              <Card>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-bold">{p.target_role}</h2>
                  <span className="text-sm text-muted">
                    {fmt(p.created_at)}{p.is_demo ? ' · demonstration data' : ''}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.analysis_id ? (
                    <Link className={pill} to={`/plan/${p.analysis_id}`}>Skill gaps: {p.alignment_score}% aligned</Link>
                  ) : (
                    <span className="text-sm text-muted">Analysis not finished</span>
                  )}
                  {p.project_id && <Link className={pill} to={`/project/${p.project_id}`}>Project: {p.project_title}</Link>}
                  {p.submission_id && <Link className={pill} to={`/results/${p.submission_id}`}>Assessment: {p.assessment_score}/100</Link>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
