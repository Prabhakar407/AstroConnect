import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const mode = process.argv[2]
if (!['fast', 'release', 'production'].includes(mode)) {
  console.error('Use: node scripts/verify.mjs fast|release|production')
  process.exit(2)
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const resultsDirectory = resolve(root, 'verification-results')
mkdirSync(resultsDirectory, { recursive: true })
const python = process.env.ASTRO_TEST_PYTHON || (existsSync(resolve(root, '.venv/bin/python')) ? resolve(root, '.venv/bin/python') : 'python3')
const startedAt = new Date()
const groups = []
let failed = false

const git = (...args) => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() }
  catch { return 'unavailable' }
}

function run(name, command, args, options = {}) {
  if (failed) {
    groups.push({ name, status: 'not_run', duration_seconds: 0 })
    return
  }
  const start = Date.now()
  console.log(`\n=== ${name} ===`)
  const outcome = spawnSync(command, args, {
    cwd: root,
    env: options.replaceEnvironment || { ...process.env, ...options.env },
    stdio: 'inherit',
    timeout: options.timeout || 15 * 60 * 1000,
  })
  const status = outcome.status === 0 ? 'passed' : 'failed'
  groups.push({ name, status, duration_seconds: Number(((Date.now() - start) / 1000).toFixed(3)) })
  if (outcome.error) console.error(`${name}: ${outcome.error.message}`)
  if (status === 'failed') failed = true
}

function safeTestEnvironment(extra = {}) {
  const environment = { ...process.env }
  for (const key of Object.keys(environment)) {
    if (/^(?:ASTRO_|VITE_|DATABASE_URL|PG|GOOGLE_|RAZORPAY_|RESEND_)/.test(key)) delete environment[key]
  }
  for (const key of ['ASTRO_POSTGRES_BIN', 'LD_LIBRARY_PATH']) {
    if (process.env[key]) environment[key] = process.env[key]
  }
  return { ...environment, ...extra }
}

const nodeTests = readdirSync(resolve(root, 'tests'))
  .filter(name => /\.test\.(?:js|mjs)$/.test(name))
  .sort()
  .map(name => `tests/${name}`)

if (mode === 'production') {
  const origin = process.env.ASTRO_PRODUCTION_ORIGIN || 'https://astroadvicebykundansingh.com'
  const productionEnvironment = safeTestEnvironment({ ASTRO_PRODUCTION_ORIGIN: origin })
  run('official-domain read-only and refusal-only smoke', process.execPath, ['tests/production-smoke.mjs'], {
    replaceEnvironment: productionEnvironment,
    timeout: 3 * 60 * 1000,
  })
  run('official booking read-only browser contract', process.execPath, ['tests/browser-booking-contracts.cjs'], {
    replaceEnvironment: {
      ...productionEnvironment,
      ASTRO_BROWSER_BASE: origin,
      ASTRO_BROWSER_OUTPUT: resolve(resultsDirectory, 'production-booking'),
    },
    timeout: 5 * 60 * 1000,
  })
} else {
  run('lint', 'npm', ['run', 'lint'], { replaceEnvironment: safeTestEnvironment() })
  run('production build', 'npm', ['run', 'build'], { replaceEnvironment: safeTestEnvironment({ VITE_API_MODE: 'same-origin', VITE_API_URL: '' }) })
  run('Node and Worker contracts', process.execPath, ['--test', ...nodeTests], { replaceEnvironment: safeTestEnvironment() })
  run('backend no-database contracts', python,
    ['scripts/run-backend-tests.py', '--mode', 'fast', '--result', resolve(resultsDirectory, 'backend-fast.json')],
    { replaceEnvironment: safeTestEnvironment() })

  if (mode === 'release') {
    run('isolated PostgreSQL integration', 'bash', ['scripts/run-postgres-tests.sh', resolve(resultsDirectory, 'backend-release.json')],
      { replaceEnvironment: safeTestEnvironment({ ASTRO_TEST_PYTHON: python }), timeout: 5 * 60 * 1000 })
    run('real Cloudflare runtime contract', process.execPath, ['tests/inquiry-worker-runtime.mjs'], { replaceEnvironment: safeTestEnvironment() })
    run('browser, responsive and accessibility certification', process.execPath, ['scripts/run-browser-tests.mjs'],
      { replaceEnvironment: safeTestEnvironment({
        ASTRO_TEST_PYTHON: python,
        ASTRO_BROWSER_CERTIFICATION_ROOT: process.env.ASTRO_BROWSER_CERTIFICATION_ROOT || resolve(resultsDirectory, 'browser'),
      }), timeout: 12 * 60 * 1000 })
    run('tracked-secret safety check', process.execPath, ['scripts/check-tracked-secrets.mjs'], { replaceEnvironment: safeTestEnvironment() })
    run('Node dependency advisories', 'npm', ['audit', '--audit-level=high'], { replaceEnvironment: safeTestEnvironment(), timeout: 2 * 60 * 1000 })
    run('Python dependency advisories', python, ['-m', 'pip_audit', '-r', 'requirements.txt', '--progress-spinner', 'off'],
      { replaceEnvironment: safeTestEnvironment(), timeout: 3 * 60 * 1000 })
  }
}

const report = {
  schema_version: 1,
  application: 'astro-advice-by-kundan-singh',
  mode,
  commit: git('rev-parse', 'HEAD'),
  worktree_dirty: git('status', '--porcelain') !== '',
  started_at: startedAt.toISOString(),
  finished_at: new Date().toISOString(),
  environment: mode === 'production' ? 'official-domain-read-only' : 'local-isolated',
  provider_calls: mode === 'production' ? 'read-only website requests plus unsigned refusal checks; no provider dispatch' : 'simulated or disabled',
  groups,
  passed: !failed,
}
const reportPath = resolve(resultsDirectory, `${mode}-latest.json`)
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
console.log(`\nVerification ${report.passed ? 'PASSED' : 'FAILED'}: ${reportPath}`)
for (const group of groups) console.log(`- ${group.status.padEnd(7)} ${group.name}`)
process.exit(report.passed ? 0 : 1)
