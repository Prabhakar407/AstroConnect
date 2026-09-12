# Razorpay provider foundation — 2026-09-12

User confirms Test Mode keys saved in existing Vercel project. This is user-reported configuration, not independently authenticated provider proof.

Implemented `src/backend/razorpay.py` using existing httpx dependency: fixed HTTPS endpoint, HTTP Basic credentials, no redirects/retries, bounded responses and timeout, redacted error codes. Order receipts are UUID-based and mode-distinct, below 40 characters. Create payload includes only integer INR paise, receipt and partial_payment=false. Ambiguous writes/malformed success remain uncertain; caller must reconcile, not repeat creation. Paginated receipt lookup exposes one bounded page and makes no uniqueness assumption. Checkout verification uses the stored order identifier and constant-time HMAC; raw-byte verifier also supports future webhook use. Capture matching requires exact payment/order/amount/currency and no refund. No automatic capture or refunds.

Settings now read the two agreed server-only environment names with hidden repr. No new dependency or public route. No database writes, UI changes, provider calls, payment activation or publication in this slice.

Verification: 10 focused payment tests pass; combined Razorpay/Google provider suite 25 passes. Cases cover malformed data, redirects, oversized response, credentials, timeouts without retries, signatures, wrong order/amount/currency, authorization-only/refunded payments, integer type safety and identifier injection. Initial broader sandbox run interrupted after no result; separate local-database regression result recorded below when available.

Full regression: all 209 backend tests passed in 17.385 seconds with access to the existing local `astro_booking_test` database. No hosted database used. Existing Starlette/httpx deprecation warning remains; no dependency change made in this slice.

Remaining: durable order intent and binding, saved merchant/mode association, deduplicated webhook inbox, common transaction finalizer, receipt-protected customer checkout/status, independent payment reconciliation, paid booking-to-Meet/email work, actual provider proof and visual verification of changed UI. Provider adapter tests do not prove those flows. No user action needed for ordinary local implementation; webhook secret/registration comes when the handler is ready.
