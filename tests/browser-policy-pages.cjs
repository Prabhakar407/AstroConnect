const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5195';
const output = process.env.ASTRO_BROWSER_OUTPUT || '/tmp/astro-policy-pages';

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.ASTRO_BROWSER_EXECUTABLE, headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1440 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const [path, title] of [
        ['/privacy-policy', 'Privacy Policy'],
        ['/terms-and-conditions', 'Terms & Conditions'],
        ['/refund-policy', 'Refund & Cancellation Policy'],
      ]) {
        const response = await page.goto(base + path);
        assert.equal(response.status(), 200);
        await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
        await page.reload();
        await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        const text = await page.locator('article').innerText();
        assert.ok(!/Redis|Zoom|8796191327/.test(text));
        if (path === '/privacy-policy') assert.ok(text.includes('Google Account & Calendar Connection'));
        if (path === '/refund-policy') assert.ok(text.includes('24 hours advance notice') && text.includes('5 to 7 business days'));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator('footer').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: output + path + '-' + viewport.width + '.png', fullPage: true });
      }
      await page.locator('footer').getByRole('link', { name: 'Privacy Policy', exact: true }).click();
      await page.getByRole('heading', { level: 1, name: 'Privacy Policy', exact: true }).waitFor();
      await page.goBack();
      await page.getByRole('heading', { level: 1, name: 'Refund & Cancellation Policy', exact: true }).waitFor();
      await page.goto(base + '/#/contact');
      await page.waitForURL(base + '/contact');
      await page.getByRole('heading', { name: 'Send Us a Message', exact: true }).waitFor();
      await page.goto(base + '/#/studio/calendar?google=denied');
      await page.getByRole('heading', { name: 'Your appointments', exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, '/studio/calendar');
      await page.goto(base + '/booking');
      await page.getByRole('heading', { name: 'Schedule an online consultation' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Submit Appointment Request' }).isDisabled(), true);
      await page.goto(base);
      assert.equal(await page.locator('footer a[href="/privacy-policy"]').count(), 1);
      assert.equal(await page.locator('footer a[href="/terms-and-conditions"]').count(), 1);
      assert.equal(await page.locator('footer a[href="/refund-policy"]').count(), 1);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ viewport, policies: 3, refresh: true, footer: true, history: true, legacyLinks: true, checkoutDisabled: true, errors: 0 }));
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
