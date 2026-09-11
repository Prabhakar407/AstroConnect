// Both public forms and the private calendar must use the same explicit route.
// Blank configuration keeps a standalone design preview disconnected.
export function apiEndpoint(path, env = import.meta.env || {}) {
  if (!/^\/api(?:\/|$)/.test(path) || /[\\#]/.test(path) || path.includes('..')) {
    throw new Error('The requested form address is invalid.')
  }
  const mode = env.VITE_API_MODE || 'explicit'
  const base = (env.VITE_API_URL || '').trim()
  if (mode === 'same-origin') {
    if (base) throw new Error('The website connection has conflicting settings. Please contact the studio.')
    return path
  }
  if (mode !== 'explicit' || !base) {
    throw new Error('Online forms are not connected yet. Please call +91 85277 90801.')
  }
  let url
  try { url = new URL(base) } catch { /* Report configuration, never its value. */ }
  const local = url && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (!url || (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('The website connection needs a secure server address. Please contact the studio.')
  }
  return `${url.origin}${path}`
}
