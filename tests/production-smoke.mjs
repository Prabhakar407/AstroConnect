import assert from 'node:assert/strict'

const origin = process.env.ASTRO_PRODUCTION_ORIGIN || 'https://astroadvicebykundansingh.com'
assert.equal(new URL(origin).origin, origin, 'Production origin must be an exact HTTPS origin')
assert.equal(new URL(origin).protocol, 'https:')

const paths = [
  '/', '/about', '/services', '/services/vedic-astrology', '/services/numerology',
  '/services/vastu', '/services/laal-kitaab', '/services/prashna-kundali',
  '/services/name-change', '/testimonials', '/contact', '/booking',
  '/privacy-policy', '/terms-and-conditions', '/refund-policy',
]
for (const path of paths) {
  const response = await fetch(origin + path, { redirect: 'error', signal: AbortSignal.timeout(15_000) })
  assert.equal(response.status, 200, `${path}: status`)
  assert.match(response.headers.get('content-type') || '', /^text\/html/i, `${path}: content type`)
  const body = await response.text()
  assert.match(body, /<div id="root"><\/div>/, `${path}: application shell`)
}

const apiPaths = ['/api/health', '/api/ready', '/api/recovery-health', '/api/services', '/api/booking-policy']
for (const path of apiPaths) {
  const response = await fetch(origin + path, { redirect: 'error', signal: AbortSignal.timeout(20_000) })
  assert.equal(response.status, 200, `${path}: status`)
  assert.match(response.headers.get('content-type') || '', /^application\/json/i, `${path}: content type`)
  assert.match(response.headers.get('cache-control') || '', /no-store/i, `${path}: no-store`)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', `${path}: content sniffing disabled`)
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer', `${path}: referrer policy`)
  const payload = await response.json()
  assert.equal(typeof payload, 'object', `${path}: JSON object`)
}

const ready = await (await fetch(origin + '/api/ready', { signal: AbortSignal.timeout(20_000) })).json()
assert.equal(ready.storage_ready, true, 'Official storage must be ready')
assert.equal(ready.booking_enabled, true, 'Official booking must be enabled')

const recovery = await (await fetch(origin + '/api/recovery-health', { signal: AbortSignal.timeout(20_000) })).json()
assert.deepEqual(recovery, { status: 'healthy' }, 'Official scheduled recovery must be current and clear')

const services = await (await fetch(origin + '/api/services', { signal: AbortSignal.timeout(20_000) })).json()
assert.equal(services.services?.length, 6, 'Official service catalogue must contain six consultations')

const anonymousSession = await fetch(origin + '/api/admin/session', {
  redirect: 'error', signal: AbortSignal.timeout(20_000),
})
assert.equal(anonymousSession.status, 401, 'Anonymous studio access must be refused')
assert.match(anonymousSession.headers.get('cache-control') || '', /no-store/i, 'Anonymous refusal must not be cached')

for (const path of ['/api/webhooks/resend', '/api/webhooks/razorpay']) {
  const response = await fetch(origin + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  })
  assert.equal(response.status, 400, `${path}: unsigned callback must be refused`)
  assert.match(response.headers.get('cache-control') || '', /no-store/i, `${path}: refusal must not be cached`)
}

console.log(JSON.stringify({
  origin,
  public_pages: paths.length,
  safe_api_reads: apiPaths.length + 2,
  refusal_only_requests: 2,
  writes: 0,
  passed: true,
}))
