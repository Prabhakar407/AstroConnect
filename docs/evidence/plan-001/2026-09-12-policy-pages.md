# Permanent policy pages and official-domain publication

## Authority and scope

On 2026-09-12 the user explicitly requested moving existing footer popovers to real pages and publishing the reviewed website to the official domain. This authorizes the existing PR/main release; it does not enable unfinished paid checkout or authorize real payments. No replacement project or temporary policy domain.

## Implementation

- Reused existing policy content in LegalPage; removed unused LegalModal. Existing refund amounts/windows retained, including manual phone handling. The existing policy leaves cancellation refunds between 12 and 24 hours unspecified; obtain client clarification before completing payment/refund acceptance. No new commercial term was invented.
- Corrected Redis/Zoom references and incorrect refund helpline; clarified necessary processing by service providers and Google account/calendar access, use, storage, sharing and revocation. This is a technical disclosure update, not a legal compliance certification.
- Permanent paths: /privacy-policy, /terms-and-conditions, /refund-policy. Shared header/footer, restrained existing palette and readable mobile layout.
- BrowserRouter uses existing Vercel SPA rewrite. Startup normalizes old same-origin hash routes, retaining Google-return query parameters. Backend callback can keep its compatible return link; no OAuth endpoint or API rewrite changed.
- Footer remains glowing gold after changing controls from buttons to links.

## Checks

- Production Vite build passes; pre-existing large-chunk warning remains.
- Targeted lint: no errors; four existing unused footer image imports remain.
- Browser harness tests all three policies at 1440x900, 2560x1440 and 390x844: direct HTTP 200, refresh, titles, no overflow, footer links, browser back, legacy Contact/private-calendar links, disabled unfinished checkout and no application exceptions.
- Screenshots captured and inspected outside Git at /tmp/astro-policy-pages. Footer scroll animation must be revealed before full-page captures.
- Source and hosted evidence are separate; publication outcome recorded below after verification.

## Remaining integration work

After official release verify apex /api/ready, private authentication boundaries, policy routes and actual rendered content. Existing Cloudflare helper and Resend webhook still point to the stable branch deployment; keep that deployment/branch intact until both permanent targets are moved and checked. Google Branding needs final public URLs and final callback registration; Calendar authorization/capability check, durable booking meetings and Razorpay remain unfinished.
