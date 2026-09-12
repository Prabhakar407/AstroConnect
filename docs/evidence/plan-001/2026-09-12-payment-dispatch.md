# Payment notification dispatch — 2026-09-12

## Scope and outcome

User confirms account ID and independent webhook secret saved and retained privately. No values collected in chat or source. Existing Test Mode API keys remain unchanged.

Removed Razorpay's eight-second provider fetch from webhook acknowledgment. Signed inbox and shared `delivery_jobs` intent commit together; a two-second elapsed HTTP deadline bounds queue publication, including streamed responses. Database time is additional: real hosted five-second response acceptance is still to measure, not guaranteed by the HTTP timeout alone.

Migration 011 extends the existing job kind constraint and gives each minimal inbox entry an opaque record UUID. No second queue/job store or new hosted resource. The same Worker routes that job kind to `/api/internal/delivery/payment`; it sends no payment facts or customer details. Handler authenticates before reading the job, verifies the server-fetched payment and acknowledges only its saved result. Duplicate delivery is idempotent. Final-attempt crashes become retained failed jobs after the lease; failed jobs still need the upcoming payment-attention UI.

Queue timeout, rejection or lost acknowledgment cannot unsave the event. The existing scheduled recovery processes due inbox entries independently of inquiry publication failure. This is rescue only: scheduled unresolved-order checks when no webhook arrives remain unfinished, as does prompt checkout reconciliation.

## Verification

- All 237 Python tests pass against the isolated local database, without skips (15.856 seconds).
- Added checks for atomic job save, no provider processing inside the webhook, duplicate payment-task completion, internal authentication, queue acceptance, timeout, redirects and oversized responses.
- Existing helper unit-test command passes with the added payment route/retry case. Real local workerd checks pass for consumer, scheduled recovery and redirect refusal, with no external requests.
- Initial regression attempt failed because the existing local PostgreSQL fixture was stopped. Restarted that exact fixture; did not substitute the permanent database for destructive tests.
- Permanent Neon migrations 009–011 applied by the existing explicit provision command. Restricted pooled runtime readiness, permissions, TLS and schedule transaction verified. No customer records, provider orders, charges, emails or meetings created.

## Publication and remaining work

Published commit `fffc44d` to `design/page-by-page` and opened [PR 3](https://github.com/Prabhakar407/AstroConnect/pull/3). Vercel reports SUCCESS for deployment `2ScDvk34QZktdcVQSRy7jsqrfQpn`. Independently checked the stable branch preview: `/api/ready` returns HTTP 200 with storage_ready=true and booking_enabled=false. Website build passed with the existing large-bundle warning; 16 helper unit cases passed. Main is not merged by this slice; the permanent Worker is not updated yet. Next release action is reviewed PR 3 merge, then existing Worker update and permanent-domain callback verification before Razorpay registration. No temporary provider callback URL is required.

The preview's unsigned Razorpay webhook probe returns HTTP 400/invalid_signature as expected, without a payment record. Signed provider acceptance and real response timing remain unproved. Source publication is verified above; Worker publication remains pending. The website UI is unchanged; no new visual acceptance claim is made. After reviewed main release, register the permanent-domain Razorpay Test Mode webhook using the saved independent secret. Then prove signed provider acceptance and continue checkout, independent payment reconciliation, payment attention, Meet creation and booking emails. Do not label this slice a complete appointment system or enable real-money checkout.
