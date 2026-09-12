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

## Next integration work

Finish moving the existing inquiry helper and Resend webhook to the official domain, preserving the same credentials, queue and signing secret. Then continue durable booking meetings and Razorpay integration from Plan 1; no completed paid-booking claim.
