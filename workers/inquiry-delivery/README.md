# Inquiry delivery helper

Permanent names: Worker `astro-advice-inquiry-delivery`, existing Queue `astroadvice-by-kundan-snigh-inquiries` (provider spelling retained). This folder is the helper, not another website. No public HTTP endpoint, domain migration, database connection, Resend key, Google key, payment key or customer data belongs here. It is excluded from the Vercel upload; deploy this folder to the approved Cloudflare account separately when authorized.

## Behaviour

- Python saves the inquiry and two jobs in one transaction. After commit it makes one bounded HTTP batch publication to Cloudflare. Failed publication never undoes the accepted inquiry. No in-process background thread owns durable work.
- Queue messages contain only `job_id`, `kind=inquiry_received`, `environment=production`. The consumer calls the fixed website `/api/internal/delivery/inquiry` address with its delivery credential. It acknowledges only a matching, structured, terminal SQL result. `failed` means retained needs-attention work, not a successful email. Pending/processing results retry at the supplied time (bounded 60–86,400 seconds); other invalid replies retry after 60 seconds. Five queue retries are independent of the SQL processor's eight send attempts.
- A 15-minute scheduled event calls `/api/internal/recovery/inquiries` with a **different** credential and random run reference. Python selects at most 25 due jobs, records a 90-second publication claim, commits, publishes once, then records acceptance. No loop through all history, provider send, customer data or booking processing in the recovery handler.
- Queue acknowledgement/retention is not the durable store. Missing publications, expired queue messages and crashed delivery leases can be republished from Neon. Row locks, publication tokens and ordering by dispatch eligibility prevent overlapping sweep collisions and old jobs monopolizing a batch. Older publication responses cannot overwrite newer dispatch state or email results.
- Under healthy scheduling and a backlog fitting one batch, recovery is eligible immediately after a lost commit-to-publish handoff, or after a 90-second active publication/delivery lease. Worst-case eligibility plus the next 15-minute tick is **16.5 minutes plus execution**, not a hard 15-minute completion guarantee. Larger backlogs need more bounded runs; no prompt booking/payment claim relies on this inquiry-only sweep.
- Each helper HTTP call has a 25-second timeout, rejects redirects, bounds response bytes to 8 KB and releases response streams. Python publication has a five-second socket timeout and a 16 KB response cap. Final hosted latency/CPU and platform enforcement still need measurement.

## Configuration and account sequence

Current prelaunch destination: `wrangler.jsonc` pins the approved account and sets `ASTRO_API_ORIGIN` to the now-public stable design/page-by-page preview. Both delivery and scheduled recovery use it. The helper accepts only that exact origin or the final apex; task messages cannot select a destination. At authorized live-domain release, set this one variable to `https://astroadvicebykundansingh.com` and redeploy the same Worker. No duplicate helper or database is required. Source configuration overrides dashboard-only changes, so keep this value in sync with the release record. Existing references to the fixed apex below describe final release behavior, not the current prelaunch target.

1. Reuse queue `56cea51fb5b14ba1b133cf9b2d4f9a09`, account ID `162c1ab1ba0619c1c78d9495f3260f18`, accessed through `neuraflowindia@gmail.com`. Authenticated inspection on 2026-09-11 confirms its actual name is `astroadvice-by-kundan-snigh-inquiries`, with zero consumers/producers, 86,400-second retention and zero delay. Source now matches this existing queue; do not create or rename one to match the old proposed name. Scoped operator OAuth login is verified. Account settings expose `default_usage_model=standard`, which alone does not prove a Free subscription. No card, paid trial, DNS/zone change or sample Worker. No second dead-letter store is needed because SQL retains unfinished work.
2. When that target is known, create a scoped Cloudflare API token for that account's Queues write access (dashboard terminology may be **Account → Queues → Edit**). Do not use a Global API Key, all-account access, DNS edits or Workers script administration for runtime publication. This permission may cover other queues in the selected account; do not describe it as a per-queue restriction unless the actual provider supports/enforces one.
3. Save these in the website's Vercel **Preview and Production** settings, using the same permanent resources for this approved prelaunch branch and eventual release:

   | Name | Type | Purpose |
   | --- | --- | --- |
   | `ASTRO_CLOUDFLARE_ACCOUNT_ID` | Config | Approved account ID, 32 hex characters. |
   | `ASTRO_CLOUDFLARE_QUEUE_ID` | Config | Permanent queue ID, 32 hex characters. |
   | `ASTRO_CLOUDFLARE_QUEUE_TOKEN` | Secret | Scoped publication token. |
   | `ASTRO_DELIVERY_SECRET` | Secret | Independently generated random server credential, at least 32 characters. |
   | `ASTRO_RECOVERY_SECRET` | Secret | A different independently generated random server credential, at least 32 characters. |

