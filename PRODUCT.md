# AstroAdvice product context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

The website presents Astroadvice by Kundan Singh, explains the consultations, and leads visitors to service details, inquiries and appointment booking. The designer is reviewing it page by page before a future colleague pull request.

## Capabilities and Constraints

- [Plan 1](docs/PLAN-001-booking-inquiries-and-client-calendar.md) is the authoritative end-to-end execution/resume checklist for booking, inquiries and the private calendar. Start there after a context reset; supporting documents retain their dated evidence/history.
- The [2026-09-10 local preparation checkpoint](docs/evidence/plan-001/2026-09-10-local-preparation.md) records notice/clock/closure safeguards, same-origin/native Python preparation and fresh tests. No visual redesign, hosted activation or completed payment journey is implied.
- The website is pre-handover. The user confirmed on 2026-09-09 that all existing bookings and inquiries are dummy data. No live-customer migration is needed; keep dummy records out of the eventual production booking store. Old external stores are not authorized for deletion by this clarification.
- Hosting alignment, 2026-09-10: no booking feature may require Pro while the website runs on either Vercel plan. Recommend retaining React/Vite/FastAPI on Hobby-capable hosting with a small Cloudflare Free queue/schedule helper. No duplicate website, main runtime port or Vercel-outage continuity requirement. All [provider/usage gates](docs/PLAN-001-no-card-hosting-review.md) remain to prove; records/security/backup requirements are unchanged.
- Preserve `astroadvicebykundansingh.com`. The client decides Pro timing; it is not a technical booking activation gate. Other providers stay direct no-card Free within limits, without paid bundles/trials/automatic upgrades. Vercel execution uses hosting allowances and Pro can meter excess usage: no unlimited zero-cost promise or purchase authority. Client ownership/delegated access is confirmed; actual account/source configuration remains unverified.
- Six public services: Vedic Astrology, General Numerology, Vastu Consultation, Laal Kitaab Remedies, Prashna Kundali, and Name Change Consultation.
- Designer-confirmed changes: General Numerology costs ₹3,100; Prashna Kundali costs ₹1,100 per question; Laal Kitaab stays ₹1,100.
- Name Change Consultation costs ₹5,100 (designer confirmed 2026-09-09). Public pages and its booking choice share that displayed price.
- Hide consultation durations on marketing pages. The user approved [BOOKING_ROADMAP.md](BOOKING_ROADMAP.md). The shared price catalogue, protected 30-minute slot engine, inquiry/verification repairs and private calendar are implemented and locally tested. Real hosting, Google sign-in/Calendar/Meet, notification delivery and Razorpay checkout are not yet live-verified. Public checkout remains disabled until the payment flow is implemented. See [BOOKING_FOUNDATION_REVIEW.md](BOOKING_FOUNDATION_REVIEW.md) for the exact boundary.
- Preserve existing detail destinations and existing functionality. Name Change needs its own information destination.

## Brand Commitments

Preserve the established navy, gold and beige identity, artwork and approved typography. Structural changes require discussion, except the Services page whose fuller vertical revamp and choice of direction are explicitly delegated. About needs only compact card refinements. Prioritize adaptive landscape layouts and review mobile independently.

## Evidence on Hand

Existing site copy and local service artwork are in src/Component and src/assets/images. They are inherited material, not independent validation of outcomes, testimonials or qualifications. Do not invent success stories, guarantees, accreditation or unapproved prices.

## Product Principles

- Plain, concise and visually led explanations.
- Useful content rather than decorative metadata or extra playback controls.
- Working, visible actions without requiring hover.
- Screenshot review across laptop, large desktop and phone before handoff.
- Never describe an inquiry as saved before storage accepts it, an email as delivered merely because it was queued, or an appointment as paid/confirmed merely because email verification succeeded.
