# Appointments and public-page refinement evidence

Date: 2026-09-13

This record covers the studio appointments list, calendar booking markers, manual-refund wording, service-to-booking links, service-page compaction, Vastu elements, testimonial copy and richer booking delivery details. It contains no customer record, secret, provider identifier or meeting URL.

## Behaviour delivered

- The authenticated studio page opens on **Appointments**, with separate Upcoming, Past and Cancelled views. Each expandable booking shows date/time, customer contact, consultation, amount/payment state, Prashna quantity when applicable, birth details, notes, Calendar/Meet state and safe booking/payment references.
- A confirmed appointment can be marked cancelled after the phone call. The page says exactly **“Refund to be done manually.”** The action moves no money and exposes no invented refund status.
- Calendar dates show a gold confirmed-booking count. Availability controls remain separate and still refuse ranges containing a booking or payment in progress.
- Generic booking entry points require the visitor to choose a consultation. Links from all six service contexts preselect the matching service. Every service detail contains at least three matching booking links.
- Service-detail opening artwork is contained against solid navy without the previous full-width haze. The All Services introduction, index and chapters are shorter; the approximately 70% landscape reading frame remains. The Vastu elements use three cards over two centred cards on desktop and a separate two-column mobile layout.
- Testimonials contain finished client-authorized provisional stories and reviews without “sample”, “illustrative” or approval metadata, aggregate ratings, numerical outcome claims or guarantees.
- Customer confirmation contains the paid amount and Prashna quantity. The studio message and Google event contain the operational customer, service, payment, question and consultation details requested for preparation. Customer messages do not expose the studio-only notes.

No database migration was needed: the existing production schema already stores every field required by these views and messages.

## Automated proof

- Backend: **258 tests passed**, including authenticated appointment list/history, calendar day counts, safe pagination, cancellation wording, complete studio notification content and enriched Google event content.
- Frontend/domain helpers: four JavaScript test suites passed.
- Customer booking browser regression: 1440×900, 2560×1440 and 390×844 passed; five synthetic submission outcomes per viewport, no page errors and no control overflow.
- Private studio browser regression: 1440×900, 2560×1440 and 390×844 passed through sign-in, appointments, booking detail, booking-date marker, closure conflict/success/reopen, phone cancellation, unavailable-calendar handling and sign-out. All five authenticated writes per viewport carried the expected protection token; no page errors.
- Public-page browser regression: 1366×768, 2560×1440 and 390×844 passed across All Services, all six service details, the three Lal Kitaab tabs, Vastu elements, testimonials and generic/service-specific booking entry. It asserted three matching booking links per service, no forbidden testimonial labels, no page errors and no horizontal overflow.
- Production build passed. Lint passed with no errors; its warnings are existing unused imports/hooks in older page code and are not introduced runtime failures.
- `git diff --check` passed. The final source scan found no testimonial occurrence of `sample`, `illustrative` or `awaiting approval`.

## Visual review

Representative full-page and viewport captures were inspected at the sizes above. The review found and corrected delayed screenshot timing before judging motion-based sections. Stationary results show:

- compact, aligned service rows at laptop and 2560px desktop widths;
- independently stacked mobile service content with loaded artwork and full footer;
- clean, compact service openings with no blurred backdrop;
- balanced Vastu 3+2 and mobile arrangements;
- a readable four-part testimonials narrative on desktop and mobile;
- a compact private appointment record on desktop and a usable single-column record on mobile.

The local browser runs use synthetic records and responses. Existing provider/database tests and the previously recorded official Live payment journey remain the authority for payment, Calendar, Meet and delivery integration.

## Release/readback boundary

This record travels with the reviewed source revision authorized for the existing `main`/Vercel production path. After publication, official-domain readback must confirm `/api/ready`, the public pages and authentication refusal on the private appointment endpoint. A public readback cannot prove an authenticated studio session; that behaviour is covered by the synthetic browser journey and backend authorization tests without exposing client access.
