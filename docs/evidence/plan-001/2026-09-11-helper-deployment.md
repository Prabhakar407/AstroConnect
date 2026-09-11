# Permanent inquiry helper deployment

## Latest acceptance and runtime correction, 21:20 UTC

User completed the Contact form and on-page OTP, reporting email in spam. Restricted read-only SQL confirmed one agency inquiry created 21:08:50 UTC, both jobs published, pending with zero send attempts. Real queue logs showed immediate retries. Safe fixed reason/error-name logging narrowed the failure to TypeError without recording payloads, secrets, URLs or arbitrary exception messages.

Reproduced in local workerd with synthetic credentials and a mocked outbound service: native fetch rejects redirect:error (requires follow/manual), despite Node accepting it and current Cloudflare Request documentation listing error. Switched both paths to manual; existing status checks reject every redirect without forwarding the credential. Added tests/inquiry-worker-runtime.mjs: real workerd queue and scheduled calls succeed, 302 responses are rejected, exactly one upstream call per handler, no external requests. Installed Miniflare requires convertV4MiniflareOptions for its legacy options, handled by the test. Initial two harness constructor attempts failed validation; corrected harness passes. Node suite passed 25 before adding the dedicated safe-log test; rerun result recorded at handoff.

Diagnostic deployments 80ad4895-019f-45a8-9ef5-37e3693a53fd and 133374dc-0791-48ac-9231-6e0cb9421071 narrowed the cause; final corrected Worker version 5e6e907f-ec1e-435b-bc2e-a0f0aa804d64. Normal recovery republished only the two pending saved jobs, with no new inquiry or state reset. Tail shows successful queue consumption (~950ms/2ms CPU and ~778ms/1ms CPU). Read-only SQL confirms customer accepted 21:19:49.626128 UTC and client 21:19:50.781333 UTC; each state sent, attempts=1, no error, with signed email.sent and email.delivered events. This proves normal form verification/storage, website queue publication, actual helper consumption, both sends and signed delivery tracking. Delivered is mailbox-server acceptance, not Inbox placement. Timed Cron invocation is still not observed and independent proactive monitoring remains open.

Public DNS check: SPF send.mail.astroadvicebykundansingh.com permits amazonses.com and resend._domainkey.mail.astroadvicebykundansingh.com DKIM exists. Neither _dmarc.mail.astroadvicebykundansingh.com nor organizational _dmarc.astroadvicebykundansingh.com has a DMARC record. This is an actionable improvement, not proof of the spam cause. No DNS record created or paid deliverability tool added. Official guidance: https://resend.com/docs/dashboard/domains/dmarc and https://resend.com/docs/dashboard/emails/deliverability-insights.

Next private-login readiness probe POST /api/admin/login/start with stable preview Origin returns 403 “Please use the approved studio website.” No Google login performed or challenge exposed. User-operated Vercel ASTRO_ALLOWED_ORIGINS must include that exact origin, preserving existing entries, before login can be tested. Google OAuth authorized JavaScript origins may also need the exact preview; actual dashboard settings are not visible here. Continue existing client account astroadvicebyks@gmail.com; no substitute admin, wildcard or auth bypass.

Final local checks: all 26 JavaScript tests pass, plus the real workerd runtime regression. Current source correction/evidence are prepared locally; publish to the same draft branch after the user saves the approved-origin setting so the resulting Vercel build picks it up without another manual redeployment. Corrected Cloudflare Worker is already live. Existing Wrangler tail session 85021 remains available for scheduled-event proof. No UI changed; no new screenshots claimed.

## Source and website

Published reviewed helper/config/tests and prior evidence to existing draft PR #1, branch design/page-by-page, commit f9a5897. Vercel reported success at DdU9wBcX74MugtsGn8qaSqsGvvYN. Main remains 3f09f6b91a272419ba13afba2fa1731c13bc996d; apex domain was not changed. Deployment skill used existing Git integration, not the unrelated connected Vercel account or a new CI stack.

User saved the two distinct helper secrets. The real preview accepts the delivery credential: a random absent job returns delivery_unavailable 404 after authentication. Recovery initially returned generic storage_unavailable 503. Source inspection and restricted-role read-only EXPLAIN isolated missing UPDATE on email_verifications: PostgreSQL requires it for FOR UPDATE even when the final operation is DELETE. Rate-limit and challenge table checks already passed. No private data was selected.

