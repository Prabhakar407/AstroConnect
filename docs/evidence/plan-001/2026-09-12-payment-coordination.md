# Payment coordination continuation — 2026-09-12

## Implemented locally

- Migration 009: payment_orders and minimal payment_observations, runtime table grants declared. Optional internal payment-key argument to Store.hold saves order intent, verification consumption and slot claim in the same transaction.
- PaymentCheckout: freeze key/mode/receipt/fee; commit attempted marker before remote creation; concurrent retry cannot repeat creation. Receipt lookup is bounded to two pages and never treats zero/incomplete/multiple matches as permission to create another order. Direct fetch before binding recovered order. Provider calls remain outside schedule locks.
- Shared finalizer commits observation, accepted payment, booking state and existing delivery intent together. It retains late/extra/mismatched/refunded payment problems, preserves previously confirmed bookings, refuses wrong-order observations and prevents stale capture from overriding review. Ledger IDs include key ID to distinguish accounts/modes.
- Migration 010: signed-event inbox, deduplicated by key/event ID; only IDs/type/body digest are retained, not customer provider payloads. Account binding requires ASTRO_RAZORPAY_ACCOUNT_ID; authentication requires separate ASTRO_RAZORPAY_WEBHOOK_SECRET. Original bytes verified before parsing/storage.
- `/api/webhooks/razorpay` persists first, then awaits one bounded provider fetch and finalization. Missing-order events remain saved. Due events retry through the existing authenticated scheduled inquiry recovery handler with one additional fetch at most; no new Worker/queue/project or changed response contract. Twelve attempts cap event retries; failures remain retained. Disputes enqueue attention without changing appointment schedule.

## Review and verification

Focused local transaction/event tests cover rollback of hold/verification/order intent, lost order responses, no repeat creation, empty lookup, duplicate/concurrent capture, atomic rollback on delivery-intent failure, reassigned slot, stale provider status, refund review, account mismatch, invalid signatures, wrong account, event replay/conflict, absent binding recovery, provider failure and authenticated scheduled processing.

Review fixed dispute-driven confirmation and restored existing recovery response shape after a full-suite assertion exposed an unnecessary response field. A new test initially used a too-short synthetic recovery credential; corrected the fixture, not the existing minimum-secret requirement.

All database tests use the existing isolated astro_booking_test fixture; no real orders, emails, hosted migration or release. No UI changes, so no new visual proof claimed.

Full regression passed 231 tests in 19.521 seconds after recovery isolation: inquiry queue failure still allows the payment recovery attempt. Existing Starlette/httpx deprecation warning remains. Final receipt-status review also included payment_observations, so refunded/mismatched money cannot be shown as not received merely because it has no accepted legacy payment row. Targeted checkout/receipt contract tests rerun after that correction. Account secrets and provider IDs are not returned in receipt summaries.

## Remaining boundaries

Client MID requested asynchronously; do not ask for keys in chat. User must save account binding and separate webhook secret before real provider acceptance can be verified. Normalize a dashboard MID into Razorpay's actual account_id format only with verified evidence, not guessed provider identity. Existing stored Vercel Test Mode pair is user-confirmed, not independently authenticated.

Public checkout and booking-email verification remain closed because those flows are unfinished, not because of a new feature toggle. Customer UI/status, verified cross-device recovery, attention views, short-delay independent order/payment reconciliation, Meet dispatch, email delivery and hosted end-to-end proof are still required. Current 15-minute event rescue is not proof of prompt checkout recovery and does not recover an absent notification or uncertain order without further wiring. Do not deploy this as a completed booking system. New migrations must be applied with reviewed runtime privileges before source release.
