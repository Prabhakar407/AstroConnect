# Plan 1 official release evidence

Date: 2026-09-13

This record covers the reviewed completion candidate's production schema, GitHub/Vercel release, official-domain readback and matching Cloudflare recovery helper. It does not claim a Razorpay Test Mode transaction, a newly created Google Meet event, inbox delivery, Live Mode or a real charge.

## Released source

- Pull request: `https://github.com/Prabhakar407/AstroConnect/pull/5`.
- The reviewed completion candidate and hosted-state correction were merged into `main`.
- GitHub reported the pull request mergeable with both Vercel checks successful and no required review decision.
- The official Vercel production deployment succeeded.

The hosted-state correction preserves the booking-enabled result after a date's availability loads. The completed preview and official-domain browser regression explicitly fail if the false configuration banner returns.

## Production database

- The existing production Neon database was retained; no duplicate project or interim database was created.
- The prepared temporary branch was compared with production, then migrations 012–014 were applied through Neon's completion workflow. Neon deleted the temporary branch afterward.
- Production readback returned true for the three exact migration records, `booking_calendar_events`, `payment_cases`, the payment reconciliation column and the two reviewed runtime permission sets.
- No booking, inquiry, payment, message or Calendar event was created by this migration.

## Official-domain readback

`https://astroadvicebykundansingh.com` returned:

- `/api/health`: HTTP 200 and `status=online`.
- `/api/ready`: HTTP 200, `storage_ready=true`, `booking_enabled=true`.
- `/api/services`: six services, all 30 minutes; General Numerology ₹3,100, Prashna ₹1,100 per question and Name Change ₹5,100.
- `/api/booking-policy`: 10-day horizon, Monday–Saturday slot grid, 30-minute duration and the client cancellation phone.
- `/api/admin/session` without a client session: HTTP 401.
- `/api/webhooks/razorpay` without a signature: HTTP 400 `invalid_signature`.
- `/api/webhooks/resend` without a signature: HTTP 400 `invalid_signature`.

The deliberately unsigned callback checks are refusal tests. They generated no provider message and no accepted event.

## Hosted browser proof

The actual official website and database policy/availability/quote reads passed at:

- 1440×900;
- 2560×1440;
- 1366×650;
- 390×844.

Each run ignored the deliberately wrong device clock, calculated ten Prashna questions as ₹11,000, recovered from simulated availability and fee-read failures, retained the entered name, produced no page error and sent zero non-GET API requests. The 2560×1440 screenshot was manually inspected after release; the false configuration banner was absent and the layout remained centered and readable.

## Cloudflare recovery helper

- The existing inquiry-delivery Worker is active on the matching released version.
- Fixed destination: `https://astroadvicebykundansingh.com`.
- The existing private inquiry queue was retained.
- Schedule: every 15 minutes.
- Public Worker routes and preview URLs remain disabled.
- Hidden delivery/recovery credentials were not printed or added to source.

The first observed scheduled event on this version finished with `outcome=ok`, no exception and the expected `inquiry_recovery_checked` log. This proves the matching scheduled recovery executes after release. Independent Cloudflare email alert configuration remains an account-side handoff item.

## Next proof boundary

The client merchant still needs its Test Mode webhook enabled at the official `/api/webhooks/razorpay` route with the already-matching website secret, alert email and subscribed payment/order/refund/dispute events. After that, one complete Test Mode journey must prove OTP, checkout, capture verification, refresh recovery, one Calendar event and Meet link, both participant messages, phone cancellation and private exception handling. Only provider/account evidence can close that boundary.
