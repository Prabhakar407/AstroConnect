# Email and two-workbook mirroring — 2026-09-14

## Outcome

This slice prepares two readable customer-record copies and replaces the plain transactional emails with one consistent Astro Advice presentation. It does not replace Neon: Neon remains the master record and the encrypted database archive remains the disaster-recovery copy.

## Provider inspection and changes

- The connected Drive identity was independently confirmed as the NeuraFlow account.
- A complete native-spreadsheet search plus Astro Advice/customer-record keyword searches found no spreadsheet in that account, so there was no like-for-like workbook to preserve or discuss.
- Created one permanent NeuraFlow-owned workbook inside `Client Shares/Astro Advice by Kundan Singh`. It has `Appointments` and `Inquiries` tabs, frozen/filterable headers, readable column widths, India time zone and restrained native formatting. API readback confirmed its owner, parent folder, tab names, headers, filters and dimensions.
- The client supplied an existing client-owned website workbook after checking that account. It contained only confirmed pre-launch dummy data and the user explicitly authorized replacing it. The old three-tab layout and dummy rows were removed in place, preserving the client-owned file, its permanent link and its access controls.
- The client workbook is now named `Astro Advice Customer Records — Client Copy`. Its `Appointments` and `Inquiries` tabs match the NeuraFlow copy exactly in headers, ordering, frozen/filterable first rows, column widths, tab colors, locale and India time zone. Connector readback verified both structures after the rewrite.
- The existing spreadsheet-only service account retains editor access to the client workbook and was granted editor access to the NeuraFlow workbook. Drive metadata confirms the two workbooks have different owners and the same service account can reach both destinations.
- A fresh JSON key for that exact existing service account passed local structural validation and authenticated through the production Sheet adapter. Read-only header probes succeeded for both tabs in both workbooks; no customer row was created during this proof. The key is not committed or reproduced in this evidence.
- No customer record was written during workbook setup.

Private workbook identifiers and credentials are deliberately absent from Git.

## Implemented source behaviour

- A saved inquiry creates its two email obligations and two independent Sheet-copy obligations in the same database transaction.
- A captured, accepted payment creates Calendar/customer/studio obligations and two Sheet-copy obligations. Unpaid or abandoned holds are not copied because no appointment exists yet.
- A cancellation creates a second Sheet version that updates the existing appointment row by booking reference. Retries find that permanent reference before writing, preventing ordinary duplicate rows.
- Literal-value Sheet writes prevent a customer value beginning with `=` from becoming a formula.
- One failed destination does not roll back the inquiry/payment, suppress the other destination or starve email/Calendar work. A final failure appears in the private **Needs attention** view with a targeted retry action.
- Booking readiness deliberately does not depend on Sheets; a Sheet outage must not close customer checkout.
- The service account is scoped to Google Sheets only. Workbook IDs and the JSON credential are server-only settings.

## Email presentation

The customer/studio versions of booking confirmation, cancellation and inquiry messages use an email-safe table layout with inline styles, an Astro Advice navy/cream/gold palette, restrained hierarchy, escaped customer content and an equivalent text copy. Confirmation includes amount paid, service, date/time, reference and Google Meet action. The studio receives the useful customer and birth details. Inquiry messages include the submitted topic/message; the studio version is replyable to the customer. Cancellation copy consistently says that the refund is to be done manually.

Desktop and 390-pixel mobile previews were rendered in a local Chromium browser. Booking and inquiry messages had no horizontal overflow; the first desktop review found a missing UTF-8 declaration that corrupted the rupee sign, and the corrected preview was re-inspected successfully.

## Verification boundary

- Final full isolated PostgreSQL suite: 266 tests passed. This includes the mid-write cancellation convergence regression found during the recursive review.
- A separate post-suite configuration check confirms the three private Sheet settings load from the server environment and do not appear in settings diagnostics.
- Google Sheet adapter tests cover literal append, in-place update, duplicate detection, bounded requests and safe access failures.
- Database integration covers two independent copies, repeated delivery, Meet-before-booking-copy ordering, cancellation convergence and visible missing configuration.
- Worker tests cover both Sheet kinds and the fixed official-domain handler.
- Frontend lint has no errors; its warnings are pre-existing in unrelated components. Production build succeeds with the existing bundle-size warning.
- Migration 015 was applied to the existing permanent Neon production branch. The protected operator command re-verified the restricted pooled website role, encrypted connection and transaction lock and created no customer record.
- No production Sheet write, Resend message, customer submission, payment or Google Calendar event was created in this slice.

## Encrypted-backup finding

The first scheduled GitHub backup run checked out source and installed all tools, then failed immediately with exit code 2 in the export step. In this script, that is a pre-export configuration/validation failure: a required protected value is missing or the `age` public recipient is invalid. Public metadata does not reveal which protected value failed, and the current GitHub login cannot read private logs. No successful encrypted Drive upload or restore is claimed. The checkout action is updated to its Node-24 generation; that removes the separate deprecation warning but does not pretend to fix missing backup credentials.

## Remaining release sequence

1. **Done:** the user confirmed the locally verified service-account JSON plus the two fixed workbook IDs were saved in the existing Vercel project for Production and Preview.
2. **Done:** website commit `97903a4` completed its Vercel production deployment. Official `/api/health` and `/api/ready` returned HTTP 200 with storage ready and booking enabled. The new private Sheet handler rejected an unauthenticated request and accepted the matching helper credential while rejecting a nonexistent job.
3. **Done:** Cloudflare helper version `3325666e-1e28-4ddc-a9f1-16cea188f6a7` deployed with the existing Worker, queue consumer and 15-minute schedule. The first authenticated empty recovery pass returned zero outstanding work and zero attention items.
4. **Done:** four bounded jobs copied one existing paid-and-cancelled prelaunch appointment and one existing prelaunch inquiry to both permanent workbooks. Neon recorded all four as sent, and bounded live reads found one matching appointment row and one matching inquiry row in each workbook. Replaying the same jobs created no duplicate rows.
5. **Recovery proof:** the first website-originated publication timed out and truthfully returned unavailable while all four SQL jobs stayed pending. Direct queue publication isolated and proved the Worker/Sheet path. A second duplicate-safe Sheet job then published through the website itself, was consumed and completed; its target workbook still had one appointment row. This proves the Vercel queue token is valid and the earlier result was transient, not a configuration failure.
6. **Cleanup:** the downloaded service-account JSON was removed from the local workspace after hosted proof. Its protected Vercel copy and provider-side key remain intentionally active.
7. **Remaining:** inspect one genuinely new redesigned transactional message in the receiving inbox without resending an old customer notification. Repair the three GitHub backup secrets, run the workflow, verify the encrypted Drive files and perform the documented isolated restore proof.
