# Inquiry and payment delivery helper

**Current, 2026-09-12:** the deployed helper targets the official website only; old preview destinations are rejected. The completion candidate routes inquiry, payment-event and booking/Calendar/email jobs to three fixed authenticated handlers while retaining the same Worker, queue, schedule and credentials. Its 15-minute run also reports durable payment/booking attention as an execution failure so Cloudflare can alert independently of Resend. All 18 unit tests pass locally. The completion candidate must be released before these added handler types exist online.

Permanent names: Worker `astro-advice-inquiry-delivery`, existing Queue `astroadvice-by-kundan-snigh-inquiries` (provider spelling retained). This folder is the helper, not another website. No public HTTP endpoint, domain migration, database connection, Resend key, Google key, payment key or customer data belongs here. It is excluded from the Vercel upload; deploy this folder to the approved Cloudflare account separately when authorized.

## Behaviour

- Python saves the inquiry and two jobs in one transaction. After commit it makes one bounded HTTP batch publication to Cloudflare. Failed publication never undoes the accepted inquiry. No in-process background thread owns durable work.
- Queue messages contain only `job_id`, an allowlisted `kind` and `environment=production`. The kind selects one of the fixed official website handlers: `/api/internal/delivery/inquiry`, `/api/internal/delivery/payment` or `/api/internal/delivery/booking`. The consumer acknowledges only a matching, structured, terminal SQL result. `failed` means retained needs-attention work, not success. Pending/processing results retry at the supplied time (bounded 60–86,400 seconds); invalid replies retry after 60 seconds. Five queue retries remain independent of the application's bounded provider attempts.
- A 15-minute scheduled event calls `/api/internal/recovery/inquiries` with a **different** credential and random run reference. Python separately selects at most 25 due inquiry-email jobs, 25 booking/Calendar jobs and 25 Google Sheet jobs, then publishes each bounded group and records acceptance. In the same request it reconciles at most one uncertain order and one signed payment event, then returns only safe counts. The Worker deliberately fails the run when that call fails or durable work needs attention.
- Queue acknowledgement/retention is not the durable store. Missing publications, expired queue messages and crashed delivery leases can be republished from Neon. Row locks, publication tokens and ordering by dispatch eligibility prevent overlapping sweep collisions and old jobs monopolizing a batch. Older publication responses cannot overwrite newer dispatch state or email results.
- Under healthy scheduling and a backlog fitting one batch, recovery is eligible immediately after a lost commit-to-publish handoff, or after a short active publication/delivery lease. Worst-case eligibility plus the next 15-minute tick is **about 16.5 minutes plus execution**, not a hard completion guarantee. Larger backlogs need more bounded runs. Prompt customer payment confirmation uses the browser callback/webhook first; this schedule is recovery.
- Each helper HTTP call has a 25-second timeout, rejects redirects, bounds response bytes to 8 KB and releases response streams. Python publication has a five-second socket timeout and a 16 KB response cap. Final hosted latency/CPU and platform enforcement still need measurement.

## Configuration and account sequence

`wrangler.jsonc` pins the approved account and the permanent `https://astroadvicebykundansingh.com` destination. Messages cannot select another host, and the Worker exposes no public route or preview URL. The Resend and Razorpay provider callbacks are separate website routes; changing a Worker destination does not configure either provider dashboard.

1. Reuse queue `56cea51fb5b14ba1b133cf9b2d4f9a09`, account ID `162c1ab1ba0619c1c78d9495f3260f18`, accessed through `neuraflowindia@gmail.com`. Authenticated inspection on 2026-09-11 confirms its actual name is `astroadvice-by-kundan-snigh-inquiries`, with zero consumers/producers, 86,400-second retention and zero delay. Source now matches this existing queue; do not create or rename one to match the old proposed name. Scoped operator OAuth login is verified. Account settings expose `default_usage_model=standard`, which alone does not prove a Free subscription. No card, paid trial, DNS/zone change or sample Worker. No second dead-letter store is needed because SQL retains unfinished work.
2. When that target is known, create a scoped Cloudflare API token for that account's Queues write access (dashboard terminology may be **Account → Queues → Edit**). Do not use a Global API Key, all-account access, DNS edits or Workers script administration for runtime publication. This permission may cover other queues in the selected account; do not describe it as a per-queue restriction unless the actual provider supports/enforces one.
3. Keep these in the website's Vercel **Preview and Production** settings, using the same permanent resources. The official website origin must remain in `ASTRO_ALLOWED_ORIGINS`; an approved preview origin may coexist with it:

   | Name | Type | Purpose |
   | --- | --- | --- |
   | `ASTRO_CLOUDFLARE_ACCOUNT_ID` | Config | Approved account ID, 32 hex characters. |
   | `ASTRO_CLOUDFLARE_QUEUE_ID` | Config | Permanent queue ID, 32 hex characters. |
   | `ASTRO_CLOUDFLARE_QUEUE_TOKEN` | Secret | Scoped publication token. |
   | `ASTRO_DELIVERY_SECRET` | Secret | Independently generated random server credential, at least 32 characters. |
   | `ASTRO_RECOVERY_SECRET` | Secret | A different independently generated random server credential, at least 32 characters. |

