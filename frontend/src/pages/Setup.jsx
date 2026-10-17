import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FlaskConical, X } from 'lucide-react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { Button, Card, ErrorBanner, Field, ProgressPanel, inputClasses } from '../components/ui.jsx'

const LEVELS = ['Beginner', 'Intermediate', 'Recent graduate', 'Career changer']
const STEPS = ['Target job', 'About you', 'Review']
const EMPTY = {
  target_role: '',
  job_description: '',
  name: '',
  experience_level: 'Beginner',
  existing_skills: [],
  weekly_learning_hours: 10,
  is_demo: false,
  demo_key: '',
}
const DEMOS = [
  { id: 'digital-marketing', title: 'Digital Marketing Assistant' },
  { id: 'junior-accountant', title: 'Junior Accountant' },
  { id: 'data-engineer', title: 'Junior Data Engineer' },
]

function TagInput({ id, value, onChange }) {
  const [text, setText] = useState('')
  const add = () => {
    const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    const next = [...value]
    parts.forEach((p) => {
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < 40) next.push(p)
    })
    onChange(next)
    setText('')
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          id={id}
          className={inputClasses}
          value={text}
          maxLength={80}
          placeholder="e.g. Customer service"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
        />
        <Button type="button" variant="secondary" onClick={add}>Add</Button>
      </div>
      {value.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Your skills">
          {value.map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-3 pr-1.5 text-sm">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => onChange(value.filter((v) => v !== s))}
                className="rounded-full p-0.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [prefilled, setPrefilled] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [demoLoading, setDemoLoading] = useState('')
  const [demoLabel, setDemoLabel] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const loadDemo = async (id) => {
    setDemoLoading(id || 'first')
    setApiError(null)
    try {
      const d = await api.demo()
      const sc = d.scenarios.find((s) => s.id === id) || d.scenarios.find((s) => s.id === DEMOS[0].id) || d.scenarios[0]
      setForm({
        ...EMPTY, ...sc.profile, name: user?.name || sc.profile.name,
        job_description: sc.job_description, is_demo: true, demo_key: sc.id,
      })
      setDemoLabel(d.label)
      setPrefilled(false)
      setErrors({})
    } catch (e) {
      setApiError(e)
    } finally {
      setDemoLoading('')
    }
  }

  useEffect(() => {
    const d = params.get('demo')
    if (d) loadDemo(d === '1' ? undefined : d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Signed-in users: start from their name and the details of their last plan.
  useEffect(() => {
    if (!user || params.get('demo')) return undefined
    let alive = true
    api.me().then((u) => {
      if (!alive) return
      const lp = u.last_profile
      setForm((f) => (f.name || f.existing_skills.length || f.is_demo ? f : {
        ...f,
        name: u.name,
        ...(lp ? { experience_level: lp.experience_level, existing_skills: lp.existing_skills, weekly_learning_hours: lp.weekly_learning_hours } : {}),
      }))
      if (lp) setPrefilled(true)
    }).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const validate = (s) => {
    const e = {}
    if (s === 0 && form.target_role.trim().length < 2) e.target_role = 'Enter the job you are aiming for.'
    if (s === 1) {
      if (!form.name.trim()) e.name = 'Enter your name.'
      const h = Number(form.weekly_learning_hours)
      if (!Number.isInteger(h) || h < 1 || h > 80) e.weekly_learning_hours = 'Enter a whole number from 1 to 80.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => validate(step) && setStep(step + 1)

  const submit = async () => {
    if (!validate(0) || !validate(1)) return
    setBusy(true)
    setApiError(null)
    try {
      const profile = await api.createProfile({
        name: form.name.trim(),
        target_role: form.target_role.trim(),
        experience_level: form.experience_level,
        existing_skills: form.existing_skills,
        weekly_learning_hours: Number(form.weekly_learning_hours),
        job_description: form.job_description.trim(),
        is_demo: form.is_demo,
        demo_key: form.demo_key,
      })
      const analysis = await api.analyze(profile.id)
      navigate(`/plan/${analysis.id}`)
    } catch (e) {
      setApiError(e)
      setBusy(false)
    }
  }

  if (busy) {
    return (
      <ProgressPanel
        title="Analyzing your career plan"
        steps={[
          'Reading the job requirements...',
          'Separating what the job states from what it only implies...',
          'Comparing the requirements with your skills...',
          'Working out your priorities...',
        ]}
      />
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold sm:text-4xl">Build your career plan</h1>
      <p className="mt-2 text-muted">Three short steps. No account needed, and we only ask for your name.</p>

      <ol className="mt-6 flex gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className={`flex-1 border-t-4 pt-2 text-sm font-semibold ${i <= step ? 'border-accent text-ink' : 'border-line text-muted'}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-5">
        <ErrorBanner error={apiError} onRetry={step === 2 ? submit : undefined} />

        <Card className="space-y-5">
          {step === 0 && (
            <>
              <div className="rounded-lg bg-paper p-3">
                <p className="text-sm text-muted">Want to see how it works first? Load a demo scenario:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DEMOS.map((d) => (
                    <Button key={d.id} type="button" variant="secondary" loading={demoLoading === d.id} onClick={() => loadDemo(d.id)}>
                      <FlaskConical className="h-4 w-4" aria-hidden="true" />
                      {d.title}
                    </Button>
                  ))}
                </div>
              </div>
              {!user && (
                <p className="text-sm text-muted">
                  <Link to="/login?next=/setup" className="font-semibold text-accent underline">Sign in</Link> to save your plans and skip retyping your details next time.
                </p>
              )}
              <Field id="target_role" label="Target job role" error={errors.target_role}>
                <input
                  id="target_role"
                  className={inputClasses}
                  value={form.target_role}
                  maxLength={120}
                  placeholder="e.g. Digital Marketing Assistant, Junior Accountant, Nurse, Software Developer"
                  onChange={(e) => set({ target_role: e.target.value, is_demo: false, demo_key: '' })}
                />
              </Field>
              <Field
                id="job_description"
                label="Job description (optional)"
                hint="Paste a real job post for the most accurate result. Without one, we use typical expectations for the role and mark them as inferred."
              >
                <textarea
                  id="job_description"
                  aria-describedby="job_description-hint"
                  className={`${inputClasses} min-h-[200px]`}
                  value={form.job_description}
                  maxLength={8000}
                  onChange={(e) => set({ job_description: e.target.value, is_demo: false, demo_key: '' })}
                />
                <div className="mt-1.5 flex justify-between text-sm text-muted">
                  <span>{form.is_demo && demoLabel ? demoLabel : ''}</span>
                  <span>{form.job_description.length}/8000</span>
                </div>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              {prefilled && <p className="rounded-lg bg-accentSoft p-3 text-sm text-[#085C3E]">Filled in from your last plan. Change anything that is different now.</p>}
              <Field id="name" label="Your name" error={errors.name}>
                <input id="name" className={inputClasses} value={form.name} maxLength={120} autoComplete="given-name" onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field id="experience_level" label="Education or experience level">
                <select id="experience_level" className={inputClasses} value={form.experience_level} onChange={(e) => set({ experience_level: e.target.value })}>
                  {[...new Set([form.experience_level, ...LEVELS])].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field id="skills" label="Skills you already have" hint="Type a skill and press Enter, for example Customer service, Basic Excel or Lesson planning. Add words like 'basic' if they apply; the score treats them honestly.">
                <TagInput id="skills" value={form.existing_skills} onChange={(existing_skills) => set({ existing_skills })} />
              </Field>
              <Field id="weekly_learning_hours" label="Hours you can learn each week" error={errors.weekly_learning_hours}>
                <input
                  id="weekly_learning_hours"
                  type="number"
                  min={1}
                  max={80}
                  className={`${inputClasses} max-w-[10rem]`}
                  value={form.weekly_learning_hours}
                  onChange={(e) => set({ weekly_learning_hours: e.target.value })}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <dl className="space-y-4 text-sm">
              {[
                ['Target role', form.target_role],
                ['Name', form.name],
                ['Level', form.experience_level],
                ['Learning time', `${form.weekly_learning_hours} hours per week`],
                ['Skills', form.existing_skills.join(', ') || 'None listed. Everything will show as unproven.'],
                ['Job description', form.job_description ? `${form.job_description.length} characters${form.is_demo ? ' (demonstration data)' : ''}` : 'Not provided. Requirements will be inferred from the role.'],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-muted">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <div className="flex justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button onClick={next}>
              Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button onClick={submit}>Analyze my skill gaps</Button>
          )}
        </div>
      </div>
    </div>
  )
}
