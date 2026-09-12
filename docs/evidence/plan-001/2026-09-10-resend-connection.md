# Plan 1 — Resend domain and verification-email connection

Date: 2026-09-10. Scope: bounded P1-05 local adapter/configuration preparation, not completion of identity, email delivery or booking.

## Observed account state

- User replied “done” to the direct Resend sending-domain instructions. Record domain verification as user-reported, not independent dashboard inspection.
- Public DNS independently returned DKIM TXT at `resend._domainkey.mail.astroadvicebykundansingh.com` and SPF TXT at `send.mail.astroadvicebykundansingh.com`. The return-path MX at the latter name has priority 10 and points to `feedback-smtp.ap-northeast-1.amazonses.com`. No private credential was queried/displayed by these DNS checks.
- Keep the provider-issued Tokyo sending region; the database's Singapore region is a separate service choice. No rename/recreation or DNS mutation by Codex occurred.
- Resend's authenticated dashboard/key is not connected to Codex. Vercel remains user-operated in `neura-flow1/astrologer-website-kundan-singh`, not the unrelated ChatGPT-connected account.
- No Neon write or new Neon verification in this slice. The earlier [permanent connection report](2026-09-10-contracts-and-neon.md) remains its dated evidence.

## Implementation and review

`src/backend/resend_email.py` replaces the inline send transport in `application.py`; `verification.py` now passes the committed challenge UUID into that adapter. No database migration, SDK, framework replacement, new hosted resource or activation switch.

- Exactly one POST to the fixed Resend email endpoint. No credential/message forwarding to redirect destinations. Ten-second socket timeout; bounded response read; valid JSON/HTTP success and provider ID required. This is provider acceptance, never proof of the recipient's inbox.
- The opaque idempotency key uses the saved challenge UUID, not the email/code. Repeating the same attempt retains its identity; a fresh challenge receives a fresh identity even if its six digits happen to repeat. No automatic retry or delayed code queue.
- Sending happens outside the database transaction. A replaced or expired challenge cannot be marked accepted by a delayed response. A failure tells the visitor to wait a minute and request a new code; provider internals are not returned to the browser.
- HTML and plain text describe the action, code and expiry. Replies go to `astroadvicebyks@gmail.com`. No birth details, extra recipients, remote images or tracking content. The template uses a readable system font and a prominent code, without changing the website's marketing design.
- Review corrections: explicitly close HTTP-error responses, assert the installed no-redirect handler, replace a broad test exception with `RuleViolation`, and remove repeated browser startup flags. Even synthetic codes are masked before screenshots.

The email/configuration skill guidance was used for the provider contract and protected settings; the browser guidance was used for local visual inspection. Direct Resend Free and existing Python were retained rather than adopting a billed Marketplace integration or different framework. Official documentation supersedes older skill terminology: Vercel now offers Config/Secret, with legacy Sensitive values treated as Secret.

## Verification

| Check | Result and boundary |
| --- | --- |
| Focused Resend tests | 9 passed: payload/reply-to, repeat identity, malformed success, network/quota/provider failures, redirects, invalid input, purpose wording, committed challenge identity and stale/expired acceptance races. All provider responses mocked. |
| Full backend regression | 106 passed, no skips, rerun after final template edit. Isolated local PostgreSQL 16.2 only; no hosted records. Existing Starlette/httpx test-tool deprecation warning remains. |
| JS regression | 11 passed across booking policy, API configuration and receipt helpers. |
| Email browser checks | `tests/browser-verification-email.mjs`: 30 assertions, all three purposes at 640×480 and 320×480. No overflow, readable body text, masked code, expiry notice and no remote content. |
| Visual inspection | All six first-run screenshots inspected. Clear hierarchy; six-digit code area has room; narrow copy wraps without clipping. Browser rendering only, not Gmail/Outlook or inbox-delivery acceptance. |
| Lint/syntax | `npm run lint` exited successfully; existing website unused-import/escape/hook warnings remain. New browser script passes `node --check`. Scoped `git diff --check` passed. |
| Prepared source | 130 files / 13,036,941 bytes in `/tmp/astro-hosting-source.yu73f8`. Hashes verified; credential-pattern scan found no matches. This limited scan is not a guarantee against every secret format. |
| Python source package | Prepared package imports the real `api.index:app` and new template/adapter successfully using the pinned runtime environment. No provider call. |
| Hosted/runtime delivery | Not run. No new Vercel build, source publication, real email, login, Meet or payment proof. Previous Vite build remains earlier evidence, not a new build claim. |

