// No database, email, payment or Google credentials belong in this helper.
const ORIGIN = 'https://astroadvicebykundansingh.com';
const PREVIEW_ORIGIN = 'https://astrologer-website-kundan-singh-git-design-p-8bfe8c-neura-flow1.vercel.app';
const APPLICATION = 'astro-advice-booking';
const ENVIRONMENT = 'production';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const identity = value => object(value) && value.application === APPLICATION && value.environment === ENVIRONMENT;
const failureReason = error => ['invalid_queue_message', 'helper_configuration', 'handler_mismatch',
  'handler_unconfirmed', 'handler_response_limit', 'invalid_retry_time']
  .includes(error?.message) ? error.message :
  ['TypeError', 'ReferenceError', 'SyntaxError', 'AbortError'].includes(error?.name) ? error.name : 'request_failed';

async function call(path, secret, body, fetcher, configuredOrigin) {
  // The deployment selects the destination, never a queue message. Permit
  // only this site's two reviewed origins so a typo cannot leak credentials.
  const origin = configuredOrigin === undefined ? ORIGIN : configuredOrigin;
  if (origin !== ORIGIN && origin !== PREVIEW_ORIGIN) throw new Error('helper_configuration');
  if (typeof secret !== 'string' || secret.length < 32 || /[\r\n]/.test(secret)) throw new Error('helper_configuration');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetcher(origin + path, {
      // workerd rejects redirect:'error'. Manual mode never forwards our
      // credential; the status check below rejects every redirect response.
      method: 'POST', redirect: 'manual', signal: controller.signal,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (![200, 202].includes(response.status) || response.redirected ||
        response.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      await response.body?.cancel();
      throw new Error('handler_unconfirmed');
    }
    // Bound streamed bytes, not just an untrusted Content-Length header.
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 8192) throw new Error('handler_response_limit');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { status: response.status, data: JSON.parse(new TextDecoder().decode(bytes)) };
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

export function createWorker(fetcher = (...args) => fetch(...args)) {
  return {
    async queue(batch, env) {
      for (const message of batch.messages) {
        let retry = 60;
        try {
          const body = message.body;
          if (!object(body) || Object.keys(body).sort().join(',') !== 'environment,job_id,kind' ||
              body.kind !== 'inquiry_received' || body.environment !== ENVIRONMENT ||
              typeof body.job_id !== 'string' || !UUID.test(body.job_id)) throw new Error('invalid_queue_message');
          const { status, data } = await call('/api/internal/delivery/inquiry', env.ASTRO_DELIVERY_SECRET,
            { job_id: body.job_id }, fetcher, env.ASTRO_API_ORIGIN);
          if (!identity(data) || data.job_id !== body.job_id) throw new Error('handler_mismatch');
          if (status === 200 && data.terminal === true && ['sent', 'failed'].includes(data.state)) {
            // Failed is a retained SQL result needing attention, never success mail.
            if (data.state === 'failed') console.warn('inquiry_delivery_needs_attention');
            message.ack();
            continue;
          }
          if (status !== 202 || data.terminal !== false || !['pending', 'processing'].includes(data.state)) {
            throw new Error('handler_unconfirmed');
          }
          if (typeof data.retry_at !== 'string' || !Number.isFinite(Date.parse(data.retry_at))) throw new Error('invalid_retry_time');
          retry = Math.max(60, Math.min(86400, Math.ceil((Date.parse(data.retry_at) - Date.now()) / 1000)));
        } catch (error) {
          // Do not log task bodies, tokens, upstream response text or URLs.
          console.warn('inquiry_delivery_retry', failureReason(error));
        }
        message.retry({ delaySeconds: retry });
      }
    },
    async scheduled(controller, env) {
      // Independent of visits and the queue. SQL remains authoritative even
      // after Free queue retention/retries expire. One batch, never a loop.
      const run_id = crypto.randomUUID();
      try {
        const { status, data } = await call('/api/internal/recovery/inquiries', env.ASTRO_RECOVERY_SECRET,
          { run_id }, fetcher, env.ASTRO_API_ORIGIN);
        if (status !== 200 || !identity(data) || data.run_id !== run_id ||
            !Number.isInteger(data.selected) || data.selected < 0 || data.selected > 25 ||
            data.published !== data.selected) throw new Error('recovery_unconfirmed');
        console.info('inquiry_recovery_checked');
      } catch {
        // Failed scheduled run is visible in Cloudflare; independent proactive
        // alerts still require the agreed monitoring destination, not Resend.
        throw new Error('inquiry_recovery_failed');
      }
    },
  };
}

export default createWorker();