Corrected provision.py and added a permissions regression covering all three housekeeping tables while preserving no-DELETE rights over business history. Five provision tests pass. Applied only GRANT UPDATE ON public.email_verifications TO astro_booking_app through the existing direct maintenance connection; restricted pooled EXPLAIN now passes. No migration history was modified, no schema/role/credential recreated. Normal deployed recovery then returned 200 with matching application/environment/run ID and selected=0, published=0. It runs the ordinary bounded expired-auth cleanup, not business-record deletion. Full backend suite was not rerun for this permission-only patch; hosted restricted-role execution is the decisive additional proof.

## Cloudflare

First upload accepted final helper code and both secret_text bindings but failed attaching both triggers with code 10063: account had no workers.dev subdomain. Read-only checks confirmed missing account subdomain, zero schedules, zero queue consumers. Registered neuraflowindia.workers.dev through the official Workers subdomain API. This is the required account-level namespace, not a second website or domain migration; no paid plan or website DNS change.

Redeployed the same permanent helper successfully:

- Worker: astro-advice-inquiry-delivery.
- Account: 162c1ab1ba0619c1c78d9495f3260f18.
- Version: 95335b5b-79ae-43fa-baa3-c7fa9a5994d1.
- Queue: astroadvice-by-kundan-snigh-inquiries, ID 56cea51fb5b14ba1b133cf9b2d4f9a09 (existing provider spelling retained).
- Consumer: e08cf0341f244304b6823ab326903006; batch 1, concurrency 1, wait 1000ms, retries 5, retry delay 60s.
- Schedule: */15 * * * *, created 20:42:02 UTC.
- Public workers.dev enabled=false, previews_enabled=false, independently read back.
- Build 4.85 KiB/gzip 1.89 KiB; provider reported startup 4ms.

The helper-only private key file was supplied using --secrets-file; confirmed the two bindings are secret_text, not plain variables. No database, Resend or Google credential was uploaded. Account subscription read remains forbidden under scoped operator access; usage_model=standard is not subscription proof. No billing write/card/upgrade occurred.

## Acceptance still needed

Watching actual scheduled events through Wrangler tail; registered schedule alone is not execution proof. Empty recovery validates queue-configuration format but does not prove the website's token can publish messages. User asked to complete a labelled prelaunch Contact inquiry using agency email, entering its OTP only on the website. This ordinary flow sends agency acknowledgement and client notification; no fake grant, direct business-record seed or OTP requested in chat. Verify database saving, real queue publication/consumption, both recipients and signed delivery events after that submission.

Next preserve source permission correction in same draft branch; no main merge. Private client Google login, Calendar/Meet, Razorpay checkout, proactive alerts/backups and full release/handover remain incomplete. No visual/layout changes in this slice.

### Follow-up at 20:45 UTC

Permission correction/evidence published as b9ebfe4; Vercel reports SUCCESS at GVqgjSrtAdw2TS2VxxkYUQyx7m13. Unsigned delivery and recovery requests both return 403 delivery_unauthorized; storage readiness remains 200/true with booking_enabled=false. Worktree was clean after publication. Wrangler tail session 85021 remains open for the first scheduled event; no event had arrived by 20:45:24 UTC, so actual Cron execution is not yet verified. Do not infer failure or success solely from the first boundary after schedule creation. User inquiry completion is still awaited. This final checkpoint is locally recorded after the source push.
# Follow-up: preview origin and private sign-in handoff

User confirmed saving the allowed preview origin. Published reviewed source as `4ede88c` on the existing draft PR branch. GitHub's Vercel status reports success for deployment `Fo3JN8XKdCaTVAo2HrU9ykJkgKw6`. Matching-origin POST to the stable preview `/api/admin/login/start` returned HTTP 200 with both required challenge fields present. Values/cookies were not logged. This proves the previous origin rejection is resolved, not that client Google authentication has succeeded. User must now open `/studio/calendar` and sign in as the client. Main and actual domain are unchanged. Automated Node test files and the native workerd queue/scheduled/redirect regression passed again. Timed Cron execution remains unobserved.
