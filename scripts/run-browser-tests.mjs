import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = process.env.ASTRO_BROWSER_CERTIFICATION_ROOT || mkdtempSync(join(tmpdir(), 'astro-browser-certification.'))
const base = 'http://127.0.0.1:5186'
const api = 'http://127.0.0.1:18000/api/health'
const python = process.env.ASTRO_TEST_PYTHON || resolve(root, '.venv/bin/python')
const children = []
mkdirSync(output, { recursive: true })
writeFileSync(resolve(output, '.keep'), '')

function sideEffectFreeEnvironment(extra = {}) {
  const environment = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(?:ASTRO_|VITE_|DATABASE_URL|PG|GOOGLE_|RAZORPAY_|RESEND_)/.test(key)) continue
    environment[key] = value
  }
  return { ...environment, ...extra }
}

function start(command, args, environment, logName) {
  const child = spawn(command, args, { cwd: root, env: environment, stdio: ['ignore', 'pipe', 'pipe'] })
  const chunks = []
  child.stdout.on('data', chunk => chunks.push(chunk))
  child.stderr.on('data', chunk => chunks.push(chunk))
  child.logName = logName
  child.chunks = chunks
  children.push(child)
  return child
}

async function waitFor(url, child) {
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${child.logName} exited before becoming ready`)
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
    } catch {}
    await new Promise(resolvePromise => setTimeout(resolvePromise, 150))
  }
  throw new Error(`${child.logName} did not become ready`)
}

async function stop(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([
    new Promise(resolvePromise => child.once('exit', resolvePromise)),
    new Promise(resolvePromise => setTimeout(resolvePromise, 5_000)),
  ])
  if (child.exitCode === null) child.kill('SIGKILL')
}

const scripts = [
  'tests/browser-certification.mjs',
  'tests/browser-booking.cjs',
  'tests/browser-google-connection.cjs',
  'tests/browser-inquiry-recovery.cjs',
  'tests/browser-policy-pages.cjs',
  'tests/browser-private-calendar.cjs',
  'tests/browser-private-inquiries.cjs',
  'tests/browser-release-polish.cjs',
  'tests/browser-testimonial-rotation.cjs',
  'tests/browser-hosting.cjs',
  'tests/browser-verification-email.mjs',
]

let failed = false
const results = []
try {
  const safe = sideEffectFreeEnvironment({ PYTHONPATH: root })
  const apiProcess = start(python, ['-m', 'uvicorn', 'src.backend.main:app', '--host', '127.0.0.1', '--port', '18000', '--no-access-log'], safe, 'local API')
  const viteProcess = start(resolve(root, 'node_modules/.bin/vite'), ['--config', 'tests/vite.hosting.config.js'],
    sideEffectFreeEnvironment({ VITE_API_MODE: 'same-origin', VITE_API_URL: '' }), 'local website')
  await waitFor(api, apiProcess)
  await waitFor(base, viteProcess)

  for (const filename of scripts) {
    const started = Date.now()
    console.log(`\n--- ${filename} ---`)
    const outcome = spawnSync(process.execPath, [filename], {
      cwd: root,
      env: sideEffectFreeEnvironment({
        ASTRO_BROWSER_BASE: base,
        ASTRO_BROWSER_OUTPUT: join(output, filename.replace(/\W+/g, '-')),
        ASTRO_SCREENSHOTS: join(output, filename.replace(/\W+/g, '-')),
        ASTRO_TEST_PYTHON: python,
      }),
      stdio: 'inherit',
      timeout: 4 * 60 * 1000,
    })
    const status = outcome.status === 0 ? 'passed' : 'failed'
    results.push({ filename, status, duration_seconds: Number(((Date.now() - started) / 1000).toFixed(3)) })
    if (status === 'failed') { failed = true; break }
  }

  for (const filename of scripts.slice(results.length)) results.push({ filename, status: 'not_run', duration_seconds: 0 })
  writeFileSync(join(output, 'browser-summary.json'), JSON.stringify({ base, provider_calls: 0, results }, null, 2) + '\n')
} catch (error) {
  failed = true
  console.error(error.message)
  for (const child of children) {
    const log = Buffer.concat(child.chunks).toString('utf8')
    if (log) console.error(`${child.logName}:\n${log.slice(-4000)}`)
  }
} finally {
  for (const child of children.reverse()) await stop(child)
}

console.log(`Browser evidence: ${output}`)
process.exit(failed ? 1 : 0)