The fresh generated [source manifest](2026-09-10-resend-source.manifest.json) records the package. Previous source manifests and evidence were not overwritten. Current branch remains `design/page-by-page`, HEAD `3f09f6b91a272419ba13afba2fa1731c13bc996d`; uncommitted/untracked work is required to reproduce the reviewed source, not HEAD alone.

Local visual artifacts:

- First run, all six inspected: `/tmp/astro-email-visual.IgatmO/{booking,contact,prashna}-{640,320}.png`.
- Final runner recheck: `/tmp/astro-email-visual.OrxzKf/`, six screenshots, 30 assertions passed without repeated startup-option warnings.
- Synthetic codes were masked before rendering/capture, not edited out afterward. No actual OTP, key, customer record or private link is in the images.

Local browser session closed by the runner. The local-only PostgreSQL check server (PID 373804, `/tmp/astro-booking-check.AtRTSl/data`) was stopped after verification. Its first sandbox status check could not see the externally started process; an attempted start was rejected by PostgreSQL's existing-process lock. Inspection in the correct process context confirmed ownership and the running local server; no lock file was removed or database reset. No website server was started or stopped in this slice. Temporary evidence/package directories remain; no files were deleted.

## Remaining work and exact next step

The user creates **Astro Advice Website**, a Sending access Resend key restricted to `mail.astroadvicebykundansingh.com`, and saves it directly into the official Vercel project's **Production** `ASTRO_RESEND_API_KEY` Secret, plus `ASTRO_EMAIL_FROM` Config set to `Astro Advice <bookings@mail.astroadvicebykundansingh.com>`. [Exact instructions](../../../BOOKING_SETUP.md#next-account-step--resend-sending-key). Report saved, never the key. No card, extra project, screenshot or redeployment of old remote code.

This does not complete hosted settings or email verification. The protected runtime database connection, OTP secret, exact origins and reviewed-source publication still need the coordinated hosting step. No key must be exposed to frontend `VITE_` variables or untrusted preview builds. Test recipient/scope must be agreed before a real send.

Still implement/verify under C03/P1-06: shared account/per-purpose budgets with measured delivery headroom, bounded expired-key cleanup, remaining lost-reply/cross-device recovery, durable notification delivery and provider-event correlation. The new adapter returns an accepted email reference but does not persist delivery-event correlation. Existing per-email/IP cooldowns are not a substitute for the account-wide budget. These remain visible work items, not invented static quota cutoffs or manual-enable switches.

Next local work can continue on these existing contracts while the account settings wait. Google sign-in/Calendar consent, Meet, payments, actual Hobby-capable runtime, operational checks and client acceptance remain later Plan 1 stages. Do not equate this slice with a working end-to-end booking service.

## Official references checked

- [Resend API-key permissions](https://resend.com/docs/dashboard/api-keys/introduction).
- [Resend send request/response contract](https://resend.com/docs/api-reference/emails/send-email) and [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
- [Resend account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits); shared free allowance must cover codes and subsequent notifications, not codes alone.
- [Vercel Config/Secret types](https://vercel.com/docs/environment-variables/sensitive-environment-variables) and [environment-variable changes](https://vercel.com/docs/environment-variables/managing-environment-variables); saving affects subsequent deployments, not the currently running deployment.
