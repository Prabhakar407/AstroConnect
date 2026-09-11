# Public preview: inquiry connection check

User authorized public previews and reports Vercel Authentication disabled. The stable branch domain `astrologer-website-kundan-singh-git-design-p-8bfe8c-neura-flow1.vercel.app` now serves API JSON directly. The older user-supplied `kvvgyzm2l` URL returns platform 404; do not use that obsolete address.

## Independently observed

- GET health: 200, online, booking_enabled false.
- GET ready: 200, storage_ready true, booking_enabled false. Hosted database/schema connection is confirmed, not merely user-reported.
- GET admin/session: 401, sign-in required. Public previews do not remove application authentication. Google configuration exists; actual client Google login is not proved.
- Name-change quote: INR 510000 paise, 30 minutes. Three Prashna questions: INR 330000 paise, 30 minutes.
- Contact page renders; `/tmp/astro-hosted-contact.png` captured and visually inspected. No design edits. Hosted asset metadata identifies commit 8b4a4d2 and deployment dpl_8kCgdiRXbohat2ZBQTq3QXaVGyEs.
- Hosted API helper's compiled default environment contains neither VITE_API_MODE nor VITE_API_URL. Its default explicit mode therefore blocks forms before a server request.
- Unsigned delivery/recovery probes with inert UUIDs return configuration 503 before store/provider work; the corresponding internal secrets are missing or too short. Unsigned Resend webhook probe returns missing-signing-secret 503 before any event storage. No sends, challenges, inquiries, recovery jobs or business records created.

## Correction and verification

Set Vercel's source-controlled buildCommand to `VITE_API_MODE=same-origin VITE_API_URL= npm run build`. This permanently connects same-project public/private forms to relative /api paths and neutralizes a legacy external base in that hosted build. It does not expose server credentials, change the standalone local preview default, or introduce a feature-enable switch. Added hosting regression assertion. Four Python hosting tests and all 23 JavaScript tests pass; the exact build command passes (existing large-chunk warning remains). Publish only the existing draft PR branch, then inspect the resulting hosted asset and form request without a real email send.

## Remaining provider setup

ASTRO_DELIVERY_SECRET and ASTRO_RECOVERY_SECRET must be separate secure values shared with the permanent Cloudflare helper. ASTRO_RESEND_WEBHOOK_SECRET must come from the actual Resend webhook configuration, not a locally invented value. Resend key/sender/OTP availability have not yet been proved by a real send. The worker still targets apex where the new API is not published; use an explicitly configured stable preview target for prelaunch verification before deployment, retaining final apex behavior for release. Actual sender/recipient approval, signed callbacks, scheduled recovery and client Google login remain pending. No main merge or live-domain publication authorized.
