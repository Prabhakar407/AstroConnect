# Private inquiry follow-up — implementation brief

Recorded 2026-09-11. This is a scoped implementation record for the existing private studio page, not a new global design system. [Plan 1](../../PLAN-001-booking-inquiries-and-client-calendar.md) owns programme status; [C07 and C08](../../PLAN-001-implementation-contracts.md#c07--inquiries-and-notifications-have-clear-destinations) define the intended operational behaviour.

## Overview

The purpose is simple private inquiry follow-up: find a saved request, read it, understand its email status and contact the customer. It is not an analytics dashboard, sales pipeline or new customer-management product. The existing private-calendar design in [Design.md](../../../Design.md) remains authoritative; no global tokens or sidecar were replaced.

This is an extension of an approved surface with an established visual identity and explicit functional requirements. No new visual-world selection, concept composition or random direction roll was needed. Implementation references are [PrivateCalendar.jsx](../../../src/Component/PrivateCalendar.jsx), [StudioInquiries.jsx](../../../src/Component/StudioInquiries.jsx) and [PrivateCalendar.css](../../../src/Component/PrivateCalendar.css).

## Colors

Retain the navy/plum, gold, beige and cream family already used by the private calendar. A dark selected navigation choice supplies contrast; gold-toned New badges distinguish unread requests without introducing a second accent system. Muted text supports source/date and explanatory copy. Error panels retain the existing semantic red treatment. Status meaning is written in words, never left to colour alone.

## Typography

Retain Source Serif 4 for the main page title and Source Sans 3 for reading text, controls and operational headings. The inquiry name is stronger than its subject; source and India Standard Time date sit below that hierarchy. Messages preserve entered line breaks, wrap long text and stop at a readable measure rather than expanding into an edge-to-edge paragraph. Do not copy marketing hero type sizes into this operational page.

## Layout

Reading order:

1. The private page heading and sign-out action establish where the client is.
2. Calendar, Inquiries and Needs attention select one view; Calendar remains the default.
3. The selected inquiry panel explains its purpose and offers Refresh.
4. Each compact expandable row shows name, subject, source, date/time and New or Seen.
5. Expansion reveals the message, optional location/birth date and email updates. Reply by email, Call and Mark as seen follow the content; the email address remains readable separately.
6. Older inquiries and Newest inquiries provide bounded navigation rather than an endlessly growing list.

The incumbent centered private content frame is capped at 1200px, increasing to 1600px on landscape screens at least 1920px wide. Expanded inquiry content uses a wider message column beside an email-status column. At widths up to 760px, metadata moves below the row identity, expanded content becomes one column and action controls stack. The surrounding marketing header and footer are not redesigned by this extension.

## Elevation & Depth

Use the existing lightly lifted cream panel. Individual inquiries are separated by fine rules rather than nested raised cards. Depth must help identify the operational surface, not compete with names and messages. There is no new assembly animation or decorative motion; existing short control-state transitions are sufficient for this task.

## Shapes

Retain the private calendar's softly rounded panel and action controls. New/Seen badges are compact and subordinate. Native disclosure rows use plus/minus cues while retaining their semantic expanded/collapsed behaviour.

## Components

- **View navigation:** three named buttons with an explicit pressed state, not icon-only destinations.
- **Inquiry disclosure:** native details/summary makes the full row discoverable without relying on hover. The message is loaded on expansion and rendered as text, not injected HTML.
- **Email updates:** distinguish the studio notification from the customer acknowledgement. An email problem does not mean the stored inquiry is lost. Needs attention currently covers inquiry email follow-up, not unfinished future payment or meeting workflows.
- **Actions:** Reply by email and Call open the user's ordinary email/telephone tools; they do not send automatically. Call appears only for a valid usable phone number. Mark as seen acknowledges review only after the server accepts it; it neither sends a message nor resolves an email problem.
- **Loading, empty and failure states:** explain the actual state in a sentence, offer retry where applicable and avoid a false success message. Empty attention copy is limited to inquiry emails.
- **Accessible interaction:** native buttons and disclosures retain keyboard operation; refresh has a descriptive accessible name; selected views use aria-pressed; loading text uses status announcements and failures use alerts. Controls retain the private surface's visible focus treatment and minimum 44px button height. Long addresses wrap and small-screen actions remain visible without hover.
- **Privacy:** leaving the authenticated session removes the private view. Late results must not repopulate private content after sign-out. List summaries do not expose the full message or contact details before deliberate expansion.

## Do's and Don'ts

- Do preserve the shared private-calendar visual family and separate phone layout.
- Do keep inquiry storage, email delivery and appointment confirmation as distinct ideas in the copy.
- Do keep follow-up actions visible and labels brief enough to scan.
- Don't infer that opening or marking a request Seen fixed its delivery problem.
- Don't add revenue charts, assignment pipelines, automatic reply tools or raw provider/job identifiers.
- Don't treat screenshots as proof that Google authentication or email delivery works online.

## Verification boundary

The local browser verification uses synthetic, explicitly fake inquiry data and simulated API responses at laptop (1366×768), large desktop (2560×1440) and phone (390×844) sizes. Those screenshots demonstrate layout and controlled interface states only; they contain no customer records and do not establish live-provider delivery, deployed authentication or physical-device acceptance. Fresh verification results and any final review corrections belong in the corresponding Plan 1 evidence checkpoint, not in invented claims of production readiness here.
