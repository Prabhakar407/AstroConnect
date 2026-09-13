// Local-only visual and interaction regression for the service/testimonial release slice.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')

const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5185'
const output = process.env.ASTRO_BROWSER_OUTPUT || '/tmp/astro-release-polish'
fs.mkdirSync(output, { recursive: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

const services = [
  ['vedic-astrology', 'Vedic Astrology (Janam Kundli)'],
  ['numerology', 'General Numerology'],
  ['vastu', 'Vastu Consultation'],
  ['laal-kitaab', 'Laal Kitaab Remedies'],
  ['prashna-kundali', 'Prashna Kundali (Horary Astrology)'],
  ['name-change', 'Name Change Consultation'],
]

async function assertPageHealth(page, errors) {
  assert.equal(errors.length, 0, `Browser errors: ${errors.join('; ')}`)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page has horizontal overflow')
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.ASTRO_BROWSER_EXECUTABLE,
    headless: true,
  })
  const results = []
  try {
    const requestedWidth = Number(process.env.ASTRO_BROWSER_WIDTH || 0)
    const viewports = [
      { width: 1366, height: 768 },
      { width: 2560, height: 1440 },
      { width: 390, height: 844 },
    ].filter(viewport => !requestedWidth || viewport.width === requestedWidth)
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
      const page = await context.newPage()
      page.setDefaultTimeout(15000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))

      await page.goto(`${base}/services`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: /Guidance for every/ }).waitFor()
      assert.equal(await page.locator('.service-chapter').count(), 6)
      for (const [id] of services) {
        assert.equal(await page.locator(`a[href="/booking?service=${id}"]`).count() > 0, true)
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await pause(500)
      await page.evaluate(() => window.scrollTo(0, 0))
      await pause(700)
      await assertPageHealth(page, errors)
      await page.screenshot({ path: `${output}/services-${viewport.width}.png`, fullPage: true })

      for (const [id, title] of services) {
        errors.length = 0
        await page.goto(`${base}/services/${id}`, { waitUntil: 'domcontentloaded' })
        await page.getByText(title, { exact: false }).first().waitFor()
        await pause(700)
        assert.equal(await page.locator(`a[href="/booking?service=${id}"]`).count() >= 3, true, `${title} needs three booking links`)
        await assertPageHealth(page, errors)
        await page.screenshot({ path: `${output}/${id}-${viewport.width}.png`, fullPage: false })
        if (id === 'vastu') {
          const elements = page.getByRole('heading', { name: 'The Five Elements', exact: true })
          await elements.scrollIntoViewIfNeeded()
          await pause(900)
          await page.screenshot({ path: `${output}/vastu-elements-${viewport.width}.png`, fullPage: false })
        }
        if (id === 'laal-kitaab') {
          for (const tab of ['Overview & Philosophy', 'Key Diagnostic Areas', 'Practical Remedies']) {
            await page.getByRole('button', { name: tab, exact: true }).click()
            assert.equal(await page.locator(`a[href="/booking?service=${id}"]`).count() >= 3, true)
          }
        }
      }

      errors.length = 0
      await page.goto(`${base}/testimonials`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: 'Client Testimonials', exact: true }).waitFor()
      const testimonialText = (await page.locator('body').innerText()).toLowerCase()
      for (const forbidden of ['sample', 'illustrative', 'awaiting approval']) assert.equal(testimonialText.includes(forbidden), false)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await pause(500)
      await page.evaluate(() => window.scrollTo(0, 0))
      await pause(700)
      await assertPageHealth(page, errors)
      await page.screenshot({ path: `${output}/testimonials-${viewport.width}.png`, fullPage: true })

      errors.length = 0
      await page.goto(`${base}/booking`, { waitUntil: 'domcontentloaded' })
      const serviceSelect = page.getByLabel('Consultation Type')
      assert.equal(await serviceSelect.inputValue(), '')
      assert.equal(await serviceSelect.locator('option:checked').textContent(), 'Choose a consultation')
      await page.goto(`${base}/booking?service=vastu`, { waitUntil: 'domcontentloaded' })
      assert.equal(await page.getByLabel('Consultation Type').inputValue(), 'vastu')
      await assertPageHealth(page, errors)

      results.push({ viewport, passed: true, applicationErrors: 0 })
      console.log('PASS', JSON.stringify(results.at(-1)))
      await context.close()
    }
    fs.writeFileSync(`${output}/browser-results.json`, JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
