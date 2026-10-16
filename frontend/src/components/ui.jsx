import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { describeDetails } from '../api.js'

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const BTN_VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accentDark',
  secondary: 'border border-line bg-white text-ink hover:bg-paper',
  ghost: 'text-muted hover:bg-white hover:text-ink',
  light: 'bg-white text-ink hover:bg-[#E8EDF3]',
}
export const buttonClasses = (variant = 'primary', extra = '') =>
  `${BTN_BASE} ${BTN_VARIANTS[variant]} ${extra}`

export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...rest }) {
  return (
    <button className={buttonClasses(variant, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function LinkButton({ to, variant = 'primary', className = '', children, ...rest }) {
  return (
    <Link to={to} className={buttonClasses(variant, className)} {...rest}>
      {children}
    </Link>
  )
}

export function Card({ className = '', children, as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`rounded-xl border border-line bg-white p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-[#B42318]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClasses =
  'w-full rounded-lg border border-[#B7C3D1] bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-[#6B7A90] focus:border-accent'

const HINTS = {
  rate_limited: 'Wait about a minute, then try again.',
  missing_api_key: 'Add GEMINI_API_KEY (or AI_PROVIDER=groq with GROQ_API_KEY) to backend/.env, then restart the Django server.',
  auth_error: 'Check that the AI key in backend/.env is valid and matches AI_PROVIDER.',
  timeout: 'The AI took too long. Try again; a shorter input can help.',
  invalid_ai_output: 'The AI reply was not usable. Trying again usually fixes this.',
  network: 'Start the backend with: python manage.py runserver',
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null
  const lines = describeDetails(error.details)
  return (
    <div role="alert" className="rounded-xl border border-[#F4B6AE] bg-[#FEF3F2] p-4 text-[#7A271A]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{error.message || 'Something went wrong.'}</p>
          {HINTS[error.code] && <p className="mt-1 text-sm">{HINTS[error.code]}</p>}
          {lines.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-sm">
              {lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-[#F4B6AE] bg-white px-3 py-1.5 text-sm font-semibold hover:bg-[#FFF8F7]"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Rotates through plain-language messages while a slow AI call runs.
export function ProgressPanel({ title, steps }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 5000)
    return () => clearInterval(t)
  }, [steps.length])
  return (
    <Card className="mx-auto max-w-xl text-center" role="status" aria-live="polite">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{steps[i]}</p>
      <p className="mt-4 text-sm text-muted">This can take up to a minute.</p>
    </Card>
  )
}

export function PageLoading({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

const BADGE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
export const SKILL_STATUS = {
  reported: { label: 'Self-reported', cls: 'bg-accentSoft text-[#085C3E]' },
  to_improve: { label: 'Partial', cls: 'bg-[#FEF0C7] text-[#7A4510]' },
  not_demonstrated: { label: 'Unproven', cls: 'bg-[#E8EDF3] text-[#2D3C52]' },
}
export const EVIDENCE_STATUS = {
  demonstrated: { label: 'Demonstrated', cls: 'bg-accentSoft text-[#085C3E]' },
  partial: { label: 'Partial', cls: 'bg-[#FEF0C7] text-[#7A4510]' },
  not_demonstrated: { label: 'Unproven', cls: 'bg-[#E8EDF3] text-[#2D3C52]' },
  deficient: { label: 'Needs work', cls: 'bg-[#FEE4E2] text-[#912018]' },
}
export const PRIORITY = {
  high: { label: 'High priority', cls: 'bg-[#FEE4E2] text-[#912018]' },
  medium: { label: 'Medium priority', cls: 'bg-[#FEF0C7] text-[#7A4510]' },
  low: { label: 'Low priority', cls: 'bg-[#E8EDF3] text-[#2D3C52]' },
}

export function Badge({ map, value }) {
  const m = map[value] || { label: value, cls: 'bg-[#E8EDF3] text-[#2D3C52]' }
  return <span className={`${BADGE} ${m.cls}`}>{m.label}</span>
}

export function Meter({ value, max = 100, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-[#E8EDF3]"
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  )
}
