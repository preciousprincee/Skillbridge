import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Clock, FlaskConical, RefreshCw, Send } from 'lucide-react'
import { api } from '../api.js'
import { useLoad } from '../useLoad.js'
import {
  Button, Card, ErrorBanner, Field, PageLoading, ProgressPanel, inputClasses,
} from '../components/ui.jsx'

const NAV = [
  ['brief', 'Brief'], ['tasks', 'Tasks'], ['deliverables', 'Deliverables'], ['criteria', 'Acceptance criteria'],
  ['rubric', 'Assessment rubric'], ['submit', 'Submit your work'],
]

function BulletSection({ id, title, items }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6">
      <h2 id={`${id}-h`} className="text-2xl font-bold">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </section>
  )
}

export default function Project() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, data, error, reload } = useLoad(() => api.getProject(id), [id])
  const [checked, setChecked] = useState({})
  const [regen, setRegen] = useState({ busy: false, error: null })
  const [text, setText] = useState('')
  const [repo, setRepo] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [sub, setSub] = useState({ busy: false, error: null })
  const [sampleLoading, setSampleLoading] = useState(false)

  useEffect(() => setChecked({}), [id])

  // Router links with #hash do not scroll on their own.
  useEffect(() => {
    if (data && location.hash) document.querySelector(location.hash)?.scrollIntoView()
  }, [data, location.hash])

  if (loading) return <PageLoading label="Loading your project" />
  if (error) return <ErrorBanner error={error} onRetry={reload} />
  if (regen.busy) {
    return <ProgressPanel title="Designing a different project" steps={['Picking a new angle on your gaps...', 'Writing a new rubric...']} />
  }
  if (sub.busy) {
    return (
      <ProgressPanel
        title="Assessing your submission"
        steps={[
          'Reading your write-up...',
          'Matching your evidence to each rubric criterion...',
          'Noting what is proven and what is still missing...',
        ]}
      />
    )
  }

  const { project: p, rubric } = data

  const regenerate = async () => {
    setRegen({ busy: true, error: null })
    try {
      const next = await api.generateProject({ profile_id: data.profile_id, analysis_id: data.analysis_id || undefined, previous_project_id: data.id })
      navigate(`/project/${next.id}`)
      setRegen({ busy: false, error: null })
    } catch (e) {
      setRegen({ busy: false, error: e })
    }
  }

  const loadSample = async () => {
    setSampleLoading(true)
    try {
      const d = await api.demo()
      setText(d.sample_submission)
      setFieldErrors({})
    } catch (e) {
      setSub({ busy: false, error: e })
    } finally {
      setSampleLoading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (text.trim().length < 40) errs.text = 'Write at least a few sentences (40 characters or more) so there is something to assess.'
    if (repo && !/^https?:\/\//i.test(repo.trim())) errs.repo = 'Start the link with http:// or https://.'
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setSub({ busy: true, error: null })
    try {
      const r = await api.submit({ project_id: data.id, submission_text: text.trim(), repository_url: repo.trim() })
      navigate(`/results/${r.id}`)
    } catch (err) {
      setSub({ busy: false, error: err })
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_15rem]">
      <div className="min-w-0 space-y-12">
        <header id="brief" className="scroll-mt-6">
          <p className="text-sm text-muted">Your practical project</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{p.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="rounded-full bg-accentSoft px-3 py-1 font-semibold capitalize text-[#085C3E]">{p.difficulty}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />About {p.estimated_hours} hours</span>
          </div>
          <h2 className="mt-8 text-xl font-bold">The problem</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted">{p.problem_statement}</p>
          <h2 className="mt-6 text-xl font-bold">Why it matters for this role</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted">{p.why_it_matters}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[['Skills it tests', p.skills_tested], ['Prerequisites', p.prerequisites], ['Tools (free)', p.required_tools]].map(([t, items]) => (
              <div key={t}>
                <h3 className="font-display font-bold">{t}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li>None</li>}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="secondary" onClick={regenerate}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Not a fit? Generate a different project
            </Button>
          </div>
          {regen.error && <div className="mt-4"><ErrorBanner error={regen.error} onRetry={regenerate} /></div>}
        </header>

        <section id="tasks" aria-labelledby="tasks-h" className="scroll-mt-6">
          <h2 id="tasks-h" className="text-2xl font-bold">Tasks</h2>
          <ol className="mt-4 space-y-4">
            {p.tasks.map((t, i) => (
              <li key={`${t.title}-${i}`} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="font-bold">{t.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{t.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <BulletSection id="deliverables" title="Deliverables" items={p.deliverables} />
        <BulletSection id="criteria" title="Acceptance criteria" items={p.acceptance_criteria} />
        <BulletSection id="mistakes" title="Common mistakes" items={p.common_mistakes} />

        <section aria-labelledby="check-h">
          <h2 id="check-h" className="text-2xl font-bold">Before you submit</h2>
          <ul className="mt-3 space-y-2">
            {p.submission_checklist.map((c, i) => (
              <li key={c}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#0B7A52]"
                    checked={!!checked[i]}
                    onChange={(e) => setChecked({ ...checked, [i]: e.target.checked })}
                  />
                  <span className={checked[i] ? 'text-muted line-through' : 'text-ink'}>{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section id="rubric" aria-labelledby="rubric-h" className="scroll-mt-6">
          <h2 id="rubric-h" className="text-2xl font-bold">Assessment rubric (100 points)</h2>
          <p className="mt-1 text-muted">This is how your submitted evidence will be scored.</p>
          {rubric.rebalanced && (
            <p className="mt-2 text-sm text-muted">Point values were adjusted automatically so the total is exactly 100.</p>
          )}
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
            {rubric.criteria.map((c) => (
              <li key={c.name} className="p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-bold">{c.name}</h3>
                  <span className="shrink-0 font-display text-lg font-bold">{c.max_points} pts</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.description}</p>
                <p className="mt-2 text-sm leading-relaxed"><span className="font-semibold">Full marks: </span><span className="text-muted">{c.success_looks_like}</span></p>
              </li>
            ))}
          </ul>
        </section>

        <section id="submit" aria-labelledby="submit-h" className="scroll-mt-6">
          <h2 id="submit-h" className="text-2xl font-bold">Submit your work</h2>
          <Card className="mt-4">
            <form onSubmit={submit} className="space-y-5" noValidate>
              <ErrorBanner error={sub.error} />
              <Field
                id="submission_text"
                label="Your write-up and evidence"
                hint="Explain what you built and how. Include a project summary and paste key code or SQL snippets. Only what you write here is assessed."
                error={fieldErrors.text}
              >
                <textarea
                  id="submission_text"
                  aria-describedby="submission_text-hint"
                  className={`${inputClasses} min-h-[260px]`}
                  value={text}
                  maxLength={12000}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                  <Button type="button" variant="ghost" loading={sampleLoading} onClick={loadSample} className="!px-2 !py-1">
                    <FlaskConical className="h-4 w-4" aria-hidden="true" /> Fill in the demo sample submission
                  </Button>
                  <span>{text.length}/12000</span>
                </div>
              </Field>
              <Field
                id="repository_url"
                label="Repository link (optional)"
                hint="We save the link but do not open it or run your code. Paste the relevant code above so it can be assessed."
                error={fieldErrors.repo}
              >
                <input
                  id="repository_url"
                  aria-describedby="repository_url-hint"
                  className={inputClasses}
                  value={repo}
                  maxLength={300}
                  placeholder="https://github.com/you/project"
                  onChange={(e) => setRepo(e.target.value)}
                />
              </Field>
              <Button type="submit">
                <Send className="h-4 w-4" aria-hidden="true" /> Assess my submission
              </Button>
            </form>
          </Card>
        </section>
      </div>

      <aside className="hidden lg:block">
        <nav aria-label="On this page" className="sticky top-6">
          <ul className="space-y-1 border-l-2 border-line text-sm">
            {NAV.map(([anchor, label]) => (
              <li key={anchor}>
                <a href={`#${anchor}`} className="-ml-0.5 block border-l-2 border-transparent py-1.5 pl-4 text-muted hover:border-accent hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}
