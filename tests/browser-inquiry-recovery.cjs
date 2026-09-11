// Exercise the actual browser helper with synthetic responses only. No email or saved records.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.ASTRO_BROWSER_BASE || 'http://127.0.0.1:5186';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.ASTRO_BROWSER_EXECUTABLE, headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/api/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"Synthetic unavailable response"}' }));
    await page.goto(`${base}/#/contact`);
    const result = await page.evaluate(async () => {
      const { submitInquiry } = await import('/src/lib/formApi.js');
      const payload = { name: 'Synthetic visitor', email: 'visitor@example.invalid', subject: 'Synthetic inquiry', message: 'Private text kept in memory', verification_token: 'synthetic-verification-token' };
      const record = '13e55131-cb48-4525-84ed-c51be45b7e71';
      const originalFetch = window.fetch;
      const checks = [];
      const verify = (condition, label) => { if (!condition) throw new Error(label); checks.push(label); };
      const saved = () => new Response(JSON.stringify({ status: 'success', inquiry_id: record }), { status: 200 });
      try {
        for (const failure of ['network', 'server', 'malformed']) {
          sessionStorage.clear();
          const calls = [], reference = { current: null };
          window.fetch = async (url, options) => {
            calls.push({ url, options });
            if (url === '/api/inquiry-status') return saved();
            if (failure === 'network') throw new TypeError('Synthetic lost response');
            return new Response(failure === 'server' ? '{"detail":"Synthetic failure"}' : '<html>Not an API result</html>', { status: failure === 'server' ? 503 : 200 });
          };
          const result = await submitInquiry('/api/contact', payload, reference);
          verify(result.inquiry_id === record, `${failure}: recovered saved result`);
          verify(calls.length === 2 && calls[1].url === '/api/inquiry-status', `${failure}: one save then one recovery`);
          verify(calls[0].options.headers['X-Astro-Receipt'] === calls[1].options.headers['X-Astro-Receipt'], `${failure}: same independent receipt`);
          verify(!calls[1].options.body.includes('Private') && !calls[1].options.body.includes('verification_token'), `${failure}: private details absent from recovery`);
          verify(sessionStorage.length === 0, `${failure}: saved receipt removed from tab storage`);
        }
        sessionStorage.clear();
        const reference = { current: null }, calls = [];
        window.fetch = async (url, options) => { calls.push({ url, options }); throw new TypeError('Synthetic outage'); };
        try { await submitInquiry('/api/contact', payload, reference); } catch { /* Expected: no success without evidence. */ }
        verify(reference.current.uncertain === true, 'Outage remains unconfirmed');
        verify(!JSON.stringify(sessionStorage).includes('Private'), 'No private form draft stored');
        const count = calls.length;
        try { await submitInquiry('/api/contact', { ...payload, message: 'Changed draft' }, reference); } catch { /* Keep the unconfirmed request unchanged. */ }
        verify(calls.length === count, 'Changed draft cannot silently create another inquiry');
        window.fetch = async (url, options) => { calls.push({ url, options }); return saved(); };
        await submitInquiry('/api/contact', payload, reference);
        verify(calls.length === count + 1 && calls.at(-1).url === '/api/inquiry-status', 'Uncertain retry recovers before another save');
        verify(reference.current.uncertain === false, 'Successful recovery clears uncertainty');
        return checks;
      } finally { window.fetch = originalFetch; sessionStorage.clear(); }
    });
    assert.equal(result.length, 20);
    console.log(JSON.stringify({ passed: result.length, actualProviderWrites: 0, checks: result }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
