// Only random identifiers belong in browser storage, never form contents or codes.
export function createReceipt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = values => Array.from(values, value => value.toString(16).padStart(2, '0')).join('')
  const id = hex(bytes)
  return { id: `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`,
    secret: hex(crypto.getRandomValues(new Uint8Array(32))) }
}

export function readReceipt(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(`astro:receipt:${key}`))
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value?.id) && /^[a-f0-9]{64}$/.test(value?.secret)) {
      return { id: value.id, secret: value.secret }
    }
  } catch { /* A blocked browser store does not stop this tab's in-memory retry. */ }
  return null
}

export function rememberReceipt(key, receipt) {
  try { sessionStorage.setItem(`astro:receipt:${key}`, JSON.stringify({ id: receipt.id, secret: receipt.secret })) } catch { /* Memory still works. */ }
}

export function forgetReceipt(key) {
  try { sessionStorage.removeItem(`astro:receipt:${key}`) } catch { /* Memory still works. */ }
}
