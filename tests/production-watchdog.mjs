import assert from 'node:assert/strict'

const origin = process.env.ASTRO_PRODUCTION_ORIGIN || 'https://astroadvicebykundansingh.com'
assert.equal(new URL(origin).origin, origin, 'Production origin must be an exact HTTPS origin')
assert.equal(new URL(origin).protocol, 'https:')

async function read(path, expectedType) {
  const response = await fetch(origin + path, {
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  })
  assert.equal(response.status, 200, `${path}: status`)
  assert.match(response.headers.get('content-type') || '', expectedType, `${path}: content type`)
  return response
}

const homepage = await read('/', /^text\/html/i)
assert.match(await homepage.text(), /<div id="root"><\/div>/, 'Homepage application shell')

const health = await (await read('/api/health', /^application\/json/i)).json()
assert.deepEqual(health, { status: 'online' }, 'Website process must answer')

const ready = await (await read('/api/ready', /^application\/json/i)).json()
assert.deepEqual(ready, { storage_ready: true, booking_enabled: true },
  'Database and booking connections must be ready')

const recovery = await (await read('/api/recovery-health', /^application\/json/i)).json()
assert.deepEqual(recovery, { status: 'healthy' },
  'Cloudflare recovery must have completed recently with no work needing attention')

console.log(JSON.stringify({ origin, reads: 4, writes: 0, passed: true }))