4. The last two identical named values go into the helper's Cloudflare **Secrets**, never its plain variables or source. Generate/store privately in the named account workflow, not chat, logs or screenshots. No manual email-enable or booking-enable toggle. Settings being saved is not proof of deployed delivery.
5. After the matching Vercel secrets are saved and the design/page-by-page Preview is redeployed, verify the configured preview reaches both authenticated handlers. Deploy reviewed helper code and both secrets together using `wrangler deploy --config workers/inquiry-delivery/wrangler.jsonc --secrets-file <private-operator-file>`; never include the database operator file, which contains unrelated credentials. This avoids an empty placeholder Worker or an active consumer with missing secrets. The source supplies no public routes, consumer concurrency one, batch size one and the schedule. At separately authorized live release, update the source destination to the apex and verify again. Do not merge main or change the domain as part of helper setup.

Rotation: replace the server value in Vercel and the matching helper Secret as a coordinated change, verify both directions, then retire only the superseded value. A short mismatch produces retryable authorization failure, not data loss or fallback access. Rotate the queue token by replacing the Vercel Secret and verifying actual publication before revoking the old scoped token. Never rotate unrelated resources.

## Local proof and remaining online checks

Run `node tests/inquiry-worker.test.mjs` from the repository root. Python coverage is in `src/backend/tests/test_inquiry_dispatch.py`; integration tests refuse any database except the named isolated local fixture. Never aim those destructive fixtures at Neon.

Cloudflare build tool: **Wrangler 4.131.0**, Node **22.23.2** used for this slice (local tools only, no website dependency change). From repo root:

```sh
wrangler deploy --dry-run --config workers/inquiry-delivery/wrangler.jsonc --outdir /tmp/astro-inquiry-worker-build
```

This command is a local build, not deployment. A local Cloudflare runtime startup also passed. Unit tests inject providers and inspect fixed request/response contracts; they do not prove real queue consumption, Cron execution, website reachability, inbox delivery or email-provider deduplication. No actual consumer is attached yet.

Free Queues currently includes 10,000 operations/day and fixed 24-hour retention. Normal two-recipient inquiry delivery uses roughly six queue operations (write/read/delete per message), plus retries. Empty scheduled runs make 96 website recovery calls/day but no queue publications. Neon wake time, Vercel execution, helper CPU, retries, other account usage and any backlog must be measured; low volume is not a guarantee of unlimited allowance. Stay Free; no automatic paid upgrade.

**Outstanding:** shared mail budgets/expiry cleanup, signed provider observations, private inquiry/attention/retry UI, an agreed proactive alert outside Resend, actual scheduled heartbeat monitoring, Cloudflare/Vercel hosted proof and customer/client delivery tests. Console failure logs are not independent proactive alerts. Google sign-in is a separate integration and Calendar/Meet consent is later still.

Official sources: [HTTP publication](https://developers.cloudflare.com/queues/examples/publish-to-a-queue-via-http/), [batch API and permissions](https://developers.cloudflare.com/api/resources/queues/subresources/messages/methods/bulk_push/), [consumer settings](https://developers.cloudflare.com/queues/configuration/configure-queues/), [retries](https://developers.cloudflare.com/queues/configuration/batching-retries/), [free limits](https://developers.cloudflare.com/queues/platform/pricing/) and [scheduled events](https://developers.cloudflare.com/workers/configuration/cron-triggers/). Checked 2026-09-11. Older generic examples saying four-day retention or requiring a producer Worker do not override the Free pricing page or the HTTP publication API.
