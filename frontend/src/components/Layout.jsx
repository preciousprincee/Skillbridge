import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../auth.jsx'
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

const desktopLink = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-paper text-ink' : 'text-muted hover:text-ink'}`
const mobileLink = ({ isActive }) =>
  `block rounded-lg px-3 py-3 text-base font-semibold ${isActive ? 'bg-paper text-ink' : 'text-ink hover:bg-paper'}`

export default function Layout() {
  const { user, ready, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const menuButton = useRef(null)

  // Close the mobile menu after navigating, and on Escape.
  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const signOut = async () => {
    await logout()
    setOpen(false)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only rounded-md bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Wordmark />

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={desktopLink}>Home</NavLink>
            <NavLink to="/setup" className={desktopLink}>New career plan</NavLink>
            {user && <NavLink to="/plans" className={desktopLink}>My plans</NavLink>}
            {ready && (user ? (
              <div className="ml-3 flex items-center gap-3 border-l border-line pl-4">
                <span className="max-w-[10rem] truncate text-sm text-muted">Hi, {user.name}</span>
                <button type="button" onClick={signOut} className={buttonClasses('secondary', '!py-1.5')}>
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            ) : (
              <div className="ml-3 flex items-center gap-2 border-l border-line pl-4">
                <NavLink to="/login" className={desktopLink}>Sign in</NavLink>
                <Link to="/register" className={buttonClasses('primary', '!py-1.5')}>Create account</Link>
              </div>
            ))}
          </nav>

          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <nav id="mobile-menu" aria-label="Main" className="border-t border-line bg-white px-4 pb-4 pt-2 md:hidden">
            <ul className="space-y-1">
              <li><NavLink to="/" end className={mobileLink}>Home</NavLink></li>
              <li><NavLink to="/setup" className={mobileLink}>New career plan</NavLink></li>
              {user && <li><NavLink to="/plans" className={mobileLink}>My plans</NavLink></li>}
            </ul>
            {ready && (
              <div className="mt-3 border-t border-line pt-3">
                {user ? (
                  <>
                    <p className="px-3 pb-2 text-sm text-muted">Signed in as {user.name}</p>
                    <button type="button" onClick={signOut} className={buttonClasses('secondary', 'w-full !py-3')}>
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Link to="/register" className={buttonClasses('primary', '!py-3')}>Create account</Link>
                    <Link to="/login" className={buttonClasses('secondary', '!py-3')}>Sign in</Link>
                  </div>
                )}
              </div>
            )}
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
