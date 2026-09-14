// Real workerd fetch semantics, synthetic credentials, no external requests.
// Set ASTRO_MINIFLARE_MODULE to an installed Miniflare module if not local.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { Miniflare, convertV4MiniflareOptions } = await import(process.env.ASTRO_MINIFLARE_MODULE || 'miniflare');
const source = readFileSync(new URL('../workers/inquiry-delivery/worker.mjs', import.meta.url), 'utf8');
assert.ok(source.includes('export default createWorker();'));
const script = source.replace('export default createWorker();', `
export default {
  async fetch(request) {
    const env = { ASTRO_DELIVERY_SECRET: 'synthetic-runtime-delivery-key-32-characters',
      ASTRO_RECOVERY_SECRET: 'synthetic-runtime-recovery-key-32-characters' };
    const worker = createWorker();
    if (new URL(request.url).pathname === '/scheduled') {
      try { await worker.scheduled({}, env); return Response.json({ success: true }); }
      catch { return Response.json({ success: false }); }
    }
    const message = { body: { job_id: '11111111-1111-4111-8111-111111111111',
      kind: 'inquiry_received', environment: 'production' },
      ack() { this.acked = true; }, retry() { this.retried = true; } };
    await worker.queue({ messages: [message] }, env);
    return Response.json({ acked: !!message.acked, retried: !!message.retried });
  }
};`);

for (const redirect of [false, true]) {
  const calls = [];
  const options = { modules: true, script, compatibilityDate: '2026-09-11',
    outboundService: async request => {
      calls.push(request.url);
      assert.equal(new URL(request.url).origin, 'https://astroadvicebykundansingh.com');
      if (redirect) return new Response(null, { status: 302, headers: { Location: 'https://unexpected.invalid/' } });
      const body = await request.json();
      const identity = { application: 'astro-advice-booking', environment: 'production' };
      return Response.json(body.job_id ? { ...identity, job_id: body.job_id, state: 'sent', terminal: true }
        : { ...identity, run_id: body.run_id, selected: 0, published: 0, needs_attention: 0 });
    } };
  const runtime = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
  try {
    assert.deepEqual(await (await runtime.dispatchFetch('http://localhost/queue')).json(),
      { acked: !redirect, retried: redirect });
    assert.deepEqual(await (await runtime.dispatchFetch('http://localhost/scheduled')).json(), { success: !redirect });
    assert.equal(calls.length, 2, 'Native fetch must not follow either redirect');
  } finally { await runtime.dispose(); }
}
console.log('workerd queue, scheduled recovery, and redirect refusal checks passed. No external requests.');
