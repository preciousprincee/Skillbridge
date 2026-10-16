import axios from 'axios'

// Backend responses look like { ok: true, data } or { ok: false, error: { code, message, details } }.
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 300000, // project + rubric = 2 AI calls, each may retry once
})

export class ApiError extends Error {
  constructor(message, code = 'error', details = null, status = 0) {
    super(message)
    this.code = code
    this.details = details
    this.status = status
  }
}

const TOKEN_KEY = 'skillbridge_token'
export const getAuthToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export function setAuthToken(token) {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
}
// Send the token on every request when signed in; anonymous use (and the demo) keeps working.
http.interceptors.request.use((config) => {
  const t = getAuthToken()
  // Never send a possibly stale token to login/register: DRF would reject it before the view runs.
  const isAuthEntry = /\/auth\/(login|register)\/?$/.test(config.url || '')
  if (t && !isAuthEntry) config.headers.Authorization = `Token ${t}`
  return config
})

export const SIGNED_OUT_EVENT = 'skillbridge:signed-out'

async function call(request) {
  try {
    const res = await request
    return res.data.data
  } catch (e) {
    // A 401 on an authenticated request means the token is dead (signed out elsewhere, expired): drop it.
    if (e.response?.status === 401 && getAuthToken() && !/\/auth\/login\//.test(e.config?.url || '')) {
      setAuthToken(null)
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT))
    }
    const body = e.response?.data?.error
    if (body) throw new ApiError(body.message, body.code, body.details, e.response.status)
    if (e.response) throw new ApiError('The server returned an unexpected error. Check the Django terminal for details.', 'server_error', null, e.response.status)
    if (e.code === 'ECONNABORTED') throw new ApiError('The request took too long.', 'timeout')
    throw new ApiError('Cannot reach the server. Check that the backend is running on port 8000.', 'network')
  }
}

export const api = {
  register: (body) => call(http.post('/auth/register/', body)),
  login: (body) => call(http.post('/auth/login/', body)),
  logout: () => call(http.post('/auth/logout/')),
  me: () => call(http.get('/auth/me/')),
  demo: () => call(http.get('/demo/')),
  health: () => call(http.get('/health/')),
  createProfile: (body) => call(http.post('/profiles/', body)),
  analyze: (profile_id) => call(http.post('/analyze/', { profile_id })),
  getAnalysis: (id) => call(http.get(`/analyses/${id}/`)),
  generateProject: (body) => call(http.post('/projects/generate/', body)),
  getProject: (id) => call(http.get(`/projects/${id}/`)),
  submit: (body) => call(http.post('/submissions/', body)),
  getResults: (id) => call(http.get(`/submissions/${id}/results/`)),
}

// Flatten DRF field errors into readable lines.
export function describeDetails(details) {
  if (!details || typeof details !== 'object') return []
  return Object.entries(details).map(([field, msg]) => {
    const text = Array.isArray(msg) ? msg.join(' ') : String(msg)
    return `${field.replace(/_/g, ' ')}: ${text}`
  })
}
