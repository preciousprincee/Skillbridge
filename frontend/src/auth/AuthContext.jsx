import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken, getAuthToken, SIGNED_OUT_EVENT } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!getAuthToken()) // no token = nothing to check

  useEffect(() => {
    if (!getAuthToken()) return
    let alive = true
    api.me()
      .then((u) => alive && setUser(u))
      .catch(() => {}) // a 401 clears the token inside api.js; a network error keeps it so a reload can retry
      .finally(() => alive && setReady(true))
    return () => { alive = false }
  }, [])

  // The token died mid-session (e.g. signed out on another device).
  useEffect(() => {
    const onOut = () => setUser(null)
    window.addEventListener(SIGNED_OUT_EVENT, onOut)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onOut)
  }, [])

  const finish = useCallback(({ token, user }) => {
    setAuthToken(token)
    setUser(user)
    return user
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      login: (body) => api.login(body).then(finish),
      register: (body) => api.register(body).then(finish),
      logout: async () => {
        try { await api.logout() } catch { /* token may already be invalid */ }
        setAuthToken(null)
        setUser(null)
      },
    }),
    [user, ready, finish],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
