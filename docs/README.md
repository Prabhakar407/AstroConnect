# Project plans

**Current, 2026-09-12 — official-domain release approved by user:** publish the reviewed website and permanent privacy/terms/refund pages through the existing PR and main branch. Clean paths now replace HashRouter, with old hash links preserved at startup. No payment checkout activation. See [policy publication evidence](evidence/plan-001/2026-09-12-policy-pages.md). After domain verification, return to Google Branding using final URLs, final callback registration and durable Calendar consent. Calendar API is already enabled; Audience is Testing. The checkpoints below are history, not current instructions.

Start here when resuming work after a break or a context reset.

**Current deployed handoff:** user saved Calendar encryption/client secrets. Migration 008 applied and restricted pooled runtime verified. Commit `fe22e74` published to the existing draft PR; Vercel preview deployment `HeAnYqs3zCs9LJA5jQ6A66dUYXJP` reports success. Live readiness 200/storage_ready=true, Google status 401 without session, callback 400 without state. Next user-only batch: enable Calendar API if needed, register the exact backend callback in the existing Google web client, report Audience publishing status. Then grant separate Calendar permission through `/#/studio/calendar` and Check connection. No main/domain move or real Calendar authorization yet. This supersedes local-only status below.

**Latest: client Google sign-in is user-confirmed DONE.** Separate Calendar connection, encrypted token storage, callback and private panel now implemented locally; migration 008 not hosted and source not yet published. Account handoff: save Google token encryption secret in Vercel Preview/Production, cover Preview with existing Google client secret, enable Calendar API/register backend callback, and check Google Audience publishing status. Then agent applies tested migration and publishes the existing preview branch; client grants Calendar consent. See [Calendar connection evidence](evidence/plan-001/2026-09-11-google-connection.md). Older sign-in handoffs below are history.

**Routing correction:** App.jsx uses HashRouter. User-facing calendar links must end in `/#/studio/calendar`, and Contact links in `/#/contact`; plain paths incorrectly show Home. Corrected calendar URL independently opened in a browser, showing Your availability and an enabled Connect with Google button. Screenshot inspected at `/tmp/astro-private-calendar-route.png`. No application change or redeployment needed. API paths and allowed origins stay unchanged. Next action remains client Google sign-in at the corrected URL.

**Current handoff:** user saved the preview origin. Commit `4ede88c` is published to the existing draft PR branch and Vercel reports success (deployment `Fo3JN8XKdCaTVAo2HrU9ykJkgKw6`). Live private-login start now returns HTTP 200 with client ID/nonce present; neither value was logged. Next user-only action: open the stable preview `/studio/calendar`, choose Connect with Google, and sign in as `astroadvicebyks@gmail.com`. Actual Google sign-in remains unproved. Main/domain unchanged. This supersedes the origin blocker below.

**Current, 21:20 UTC:** the user completed a Contact inquiry. A real workerd incompatibility in redirect mode blocked background sends; corrected and runtime-tested, then both saved notifications sent once and signed delivered events were verified. Next user-only action: add the stable preview origin to ASTRO_ALLOWED_ORIGINS in Vercel, preserving existing entries. Private sign-in currently returns 403 approved-website error. Google Calendar/Meet and Razorpay follow. DMARC absence is an open deliverability task; real scheduled invocation remains unproved. See latest helper evidence; older checkpoints below are history.

**Latest live checkpoint (20:42 UTC):** both keys saved and verified; f9a5897 Vercel preview is ready. Fixed one missing runtime database permission for expired-verification cleanup. Permanent Cloudflare helper, existing queue consumer and 15-minute schedule are deployed; public access remains disabled. User's next action is a labelled inquiry through the preview Contact form using agency email and on-page OTP entry. Actual queue processing and scheduled execution remain to be observed. Main/domain unchanged. See [helper deployment evidence](evidence/plan-001/2026-09-11-helper-deployment.md). All setup handoffs below are historical.

**Current handoff, 2026-09-11:** Cloudflare login is verified for the correct agency account. Its existing queue has the provider name `astroadvice-by-kundan-snigh-inquiries`; source now matches it without recreating anything. Real agency email and signed sent/delivered callbacks are verified. Two distinct helper keys are stored privately outside Git and copied together to Windows clipboard for Vercel Preview/Production. Next user action is saving them. Then redeploy the current design/page-by-page Preview, verify authenticated helper calls, and deploy the same permanent helper with its matching secrets. No consumer has been attached yet; main/domain are unchanged. See [current evidence](evidence/plan-001/2026-09-11-public-preview-inquiry-check.md).

The checkpoints below are historical; the current handoff above supersedes their setup blockers.

