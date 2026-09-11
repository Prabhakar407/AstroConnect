# Plan 1 — Inquiry delivery processor, handler and permanent schema

Date: 2026-09-11. Scope: bounded P1-06 local processor/handler and P1-07 inquiry-copy work; not automatic online delivery.

## Account checkpoint

The user reported the Resend Sending access key and sender saved in the intended Vercel project's Production settings. This closes the account instruction, not independent key-scope, runtime or delivery verification. No secret or screenshot was requested/received. Vercel remains user-operated; no connector change or redeployment.

Next account-only action is the [permanent Google sign-in client](../../../BOOKING_SETUP.md#next-account-step--google-sign-in-client) in the existing unbilled project. This is identity setup, not Calendar consent. A newly issued client secret can be retained directly in Vercel's Secret storage for that same client's later Calendar integration; the current sign-in implementation does not consume it.

## Implemented

- Migration `005_inquiry_delivery.sql` extends the existing `delivery_jobs` table; no second queue store or provider SDK. Inquiry acceptance now saves independent customer/client jobs atomically. Other booking job types and dedupe suffixes are preserved.
- `inquiry_delivery.py` processes one inquiry recipient at a time. It commits a frozen payload, first-attempt/uncertainty marker and 90-second lease before calling Resend outside the transaction. Every retry uses the same message and opaque versioned send key. Message versions/payloads must not be edited after attempts; future revised messages require new versioned jobs.
- Results retain provider ID and acceptance timestamp. Lease checks prevent an older worker from overwriting a newer worker's state; late acceptance evidence is retained. Accepted duplicate deliveries do not depend on the current email key being configured.
- Transient errors use bounded backoff and at most eight attempts. A crashed/uncertain send cannot blindly replay beyond Resend's 24-hour idempotency window. A definite rate-limit rejection can wait into the next day when no prior uncertainty exists; a later rejection cannot erase earlier uncertainty. Missing settings cannot freeze an unusable message or consume attempts.
- `POST /api/internal/delivery/inquiry` accepts a job ID only and checks an independent server credential before storage or provider calls. Terminal durable results return 200; unfinished work returns 202; missing/unsupported inquiry work returns 404. The response identifies application/job/state, not private data. No public website delivery trigger or feature-enable flag was added.
- Customer/client inquiry messages have correct recipients/reply-to, a saved reference, no appointment/payment promise and no private question/birth content. Customer phone formatting is readable. Receipt-based inquiry status reports customer email acceptance without claiming inbox delivery or exposing the client's notification state.

## Checks and corrections

| Check | Result |
| --- | --- |
| Backend regression | **126 passed, no skips**, rerun after final code/copy changes. Real local PostgreSQL transactions, synthetic providers only. Existing Starlette/httpx test-tool deprecation warning remains. |
| New delivery coverage | **20 tests** added: two atomic recipients, save retry, independent partial failure, concurrency, lost result after provider acceptance, frozen retries, stale leases, quota-delay certainty, retry limits, missing settings, bounded due scan, unsupported jobs, migration/backfill, protected handler and customer-only acceptance status. |
| JS regression | **11 passed** across booking-policy, API-config and receipt helpers. No website component/layout changes this slice. |
| Email browser checks | **50 assertions**, ten previews: three verification purposes and two inquiry recipients, each at 640px/320px. No overflow/remote content; code masks, minimum font size and appropriate copy checked. |
| Visual review | Inspected all ten initial previews; made the phone number easier to read and recaptured/rechecked both affected customer previews. Reference wraps rather than clipping on narrow screens. Browser HTML proof only, not Gmail/Outlook or real inbox delivery. |
| Migration compatibility | Local transaction-scoped test schema applies 001–004, inserts synthetic old pending/sent inquiry jobs plus a booking job, then applies 005. Pending inquiry intent splits; unproven historical sent outcomes remain flagged instead of invented recipient success; booking job remains unchanged. Test schema is rolled back. |
| Lint/syntax | Lint exits successfully with existing unrelated website warnings; new browser runner syntax checks. No unrelated cleanup/refactor. |
| Source preparation | **132 files / 13,052,078 bytes**, hashes checked, 64 textual files pattern-scanned with zero credential matches. Limited pattern scan is not a universal secret guarantee. Python API entrypoint and inquiry processor import from the prepared package successfully, without provider calls. |

Review improvements prevented: re-sending the successful recipient after the other failed; changing an in-flight message after a template/sender revision; forwarding provider errors to visitors; discarding late acceptance solely because a lease expired; falsely treating a definitely rejected next-day retry like an ambiguous duplicate; consuming work before server authentication; returning stale “pending” after known customer acceptance.

Code/data proof is distinct from delivery proof. `sent` in the internal table means Resend accepted a valid request. No signed delivered/bounced/complained events exist yet. Sending access credentials do not grant provider read/administration access; no such access is assumed.

## Permanent Neon update

Approved existing project: `astro-advice-by-kundan-singh`, ID `fancy-water-31658958`, production branch `br-rough-lake-b3ira3cc`, database `neondb`.

1. Read the existing owner-only operator configuration without printing values. Checked the exact direct host/database/maintenance role against the approved target. Initial SQL showed migrations 001–004 and **zero bookings, inquiries and delivery jobs**.
2. Applied migration 005 through the direct maintenance connection using the existing checksum-tracked migration runner. No old applied migration changed, project/branch was created, or credential/role/plan/compute setting was changed.
3. Rechecked through the restricted `astro_booking_app` pooled connection: readiness/checksums through 005, actual application TLS flag, reads of every new delivery column and the existing UPDATE grant via a zero-row statement. Bookings/inquiries/jobs still **zero**. No email, booking or synthetic notification record was created in Neon.

The persistent private operator file remains `/home/anan/.local/share/astro-advice-by-kundan-singh/booking.env`, outside Git. Do not print, copy into source, reissue or reset its credentials. Applied migrations 001–005 are now immutable.

## Evidence and temporary resources

- [Fresh source manifest](2026-09-11-inquiry-delivery-source.manifest.json); generated package `/tmp/astro-hosting-source.48E18j`. Earlier manifests/reports are untouched. No source upload, commit, push, PR, Vercel build or deployment.
- Initial inspected screenshots: `/tmp/astro-email-visual.j00xCy/`; final recapture: `/tmp/astro-email-visual.y0FnZ5/`. Ten images each, with synthetic names/reference only and masked verification codes.
- Browser session closed by the runner. Local regression database `/tmp/astro-booking-check.AtRTSl/data` stopped after checks. No website server was started/stopped. Temporary proof/package directories retained; no material files deleted.
- Branch HEAD remains `3f09f6b91a272419ba13afba2fa1731c13bc996d` on `design/page-by-page`; substantial ongoing uncommitted/untracked project work remains necessary to reproduce this version.

## Still required

The internal handler and due-job query do **not** make form submissions automatically send mail. Continue post-commit Cloudflare publication, fixed authenticated consumer/recovery destinations, zero-visitor rescue and independent alerts. Configure the helper credential with that integration, not as another user-visible activation switch.

Shared account/per-purpose send budgets, bounded verification-data cleanup, signed Resend observations, private inquiry/attention/retry views and source attribution remain unfinished. Booking/meeting/payment work cannot enter the inquiry processor. Before online acceptance, finish those contracts, actual Hobby-compatible hosting, Google sign-in/Calendar consent, Meet, Razorpay, backup/operating checks and agreed real-recipient journeys. This slice is not a launch-ready booking system.

Official guidance checked: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [rate/quota responses](https://resend.com/docs/api-reference/rate-limit), [Google sign-in setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Auth Platform setup](https://support.google.com/cloud/answer/15544987), [client-secret handling](https://support.google.com/cloud/answer/15549257) and [advisory billing check](https://support.google.com/cloud/answer/15548748). The email/database/browser skills guided bounded transport, transaction placement and visual proof; the existing Python stack, permanent database and direct no-card provider setup were retained.
