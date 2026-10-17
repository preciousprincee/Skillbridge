import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, AUTH_EXPIRED, clearToken, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(() => !getToken()) // with no stored token there is nothing to check

  useEffect(() => {
    let alive = true
    if (getToken()) {
      api.me()
        .then((u) => alive && setUser(u))
        .catch(() => clearToken())
        .finally(() => alive && setReady(true))
    }
    const onExpired = () => setUser(null)
    window.addEventListener(AUTH_EXPIRED, onExpired)
    return () => {
      alive = false
      window.removeEventListener(AUTH_EXPIRED, onExpired)
    }
  }, [])

  const finish = useCallback((res) => {
    setToken(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const value = useMemo(() => ({
    user,
    ready,
    login: async (body) => finish(await api.login(body)),
    register: async (body) => finish(await api.register(body)),
    logout: async () => {
      try { await api.logout() } catch { /* token may already be invalid; sign out locally anyway */ }
      clearToken()
      setUser(null)
    },
  }), [user, ready, finish])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
