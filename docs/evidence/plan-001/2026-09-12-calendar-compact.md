# Calendar connection milestone and compact private page

The user supplied screenshots showing the actual client Calendar connection and successful Calendar/Meet capability check. This proves the consent/token refresh/calendar-read flow through the deployed site; it does not prove event creation, invitations, cancellation delivery or paid checkout.

## Requested refinement

- Removed the standalone Google explanation box and expanded calendar details.
- Connection buttons now share the Studio navigation toolbar on landscape; mobile wraps into a compact two-button group.
- Action feedback remains only after connection/check requests; errors still explain actual failures. No backend permission or authentication changes.
- Landscape body size reduced exactly 15% (18 → 15.3px; 22 → 18.7px on large desktop), with proportionate headings, tighter panels/gaps and a narrower centered content width. Small labels keep a readable floor; mobile keeps its 17px body, 16px form inputs and 44px touch targets.
- Existing private inquiry layout inherits the smaller scale; marketing header/footer remain unchanged.

## Verification

- Production build and targeted frontend lint passed; existing Vite bundle-size warning remains.
- Synthetic browser checks at 1366x768, 2560x1440 and 390x844: connection action, rejected invalid redirect, capability success, revoked permission error, responsive toolbar, ten-slot agenda and no horizontal overflow/application exceptions.
- Private inquiry checks passed at all three sizes: safe rendering, details, seen state, paging, empty/error recovery, logout and stale response handling.
- Screenshots inspected in /tmp/astro-calendar-compact and /tmp/astro-calendar-compact-inquiries. Browser mocks do not obtain real Google consent, modify client availability or send email.

## Integration continuation

- Existing Cloudflare OAuth account verified as the approved agency account; no additional scopes requested.
- Production delivery credential verified against a random nonexistent job (404 delivery_unavailable after authentication; no job created). Normal production recovery returned 200, selected=0/published=0.
- Same Worker deployed with official ASTRO_API_ORIGIN and matching existing secrets. Version 31a38928-36ad-4db0-b1bf-6068b4592e0a; retained */15 schedule and existing queue consumer. No duplicate worker/queue, message or invitation created. Scheduled invocation after this switch is not yet observed.
- Fifteen helper tests and native workerd delivery/scheduled/redirect regression passed. Older moderation harness needed a Google status-read fixture (it incorrectly treated that newer GET as a mutation); corrected test then passed all three viewports with five CSRF-checked synthetic writes each.
- Source e9c5ec39212560b90c683cefd5a56bfdfc83ae89 published in PR 2. Deployment verification pending.
- Final release: PR 2 merged as 1eedc74c701a14f8380872798e87e0789d94bdaa. Preview AG9Z25htoTiSGbiVzAk3vTBaMQxW and production A4ea591or9p5wA8Y5GTACULaPV8G succeeded. Official-domain connection UI harness passed all three sizes with synthetic responses; production screenshots inspected in /tmp/astro-calendar-compact-production. Actual readiness returned storage_ready=true/booking_enabled=false. This is deployed-UI proof, not a second live Google consent/check or provider-log audit.
- Apex Resend endpoint rejects unsigned updates with 400 invalid_signature, as intended. Account-only endpoint URL edit remains pending; no API/signing-secret replacement required.

## Next account step

User subsequently confirmed the existing Resend webhook URL edit DONE. Independent follow-up returned apex readiness HTTP 200/storage_ready=true/booking_enabled=false and unsigned Resend callback HTTP 400/invalid_signature. No email or booking created; a fresh signed provider event at the apex is still unproved. The earlier pending URL-edit note is superseded.

Continue durable booking meetings and Razorpay integration from Plan 1. Establish whether the client's own merchant account already exists under the agency's Partner dashboard before giving account-specific connection instructions. No completed paid-booking claim, and no merchant activation dependency on ordinary local implementation.
