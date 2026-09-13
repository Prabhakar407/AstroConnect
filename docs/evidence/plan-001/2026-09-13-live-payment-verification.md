# Live payment verification — 2026-09-13

This record contains operational facts only. It deliberately excludes customer identity, contact details, verification codes, provider identifiers, secrets and the Google Meet URL.

## Authorized window

- The user explicitly authorized a one-hour production verification with every service unit temporarily priced at ₹1 and one real payment.
- Commit `6aa5783` placed the shared catalogue at ₹1 and was published to `main` only after the client merchant's Live API keys, Live webhook secret/events and automatic capture were configured in Vercel Production and Razorpay.
- The official readiness and six server quotes passed at 2026-09-13 11:44 UTC (17:14 IST). This began the temporary-price window.

## Real booking and payment proof

- One Vedic Astrology booking was created at 100 paise through the official website after email verification.
- The server saved the order as `live` and the provider order reached `ready`; no Test key or Test order was used.
- One 100-paise INR payment was saved with disposition `accepted`.
- The independent provider observation reported `captured`, exact amount 100 paise, INR, zero refunded and disposition `accepted`.
- Signed Live webhook events `payment.authorized`, `payment.captured` and `order.paid` were each processed in one attempt with no error.
- The booking reached `confirmed`. The Google Calendar operation reached `ready`, and a Google Meet URL was saved.
- Calendar, customer-confirmation and client-confirmation operations each completed in one attempt with no error.
- Resend signed events recorded both customer and client messages as `email.sent` and `email.delivered`. This proves delivery to the receiving mail servers; it does not claim inbox placement.

## Price restoration and public checks

- Commit `948d97b` restored the permanent catalogue and was published to `main` after the captured-payment proof.
- Vercel completed the matching production deployment before the one-hour deadline.
- Official readiness remained `storage_ready: true` and `booking_enabled: true`.
- The official `/api/services` response restored: Vedic Astrology ₹2,100; General Numerology ₹3,100; Vastu Consultation ₹5,100; Laal Kitaab Remedies ₹1,100; Prashna Kundali ₹1,100 per question; Name Change Consultation ₹5,100. A ten-question Prashna quote returned ₹11,000 and 30 minutes.
- Read-only official-domain journeys passed at 1440×900, 2560×1440, 1366×650 and 390×844 with no API writes, horizontal overflow or browser errors. Quote and availability failure recovery retained form state.
- Stationary 1440×900 and 2560×1440 captures showed the permanent prices and a fully visible form. A dim intermediate frame in the scroll-through harness was confirmed as capture timing during motion, not a stationary customer-page defect.

## Cancellation cleanup proof

- The authorized studio user marked the paid test appointment cancelled from the private calendar after the agreed phone-cancellation step. This cleanup occurred after the temporary-price release had already been restored; it did not extend the ₹1 public window.
- The booking reached `cancelled`, its slot claim was removed, the Google Calendar record reached `cancelled`, and the stored Meet URL was removed.
- Calendar, customer-cancellation and client-cancellation operations each completed in one attempt with no error.
- Signed Resend events recorded both cancellation messages as `email.sent` and `email.delivered` to their receiving mail servers.
- The accepted ₹1 payment remained saved with provider status `captured`, zero refunded and no refund webhook event. The website made no automatic-refund claim.

## Final conclusion

The controlled Live journey proved the official customer path from email verification through exact server-priced Razorpay order, captured real payment, signed payment notifications, booking confirmation, Calendar and Meet creation, both participant messages, private phone-agreed cancellation, slot release, Calendar/Meet cleanup and both cancellation messages. Permanent prices were restored within the authorized hour and remained present in the final official readiness and service checks.
