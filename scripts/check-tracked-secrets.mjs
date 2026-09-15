import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const historyMode = process.argv.includes('--history')
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
  .toString('utf8').split('\0').filter(Boolean)
const forbiddenNames = /(^|\/)(?:\.env(?:\..*)?|service_account\.json|credentials\.json)$/i
const textExtensions = new Set(['', '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.py', '.sh', '.sql', '.txt', '.yaml', '.yml'])
const signatures = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['Razorpay credential', /\brzp_(?:test|live)_[A-Za-z0-9]{14,}\b/],
  ['Resend credential', /\bre_[A-Za-z0-9]{20,}\b/],
  ['Google private key field', /"private_key"\s*:\s*"-----BEGIN/],
  ['database password URL', /\bpostgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/i],
]
const findings = []
for (const filename of tracked) {
  if (forbiddenNames.test(filename)) findings.push({ filename, kind: 'forbidden credential filename' })
  if (!textExtensions.has(extname(filename).toLowerCase())) continue
  let source
  try { source = readFileSync(resolve(root, filename), 'utf8') } catch { continue }
  for (const [kind, pattern] of signatures) {
    if (pattern.test(source)) findings.push({ filename, kind })
  }
}
if (findings.length) {
  console.error('Potential tracked credentials require review:')
  for (const finding of findings) console.error(`- ${finding.filename}: ${finding.kind}`)
  process.exit(1)
}

if (historyMode) {
  const revisions = execFileSync('git', ['rev-list', '--all'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const historyPattern = [
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'rzp_(test|live)_[A-Za-z0-9]{14,}',
    're_[A-Za-z0-9]{20,}',
    '"private_key"[[:space:]]*:[[:space:]]*"-----BEGIN',
    'postgres(ql)?://[^[:space:]:@/]+:[^[:space:]@/]+@',
  ].join('|')
  let matches = ''
  try {
    matches = execFileSync('git', ['grep', '-I', '-l', '-E', '-e', historyPattern, ...revisions], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }).trim()
  } catch (error) {
    if (error.status !== 1) throw error
  }
  if (matches) {
    console.error('Potential credential material exists in Git history. Values were not printed:')
    for (const match of [...new Set(matches.split('\n'))]) console.error(`- ${match}`)
    process.exit(1)
  }
  console.log(`Git-history secret check passed across ${revisions.length} revisions. No credential values were printed.`)
}

console.log(`Deployable-tree secret check passed across ${tracked.length} current files. No credential values were printed.`)
