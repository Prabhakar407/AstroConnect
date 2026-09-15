// Actual unconfigured local API, not mocked acceptance and not a hosted test.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalogue = require('../src/data/consultationCatalogue.json');
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5186';
const output = process.env.ASTRO_BROWSER_OUTPUT || '/tmp/astro-hosting-browser';
const nameChangeFee = `₹${(catalogue.find(item => item.id === 'name-change').amount_paise / 100).toLocaleString('en-IN')}`;

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.ASTRO_BROWSER_EXECUTABLE, headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1440 },
      { width: 390, height: 844 }, { width: 1366, height: 650 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const capture = async name => {
        await page.evaluate(() => document.fonts.ready);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        // Visit all scroll-triggered sections; fullPage alone does not reveal them.
        for (let y = 0; y < height; y += Math.floor(viewport.height * 0.7)) {
          await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
          await page.waitForTimeout(150);
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForTimeout(750);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.screenshot({ path: `${output}/${name}-${viewport.width}.png`, fullPage: true });
      };
      const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('/api/')) requests.push(request.url());
      });
      await page.goto(`${base}/#/booking`);
      await page.getByRole('heading', { name: 'Schedule an online consultation' }).waitFor();
      await page.locator('#readingType').selectOption('name-change');
      assert.ok((await page.locator('#booking-form').innerText()).includes(nameChangeFee));
      assert.equal(await page.getByRole('button', { name: 'Submit Appointment Request' }).isDisabled(), true);
      const policy = await context.request.get(`${base}/api/booking-policy`);
      assert.equal(policy.status(), 503, 'This harness requires the unconfigured local backend');
      for (const [path, status] of [['health', 200], ['services', 200], ['ready', 503], ['missing', 404]]) {
        const response = await context.request.get(`${base}/api/${path}`);
        assert.equal(response.status(), status);
        assert.equal(response.headers()['cache-control'], 'no-store');
        assert.equal(response.headers()['x-vercel-enable-rewrite-caching'], '0');
        assert.ok(response.headers()['content-type'].startsWith('application/json'));
        if (path === 'services') assert.equal((await response.json()).services.length, 6);
      }
      const disabled = await context.request.post(`${base}/api/book-appointment`, { data: { paid: true } });
      assert.equal(disabled.status(), 410);
      await capture('same-origin-booking');
      await page.goto(`${base}/#/studio/calendar`);
      await page.getByRole('heading', { name: 'Your appointments' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Sign out' }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Close the whole day' }).count(), 0);
      await capture('same-origin-private');
      const width = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(width.document <= width.viewport + 1);
      assert.deepEqual(errors, []);
      assert.ok(requests.length > 0);
      assert.ok(requests.every(url => new URL(url).origin === base), 'API requests must remain same-origin');
      results.push({ viewport, passed: true, applicationErrors: errors.length, sameOrigin: true, checkoutDisabled: true });
      await context.close();
    }
    fs.writeFileSync(`${output}/hosting-browser-results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
