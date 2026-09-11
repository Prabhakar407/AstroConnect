# Permanent inquiry helper deployment

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
