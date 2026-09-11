# PR 1 — Website refinements and booking/inquiry foundation

## Scope

Publishes the accumulated page-by-page refinements and the locally verified booking/inquiry foundation from design/page-by-page to a review branch in Prabhakar407/AstroConnect. This is a review checkpoint, not authorization to merge or release the completed booking system.

- Retain approved homepage, About, services, testimonials, contact, shared navigation and footer refinements, with separate responsive layouts.
- Align all six services, Name Change Consultation, General Numerology and Prashna question pricing.
- Replace the inherited backend implementation with bounded PostgreSQL-backed booking rules, verification, inquiry storage/delivery and private calendar foundations.
- Add private inquiry follow-up and signed email observations, plus the Cloudflare inquiry delivery/recovery helper source.
- Include numbered Plan 1, migrations 001–007, setup documentation and reproducible tests.

## Verification and limits

The previous implementation checkpoint passed 165 Python tests and synthetic browser checks at laptop, 2560×1440 desktop and mobile sizes; screenshots were reviewed and long-location wrapping fixed. Permanent Neon 001–007 and restricted pooled access were verified without creating customer records. Publication preparation reruns build and JavaScript tests and checks selected source for common credential patterns. These checks are not a guarantee that no defect exists.

The existing main JavaScript bundle remains above Vite's advisory size threshold. Earlier backend history may contain exposed credentials: their owner-side rotation remains necessary; excluding the local archived copy does not revoke historical secrets.

No completed checkout is claimed. Google Calendar/Meet, Razorpay, backups, independent alerts, real login/email, hosted route checks and complete operational acceptance remain unfinished. Keep the PR in draft until the intended hosting review is complete. Do not merge merely because local checks pass.

## Publication boundaries

Connected account neuraflowindia now has WRITE access, verified 2026-09-11. origin/main matched the original local base before publication. Publish only design/page-by-page and open a draft PR against main; do not force push, merge, alter the production branch or call Vercel deployment commands. Git integration may independently create a branch preview. That is not the production website or proof of backend readiness. Do not submit forms or invoke real providers on any preview without the required configuration/recipient review.

Local archives, credentials, generated screenshots, dependencies and build outputs are excluded from the commit. Existing design metadata and the scoped surface brief are retained. No local artifacts are deleted.
