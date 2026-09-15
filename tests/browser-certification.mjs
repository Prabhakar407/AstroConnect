import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium, firefox, webkit } from 'playwright'

const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5186'
const output = process.env.ASTRO_BROWSER_OUTPUT || '/tmp/astro-browser-certification'
mkdirSync(output, { recursive: true })

const routes = [
  '/', '/about', '/services', '/services/vedic-astrology', '/services/numerology',
  '/services/vastu', '/services/laal-kitaab', '/services/prashna-kundali', '/services/name-change',
  '/testimonials', '/contact', '/booking', '/privacy-policy', '/terms-and-conditions', '/refund-policy',
]
const viewports = [
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'large-desktop', width: 2560, height: 1440 },
  { name: 'short-landscape', width: 1366, height: 650 },
  { name: 'mobile', width: 390, height: 844 },
]
const screenshotRoutes = new Set(['/', '/services', '/testimonials', '/contact', '/booking'])

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  // Entry motion lasts up to 0.8 s. Audit the final rendered colours rather
  // than a deliberately translucent in-between animation frame.
  await page.waitForTimeout(900)
}

async function revealPage(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const step = await page.evaluate(() => Math.max(320, Math.floor(innerHeight * 0.7)))
  for (let top = 0; top < height; top += step) {
    await page.evaluate(scrollTop => window.scrollTo({ top: scrollTop, behavior: 'instant' }), top)
    await page.waitForTimeout(100)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await settle(page)
}

async function pageHealth(page, route, errors) {
  await settle(page)
  assert.equal(await page.locator('main').count(), 1, `${route}: one main region required`)
  assert.equal(await page.locator('main h1').count(), 1, `${route}: one main heading required`)
  assert.ok(await page.locator('main').innerText(), `${route}: main content must not be empty`)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}: horizontal overflow`)
  const publicText = await page.locator('main').innerText()
  assert.doesNotMatch(publicText, /\b30\s*(?:minutes?|mins?)\b|session length/i, `${route}: public session length wording`)
  assert.deepEqual(errors.splice(0), [], `${route}: browser errors`)
}

const browser = await chromium.launch({ headless: true })
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' })
      assert.equal(response?.status(), 200, `${route}: website response`)
      await pageHealth(page, route, errors)
      if (screenshotRoutes.has(route)) {
        // Several sections intentionally assemble when they enter the viewport.
        // Reveal each section before a full-page capture so the evidence records
        // the settled page rather than untouched off-screen animation states.
        await revealPage(page)
        await page.screenshot({ path: join(output, `${viewport.name}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`), fullPage: true })
      }
    }
    const missing = await page.goto(base + '/this-page-does-not-exist', { waitUntil: 'domcontentloaded' })
    assert.equal(missing?.status(), 200, 'SPA fallback must load')
    await page.getByRole('heading', { name: 'This page isn’t here.' }).waitFor()
    await pageHealth(page, 'unknown route', errors)

    await page.goto(base + '/testimonials')
    assert.doesNotMatch(await page.locator('main').innerText(), /\bsample\b|\billustrative\b/i)
    await context.close()
  }

  for (const viewport of [viewports[0], viewports[3]]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    for (const route of ['/', '/services', '/testimonials', '/contact', '/booking', '/studio/calendar']) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded' })
      await settle(page)
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const blocking = scan.violations.filter(item => ['serious', 'critical'].includes(item.impact))
      assert.deepEqual(blocking.map(item => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map(node => ({ target: node.target, failure: node.failureSummary })),
      })), [],
        `${route} ${viewport.name}: serious/critical accessibility violations`)
    }
    await page.goto(base + '/')
    let keyboardEnteredPage = false
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await page.keyboard.press('Tab')
      keyboardEnteredPage = await page.evaluate(() => !['BODY', 'HTML'].includes(document.activeElement?.tagName))
      if (keyboardEnteredPage) break
    }
    assert.equal(keyboardEnteredPage, true, 'Keyboard focus must enter a visible control within five Tab presses')
    await context.close()
  }
} finally {
  await browser.close()
}

for (const [name, browserType, viewport] of [
  ['firefox-desktop', firefox, viewports[0]],
  ['webkit-mobile', webkit, viewports[3]],
]) {
  const engine = await browserType.launch({ headless: true })
  try {
    const page = await engine.newPage({ viewport, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/booking', { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Schedule an online consultation' }).waitFor()
    await page.locator('#readingType').selectOption('vedic-astrology')
    assert.equal(await page.locator('#booking-form').count(), 1)
    await pageHealth(page, name, errors)
  } finally {
    await engine.close()
  }
}

console.log(JSON.stringify({ routes: routes.length + 1, viewports: viewports.length, accessibility_pages: 12, cross_browser: 2, provider_calls: 0 }))
