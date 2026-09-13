# Plan 1 completion candidate — implementation and local proof

Date: 2026-09-12

Branch: `design/page-by-page`

Starting commit for this uncommitted candidate: `f343af6`

This is the current evidence index for the seven-point booking-system checklist. It records what is implemented and locally proven, and it keeps provider-account work separate from claims the code alone cannot prove.

## What is now implemented

1. **Permanent account and callback contract.** The application requires the official `https://astroadvicebykundansingh.com` origin before checkout can start. An approved preview origin may coexist with it. Resend, Google, Razorpay, Neon and Cloudflare each have one permanent purpose and one final-domain route; there is no duplicate hosted stack or development-only activation switch.
2. **Customer checkout and recovery.** A verified email, quoted service, 30-minute slot and ten-minute hold precede Razorpay checkout. Prashna accepts one to ten questions and calculates ₹1,100 per question. Name Change is ₹5,100. Refreshing or reopening the page resumes the same order; it cannot create a second order for the same booking.
3. **Payment verification and exceptions.** The server checks merchant, mode, order, capture, amount, currency and refund state. Browser success alone cannot confirm a booking. Signed Razorpay notifications and an independent provider lookup use the same finalizer. Late, mismatched, refunded, disputed, unmatched or exhausted work remains visible in the private **Needs attention** page; marking it handled never moves money.
4. **Meet, participant messages and cancellations.** A paid booking creates one stable Google Calendar event and Meet link, then sends separate customer and studio messages. Each obligation has its own durable result and safe retry. Phone cancellation changes the website record, removes the website-created event and notifies both parties; it does not automatically refund. A cancellation racing with event creation deletes the newly created event and suppresses stale confirmation mail.
5. **Customer and client interfaces.** The booking page explains payment-in-progress, confirmed, cancelled and recoverable failure states without exposing private records. The client page separates Calendar, Inquiries and Needs attention. Retry language says exactly which provider to check. Status is always written in words and never conveyed by colour alone.
6. **Operations, backup and alerts.** `/api/health` is a cheap liveness reply and deliberately does not wake Neon. `/api/ready` checks the database schema and every required booking connection. The fixed Cloudflare helper handles inquiry, payment and booking work and runs recovery every 15 minutes. A daily GitHub job exports PostgreSQL, validates the dump, encrypts it before upload, verifies the uploaded bytes and retains 15 days. The operating guide covers client actions, recovery and credential rotation.
7. **Live-mode boundary.** The code accepts one internally consistent Razorpay Test or Live credential set; it does not mix them. The official Test Mode journey must pass after release. Matching Live Mode credentials and one real-money check remain deliberately separate because they can charge money and require explicit approval.

## Important failure cases closed during the final review

- A provider-accepted email retry no longer republishes a message just because the later database write was interrupted.
- Cancelling before confirmation suppresses every unsent confirmation job.
- Cancelling while Google is creating an event removes that event instead of leaving an orphaned meeting.
- A cancelled customer receipt never shows the former Meet link and cannot be mistaken for a current appointment.
- Checkout refuses to take payment if database schema, queue recovery, email, Google, merchant binding or official-origin readiness is incomplete.
- Selecting a date preserves the confirmed booking-readiness result instead of replacing it with the availability response's conservative default; a hosted visual check found this false-disabled state and the regression journey now asserts that the configuration banner stays absent.
- Payment and booking work that exhausts automatic retries causes the scheduled helper to fail visibly and appears in the client page.
- Database integration fixtures reject any database other than the named isolated local test database.

## Automated proof

| Check | Result |
| --- | --- |
| Backend and PostgreSQL suite | 252 passed, zero skipped, against isolated local PostgreSQL 16.2 |
| Cloudflare helper suite | 18 passed |
| Focused browser-side contracts | 11 passed |
| Production frontend build | Passed with Vite 8.1.5 |
| Code-quality check | Passed; only older unrelated unused-import/hook warnings remain |
| Backup script syntax and repository whitespace | Passed |
| Package vulnerability review | `npm audit` and `pip-audit` found no known vulnerabilities in the reviewed dependency sets |
| Source credential scan | No real credential found; matches are deliberately synthetic Razorpay fixtures only |

The final backend run used Python 3.12.3 and ran all 252 tests in 18.721 seconds. No test called Razorpay, Resend, Google, Cloudflare, Neon production or a real customer address.

## Visual and browser proof

- Booking success, payment recovery, confirmed and cancelled states passed at 1440×900, 2560×1440 and 390×844 with no page errors, horizontal overflow or clipped controls.
- The private Inquiries and Needs attention flows passed at 1366×768, 2560×1440 and 390×844, including detail safety, paging, empty state, failure recovery, logout and stale-response handling.
- Final screenshot sets are local-only synthetic evidence under `/tmp/astro-booking-final-3` and `/tmp/astro-private-final-2`. They contain no client or customer data.
- Manual screenshot inspection confirmed readable hierarchy, compact large-screen measures, independent mobile stacking, visible retry actions and an unambiguous cancelled-booking state.

## Database migration proof

Migrations 012–014 first passed on Neon's temporary migration branch `br-young-river-b3g8656a`, created from production branch `br-rough-lake-b3ira3cc` in project `fancy-water-31658958`. They add payment reconciliation, durable booking delivery and private payment-case structure.

On 2026-09-13, the user approved completing the work and the prepared migration was applied to the existing production branch. Neon then deleted the temporary branch as designed. One reviewed grant gave the existing runtime role `SELECT`, `INSERT` and `UPDATE` on `booking_calendar_events` and `payment_cases`. A separate production readback returned true for the three exact migration records, both tables, the reconciliation column and both permission checks. The migration created no booking, sent no message and charged no money.

## Backup and configuration proof boundaries

- A local PostgreSQL export was validated, encrypted with a disposable local proof key, copied through the same upload path, byte-checked and restored into a separate empty database named `astro_booking_restore_test`. No production data or permanent key was involved.
- Source configuration points the Worker only to `https://astroadvicebykundansingh.com`; public Worker routes and preview URLs are off.
- Vercel builds the Vite site in same-origin mode, routes `/api/*` to the one Python function and prevents API caching. The code does not require Vercel Pro.
- Dashboard values are never committed. User-confirmed official and preview entries are compatible; preview does not have to be removed.
- The live account dashboards, final callback acceptance and current credential scopes must be verified after this source is released. Local proof must not be described as hosted acceptance.

## Controlled sequence from here

1. Commit and publish this exact candidate through the existing pull request, then release the matching existing Cloudflare Worker.
2. On the official domain, verify readiness, signed Resend/Razorpay callbacks and one complete Razorpay Test Mode customer journey through Meet, both emails, refresh recovery, phone cancellation and the private exception page.
3. Configure the independent Cloudflare failure email, GitHub backup secrets/failure notification, client-controlled Drive folder and the DMARC monitoring record. Observe one encrypted scheduled backup and one clean scheduled recovery run.
4. Replace any remaining placeholder commercial copy or evidence with client-approved material and complete the client walkthrough.
5. Only then configure one matching Razorpay Live Mode set and, after separate approval, run one small real payment and reconcile the payment, booking, Meet, messages and settlement/refund handling.

Until step 3 passes, the candidate is locally complete but the live booking system is not yet accepted. Until step 6 passes, it is not a proven Live Mode payment system.
