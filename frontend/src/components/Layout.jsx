import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'
import { buttonClasses } from './ui.jsx'

export function Wordmark({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 rounded-md ${className}`} aria-label="SkillBridge AI home">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="#0B1F3A" />
        <path d="M5 19c3-8 15-8 18 0" stroke="#5FD0A0" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M5 21h18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">SkillBridge AI</span>
    </Link>
  )
}

// Plain-language labels so the menu makes sense to people in any field.
const linkCls = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`
const plainLinkCls = 'rounded-md px-3 py-2 text-sm font-semibold text-muted hover:text-ink'

export default function Layout() {
  const { user, ready, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const toggleRef = useRef(null)

  // Close the menu on navigation, on Escape, and when the screen grows to desktop size.
  useEffect(() => setOpen(false), [location.pathname, location.search])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const mq = window.matchMedia('(min-width: 768px)')
    const onResize = () => mq.matches && setOpen(false)
    document.addEventListener('keydown', onKey)
    mq.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onResize)
    }
  }, [open])

  const signOut = async () => {
    await logout()
    setOpen(false)
    navigate('/')
  }

  const items = [
    <NavLink key="home" to="/" end className={linkCls}>Home</NavLink>,
    <NavLink key="plan" to="/setup" end className={linkCls}>Build my plan</NavLink>,
    <Link key="demo" to="/setup?demo=1" className={plainLinkCls}>See an example</Link>,
  ]

  const account = !ready ? null : user ? (
    <>
      <span className="px-3 py-2 text-sm text-muted">Hi, {user.name?.split(' ')[0] || 'there'}</span>
      <button type="button" onClick={signOut} className={`inline-flex items-center gap-2 ${plainLinkCls}`}>
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className={plainLinkCls}>Sign in</Link>
      <Link to="/register" className={buttonClasses('primary', 'py-2')}>Create account</Link>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only rounded-md bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Wordmark />

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items}
            <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
            {account}
          </nav>

          {/* Hamburger (small screens) */}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-white px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col [&>a]:py-3">{items}</div>
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3 [&>a]:justify-center [&>a]:text-center [&>button]:py-3">
              {account}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-white">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted sm:px-6">
          Scores are AI-assisted estimates based on what you tell us and submit. They are not a hiring probability or a
          certification of competence.
        </p>
      </footer>
    </div>
  )
}
