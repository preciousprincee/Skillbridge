import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '../api.js'
import { useLoad } from '../useLoad.js'
import JourneyNav from '../components/JourneyNav.jsx'
import PlankMeter from '../components/PlankMeter.jsx'
import {
  Badge, Button, Card, ErrorBanner, Meter, PageLoading, PRIORITY, ProgressPanel, SKILL_STATUS,
} from '../components/ui.jsx'

const IMPORTANCE = { critical: 'Critical', important: 'Important', nice_to_have: 'Nice to have' }

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, data, error, reload } = useLoad(() => api.getAnalysis(id), [id])
  const [gen, setGen] = useState({ busy: false, error: null })

  if (loading) return <PageLoading label="Loading your plan" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />

  const { gap, requirements, profile } = data

  const generate = async () => {
    setGen({ busy: true, error: null })
    try {
      const p = await api.generateProject({ profile_id: data.profile_id, analysis_id: data.id })
      navigate(`/project/${p.id}`)
    } catch (e) {
      setGen({ busy: false, error: e })
    }
  }

  if (gen.busy) {
    return (
      <ProgressPanel
        title="Designing your project"
        steps={[
          'Choosing a project that fits your top gaps...',
          'Sizing it to your level and weekly hours...',
          'Writing a 100-point rubric to assess it...',
        ]}
      />
    )
  }

  const toImprove = gap.skills.filter((s) => s.status !== 'reported')

  return (
    <div className="space-y-10">
      <JourneyNav current="plan" analysisId={data.id} />
      <header>
        <p className="text-sm text-muted">Skill gap analysis for {profile.name}</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{profile.target_role}</h1>
        {profile.is_demo && (
          <p className="mt-2 inline-block rounded-md bg-[#FEF0C7] px-2.5 py-1 text-sm text-[#7A4510]">
            Demonstration data, not a live vacancy.
          </p>
        )}
      </header>

      <Card className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-muted">{gap.score_label}</p>
          <p className="mt-1 font-display text-6xl font-bold" aria-label={`${gap.alignment_score} percent`}>
            {gap.alignment_score}%
          </p>
          <div className="mt-5">
            <PlankMeter skills={gap.skills} />
          </div>
          <p className="mt-4 text-sm text-muted">
            {gap.counts.reported} self-reported, {gap.counts.to_improve} partial and {gap.counts.not_demonstrated} unproven
            out of {gap.counts.total} required skills.
          </p>
        </div>
        <div className="rounded-lg bg-paper p-4 text-sm leading-relaxed text-muted">
          <h2 className="font-display text-base font-bold text-ink">How this was estimated</h2>
          <p className="mt-2">{gap.method}</p>
          <p className="mt-2">
            {requirements.source === 'job_description'
              ? 'Requirements come from the job description you provided. Items marked "inferred" were not stated in it.'
              : 'You did not provide a job description, so every requirement is inferred from the role title.'}
          </p>
        </div>
      </Card>

      <section aria-labelledby="priorities">
        <h2 id="priorities" className="text-2xl font-bold">Priority actions</h2>
        {gap.priorities.length === 0 ? (
          <Card className="mt-4 text-muted">Every required skill appears in your profile. A project can still turn those claims into evidence.</Card>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
            {gap.priorities.map((p) => (
              <li key={p.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="max-w-2xl">
                  <p className="font-semibold">{p.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{p.explanation}</p>
                </div>
                <div className="shrink-0"><Badge map={PRIORITY} value={p.priority} /></div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-xl border border-accent/30 bg-accentSoft p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="text-lg font-bold">Turn these gaps into evidence</h3>
            <p className="mt-1 text-sm text-[#2D3C52]">
              Get one practical project for your level and {profile.weekly_learning_hours} hours a week, with a rubric to assess it.
            </p>
          </div>
          <Button onClick={generate} className="mt-4 shrink-0 sm:mt-0">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Generate my project
          </Button>
        </div>
        {gen.error && <div className="mt-4"><ErrorBanner error={gen.error} onRetry={generate} /></div>}
      </section>

      <section aria-labelledby="categories">
        <h2 id="categories" className="text-2xl font-bold">By category</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gap.categories.map((c) => (
            <Card key={c.category}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold">{c.category}</h3>
                <span className="font-display text-xl font-bold">{c.score}%</span>
              </div>
              <div className="mt-3"><Meter value={c.score} label={`${c.category} alignment`} /></div>
              <p className="mt-3 text-sm text-muted">
                {c.reported} of {c.total} self-reported
                {c.not_demonstrated > 0 ? `, ${c.not_demonstrated} unproven` : ''}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="skills">
        <h2 id="skills" className="text-2xl font-bold">Required skills</h2>
        <p className="mt-1 text-muted">{toImprove.length} of {gap.skills.length} still need evidence.</p>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
          {gap.skills.map((s) => (
            <li key={s.name} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-semibold">{s.name}</span>
                <Badge map={SKILL_STATUS} value={s.status} />
                <span className="text-sm text-muted">{IMPORTANCE[s.importance] || s.importance}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted">
                {s.basis === 'explicit' && s.evidence
                  ? <>Stated in the job description: &ldquo;{s.evidence}&rdquo;</>
                  : 'Inferred for this role. It was not stated in the text provided.'}
                {s.matched_with ? <> You listed &ldquo;{s.matched_with}&rdquo;.</> : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {(requirements.responsibilities.length > 0 || requirements.experience_expectations.length > 0) && (
        <details className="rounded-xl border border-line bg-white p-5">
          <summary className="cursor-pointer font-semibold">Role details extracted from the job</summary>
          <div className="mt-4 grid gap-6 text-sm text-muted sm:grid-cols-2">
            {[
              ['Responsibilities', requirements.responsibilities],
              ['Experience expectations', requirements.experience_expectations],
              ['Key requirements', requirements.key_requirements],
            ].filter(([, items]) => items.length > 0).map(([title, items]) => (
              <div key={title}>
                <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">{items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
