# Plan 1 — Inquiry publication, helper and recovery

Date: 2026-09-11. Bounded P1-06 implementation following the user's confirmation of Google settings. This is local implementation plus the approved permanent schema update, **not hosted automatic delivery**.

## Account checkpoint

The user reports completing Google web client setup and saving `ASTRO_GOOGLE_CLIENT_ID` / `ASTRO_GOOGLE_CLIENT_SECRET` in the intended Vercel Production settings. No credential received or dashboard inspected. Keep project `astrologer-kundan-singh` unbilled. Login, correct-account rejection and Calendar consent remain unproved; the current identity-only code does not consume the preserved client secret.

Next account-only action: [permanent Cloudflare account and queue](../../../BOOKING_SETUP.md#next-account-step--cloudflare-account-and-inquiry-queue). Intended queue `astro-advice-inquiries`, helper `astro-advice-inquiry-delivery`. No account/resource was created by Codex. No unrelated Vercel connector or website/domain relocation.

## Implementation and review

- `006_inquiry_dispatch.sql` adds dispatch eligibility/token, acknowledgement timestamp, attempt count and safe error on existing jobs. It backfills eligibility from creation time without claiming publication or changing email results. Existing migrations are untouched. Partial index covers active inquiry dispatch order.
- `inquiry_dispatch.py` publishes opaque job/type/environment messages to the official fixed Cloudflare batch endpoint. Request shape, account/queue identifiers, credentials, bounded response and explicit acceptance are validated; redirects/HTML/error bodies cannot count as publication. One five-second socket-bounded request, no retry loop in the public form.
- Both Contact/Home and Prashna routes save first, commit, then make best-effort publication. Submission retries respect publication claims. Missing configuration/network/writeback errors leave the inquiry saved and only emit a generic recovery-needed log; they cannot send raw provider details to the visitor.
- Recovery uses the same authoritative rows, selecting at most 25 eligible jobs with row locks and skip-locked semantics. Only inquiry pending-due or expired-processing jobs qualify; future retries, active leases, terminal rows and booking jobs are excluded. Eligibility ordering permits later jobs to advance even when earlier work is stuck.
- Publication claims expire after 90 seconds. A matching token protects writeback from stale publishers; dispatch metadata never overwrites email/provider state. Queue loss or acceptance/writeback ambiguity may republish the same IDs, but stable SQL/Resend processing identities preserve duplicate safety.
- `/api/internal/recovery/inquiries` accepts a run UUID only; its own constant-time-checked credential is not interchangeable with the delivery credential. Structured replies identify application, production environment, run and selected/published counts. Authorization precedes storage. The existing delivery response now includes environment and retry time for the consumer.
- Cloudflare helper has no public fetch handler, database/provider credentials or business logic. Fixed apex website destinations only; every outbound call has a 25-second abort timer, no redirects, 8 KB streamed response bound and stream cleanup. ACK requires matching durable terminal state. Retained failed work is not mislabeled successful email. Pending/active rows request a bounded delayed queue retry. Five queue retries do not erase SQL state or replace the processor's eight-attempt bound.
- Independent 15-minute scheduled recovery runs without browser visits or queued messages. It makes one recovery call and treats mismatched/failed results as a failed scheduled event. The active 90-second claim plus next tick permits up to 16.5 minutes before execution under a one-batch backlog; this is not a guaranteed completion time, and larger backlogs need more runs. No keep-awake loop or Pro Cron.
- `.gitignore` protects local Cloudflare credentials/state; `.vercelignore` excludes the helper from the website upload. No new website framework/library dependency. The [helper runbook](../../../workers/inquiry-delivery/README.md) records exact names, permissions, secrets, rotation and deployment/verification sequence.

## Verification

| Check | Result |
| --- | --- |
| Backend | **142 tests passed, no skips**, 9.195 seconds; 16 new dispatch/transport tests, real isolated local PostgreSQL transactions and injected network. Existing Starlette/httpx test-tool deprecation warning remains. |
| Helper | **12 tests passed**, including fixed destinations, independent credentials, matching ACKs, false HTML/redirect/status results, unknown environment/job/type, oversized streams, timeout abort, partial failure, scheduled no-visitor call and bounded permanent config. |
| Existing JS | **11 tests passed**: booking policy 3, API configuration 4, receipt helpers 4. |
| Website | Fresh Vite production build passed, 10.91 seconds. Existing large-chunk/plugin timing and unrelated website lint warnings remain. No marketing/UI/email-template edits this slice; no new screenshots claimed. Earlier email preview proof remains dated. |
| Scoped lint | Worker and new helper tests pass with no warnings after removing unused test parameters. |
| Cloudflare build | Wrangler **4.131.0**, temporary Node **22.23.2**, `deploy --dry-run` passed: 4.50 KiB / gzip 1.78 KiB. No deployment/account/queue access or messages. “No bindings found” describes no producer/data bindings; the consumer and schedule are in source config and require hosted verification. |
| Cloudflare runtime | Installed Miniflare **5.20260910.0-alpha** startup of the actual worker source passed through its exported `convertV4MiniflareOptions`, then disposed. No events triggered. Tool-only version, not an application dependency or a replacement service. |
| Source | [134-file manifest](2026-09-11-inquiry-dispatch-source.manifest.json), 13,060,374 bytes; all hashes match, 66 textual files scanned with zero credential-pattern matches. Prepared package imports and both internal route registrations verified. Limited pattern scan is not universal secret proof. Helper source is separate from this Vercel package. |
| Documentation | 76 local file links resolve; scoped Git whitespace check passes. Plan 1, setup, architecture and both runbooks updated; integrated stages remain open. |

Review/test corrections: invalid synthetic form fixtures were adjusted to the real token/phone/cooldown rules, not by weakening validation. A stale publisher cannot overwrite a newer result. Streamed responses are actually bounded/cancelled, not trusted by Content-Length. Replacing a 15-minute publication claim with 90 seconds avoids waiting almost two full schedule periods after a crash. Recovery target wording explicitly includes that claim window rather than hiding the timing discrepancy.

Local tooling corrections: PostgreSQL initially failed because sandbox sockets were blocked and its default socket directory was absent; it was started with elevated local-only socket access and no TCP listener. Wrangler required Node 22 rather than the current Node 20; used temporary pinned tool runtime, left installed website dependencies unchanged. Two direct Miniflare attempts used outdated constructor formats; inspected the installed types and used its supported converter. These failed checks were not counted as runtime passes.

## Permanent database

Read-only precheck verified the exact approved direct Neon host, `neondb`, `neondb_owner`, applied migrations 001–005, and zero bookings/inquiries/jobs. Applied only migration 006 through the existing checksum-aware runner. No applied SQL file was edited, no data imported/deleted and no customer/dummy message record created.

Final check used restricted `astro_booking_app` at the exact approved pooled host: readiness/checksums through 006, actual libpq TLS flag, reads of all five new columns, and the existing update grant via a zero-row update. Counts remain **0 bookings / 0 inquiries / 0 delivery jobs**. The first post-migration verification used an incorrect driver TLS property; migration had already committed, so only verification was rerun using `conn.pgconn.ssl_in_use`. No migration replay/replacement or false rollback claim.

Project `fancy-water-31658958`, branch `br-rough-lake-b3ira3cc`, same Free/Singapore resource. Protected operator file remains outside Git; no values printed or changed. Migrations 001–006 are immutable from here.

## Handoff / limits

Prepared website source is `/tmp/astro-hosting-source.ykHVwt`; local helper build `/tmp/astro-inquiry-worker-build`; tool cache `/tmp/astro-inquiry-npm-cache`. No hosted resource, deployment, source commit/push/PR, real mail/Google/Meet/payment action, billing or credential change. Temporary source/tool artifacts retained; no material user data deleted.

Local PostgreSQL was stopped after tests; Miniflare disposed its runtime, and the superseded duplicate Node-20 build-tool process was stopped after the Node-22 dry-run succeeded. No website server was started or stopped. Prepared-route inspection initially encountered FastAPI's included-router wrapper; checking only route objects carrying a path verified both actual internal routes without changing application code. Branch HEAD remains `3f09f6b91a272419ba13afba2fa1731c13bc996d`; substantial existing work remains uncommitted.

Local checks are not live queue/Cron, precise Cloudflare CPU, Vercel latency, email delivery or client acceptance proof. Before real mail, finish shared send budgets/expiry cleanup, signed provider observations, private inquiry/attention/retry access and the agreed independent proactive alert/heartbeat channel. Failure logs are not a proactive alert. Remaining Google Calendar/Meet, payment, backup/restore and release contracts stay in Plan 1.

Skills used: server-function/email guidance kept network work bounded and outside DB transactions; Neon guidance retained direct migrations and pooled runtime access. User instructions override Marketplace billing, SDK/framework swaps and disposable hosted branches. No such changes were made.

Official sources checked: [Cloudflare HTTP publication](https://developers.cloudflare.com/queues/examples/publish-to-a-queue-via-http/), [batch request contract](https://developers.cloudflare.com/api/resources/queues/subresources/messages/methods/bulk_push/), [queue configuration](https://developers.cloudflare.com/queues/configuration/configure-queues/), [retries](https://developers.cloudflare.com/queues/configuration/batching-retries/), [Free queue limits](https://developers.cloudflare.com/queues/platform/pricing/) and [Cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/). Provider/account proof remains separate from documentation.
