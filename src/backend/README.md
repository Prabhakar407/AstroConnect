# Booking backend: current setup and safety boundary

Guidance updated 2026-09-12. Start with [Plan 1's resume checkpoint](../../docs/PLAN-001-booking-inquiries-and-client-calendar.md), the [operating guide](../../docs/OPERATIONS-001-booking-system.md), and the [helper runbook](../../workers/inquiry-delivery/README.md). Earlier reports are dated evidence, not the current handoff.

## What runs now

Local entrypoint: `src.backend.main:app`. The released Vercel entrypoint `api/index.py` exports that same ASGI app; framework remains Vite, with API routing before the page fallback. It retains FastAPI and PostgreSQL, not local JSON files. Missing database/provider configuration never invents availability, a sent code, a payment or a booking.

The private calendar route is `/studio/calendar` (legacy hash links are redirected). Client Google sign-in, Calendar permission and Meet capability have real user-observed evidence. Inquiry delivery and its fixed-destination Cloudflare helper are deployed on the official domain. The completion candidate adds customer Razorpay checkout/recovery, durable payment reconciliation, Meet/event creation, participant emails, cancellation updates and a private payment/booking attention list. Its database additions are applied and verified; the reviewed source still needs release and official-domain provider checks.

The user confirmed the website is pre-handover and old bookings/inquiries are dummy. No legacy import is needed. Permanent Neon is now initialized; keep it for launch and leave old external stores untouched. Controlled provider checks need identified records/recipients, never a reset of this permanent database. Local destructive regression tests remain isolated from Neon.

## Install and start locally

Use Python 3.12 and an isolated virtual environment. The tested constraints record the package versions used in this review; they are not a claim of security certification. Some legacy packages are present in the constraint snapshot but no longer required by the active application.

```bash
python -m pip install --upgrade 'pip>=26.2,<27'
python -m pip install -r src/backend/requirements-dev.txt -c src/backend/requirements-tested.lock
python -m uvicorn src.backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

The app starts without credentials and reports unavailable features. `GET /api/health` (also `/` locally) is process liveness and does not wake Neon. `/api/ready` verifies all packaged migration checksums; it is not email/Google/payment proof. `/api/services` returns `{ "services": [...] }`. `/api/booking-policy` returns database-clock `server_now`, horizon, slots and `minimum_notice_minutes: 30`; absent storage returns 503. `/api/availability?date=YYYY-MM-DD` returns the same policy plus `date` and `slots: {"10:00": true, ...}`. The browser now consumes that object/horizon, stops hidden/idle polling and offers retry without discarding typed details.

Database setup is explicit: after creating an empty, approved database and securely setting **`ASTRO_MIGRATION_DATABASE_URL` to its direct maintenance connection**, run:

```bash
python -m src.backend.migrate
```

This applies numbered migrations transactionally and records their checksums. Never edit an already-applied migration. Never point this command at an unknown database. Provisioning a real database and migrating historical data need separately established ownership/authority.

### Permanent Neon provisioning completed

Project `fancy-water-31658958`, branch `br-rough-lake-b3ira3cc` (`production`), database `neondb`: migrations **001–015** are applied and immutable. On 2026-09-14, the protected operator command applied additive migration 015 and re-verified the restricted pooled website role, encrypted connection and transaction lock without creating a customer record. Use the existing protected operator workflow; never migrate from a request, reset credentials or introduce another database.

The SQL-created `astro_booking_app` login uses the pooled endpoint; `neondb_owner` uses the direct endpoint for maintenance only. Actual checks passed for schema/read access, transaction-scoped locks, application-link TLS, no elevated `neon_superuser` membership and no schema/table creation privileges. Use libpq's client TLS flag: `pg_stat_ssl` behind pooling describes the pooler's internal link and cannot establish encryption of the application's connection.

The local operator file's non-secret location and permissions are recorded in the latest evidence. Never add that file or its contents to this repository, a screenshot or chat. When publishing, place only the restricted runtime connection in Vercel's protected server settings; keep the direct maintenance credential off request-serving deployments. Future feature migrations must also review explicit grants in `provision.py`; runtime roles do not receive blanket `ALL` permissions.

## Configuration

No automatic `.env` discovery occurs. Put secrets in the host's protected configuration, not source code, browser settings, chat, screenshots or logs. There is no legacy credential fallback.

| Variable | Purpose / default |
| --- | --- |
| `ASTRO_DATABASE_URL` | Runtime PostgreSQL connection. Explicit single host/database required; remote connections require TLS (`sslmode=require` or certificate verification; prefer `verify-full` where supported). No startup `options`, host-address override, service-file indirection or implicit server. Use Neon's pooled runtime endpoint with a restricted role. |
| `ASTRO_MIGRATION_DATABASE_URL` | Separate direct maintenance connection, used only by the explicit migration command, never by request handlers. No fallback to runtime credentials; known Neon pooler addresses rejected. Keep this credential off the request-serving deployment. |
| `ASTRO_ALLOWED_ORIGINS` | Exact website origins, comma separated. Defaults to localhost/127.0.0.1 on port 5173. No wildcard, credentials or path. Non-local origins require HTTPS. |
| `ASTRO_OTP_SECRET` | At least 32 characters of securely generated secret material for verification digests. Required for email verification. Rotating it invalidates outstanding codes/tokens. |
| `ASTRO_RESEND_API_KEY` | Resend Sending access key restricted to `mail.astroadvicebykundansingh.com`; Vercel Production Secret (legacy Sensitive). No SMTP fallback. |
| `ASTRO_RESEND_WEBHOOK_SECRET` | Existing Resend callback signing secret, at least 32 characters. Callback: `/api/webhooks/resend`. |
| `ASTRO_EMAIL_FROM` | `Astro Advice <bookings@mail.astroadvicebykundansingh.com>`; public configuration. The client's Gmail receives replies, not an automatically authorized third-party sender. |
| `ASTRO_DELIVERY_SECRET` | Server-only helper credential, at least 32 characters; authenticates the fixed inquiry, payment, booking and Sheet delivery routes. Not a feature switch or customer/admin credential. Configure with the existing Cloudflare helper, not in the browser. |
| `ASTRO_RECOVERY_SECRET` | Separate server-only random credential, at least 32 characters; permits the fixed inquiry recovery route only. Same value in the helper's Secret storage. |
| `ASTRO_CLOUDFLARE_ACCOUNT_ID` | Approved permanent Cloudflare account ID; server Config. |
| `ASTRO_CLOUDFLARE_QUEUE_ID` | Permanent existing `astroadvice-by-kundan-snigh-inquiries` queue ID; server Config. The provider spelling is intentionally retained. |
| `ASTRO_CLOUDFLARE_QUEUE_TOKEN` | Account-scoped Queues publication credential; Vercel Secret only. Not a Global API Key or a frontend setting. |
| `ASTRO_GOOGLE_CLIENT_ID` | Google web sign-in client ID, bound to the intended website. Not a secret. Must belong to the approved project. |
| `ASTRO_GOOGLE_CLIENT_SECRET` | Existing Google web client's secret, used only for server-side Calendar permission exchanges. |
| `ASTRO_GOOGLE_TOKEN_KEY` | Stable Fernet encryption key for the saved Calendar refresh token. Server-only; preserve it across deployments. Replacing it requires re-encryption or client reconnection. Never prefix with VITE_. |
| `ASTRO_GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` | Complete JSON key for the one Google service account allowed to edit the two fixed customer-record workbooks. Server Secret only; never expose it to the browser. |
| `ASTRO_CLIENT_SHEET_ID` | Fixed client-owned workbook ID. Server Secret because it points to private customer records. |
| `ASTRO_AGENCY_SHEET_ID` | Fixed NeuraFlow-owned workbook ID. Server Secret because it points to private customer records. |
| `ASTRO_RAZORPAY_KEY_ID` | Matching client-merchant Test or Live key ID. Its mode is shown to the customer; never mix it with a secret from the other mode. |
| `ASTRO_RAZORPAY_KEY_SECRET` | Server-only secret matching the key ID above. |
| `ASTRO_RAZORPAY_WEBHOOK_SECRET` | Independent callback signing secret, at least 32 characters. Callback: `/api/webhooks/razorpay`. |
| `ASTRO_RAZORPAY_ACCOUNT_ID` | Client merchant ID used to reject notifications from a different Razorpay account. |
| `VITE_API_MODE` | Explicit `same-origin` sends both public/private requests to the website's `/api`; then `VITE_API_URL` must be absent/empty. Default `explicit` requires a separate configured server origin. Blank settings keep design previews disconnected. |
| `VITE_API_URL` | Only for explicit mode: HTTPS server origin with no path, credentials, query or fragment; loopback HTTP allowed for local tests. Never put a secret in a `VITE_` variable. |

Email and private sign-in use their actual connection settings; there is no separate enable switch. `ASTRO_EMAIL_ENABLED` and `ASTRO_ADMIN_ENABLED` have been removed and are ignored if present in older configuration. When deploying this revision, supplying valid sender/key/verification/storage settings permits requested email-code sends; supplying the Google client ID and storage permits the authorized sign-in flow. Configure only the intended test/live providers and recipients. No provider calls happen at import or merely because settings exist; login, origin, session and anti-forgery checks remain unchanged.

`resend_email.py` is the single verification-email transport. It sends once, after the challenge transaction commits, to the fixed Resend endpoint with a ten-second socket timeout, no redirects and an opaque challenge-based idempotency key. It requires a bounded JSON success response with a valid provider email ID before the still-current, unexpired challenge may be marked `send_accepted`. The returned reference is provider acceptance, not inbox delivery; its minimal provider reference is now persisted for signed-event correlation. Provider failure details never enter browser messages. Codes are never queued for delayed replay. HTML/text contain the purpose, code and expiry only, not birth details; replies go to the existing `CLIENT_EMAIL`. [Resend's documented send contract](https://resend.com/docs/api-reference/emails/send-email) and [idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys) are the basis. Daily shared reservations now run in the caller's pre-send transaction: 100 total per UTC day, with verification limited to 80 to leave 20 for accepted obligations. Unknown/failed sends consume reservations conservatively; no provider call holds the budget lock. Existing authenticated recovery clears expired temporary records in bounded batches. Monthly provider allowance and usage outside this database are not modeled as fresh local capacity; the user confirms this team currently serves only this website. Signed delivery tracking and monthly-refusal recovery are locally verified; remaining C03 recovery and hosted proof stay open.

Checkout has no separate activation switch. Booking availability is derived from the working database, email, queue, saved Google Calendar connection, official website origin and one matching Razorpay credential set. The customer browser opens only the order created by the server; payment is confirmed only after the server fetches and matches the captured payment. Webhooks and the 15-minute recovery route finish saved work if the browser closes. Missing or malformed dependencies keep new checkout unavailable while existing signed callbacks and recovery routes remain reachable.

### Local hosting preparation (not deployment)

Run `node scripts/prepare-hosting.mjs` from the repository. It creates a **new** allowlisted directory under `/tmp/astro-hosting-source.*` and a sibling file/hash manifest. It refuses symbolic/indirect files and excludes credentials, old stores, archives, screenshots, tests and documents. Nothing is uploaded or linked. The source catalogue is retained. Review the manifest and run a separate secret scan before any authorized upload; a filename allowlist is not proof of secret-free content.

Build that directory with the lockfile (`npm ci --ignore-scripts` then `VITE_API_MODE=same-origin VITE_API_URL= npm run build`). Install Python via root `requirements.txt`, which applies tested constraints. Unused Calendar/legacy SDKs are not installed until their actual integration needs them. `vercel.json` uses one native Python function, a 30-second ceiling, `regions: ["sin1"]`, and no cron, beta Services or paid-only setting. Do **not** deploy the whole dirty worktree automatically. Full Vercel bundle/routing/cookies and actual Hobby execution remain unverified; local source build is not platform proof.

Runtime transactions use `SET LOCAL` statement/lock timeouts and transaction-scoped advisory locks; automatic prepared statements are disabled for the short connection-per-operation workload. These settings and restricted pooled access now work against real Neon from local code. Actual Vercel concurrency/cold-start/pool-wait limits remain unproved. The browser's 20-second timeout does not cancel server work; uncertain inquiry replies now attempt same-receipt recovery. Full checkout recovery remains required before paid activation.

### Private sign-in and hosting

Google Identity Services uses its official hosted sign-in button and `google-auth` verifies the signed identity, audience and expiry. The server also checks the approved Gmail address, verified email and one-use nonce. The first valid authorized login pins Google's stable account ID; later logins cannot substitute a different ID with the same email string. There is no public registration and no password stored in the app.

Sessions last eight hours and live in PostgreSQL. The browser cookie is Secure, HttpOnly, SameSite=Strict and host-only. All private writes require the exact website origin and a per-session anti-forgery token. Login itself requires a short-lived challenge bound to a separate secure cookie and to the Google identity nonce. Login starts are rate-limited; failures do not bypass challenge consumption. Sign-out revokes the server session.

**Use the website and API under the same HTTPS site**, preferably a same-origin `/api` reverse proxy. Unrelated default hostnames will not support these strict cookies reliably. Local HTTP is suitable for the public preview and mocked UI tests, not proof of Google login. Do not weaken cookies to make a preview appear connected. Configure Google's authorized origins, browser security headers and the host's trusted proxy IPs before live verification. Never blindly trust arbitrary forwarded-IP headers; check real client-IP rate-limit behavior at the host.

Google sign-in does not grant Calendar access. The separate client Calendar authorization, token lifecycle, Meet capability check and invitation delivery tests are still required.

## Data and state rules

- `bookings` stores separate validated birth date/time/place/notes alongside customer/service/quantity, server-calculated paise, 30-minute start, state and cancellation audit. Unknown birth time stays absent; legacy text is retained without parsing/inventing dates. SHA-256 quote acknowledgement protects review of current terms; accepted names/fees/quantity/duration are frozen for retry/history.
- `slot_claims` has one unique timestamp across both bookings and closures. A shared transaction lock serializes this small single-clinician schedule; the database key independently prevents duplicate ownership. This deliberately simple scheme is proportionate to ten possible sessions per working day.
- `closures` records ranges, reasons, actor and reopening. Public booking stops at today+10; future closures can extend further. Whole-day/partial changes reject an overlap in full, never cancel existing bookings.
- New holds require at least 30 minutes' notice using the database clock; exactly 30 minutes is allowed. Availability uses the same cutoff. Holds expire after at most ten minutes; a receipt-authorized unchanged retry retains its frozen price/deadline. One verified email cannot create simultaneous active holds. Price/slot/birth validation failures preserve unconsumed verification proof. `/api/checkout`, `/api/checkout/resume` and `/api/checkout/verify-payment` expose only receipt-authorized, server-priced checkout state.
- Protected day reads can inspect history; past writes remain prohibited. Today's full-day closure checks the whole day for protected claims before writing only future claims. Partial ranges containing started times, Sundays and empty closures are rejected. The private UI's historical navigation and retry/exception views remain P1-09 work.
- `payment_orders`, `payments` and `payment_events` retain the exact key mode, order/capture observations and signed notification inbox. One order is allowed per held booking. Browser callbacks, provider notifications and scheduled reconciliation share the same idempotent finalizer. Late/mismatched/refunded/disputed work is preserved for a person; phone cancellation frees the slot but never moves or refunds money.
- `inquiries` stores Contact/Home/Prashna inquiries. Verification and durable save precede success. UUID plus independent 256-bit receipt secret authorizes retry/status; only a context-bound digest and expiry enter the database. Inquiry access lasts 24 hours; booking receipt access ends no later than appointment end +24 hours. `POST /api/inquiry-status` and `/api/booking-status` require `X-Astro-Receipt`, have a shared 60/minute per-observed-IP limit and return limited summaries, never birth/contact details. Browser storage retains receipt identifiers only and resumes the same checkout after refresh.
- `delivery_jobs` stores inquiry email, payment-event, Calendar/Meet, participant-email and two-workbook Sheet obligations. Provider work is claimed with bounded leases, performed outside the database transaction and completed only by the current lease owner. Repeats reuse saved identities; Sheet writes first find the permanent record reference and update or append exactly one row using literal values. Eight bounded attempts prevent endless replay; exhausted work remains visible under **Needs attention**. Accepted email is not described as inbox delivery.
- `POST /api/internal/delivery/inquiry` accepts only `{job_id}` and exact `Authorization: Bearer <ASTRO_DELIVERY_SECRET>`. It authenticates before storage/provider work. A matching durable terminal result is 200; still-pending/in-flight is 202; unknown/unsupported work is 404. The response identifies `application=astro-advice-booking`, the job and safe state, not email contents or provider secrets. No admin session or customer receipt substitutes for this credential. There is no public delivery trigger in the website.
- `inquiry_dispatch.py` publishes after successful save; there is no delayed in-memory background task. Missing/failed queue configuration leaves the customer record saved and logs a safe recovery-needed code. The helper's 15-minute scheduled event calls `POST /api/internal/recovery/inquiries` with `{run_id}` and `ASTRO_RECOVERY_SECRET`; authorization precedes storage. It separately republishes up to 25 inquiry-email, 25 booking/Calendar and 25 Sheet jobs, so one category cannot starve another. A matching response contains counts, never customer data. `dispatch_after` ordering and a 90-second claim prevent collisions; stale publication responses cannot alter newer results.
- Confirmed bookings and inquiries remain authoritative in Neon. Each confirmed booking and inquiry also gets one row in the client workbook and one row in the NeuraFlow workbook. Cancellation updates the existing booking row. Unpaid/abandoned holds are deliberately excluded because they are not appointments. A missing Sheet, revoked share or provider outage cannot undo payment, booking or inquiry acceptance; the private **Needs attention** page names the failed copy and permits a retry.
- The deployed [Cloudflare helper](../../workers/inquiry-delivery/README.md) uses fixed official-domain inquiry, payment and booking handlers. It acknowledges only a matching durable terminal result, rejects redirects/HTML and respects retry times. Its schedule republishes missed work and raises an execution failure when saved payment/booking work needs attention, allowing an independent Cloudflare email alert. SQL—not the queue—is the authoritative record.
- Verification tables retain digests and bounded-lifetime credentials, not plaintext codes. Private session/challenge tables are distinct from customer email verification. No email OTP grants administrator access.

## Tests and proof boundaries

```bash
python -m unittest discover -s src/backend/tests -v
node tests/bookingPolicy.test.js
node tests/apiConfig.test.js
node tests/requestReceipt.test.js
npm run build
npm run lint
```

The Python suite skips integration tests unless `ASTRO_TEST_DATABASE_URL` is set. Integration tests are destructive **only inside an isolated test database**: they reject anything whose database name is not `astro_booking_test` or whose UNIX socket directory does not start `/tmp/astro-booking-check.`. Do not relax these checks to run against hosted or customer data.

Latest review ran **252 Python tests without skips** on isolated local PostgreSQL, **18 helper tests** and **11 focused frontend contract tests**. Publication/recovery tests cover all form/job routes, saved work during failure, lost acceptance/writeback, concurrency, queue expiry, bounded fairness, checkout recovery, payment events, meeting/email delivery and authentication. Fresh Vite build, lint and responsive browser checks are recorded in the current completion evidence. These are local checks, not a real charge or hosted acceptance of the unreleased candidate.

`tests/browser-verification-email.mjs` renders actual templates in a blank local browser using `agent-browser`, without a website server or mail delivery. Set `ASTRO_TEST_PYTHON` and `ASTRO_BROWSER_EXECUTABLE` for the installed tools. It masks synthetic codes and checks three verification purposes plus both inquiry recipients at 640px/320px: 50 assertions and ten screenshots. Browser HTML rendering is not Gmail/Outlook inbox proof.

Browser regression scripts are in `tests/browser-booking.cjs` and `tests/browser-private-calendar.cjs`. They require Playwright and Chromium provided by the verification environment, a local preview at port 5185 with `VITE_API_URL=http://127.0.0.1:8000`, and intercept form/admin requests. Run them only against a local isolated preview. The scripts use fake identities and records, not provider acceptance. Set `PLAYWRIGHT_MODULE_PATH`, `ASTRO_BROWSER_EXECUTABLE` and `ASTRO_BROWSER_OUTPUT` if the tools/output are outside their defaults. Screenshots contain synthetic data only.

For the real **unconfigured local** API smoke test, start `api.index:app` on loopback port 18000 with database/email/admin disabled; start Vite with `VITE_API_MODE=same-origin`, empty `VITE_API_URL`, and `--config tests/vite.hosting.config.js` (port 5186). Then run `node tests/browser-hosting.cjs` with those same Playwright/output settings. It asserts unavailable/disabled states, not provider success, across four viewports. This local proxy does not prove Vercel edge routing.

`tests/browser-booking-contracts.cjs` uses the local website/API with the actual restricted Neon connection for GET policy/availability/quote reads; it never submits customer records. It checks four viewports, an incorrect device year/timezone, Prashna totals, no overflow and recoverable fee/availability failures. `tests/browser-inquiry-recovery.cjs` uses synthetic browser responses only and passed 20 assertions for network/server/malformed-reply recovery, unchanged receipt identity and no private draft storage. These checks do not send email or validate Vercel hosting. Current script-specific base/output options override older defaults above.

## Account-dependent work, in order

The 2026-09-10 aligned baseline is existing React/Vite/FastAPI on Hobby-compatible Vercel hosting, Neon Free, Resend Free, Google identity/Calendar/Meet and one small Cloudflare Free queue/schedule helper. No Pro-only feature or upgrade-date gate; the client decides hosting-plan timing. No main Python-to-Workers port or duplicate site. Preserve `astroadvicebykundansingh.com`; existing client-owned accounts/delegated access and unbilled Google identifiers remain, with the explicit Neon exception under NeuraFlow's `neuraflowindia@gmail.com`. Client Calendar/Meet and notification email stay `astroadvicebyks@gmail.com`. Actual account/configuration/usage proof is pending. Follow [Plan 1](../../docs/PLAN-001-booking-inquiries-and-client-calendar.md) and [the alignment review](../../docs/PLAN-001-no-card-hosting-review.md); older provider setup is historical.

1. Continue from permanent Neon 001–007 and verified restricted pooled grants. Resend/Google/Cloudflare settings are reported saved and the user confirms exclusive Resend team usage. Monthly refusal recovery, signed observations and private inquiry views are locally verified. Actual Vercel/helper execution needs reviewed-source publication authority, helper secrets/deployment and `ASTRO_RESEND_WEBHOOK_SECRET`. No unrelated connector, card, extra hosted stack or redeploy of old remote source.
2. Coordinate rotation of the inherited SMTP and Upstash credentials in their owner accounts; earlier Git history may contain them. Removing them from the current source is not revocation. Do not restore the archived backend as a fallback.
3. Configure the real database, HTTPS origin/cookies and client-owned Google login. Verify correct-account access, wrong-account rejection, mobile login, expiry and sign-out on the intended host.
4. Implement client Calendar/Meet and Free queue publication/helper-authenticated Python handlers. Require matching durable outcomes before ACK; recover failed publication and expired queue work with zero visitors. No Pro Cron, paid runtime dependency or keep-awake loop. Test both recipients, conference readiness, cancellation races, duplicate/reordered/uncertain results, quotas and independent alerts. Calendar invitations do not guarantee automatic insertion into every customer's personal calendar.
5. Integrate the client's Razorpay test account, order creation, server verification of captured payments, signed webhook/replay handling, hold expiry and reconciliation. The browser may never supply proof of payment. Account details belong at this stage.
6. Agree cancellation/refund/payment-exception handling, retention/privacy and tax/invoice requirements. Demonstrate backup restoration, authorized hosted journeys and client acceptance. Only then request the appropriate publication/live-test authority.

Official references: [Google identity verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Google sign-in nonce](https://developers.google.com/identity/gsi/web/reference/js-reference), [Vercel FastAPI](https://vercel.com/docs/frameworks/backend/fastapi), [Hobby execution allowances](https://vercel.com/docs/functions/usage-and-pricing), [Cloudflare queue delivery](https://developers.cloudflare.com/queues/reference/how-queues-works/), [Neon plans](https://neon.com/pricing), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys). Recheck actual account/runtime limits during setup; planning is not provider proof.
