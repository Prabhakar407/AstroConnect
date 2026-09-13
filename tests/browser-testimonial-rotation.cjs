const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')
const assert = require('node:assert/strict')

const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5185'
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const visibleReviewIds = page => page.locator('.testimonials-review-card').evaluateAll(cards => cards.map(card => card.dataset.reviewId))

;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.ASTRO_BROWSER_EXECUTABLE,
    headless: true,
  })
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/testimonials`, { waitUntil: 'domcontentloaded' })

    const activeSlide = page.locator('.testimonials-slide.is-active')
    const firstFeatured = await activeSlide.textContent()
    await pause(3200)
    assert.notEqual(await activeSlide.textContent(), firstFeatured, 'Featured testimonial should advance after two seconds')

    const grid = page.locator('#testimonials-review-results')
    await grid.scrollIntoViewIfNeeded()
    const gridBox = await grid.boundingBox()
    await page.mouse.move(gridBox.x + gridBox.width / 2, gridBox.y + Math.min(gridBox.height / 2, 100))
    await pause(250)
    const firstWindow = await visibleReviewIds(page)
    assert.equal(firstWindow.length, 6)
    assert.equal(new Set(firstWindow).size, 6)
    await pause(2700)
    const secondWindow = await visibleReviewIds(page)
    assert.equal(secondWindow.length, 6)
    assert.equal(new Set(secondWindow).size, 6)
    assert.equal(secondWindow.filter((id, index) => id !== firstWindow[index]).length, 1, 'Exactly one All Experiences card should change')
    assert.equal(await page.locator('.testimonials-review-card.is-flipping').count(), 1, 'Exactly one card should be flipping')

    for (const label of ['Vedic Astrology', 'General Numerology', 'Vastu', 'Laal Kitaab', 'Prashna', 'Name Change']) {
      await page.getByRole('button', { name: label, exact: true }).click()
      const filteredGridBox = await grid.boundingBox()
      await page.mouse.move(filteredGridBox.x + filteredGridBox.width / 2, filteredGridBox.y + Math.min(filteredGridBox.height / 2, 100))
      const before = await visibleReviewIds(page)
      assert.equal(before.length, 3, `${label} should show three reviews`)
      assert.equal(new Set(before).size, 3)
      await pause(2700)
      const after = await visibleReviewIds(page)
      assert.equal(after.length, 3)
      assert.equal(new Set(after).size, 3)
      assert.equal(after.filter((id, index) => id !== before[index]).length, 1, `Exactly one ${label} card should change`)
    }

    assert.equal(errors.length, 0, `Browser errors: ${errors.join('; ')}`)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page has horizontal overflow')

    const stillPage = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
    await stillPage.goto(`${base}/testimonials`, { waitUntil: 'domcontentloaded' })
    const stillFeatured = await stillPage.locator('.testimonials-slide.is-active').textContent()
    await pause(2200)
    assert.equal(await stillPage.locator('.testimonials-slide.is-active').textContent(), stillFeatured, 'Featured testimonial should remain still with reduced motion')
    await stillPage.locator('#testimonials-review-results').scrollIntoViewIfNeeded()
    const stillWindow = await visibleReviewIds(stillPage)
    await pause(2700)
    assert.deepEqual(await visibleReviewIds(stillPage), stillWindow, 'Review grid should remain still with reduced motion')

    console.log('PASS testimonial rotation, filtering and duplicate prevention')
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
