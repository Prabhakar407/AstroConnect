// Local HTML rendering only. No website server, credentials or email delivery.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = process.env.ASTRO_BROWSER_OUTPUT || mkdtempSync(join(tmpdir(), 'astro-email-visual.'))
const python = process.env.ASTRO_TEST_PYTHON || 'python3'
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({ headless: true })
let checks = 0
let screenshots = 0
try {
  const cases = [
    ...['booking', 'contact', 'prashna'].map(purpose => ({ purpose, family: 'verification' })),
    ...['inquiry-customer', 'inquiry-client'].map(purpose => ({ purpose, family: 'inquiry' })),
    ...['booking-confirmed-customer', 'booking-confirmed-client',
      'booking-cancelled-customer', 'booking-cancelled-client']
      .map(purpose => ({ purpose, family: 'booking-delivery' })),
  ]

  for (const { purpose, family } of cases) {
    // Mask even the synthetic code before giving the generated HTML to Playwright.
    const generator = family === 'inquiry'
      ? 'from src.backend.inquiry_delivery import inquiry_message; import sys; print(inquiry_message("sender@example.invalid", {"id":"11111111-1111-4111-8111-111111111111", "name":"Example Visitor", "email":"visitor@example.invalid"}, sys.argv[1].split("-")[1])["html"])'
      : family === 'booking-delivery'
        ? 'from datetime import date, datetime, time; from zoneinfo import ZoneInfo; from src.backend.booking_delivery import booking_message; import sys; bits=sys.argv[1].split("-"); kind="booking_"+bits[1]; role=bits[2]; booking={"id":"22222222-2222-4222-8222-222222222222","starts_at":datetime(2026,9,21,10,0,tzinfo=ZoneInfo("Asia/Kolkata")),"amount_paise":310000,"question_count":None,"service_id":"general-numerology","service_name":"General Numerology","full_name":"Example Visitor","phone":"+91 90000 00000","email":"visitor@example.invalid","birth_date":date(1991,2,27),"birth_time":time(20,11),"birth_place":"Example City, India","notes":"Synthetic browser-rendering check."}; meet="https://meet.google.com/abc-defg-hij" if kind=="booking_confirmed" else None; print(booking_message("Astro Advice <bookings@example.invalid>", booking, kind, role, meet)["html"])'
        : 'from src.backend.resend_email import verification_message; import sys; print(verification_message("sender@example.invalid", "recipient@example.invalid", "123456", sys.argv[1])["html"].replace("123456", "••••••"))'
    const html = execFileSync(python, ['-c', generator, purpose], { cwd: root, encoding: 'utf8' })

    for (const width of [640, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 480 } })
      await page.setContent(html, { waitUntil: 'load' })
      const result = await page.evaluate(({ family, purpose }) => ({
        fits: document.documentElement.scrollWidth <= innerWidth,
        code: document.querySelector('strong')?.textContent ?? null,
        readable: parseFloat(getComputedStyle(document.querySelector('p')).fontSize) >= 16,
        noRemoteContent: !document.querySelector('img,iframe,script,link'),
        appropriateCopy: family === 'inquiry'
          ? document.body.textContent.includes('inquiry') && document.body.textContent.includes('11111111-1111-4111-8111-111111111111')
          : family === 'booking-delivery'
            ? document.body.textContent.includes('General Numerology')
              && document.body.textContent.includes('₹3,100')
              && document.body.textContent.includes('22222222-2222-4222-8222-222222222222')
              && (purpose.includes('confirmed')
                ? document.body.textContent.includes('Google Meet')
                : document.body.textContent.includes('Refund to be done manually'))
            : document.body.textContent.includes('five minutes'),
      }), { family, purpose })
      assert.deepEqual(result, {
        fits: true,
        code: family === 'verification' ? '••••••' : null,
        readable: true,
        noRemoteContent: true,
        appropriateCopy: true,
      })
      checks += 5
      await page.screenshot({ fullPage: true, path: join(output, `${purpose}-${width}.png`) })
      screenshots += 1
      await page.close()
    }
  }
  console.log(JSON.stringify({ checks, screenshots, output, realEmailSent: false }))
} finally {
  await browser.close()
}