Current: one approved real verification email to the agency address was accepted through the deployed website (HTTP 200). OTP configuration and sending path now work; inbox arrival/code verification remain unconfirmed. Next user-only batch is Resend webhook registration/signing-secret entry, then same-commit Preview redeployment. Do not ask for repeated send approval within the established agency-verification scope. See [public-preview evidence](evidence/plan-001/2026-09-11-public-preview-inquiry-check.md).

Latest: preview access is public with user approval; Codex independently confirms server/database readiness. Found and fixed missing frontend connection in the source-controlled Vercel build command. Delivery/recovery/webhook secrets are still unconfigured on the preview. See [public-preview inquiry check](evidence/plan-001/2026-09-11-public-preview-inquiry-check.md), which supersedes earlier access/configuration blockers below.

| Number | Plan | Status |
| --- | --- | --- |
| 1 | [Reliable Booking, Inquiries and Client Calendar — From Setup to Handover](PLAN-001-booking-inquiries-and-client-calendar.md) | Active; structured booking/quote/receipt/clock foundations tested. Permanent Neon schema and restricted pooled connection verified. Actual Vercel, email/identity, delivery/Meet, payments and release remain open; checkout is not implemented. |

Plan 1 is the current execution checklist. Its **Resume here** section records the next step, known facts, user-only dependencies and proof boundaries. Update that section and its progress log after each meaningful slice of work, before handing back or changing sessions.

Hosted follow-up: user reports storage_ready=true on the correct redeployment, astrologer-website-kundan-singh-kvvgyzm2l-neura-flow1.vercel.app. Database readiness is now user-observed online; stop repeating configuration/casing questions. Next integration boundary: unauthenticated preview requests still redirect to Vercel login, while the apex /api/ready returns platform 404. The fixed-apex inquiry helper and Resend callbacks cannot yet reach the new API. Resolve hosted callback reachability with user authority before helper deployment or real sends. See [hosted readiness evidence](evidence/plan-001/2026-09-11-hosted-readiness-check.md). No merge, protection change or live provider operation.

Latest checkpoint, 2026-09-11: monthly quota recovery, verified delivery observations and private inquiry views pass 165 Python tests and synthetic browser checks at three sizes. The user confirms Resend currently serves only this website; do not repeat that question. See [inquiry observations evidence](evidence/plan-001/2026-09-11-inquiry-observations.md).

Vercel remains user-operated in the website's separate account. Permanent Neon migrations 001–007 and restricted pooled access are verified. Inquiry publication/helper/recovery and observations are not deployed. Next coordinate reviewed-source publication, helper secrets/deployment and Resend notification connection. Preserve source publication boundaries; no secret/screenshot request, card or domain move.

Read its [implementation contracts and strengthening review](PLAN-001-implementation-contracts.md) for feature behaviour, data/route contracts, failure recovery and ease-of-use limits. This is a companion, not a second plan; stage status and decisions remain in Plan 1.

Supporting references:

- [2026-09-11 inquiry-dispatch evidence](evidence/plan-001/2026-09-11-inquiry-dispatch.md); latest publisher/helper/recovery, 142 Python/23 JS checks and permanent migration 006. Hosted dispatch, real mail/login and remaining operational views/budgets are open.
- [2026-09-11 earlier inquiry-delivery evidence](evidence/plan-001/2026-09-11-inquiry-delivery.md); processor/handler, email previews and migration 005 baseline.

- [No-Pro dependency and alignment review](PLAN-001-no-card-hosting-review.md); current baseline, critique and pending provider gates.
- [Archived hosting options](PLAN-001-hosting-options-history.md); history only, never setup instructions.
- [Booking requirements and historical decisions](../BOOKING_ROADMAP.md).
- [Provider/account setup](../BOOKING_SETUP.md); earlier Google and Render packages are explicitly superseded.
- [Current backend runbook](../src/backend/README.md).
- [Earlier local verification](../BOOKING_FOUNDATION_REVIEW.md); not hosted or live evidence.
- [2026-09-10 Resend connection evidence](evidence/plan-001/2026-09-10-resend-connection.md); latest email adapter, local checks, masked previews and account-only next step. No real email delivery yet.
- [2026-09-10 booking contracts and Neon evidence](evidence/plan-001/2026-09-10-contracts-and-neon.md); earlier source manifest, website screenshots and permanent connection proof.
- [2026-09-10 earlier local preparation evidence](evidence/plan-001/2026-09-10-local-preparation.md); previous checkpoint, not the latest provider state.

Keep plan numbers stable. A provider adjustment or completed stage belongs in the existing plan/log, not a new competing plan. Create Plan 2 only for a genuinely separate programme. Do not store credentials, customer records or private access links in these files.
