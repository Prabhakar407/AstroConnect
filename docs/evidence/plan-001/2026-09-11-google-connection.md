# Calendar connection implementation — 2026-09-11

## Accepted input

User confirms Google private-calendar sign-in succeeded after registering the preview origin. Treat that as user-observed acceptance; do not request the same sign-in again. It does not grant Calendar access.

## Implemented

- Focused Google provider module using existing httpx: offline code/refresh exchange, PKCE, fixed HTTPS destinations, bounded bodies/timeouts, no automatic redirects/retries, safe error codes. No new dependencies.
- Six catalogue-derived service titles, exactly 30 minutes in IST, deterministic valid event/conference IDs, private event body with no birth information. Event insert requests Google invitations and conferences; GET supports reconciliation, DELETE requests cancellation notices. These provider operations are **not yet wired to paid booking jobs**.
- Separate client-only POST start, backend GET callback, private saved-connection status and authenticated POST capability check. Existing Strict login cookies/CSRF remain unchanged; callback has separate Secure/HttpOnly/Lax browser cookie and one-use state tied to original live session, Google nonce and pinned subject. New authorization replaces older in-flight state.
- Migration 008 stores encrypted refresh token plus expiring authorization records. Shared advisory lock serializes connect/reconnect/refresh; callback locks its original session so logout cannot race connection commit. Restricted runtime privileges cover those locks. Do not change applied migrations 001–007.
- Refresh responses without replacement refresh token preserve the existing ciphertext; failed/rejected reconnection preserves the saved connection. Key loss requires reconnection, not silently accepting invalid ciphertext.
- Uses the studio's primary calendar, `astroadvicebyks@gmail.com`; no new calendar, personal busy import or two-way synchronization. Permission requests are events on owned calendars and calendar metadata, plus identity. UI explains Google's permission breadth versus the application's chosen calendar.
- Small connection panel in existing private calendar, connect/reconnect plus explicit check. Successful capability check is not represented as proof that an actual meeting has been created/joined.

## Verification

- Final full local suite: **199 tests passed, zero skips**, including authorization and grant-manifest regression. Focused UI lint also passed.
- Synthetic browser checks passed at 1366x768, 2560x1440 and 390x844: connected state, invalid authorization destination rejected, capability check, revoked access message/reconnection availability, CSRF, no JS errors or horizontal overflow.
- Screenshots `/tmp/astro-google-connection/{laptop,desktop,mobile}.png` inspected. First panel was too verbose; moved permission explanation into a disclosure and shortened success text, then reran screenshots/checks. No public marketing-page redesign.
- Frontend production build passes with existing chunk-size warning. No real Google tokens, events, invitations or payments used in tests.
- Local Vite file watching served a stale transform after the simplification; restarted with polling and added a browser assertion for the final collapsed explanation. All three viewport checks then passed on the actual revised source and screenshots were retaken.
- Permanent encryption key generated/reused in owner-only `/home/anan/.local/share/astro-advice-by-kundan-singh/google-calendar.env`; only its value copied to Windows clipboard. No secret in source, chat, logs or screenshots. Next user action is Vercel Preview/Production Secret `ASTRO_GOOGLE_TOKEN_KEY`; type the name so copying it does not replace the clipboard value. Source and migration remain local until that configuration is saved.

## Account handoff and next execution

**Publication complete:** commit `fe22e74`, existing branch `design/page-by-page`, Vercel deployment `HeAnYqs3zCs9LJA5jQ6A66dUYXJP` reports success. Stable preview live checks: readiness 200 with storage_ready=true/booking_enabled=false; Google status 401 without authenticated client; callback 400 without valid state. These prove deployed routes and database readiness, not real authorization or the saved encryption/client secret values. No production-domain promotion. Next Google-account batch: API enablement, exact authorized redirect URI, and Audience publishing status. Previous local-only wording describes pre-publication verification.

User confirms encryption secret and existing Google client secret environment coverage saved. Migration 008 and manifest permissions have now been applied to the validated existing direct Neon endpoint using the existing operator file. Provision verification passed: migrations, restricted runtime role, encrypted pooled access and transaction lock. No business records or credentials were replaced. The 37 focused provider/connection/provision tests passed again before publication. Google callback registration, API enablement, Audience status and real Calendar consent remain user-account steps.

1. Vercel server secret `ASTRO_GOOGLE_TOKEN_KEY` must be saved for Preview and Production; operator retains the same generated key privately outside Git. Existing ASTRO_GOOGLE_CLIENT_SECRET must also cover Preview, not just Production. No key values in docs/chat.
2. Enable Google Calendar API in the existing project if not already enabled. Add exact authorized redirect URI to the **existing** web client:
   `https://astrologer-website-kundan-singh-git-design-p-8bfe8c-neura-flow1.vercel.app/api/admin/google/callback`
   This is a backend callback, NOT a HashRouter URL or JavaScript origin.
3. Confirm the Google app's Audience publishing status. Applicable external Testing authorizations expire after seven days; that is not the sustained connection requirement. Review existing production/verification state before guiding a change. Do not declare a private commercial studio app exempt from verification without checking its actual category. Never add billing/card or buy Workspace.
4. After secret is saved: apply tested migration 008 to the approved existing Neon database through validated direct maintenance connection/provision manifest; publish reviewed source to existing draft PR branch, not main. Check exact Vercel commit/status, login route and authenticated Google status. User authorizes the new Calendar connection; actual token refresh/calendar capability check follows.
5. Next implementation: durable paid-booking/event dispatch and cancellation races, then approved real meeting/invitation/join proof and Razorpay integration. Deterministic provider IDs alone are not an end-to-end duplicate-prevention proof; caller must persist references before sending and reconcile ambiguous success. Paid booking remains incomplete.

## Sources checked

- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/calendar/api/auth
- https://developers.google.com/workspace/calendar/api/v3/reference/calendars/get
- https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
- https://support.google.com/cloud/answer/15549945
- https://support.google.com/cloud/answer/13464323

Platform access logs may contain OAuth callback query strings even though the application never logs them. Restrict provider-log access/retention; short-lived one-use code/state do not constitute full platform log redaction. No hosted callback proof yet.
