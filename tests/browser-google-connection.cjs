// Synthetic browser-only responses. Never obtains Google consent or creates meetings.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const output = process.env.ASTRO_SCREENSHOTS || '/tmp/astro-google-connection';
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5194';
mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.ASTRO_BROWSER_EXECUTABLE, headless: true });
  try {
    for (const [label, width, height] of [['laptop',1366,768], ['desktop',2560,1440], ['mobile',390,844]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion:'reduce' });
      const page = await context.newPage();
      let connected = false, revoked = false;
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        let status = 200, data;
        if (path.endsWith('/session')) data = {email:'synthetic@example.invalid', csrf_token:'synthetic-csrf'};
        else if (path.endsWith('/bookings')) data = {items:[], next_cursor:null};
        else if (path.endsWith('/booking-days')) data = {month:new URL(route.request().url()).searchParams.get('month'), days:{}};
        else if (path.endsWith('/day')) data = {slots:['10:00','10:30','11:00','11:30','15:00','15:30','16:00','16:30','17:00','17:30'].map(time => ({time, state:'open'})), closures:[]};
        else if (path.endsWith('/google/status')) data = {connected, calendar_id:connected ? 'synthetic@example.invalid' : null};
        else if (path.endsWith('/google/start')) {
          assert.equal(route.request().headers()['x-astro-csrf'], 'synthetic-csrf');
          // Deliberately bad destination verifies browser never navigates off-allowlist.
          data = {authorization_url:'https://unexpected.invalid/'};
        } else if (path.endsWith('/google/check')) {
          assert.equal(route.request().headers()['x-astro-csrf'], 'synthetic-csrf');
          status = revoked ? 503 : 200;
          data = revoked ? {detail:'Please reconnect Google Calendar.'} : {calendar_access:true, meet_supported:true};
        } else { status = 404; data = {detail:'Not part of this synthetic check'}; }
        return route.fulfill({status, contentType:'application/json', body:JSON.stringify(data)});
      });
      await page.goto(base + '/#/studio/calendar');
      await page.getByRole('button', {name:'Calendar', exact:true}).click();
      await page.getByRole('button', {name:'Connect Google Calendar',exact:true}).click();
      await page.getByText('Google connection address was not recognized.').waitFor();
      assert.equal(new URL(page.url()).origin, base);
      connected = true;
      await page.goto(base + '/#/studio/calendar?google=connected');
      await page.reload();
      await page.getByRole('button', {name:'Calendar', exact:true}).click();
      await page.getByRole('button', {name:'Check connection',exact:true}).click();
      await page.getByText('Calendar and Google Meet are ready.', {exact:true}).waitFor();
      assert.equal(await page.getByText('Which calendar does this use?', {exact:true}).count(), 0);
      assert.equal(await page.getByText(/Website availability is still managed here/).count(), 0);
      assert.equal(await page.locator('.studio-calendar__toolbar .studio-calendar__connection-actions').count(), 1);
      assert.equal(await page.locator('.studio-calendar__slots > div').count(), 10);
      if (width > 760) {
        const tabs = await page.locator('.studio-calendar__tabs').boundingBox();
        const actions = await page.locator('.studio-calendar__connection-actions').boundingBox();
        assert.ok(Math.abs(tabs.y - actions.y) < 2, 'Connection controls share the tabs row');
        const size = await page.locator('.studio-calendar').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        assert.ok(Math.abs(size - (width >= 1920 ? 18.7 : 15.3)) < .1);
      }
      await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0,0); });
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({path:`${output}/${label}.png`,fullPage:true});
      revoked = true;
      await page.getByRole('button', {name:'Check connection',exact:true}).click();
      await page.getByText('Please reconnect Google Calendar.',{exact:true}).waitFor();
      assert.equal(await page.getByRole('button', {name:'Reconnect Google Calendar'}).isEnabled(), true);
      assert.deepEqual(errors, []);
      console.log(`${label}: connection, invalid redirect, capability check, revocation and overflow checks passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
