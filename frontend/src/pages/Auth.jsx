import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { Button, Card, ErrorBanner, Field, inputClasses } from '../components/ui.jsx'

// Only allow in-app redirects (blocks //evil.com and https://evil.com).
const safePath = (p) => (p && p.startsWith('/') && !p.startsWith('//') ? p : '')

export default function Auth({ mode }) {
  const isRegister = mode === 'register'
  const { user, ready, login, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safePath(params.get('next'))
  const submitted = useRef(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Already signed in when arriving here: go on to the app.
  if (ready && user && !submitted.current) return <Navigate to={next || '/plans'} replace />

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    submitted.current = true
    try {
      if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      else await login({ email: form.email.trim(), password: form.password })
      navigate(next || (isRegister ? '/setup' : '/plans'), { replace: true })
    } catch (err) {
      submitted.current = false
      setError(err)
      setBusy(false)
    }
  }

  const other = `${isRegister ? '/login' : '/register'}${next ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-muted">
        {isRegister
          ? 'Save your plans, projects and results, and skip retyping your details next time.'
          : 'Sign in to see your saved plans.'}
      </p>

      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <ErrorBanner error={error} />
          {isRegister && (
            <Field id="name" label="Your name">
              <input id="name" required className={inputClasses} value={form.name} maxLength={100} autoComplete="name" onChange={(e) => set({ name: e.target.value })} />
            </Field>
          )}
          <Field id="email" label="Email">
            <input id="email" type="email" required className={inputClasses} value={form.email} maxLength={150} autoComplete="email" onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field id="password" label="Password" hint={isRegister ? 'At least 8 characters. Avoid common or all-number passwords.' : undefined}>
            <input
              id="password"
              type="password"
              required
              aria-describedby={isRegister ? 'password-hint' : undefined}
              className={inputClasses}
              value={form.password}
              maxLength={128}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onChange={(e) => set({ password: e.target.value })}
            />
          </Field>
          <Button type="submit" loading={busy} className="w-full">{isRegister ? 'Create account' : 'Sign in'}</Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-sm text-muted">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link to={other} className="font-semibold text-accent underline">{isRegister ? 'Sign in' : 'Create an account'}</Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        <Link to="/setup" className="underline">Continue without an account</Link>
      </p>
    </div>
  )
}