4. The last two identical named values go into the helper's Cloudflare **Secrets**, never its plain variables or source. Generate/store privately in the named account workflow, not chat, logs or screenshots. No manual email-enable or booking-enable toggle. Settings being saved is not proof of deployed delivery.
5. After the website candidate is released, verify all three authenticated handlers on the official domain, then deploy the reviewed helper revision with the two existing secrets using `wrangler deploy --config workers/inquiry-delivery/wrangler.jsonc --secrets-file <private-operator-file>`. Never include the database operator file. Source supplies no public routes, consumer concurrency one, batch size one and the existing schedule.

Rotation: replace the server value in Vercel and the matching helper Secret as a coordinated change, verify both directions, then retire only the superseded value. A short mismatch produces retryable authorization failure, not data loss or fallback access. Rotate the queue token by replacing the Vercel Secret and verifying actual publication before revoking the old scoped token. Never rotate unrelated resources.

## Local proof and remaining online checks

Runtime correction (2026-09-11): workerd rejects `redirect: 'error'` even though Node accepts it. Both helper paths use `manual` and reject every non-200/202 response, including redirects, without forwarding credentials. Safe retry logs expose only an allowlisted reason/error class. Run `tests/inquiry-worker-runtime.mjs` using Node 22 and Miniflare from the pinned Wrangler 4.131.0 tool installation; set `ASTRO_MINIFLARE_MODULE` to its `miniflare/dist/src/index.js` if it is not installed locally. The regression uses workerd's real fetch with a synthetic upstream, covering delivery, scheduled recovery and redirect refusal. This closes the gap left by Node-only mocks; do not replace it with a build-only check.

Online inquiry proof: user's one Contact inquiry was saved at 21:08 UTC. After correcting the runtime issue, its existing customer/client jobs each sent once at 21:19 UTC and received signed email.delivered events. Queue consumption and delivery are verified; real scheduled invocation remains unobserved. Do not ask the user to resubmit that inquiry. Private login currently rejects the stable preview origin; next configure the existing explicit approved-origin setting and Google web-client origin before client sign-in. SPF/DKIM are present; DMARC is absent at sender and parent domains, with no DNS mutation performed.

Run `node tests/inquiry-worker.test.mjs` from the repository root. Python coverage is in `src/backend/tests/test_inquiry_dispatch.py`; integration tests refuse any database except the named isolated local fixture. Never aim those destructive fixtures at Neon.

Cloudflare build tool: **Wrangler 4.131.0**, Node **22.23.2** used for this slice (local tools only, no website dependency change). From repo root:

```sh
wrangler deploy --dry-run --config workers/inquiry-delivery/wrangler.jsonc --outdir /tmp/astro-inquiry-worker-build
```

This command is a local build, not deployment. A local Cloudflare runtime startup also passed. Unit tests inject providers and inspect fixed request/response contracts; they do not prove real queue consumption, Cron execution, website reachability, inbox delivery or email-provider deduplication. No actual consumer is attached yet.

Free Queues currently includes 10,000 operations/day and fixed 24-hour retention. Normal two-recipient inquiry delivery uses roughly six queue operations (write/read/delete per message), plus retries. Empty scheduled runs make 96 website recovery calls/day but no queue publications. Neon wake time, Vercel execution, helper CPU, retries, other account usage and any backlog must be measured; low volume is not a guarantee of unlimited allowance. Stay Free; no automatic paid upgrade.

The permanent monitoring path does not depend on a Cloudflare email option that this account does not provide. Every complete scheduled recovery records a privacy-safe database heartbeat. The repository's `Production watchdog` checks that heartbeat, the official homepage, API health and booking readiness four times an hour; GitHub sends its normal workflow-failure email to the operator. The public status exposes no customer, provider, count, identity or timestamp data.

Official sources: [HTTP publication](https://developers.cloudflare.com/queues/examples/publish-to-a-queue-via-http/), [batch API and permissions](https://developers.cloudflare.com/api/resources/queues/subresources/messages/methods/bulk_push/), [consumer settings](https://developers.cloudflare.com/queues/configuration/configure-queues/), [retries](https://developers.cloudflare.com/queues/configuration/batching-retries/), [free limits](https://developers.cloudflare.com/queues/platform/pricing/) and [scheduled events](https://developers.cloudflare.com/workers/configuration/cron-triggers/). Checked 2026-09-11. Older generic examples saying four-day retention or requiring a producer Worker do not override the Free pricing page or the HTTP publication API.
