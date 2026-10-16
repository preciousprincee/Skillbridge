import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Button, Card, ErrorBanner, Field, inputClasses } from '../components/ui.jsx'

// One page, two modes: /login and /register.
export default function Auth({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = location.state?.from || '/setup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) return <Navigate to={next} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }))
      navigate(next, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-muted">
        {isRegister
          ? 'Save your plans and get suggestions that fit your background. It works for any career, not only tech.'
          : 'Sign in to pick up your career plans where you left off.'}
      </p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <ErrorBanner error={error} />
          {isRegister && (
            <Field id="name" label="Your name">
              <input id="name" className={inputClasses} value={form.name} onChange={set('name')} autoComplete="name" required />
            </Field>
          )}
          <Field id="email" label="Email">
            <input id="email" type="email" className={inputClasses} value={form.email} onChange={set('email')} autoComplete="email" required />
          </Field>
          <Field id="password" label="Password" hint={isRegister ? 'At least 8 characters.' : undefined}>
            <input
              id="password" type="password" className={inputClasses} value={form.password} onChange={set('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required
            />
          </Field>
          <Button type="submit" loading={busy} className="w-full">
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link to={isRegister ? '/login' : '/register'} state={location.state} className="font-semibold text-accent underline">
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        <Link to="/setup?demo=1" className="underline">Or try the demo without an account</Link>
      </p>
    </div>
  )
}
