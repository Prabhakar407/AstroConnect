// Actual API/Neon reads only. Never submits a booking, inquiry, email or payment.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalogue = require('../src/data/consultationCatalogue.json');
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5186';
const output = process.env.ASTRO_BROWSER_OUTPUT || '/tmp/astro-booking-contracts';
const prashnaUnit = catalogue.find(item => item.id === 'prashna-kundali').amount_paise;
const fee = count => `₹${((prashnaUnit * count) / 100).toLocaleString('en-IN')}`;

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.ASTRO_BROWSER_EXECUTABLE, headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1440 }, { width: 1366, height: 650 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce', timezoneId: 'America/Los_Angeles' });
      const page = await context.newPage();
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/') && request.method() !== 'GET') writes.push(request.method()); });
      await page.clock.setFixedTime(new Date('2035-01-01T00:00:00Z'));
      const response = await context.request.get(`${base}/api/booking-policy`);
      assert.equal(response.status(), 200);
      const policy = await response.json();
      await page.goto(`${base}/#/booking`);
      await page.waitForFunction(first => document.querySelector('#birthDate')?.max === first, policy.first_date);
      assert.equal(await page.locator('#birthDate').getAttribute('max'), policy.first_date);
      const candidate = new Date(`${policy.first_date}T00:00:00Z`);
      candidate.setUTCDate(candidate.getUTCDate() + 1);
      while (candidate.getUTCDay() === 0) candidate.setUTCDate(candidate.getUTCDate() + 1);
      const day = candidate.getUTCDate().toString();
      if (candidate.toISOString().slice(0, 7) !== policy.first_date.slice(0, 7)) await page.getByRole('button', { name: 'Next month', exact: true }).click();
      await page.getByRole('button', { name: day, exact: true }).click();
      await page.getByRole('button', { name: /10:00 AM.*10:30 AM/ }).waitFor();
      await page.waitForFunction(() => !document.querySelector('#booking-form')?.innerText.includes('Checking available times'));
      assert.equal(await page.getByText('Online booking is being configured.', { exact: false }).count(), 0);
      await page.locator('#readingType').selectOption('prashna-kundali');
      await page.locator('#questionCount').selectOption('10');
      await page.waitForFunction(expected => document.querySelector('#booking-form')?.innerText.includes(expected), fee(10));
      assert.equal(await page.locator('#booking-form button[type=submit]').isDisabled(), true);
      await page.locator('#name').fill('Synthetic visual check');
      await page.evaluate(() => document.fonts.ready);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += viewport.height * 0.7) {
        await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      const clip = await page.locator('#booking-form').boundingBox();
      await page.screenshot({ path: `${output}/booking-form-${viewport.width}.png`, fullPage: true, clip });
      await page.screenshot({ path: `${output}/booking-page-${viewport.width}.png`, fullPage: true });
      // One simulated read failure; recovery goes back to the real server.
      await page.route('**/api/availability?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'We could not check availability. Please try again.' }) }));
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
      assert.equal(await page.locator('#name').inputValue(), 'Synthetic visual check');
      await page.unroute('**/api/availability?*');
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await page.getByRole('button', { name: 'Try again', exact: true }).waitFor({ state: 'hidden' });
      await page.waitForFunction(() => !document.querySelector('#booking-form')?.innerText.includes('Checking available times'));
      assert.equal(await page.locator('#name').inputValue(), 'Synthetic visual check');
      // A failed fee lookup can recover without changing service or losing details.
      await page.route('**/api/quote?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'We could not confirm the fee.' }) }));
      await page.locator('#questionCount').selectOption('9');
      await page.getByRole('button', { name: 'Check fee again', exact: true }).waitFor();
      await page.unroute('**/api/quote?*');
      await page.getByRole('button', { name: 'Check fee again', exact: true }).click();
      await page.getByRole('button', { name: 'Check fee again', exact: true }).waitFor({ state: 'hidden' });
      await page.waitForFunction(expected => document.querySelector('#booking-form')?.innerText.includes(expected), fee(9));
      assert.equal(await page.locator('#name').inputValue(), 'Synthetic visual check');
      assert.deepEqual(writes, []);
      assert.deepEqual(errors, []);
      results.push({ viewport, actualPolicyRead: true, wrongDeviceClockIgnored: true, prashnaTotalPaise: prashnaUnit * 10, availabilityRecovered: true, quoteRecovered: true, pageErrors: 0, writes: 0 });
      await context.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
