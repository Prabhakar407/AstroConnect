// Local HTML rendering only. No website server, credentials or email delivery.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = mkdtempSync(join(tmpdir(), 'astro-email-visual.'))
const python = process.env.ASTRO_TEST_PYTHON || 'python3'
const args = ['--session', 'astro-resend-email']
const browser = (...command) => {
  const executable = command[0] === 'open' && process.env.ASTRO_BROWSER_EXECUTABLE
    ? ['--executable-path', process.env.ASTRO_BROWSER_EXECUTABLE] : []
  return execFileSync('agent-browser', [...args, ...executable, ...command], { encoding: 'utf8', cwd: root })
}
let checks = 0
try {
  browser('open', 'about:blank')
  for (const purpose of ['booking', 'contact', 'prashna', 'inquiry-customer', 'inquiry-client']) {
    // Mask even the synthetic code before sending any HTML to the browser/capture.
    const generator = purpose.startsWith('inquiry-')
      ? 'from src.backend.inquiry_delivery import inquiry_message; import sys; print(inquiry_message("sender@example.com", {"id":"11111111-1111-4111-8111-111111111111", "name":"Sample Visitor", "email":"synthetic@example.com"}, sys.argv[1].split("-")[1])["html"])'
      : 'from src.backend.resend_email import verification_message; import sys; print(verification_message("sender@example.com", "recipient@example.com", "123456", sys.argv[1])["html"].replace("123456", "••••••"))'
    const html = execFileSync(python, ['-c', generator,
      purpose], { cwd: root, encoding: 'utf8' })
    for (const width of [640, 320]) {
      browser('set', 'viewport', String(width), '480')
      browser('eval', `document.body.innerHTML = ${JSON.stringify(html)}; document.title = 'Verification email — masked local preview'; true`)
      const result = JSON.parse(browser('eval', `JSON.stringify({
        fits: document.documentElement.scrollWidth <= innerWidth,
        code: document.querySelector('strong')?.textContent ?? null,
        readable: parseFloat(getComputedStyle(document.querySelector('p')).fontSize) >= 16,
        noRemoteContent: !document.querySelector('img,iframe,script,link'),
        appropriateCopy: ${purpose.startsWith('inquiry-') ? "document.body.textContent.includes('inquiry') && document.body.textContent.includes('11111111-1111-4111-8111-111111111111')" : "document.body.textContent.includes('five minutes')"}
      })`))
      const actual = typeof result === 'string' ? JSON.parse(result) : result
      assert.deepEqual(actual, { fits: true, code: purpose.startsWith('inquiry-') ? null : '••••••', readable: true, noRemoteContent: true, appropriateCopy: true })
      checks += 5
      browser('screenshot', '--full', join(output, `${purpose}-${width}.png`))
    }
  }
  console.log(JSON.stringify({ checks, screenshots: 10, output, realEmailSent: false }))
} finally {
  browser('close')
}
