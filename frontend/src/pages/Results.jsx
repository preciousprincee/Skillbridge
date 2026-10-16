import { useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import { api } from '../api.js'
import { useLoad } from '../useLoad.js'
import {
  Badge, Card, ErrorBanner, EVIDENCE_STATUS, LinkButton, Meter, PageLoading,
} from '../components/ui.jsx'

function ListBlock({ title, items }) {
  if (!items || items.length === 0) return null
  return (
    <Card>
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Card>
  )
}

export default function Results() {
  const { id } = useParams()
  const { loading, data, error, reload } = useLoad(() => api.getResults(id), [id])

  if (loading) return <PageLoading label="Loading your results" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />

  const a = data.assessment
  const project = data.project
  const showLegend = a.unproven.length > 0 || a.demonstrated_deficiencies.length > 0

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">Assessment for {project.title}</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <h1 className="font-display text-6xl font-bold sm:text-7xl" aria-label={`Score ${a.total_score} out of 100`}>
            {a.total_score}<span className="text-3xl text-muted sm:text-4xl">/100</span>
          </h1>
          <p className="pb-2 text-xl font-bold">{a.band}</p>
        </div>
        <p className="mt-3 flex max-w-2xl items-start gap-2 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {data.disclaimer}
        </p>
        {data.repository_url && (
          <p className="mt-2 max-w-2xl break-all text-sm text-muted">
            Repository link saved: {data.repository_url}. It was not opened, so nothing here is based on its contents.
          </p>
        )}
      </header>

      <Card>
        <h2 className="text-xl font-bold">Overall feedback</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-muted">{a.overall_feedback}</p>
      </Card>

      <section aria-labelledby="by-criterion">
        <h2 id="by-criterion" className="text-2xl font-bold">Score by criterion</h2>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {a.criteria.map((c) => (
            <li key={c.name} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-bold">{c.name}</h3>
                  <Badge map={EVIDENCE_STATUS} value={c.status} />
                </div>
                <span className="font-display text-lg font-bold">{c.score}/{c.max_points}</span>
              </div>
              <div className="mt-3"><Meter value={c.score} max={c.max_points} label={`${c.name} score`} /></div>
              {c.evidence && (
                <p className="mt-3 text-sm leading-relaxed"><span className="font-semibold">What you showed: </span><span className="text-muted">{c.evidence}</span></p>
              )}
              {c.missing_evidence && (
                <p className="mt-1.5 text-sm leading-relaxed"><span className="font-semibold">Still missing: </span><span className="text-muted">{c.missing_evidence}</span></p>
              )}
            </li>
          ))}
        </ul>
        {showLegend && (
          <p className="mt-3 max-w-3xl text-sm text-muted">
            <span className="font-semibold text-ink">Unproven</span> means nothing relevant was submitted, so we cannot say
            whether you have the skill. <span className="font-semibold text-ink">Needs work</span> means the evidence you
            submitted shows a problem.
          </p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ListBlock title="Weaknesses" items={a.weaknesses} />
        <ListBlock title="Recommended improvements" items={a.recommended_improvements} />
      </div>
      <ListBlock title="Suggested next steps" items={a.next_steps} />

      <div className="flex flex-wrap gap-3">
        <LinkButton to={`/project/${project.id}#submit`}>Improve and resubmit</LinkButton>
        {project.analysis_id && (
          <LinkButton to={`/plan/${project.analysis_id}`} variant="secondary">Back to my skill gaps</LinkButton>
        )}
        <LinkButton to="/setup" variant="ghost">Start a new plan</LinkButton>
      </div>
    </div>
  )
}
