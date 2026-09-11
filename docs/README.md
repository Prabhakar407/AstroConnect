# Project plans

Start here when resuming work after a break or a context reset.

| Number | Plan | Status |
| --- | --- | --- |
| 1 | [Reliable Booking, Inquiries and Client Calendar — From Setup to Handover](PLAN-001-booking-inquiries-and-client-calendar.md) | Active; structured booking/quote/receipt/clock foundations tested. Permanent Neon schema and restricted pooled connection verified. Actual Vercel, email/identity, delivery/Meet, payments and release remain open; checkout is not implemented. |

Plan 1 is the current execution checklist. Its **Resume here** section records the next step, known facts, user-only dependencies and proof boundaries. Update that section and its progress log after each meaningful slice of work, before handing back or changing sessions.

Hosted follow-up: the user reports platform NOT_FOUND at both diagnostic endpoints on the successful PR preview. Removed the incompatible cleanUrls option from explicit file rewrites; four hosting tests pass. Publish the correction on the same draft PR and recheck the replacement preview before diagnosing database settings. Production-only settings do not automatically reach Preview. See [hosted readiness evidence](evidence/plan-001/2026-09-11-hosted-readiness-check.md). No merge, protection change or live provider operation.

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
