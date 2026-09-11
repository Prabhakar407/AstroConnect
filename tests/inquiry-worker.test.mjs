import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createWorker } from '../workers/inquiry-delivery/worker.mjs';

const env = { ASTRO_DELIVERY_SECRET: 'synthetic-delivery-secret-32-characters', ASTRO_RECOVERY_SECRET: 'synthetic-recovery-secret-32-characters' };
const identity = { application: 'astro-advice-booking', environment: 'production' };
const reply = (value, status = 200) => Response.json(value, { status });
function message(body = { job_id: randomUUID(), kind: 'inquiry_received', environment: 'production' }) {
  return { body, acks: 0, retries: [], ack() { this.acks++; }, retry(options) { this.retries.push(options); } };
}
const result = msg => ({ ...identity, job_id: msg.body.job_id, state: 'sent', terminal: true, error_code: null, retry_at: null });

test('acknowledges matching durable success and uses only fixed destination', async () => {
  const msg = message();
  const worker = createWorker(async (url, options) => {
    assert.equal(url, 'https://astroadvicebykundansingh.com/api/internal/delivery/inquiry');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${env.ASTRO_DELIVERY_SECRET}`);
    assert.deepEqual(JSON.parse(options.body), { job_id: msg.body.job_id });
    assert.ok(options.signal instanceof AbortSignal);
    return reply(result(msg));
  });
  await worker.queue({ messages: [msg] }, env);
  assert.equal(msg.acks, 1);
  assert.deepEqual(msg.retries, []);
});

test('failed durable job is acknowledged as retained attention work', async () => {
  const msg = message();
  await createWorker(async () => reply({ ...result(msg), state: 'failed', error_code: 'retry_limit' })).queue({ messages: [msg] }, env);
  assert.equal(msg.acks, 1);
});

test('delivery and recovery use the explicitly configured official branch origin', async () => {
  const origin = 'https://astrologer-website-kundan-singh-git-design-p-8bfe8c-neura-flow1.vercel.app';
  const msg = message();
  const urls = [];
  const worker = createWorker(async (url, options) => {
    urls.push(url);
    const body = JSON.parse(options.body);
    return reply(body.job_id ? result(msg) : { ...identity, run_id: body.run_id, selected: 0, published: 0 });
  });
  await worker.queue({ messages: [msg] }, { ...env, ASTRO_API_ORIGIN: origin });
  await worker.scheduled({}, { ...env, ASTRO_API_ORIGIN: origin });
  assert.equal(msg.acks, 1);
  assert.deepEqual(urls, [origin + '/api/internal/delivery/inquiry', origin + '/api/internal/recovery/inquiries']);
});

test('invalid configured destinations never receive either helper credential', async () => {
  for (const origin of ['', null, 'http://astroadvicebykundansingh.com', 'https://evil.invalid',
    'https://astroadvicebykundansingh.com/', 'https://astroadvicebykundansingh.com@evil.invalid',
    'https://astroadvicebykundansingh.com/api', 'https://astroadvicebykundansingh.com?x=1']) {
    let calls = 0;
    const worker = createWorker(async () => { calls++; });
    const settings = { ...env, ASTRO_API_ORIGIN: origin };
    const msg = message();
    await worker.queue({ messages: [msg] }, settings);
    await assert.rejects(worker.scheduled({}, settings), /inquiry_recovery_failed/);
    assert.equal(calls, 0);
    assert.equal(msg.acks, 0);
    assert.equal(msg.retries.length, 1);
  }
});

test('pending and active leases wait rather than acknowledge completion', async () => {
  for (const state of ['pending', 'processing']) {
    const msg = message();
    const retry_at = new Date(Date.now() + 3600_000).toISOString();
    await createWorker(async () => reply({ ...result(msg), state, terminal: false, retry_at }, 202)).queue({ messages: [msg] }, env);
    assert.equal(msg.acks, 0);
    assert.equal(msg.retries.length, 1);
    assert.ok(msg.retries[0].delaySeconds >= 3599 && msg.retries[0].delaySeconds <= 3600);
  }
});

test('rejects HTML, redirects, wrong identity and misleading success', async () => {
  const variants = [
    () => new Response('<html>Sign in</html>'),
    () => new Response('', { status: 302, headers: { location: 'https://evil.invalid' } }),
    msg => reply({ ...result(msg), job_id: randomUUID() }),
    msg => reply({ ...result(msg), environment: 'preview' }),
    msg => reply({ ...result(msg), application: 'another-app' }),
    msg => reply({ ...result(msg), terminal: false }),
    msg => reply({ ...result(msg), state: 'pending' }),
    msg => reply({ ...result(msg), terminal: true }, 202),
    msg => reply({ ...result(msg), state: 'pending', terminal: false, retry_at: 'tomorrow' }, 202),
    msg => reply(result(msg), 503),
    msg => reply(result(msg), 404),
    () => reply(null),
  ];
  for (const variant of variants) {
    const msg = message();
    await createWorker(async () => variant(msg)).queue({ messages: [msg] }, env);
    assert.equal(msg.acks, 0);
    assert.deepEqual(msg.retries, [{ delaySeconds: 60 }]);
  }
});

test('malformed payload cannot choose destination, recipient or another job type', async () => {
  const bodies = [null, [], {}, { job_id: randomUUID(), kind: 'booking_confirmed', environment: 'production' },
    { job_id: randomUUID(), kind: 'inquiry_received', environment: 'preview' },
    { job_id: 'bad', kind: 'inquiry_received', environment: 'production' },
    { job_id: randomUUID(), kind: 'inquiry_received', environment: 'production', url: 'https://evil.invalid' }];
  for (const body of bodies) {
    const msg = message(body);
    let calls = 0;
    await createWorker(async () => { calls++; }).queue({ messages: [msg] }, env);
    assert.equal(calls, 0);
    assert.equal(msg.acks, 0);
    assert.equal(msg.retries.length, 1);
  }
});

test('unconfigured helper never sends a request', async () => {
  let calls = 0;
  const worker = createWorker(async () => { calls++; });
  for (const bad of [{}, { ASTRO_DELIVERY_SECRET: 'short' }, { ASTRO_DELIVERY_SECRET: env.ASTRO_DELIVERY_SECRET + '\r\n' }]) {
    const msg = message();
    await worker.queue({ messages: [msg] }, bad);
    assert.equal(msg.acks, 0);
  }
  await assert.rejects(worker.scheduled({}, {}), /inquiry_recovery_failed/);
  assert.equal(calls, 0);
});

test('oversized streamed response is cancelled without an acknowledgement', async () => {
  let cancelled = false;
  const msg = message();
  const body = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(8193)); },
    cancel() { cancelled = true; },
  });
  await createWorker(async () => new Response(body, { headers: { 'content-type': 'application/json' } })).queue({ messages: [msg] }, env);
  assert.ok(cancelled);
  assert.equal(msg.acks, 0);
  assert.equal(msg.retries.length, 1);
});

test('lost reply retries only that message; next successful message still completes', async () => {
  const first = message(), second = message();
  await createWorker(async (url, options) => {
    if (JSON.parse(options.body).job_id === first.body.job_id) throw new Error('private upstream content');
    return reply(result(second));
  }).queue({ messages: [first, second] }, env);
  assert.equal(first.acks, 0);
  assert.equal(first.retries.length, 1);
  assert.equal(second.acks, 1);
});

test('helper timeout aborts the HTTP call and leaves the message retryable', async t => {
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    assert.equal(delay, 25000);
    queueMicrotask(callback);
    return 0;
  });
  const msg = message();
  const worker = createWorker(async (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  await worker.queue({ messages: [msg] }, env);
  assert.equal(msg.acks, 0);
  assert.equal(msg.retries.length, 1);
});

test('scheduled recovery runs without visitors or queued messages and uses separate secret', async () => {
  let calls = 0;
  await createWorker(async (url, options) => {
    calls++;
    assert.equal(url, 'https://astroadvicebykundansingh.com/api/internal/recovery/inquiries');
    assert.equal(options.headers.Authorization, `Bearer ${env.ASTRO_RECOVERY_SECRET}`);
    assert.equal(options.redirect, 'error');
    const { run_id } = JSON.parse(options.body);
    assert.match(run_id, /^[a-f0-9-]{36}$/);
    return reply({ ...identity, run_id, selected: 0, published: 0 });
  }).scheduled({}, env);
  assert.equal(calls, 1);
});

test('scheduled failures are reported, not silently marked healthy', async () => {
  const variants = [
    body => ({ ...identity, ...body, selected: 2, published: 1 }),
    body => ({ ...identity, ...body, selected: 26, published: 26 }),
    body => ({ ...identity, ...body, selected: 0, published: 0, run_id: randomUUID() }),
    body => ({ ...identity, ...body, selected: 0, published: 0, environment: 'preview' }),
  ];
  for (const variant of variants) {
    await assert.rejects(createWorker(async (url, options) => reply(variant(JSON.parse(options.body)))).scheduled({}, env), /inquiry_recovery_failed/);
  }
  await assert.rejects(createWorker(async () => { throw new Error('private failure'); }).scheduled({}, env), /^Error: inquiry_recovery_failed$/);
});

test('permanent helper config keeps work bounded without a public HTTP endpoint', () => {
  const config = JSON.parse(readFileSync(new URL('../workers/inquiry-delivery/wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(config.name, 'astro-advice-inquiry-delivery');
  assert.equal(config.account_id, '162c1ab1ba0619c1c78d9495f3260f18');
  assert.equal(config.vars.ASTRO_API_ORIGIN, 'https://astrologer-website-kundan-singh-git-design-p-8bfe8c-neura-flow1.vercel.app');
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.triggers.crons, ['*/15 * * * *']);
  assert.equal(config.queues.consumers[0].queue, 'astroadvice-by-kundan-snigh-inquiries');
  assert.equal(config.queues.consumers[0].max_batch_size, 1);
  assert.equal(config.queues.consumers[0].max_concurrency, 1);
  assert.equal(config.queues.consumers[0].max_retries, 5);
  assert.equal(createWorker().fetch, undefined);
});
