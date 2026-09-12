# Plan 1 evidence — Inquiry observations and private follow-up

Date: 2026-09-11. Scope: inquiry-email recovery and protected follow-up, plus additive permanent schema preparation. Not programme completion or live-provider acceptance.

## Implemented

- Explicit Resend daily/monthly quota refusals wait at least one day without consuming delivery attempts when no previous send was uncertain. Earlier uncertainty still respects the 24-hour deduplication boundary. A 32-day refusal regression resumes once when accepted. No guessed monthly reset or paid upgrade.
- Signed raw-body Resend observations use Svix verification before storage. Invalid/stale/future signatures and conflicting IDs fail; duplicates are harmless. Unknown provider IDs remain available for later correlation. Late sent events cannot erase bounces or complaints. Delivery means mail-server acceptance, not a person reading it.
- Minimal OTP provider references are retained, without codes or message bodies. OTPs stay outside delayed delivery.
- Home/Contact/Prashna source is stored. Legacy contact-kind records backfill Contact because their original page cannot be reconstructed reliably.
- Existing private calendar gains Inquiries and inquiry-email Needs attention: bounded pages, expandable details, source/date, new/seen, email outcomes, direct reply/call and mark-seen. Seen does not resolve an email failure. No analytics or automated replies.

## Verification

- Full backend suite: 165 passed, zero skips, latest run 12.425 seconds against isolated local PostgreSQL. Never run its reset fixture on permanent Neon.
- Production build passes, 2279 modules. Existing main-bundle warning (700.8 kB) remains. Python dependency compatibility passes; Svix 2.4.0 and transitive dependencies are pinned in the tested lock file.
- Browser script: tests/browser-private-inquiries.cjs; synthetic records at 1366×768, 2560×1440 and 390×844. Six grouped scenarios cover reading, escaped text, CSRF seen action, contact links, paging, empty/error/retry states and sign-out during a delayed response. Long-location checks measure page and detail overflow.
- Screenshots are temporary local artifacts under /tmp/astro-private-inquiries, not customer data or live login/delivery proof. Finish review found long-location wrapping; corrected paragraph wrapping, grid minimum widths and anchor keyboard focus. Vite's mounted-drive watcher served stale CSS during repeated checks; restarted the same preview with polling before final recapture.
- Design guidance was used to retain the existing palette and hierarchy, not redesign the site. See the scoped private-inquiry design brief alongside this report.

## External changes and limits

Permanent Neon migration 007 and restricted pooled connection/permissions were verified using existing protected maintenance configuration. No customer records or credentials changed; no extra hosted resource.

The user confirms Resend serves only this website. Vercel/Google/Cloudflare saved settings remain user-reported. No real email, invitation, payment, source push, PR, Vercel deployment or helper deployment occurred.

GitHub inspection confirms connected account neuraflowindia has READ permission on Prabhakar407/AstroConnect; default branch main. A collaborator invitation is the recommended direct publication path. No invitation, fork or push was performed.

## Next

Final verification: all six grouped browser scenarios passed across all three sizes after the preview restart, including long-location checks. Fresh screenshots were visually reviewed; the independent finish reviewer reports the wrapping defect resolved with no material regression. Final build passes in 6.84 seconds; whitespace checks pass. Temporary local preview, browser session and isolated database were stopped. No verification artifacts were deleted.

Coordinate reviewed-source publication and user-operated Vercel deployment. Configure ASTRO_RESEND_WEBHOOK_SECRET for /api/webhooks/resend and the existing helper delivery/recovery secrets; deploy the existing helper. Then prove actual login, approved-recipient delivery, signed provider notifications and recovery with zero visitors. Calendar/Meet, Razorpay, payment exceptions, independent alerts, backups and final acceptance remain later Plan 1 work.
