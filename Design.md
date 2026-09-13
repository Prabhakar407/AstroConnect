---
name: AstroAdvice Services and Name Change refinement
description: Implemented local Services and Name Change presentation, recorded 2026-09-08; not a global theme or a replacement for Home and About page rules.
colors:
  services-beige: "#ede9d7"
  services-plum: "#181122"
  services-gold: "#d3af54"
  services-gold-hover: "#e1be65"
  services-muted: "#584b53"
  services-help-navy: "#090b1c"
  services-light: "#f4efdf"
typography:
  services-display:
    fontFamily: '"Source Serif 4", Georgia, serif'
    fontSize: "clamp(38px, 24px + 2vw, 76px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  services-headline:
    fontFamily: '"Source Serif 4", Georgia, serif'
    fontSize: "clamp(29px, 17px + 1.15vw, 48px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  services-body:
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif'
    fontSize: "clamp(17px, 10px + 0.55vw, 24px)"
    fontWeight: 400
    lineHeight: 1.55
  services-action:
    fontFamily: '"Source Sans 3", sans-serif'
    fontSize: "clamp(16px, 10px + 0.45vw, 21px)"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  services-action: "8px"
  name-change-prepare: "12px"
spacing:
  services-gutter: "clamp(24px, 5vw, 112px)"
components:
  service-button-gold:
    backgroundColor: "{colors.services-gold}"
    textColor: "{colors.services-plum}"
    typography: "{typography.services-action}"
    rounded: "{rounded.services-action}"
    padding: "11px 20px"
  service-button-gold-hover:
    backgroundColor: "{colors.services-gold-hover}"
  name-change-prepare:
    backgroundColor: "{colors.services-plum}"
    textColor: "{colors.services-light}"
    rounded: "{rounded.name-change-prepare}"
    padding: "clamp(24px, 3vw, 52px)"
---

# Booking and private-calendar refinement addendum — 2026-09-09

## Appointments, services and testimonials release addendum — 2026-09-13

- The private page opens on **Appointments**. Upcoming, past and cancelled views expose the complete operational booking record only after studio authentication. Calendar dates show a small gold confirmed-booking count. Phone cancellation removes the booking from upcoming availability; every private cancellation surface says exactly **“Refund to be done manually.”** It does not invent refund tracking.
- Generic Booking entry points open with **Choose a consultation**. A service-page action uses `/booking?service=<service-id>` and preselects that service. Every service detail provides a hero, mid-page and closing booking action; the Lal Kitaab mid-page action remains present while any of its three tabs is active.
- Service-detail opening artwork is contained against solid navy, with no blurred full-width background, haze or gradient overlay. Its landscape height is capped at 260px and its phone height at 150px. Supporting title/action panels and contextual booking bands remain within a 1120px reading frame and stack independently on phones.
- The All Services introduction/index is compact, service chapters have no viewport minimum, and landscape content stays inside the established approximately 70% reading frame. Vastu elements use three cards above two centred cards on desktop and two columns with the final card centred on phones.
- Testimonials use client-authorized provisional, believable content without production-facing “sample”, “illustrative” or approval metadata. The page avoids aggregate ratings, numerical outcome claims and guarantees while retaining the approved editorial structure.
- Verification covers 1366×768, 2560×1440 and 390×844 for the public pages, plus 1440×900, 2560×1440 and 390×844 for the private appointments/calendar journey.

The approved booking roadmap now permits scoped booking/inquiry work; older instructions below to leave booking untouched describe the previous design phase. They do not prohibit this explicitly approved functionality. Preserve all unrelated Home/About/Services/Testimonial structure, shared chrome and typography.

- Public booking retains its four-step arrangement and incumbent palette. Quantity, total and a clear 30-minute statement sit in Consultation Details. Time buttons show readable start times, while their accessible labels contain the complete half-hour interval and availability. Calendar dates are 14px and navigation controls are 44px. The date card no longer stretches to add empty height beside the longer Prashna card.
- Errors remain beside the affected form and keep the entered information. Light Contact errors use a pale-red panel and dark-red text; dark forms use dark-red panels and light-red text. These are semantic error colors, not a new marketing palette. Avoid duplicated errors and success claims that precede accepted server responses.
- The email-verification dialog has named inputs, Escape/close support, keyboard containment and protection against a late response from a closed/replaced dialog. Existing dialog styling is retained. Six-digit verification is not described as a booking or payment confirmation.
- The new private calendar is deliberately operational: a day selector and closure controls beside the day's appointments, with a separate stacked phone layout. It uses Source Sans 3 for controls/body, Source Serif 4 for its main title, beige `#ede9d7`, cream `#faf7ed`, plum `#181122` and gold `#d3af54`. Large landscape screens receive a wider 1600px maximum content area and larger local text; this does not resize global fonts or shared chrome. Status colors always accompany words, not color-only meaning. Visible actions do not require hover.
- Destructive scheduling actions ask for confirmation. A closure conflict explains that existing bookings/holds are protected. Cancellation copy says “Refund to be done manually.” Failed availability checks disable scheduling controls.
- Visual verification covers 1440×900, 2560×1440 and 390×844 browser viewports, not physical-device acceptance. The review and retained screenshots are linked in [BOOKING_FOUNDATION_REVIEW.md](BOOKING_FOUNDATION_REVIEW.md). Design-audit supplementary templates were unavailable, so its checklist and these project rules were used directly. No generated artwork or marketing redesign was needed.

# Authoritative Services/About refinement addendum — 2026-09-08

## Overview

**Creative North Star: "Incumbent navy, gold and beige"**

The completed Services presentation continues the established celestial identity through illustrated chapters, readable typography and visible actions. The image gives each consultation its own character; concise copy, two focus topics and the price support comparison. Name Change uses the same local presentation in its new information page.

**Scope and precedence:** the frontmatter tokens govern only the Services and Name Change page bodies implemented in `Service.css`. This addendum and the existing [Home review](HOMEPAGE_REVIEW.md) and [About review](ABOUT_REVIEW.md) supersede the old generic palette and font suggestions below only for the approved Home, About, Services and new Name Change surfaces. Home keeps its own tokens and layout. About keeps its landscape-only local overrides and protected Outfit `Astrologer Kundan Singh` hero title. Do not apply these tokens to shared navigation, the main footer, the global root font size, booking, or other untouched pages. The complete earlier design record is preserved below as history.

**Key Characteristics:**

- Existing navy, gold and beige identity with Source Serif 4 headings and Source Sans 3 reading text on the scoped surfaces.
- Six illustrated Services chapters with readable content and actions at rest.
- Separate Services portrait/mobile layout; compact About expertise changes confined to landscape.

Implementation references: [Service.jsx](src/Component/Service.jsx) contains the direction contract; [Service.css](src/Component/Service.css) owns local styling; [ServicePresentation.jsx](src/Component/ServicePresentation.jsx) shares artwork, topic icons and price presentation; [NameChangeService.jsx](src/Component/NameChangeService.jsx) owns the sixth information destination. [About.jsx](src/Component/About.jsx) and [About.css](src/Component/About.css) own the compact expertise layout. [publicServices.js](src/data/publicServices.js) supplies public presentation data. [SERVICES_REVIEW.md](SERVICES_REVIEW.md) holds composition and verification evidence; [PRODUCT.md](PRODUCT.md) holds product constraints. This document records implementation, not publication or human acceptance.

## Colors

### Primary

Services gold marks the primary action and selected visual accents; its warmer hover variant provides a clear response. Gold is an accent, while readable text remains plum or an appropriate light color on dark surfaces.

### Neutral

Services beige is the continuous chapter background. Plum supplies primary text and the Name Change preparation panel; muted text supports descriptions. The navy help section uses light text. The exact local values are normative in the frontmatter. About retains its existing navy hero, white expertise section, plum cards and beige certificate section; the Services beige is not an instruction to recolor those sections or Home.

## Typography

The Services display and section headings use Source Serif 4 with Georgia fallback; body text, prices, topic labels and actions use Source Sans 3. Local WOFF2 font registrations live in [Home.css](src/Component/Home.css), shared by the loaded application. Keep local sizing in pixels/clamps so Services does not resize shared chrome through the root `rem` scale.

The frontmatter records the default display, headline, body and action roles. Descriptions stop at a readable measure (67ch); intro copy is narrower (58ch). Prices use a distinct semibold sans-serif scale (`clamp(22px, 15px + .6vw, 31px)`, line height 1.3). In the portrait/mobile rule, body text becomes 17px, small text 16px and section headings 29px; jump-link labels are 15px.

About's landscape section headings use Source Serif 4; its compact card titles deliberately use semibold Source Sans 3 (`clamp(20px, 13px + 0.5vw, 26px)`). Preserve the original Outfit hero title and its existing size treatment. At 1024–1599px in landscape, only the left hero supporting paragraph is reduced by 0.5pt, and its eyebrow, biography text and quote by 1.5pt, relative to their existing roles. Line-height ratios remain unchanged. Do not reduce the title, Book Consultation/Chat Now actions, proof tray or non-hero content; desktop widths from 1600px and all portrait/mobile sizes retain the previous typography. Home follows its own approved Source Serif 4 / Source Sans 3 roles, not the Services size scale.

## Layout

Name Change retains its centered container capped at 2400px with the local gutter from frontmatter. Services opens with a compact centered introduction and six in-page links. Its landscape reading frame is approximately 70% of the viewport: `min(2400px, max(940px, 70vw), calc(100vw - 64px))`. Smaller landscape screens use more than 70% where needed to keep the content readable. The introduction, index, chapter content, inter-chapter seams and closing callout share that frame; the header and footer are unchanged. The index has three columns by default, six at widths of at least 2200px in landscape, and two in portrait/mobile.

At widths of at least 1024px in landscape, six Services chapters alternate the illustration side without a viewport-height minimum. Each row grows only to fit its content, using 24px vertical padding. The header is measured with `ResizeObserver`; the initial fallback is 85px. The artwork column is `clamp(220px, 15vw, 320px)` beside a flexible copy column with a `clamp(32px, 3vw, 64px)` gap. Reverse rows swap the columns, keeping common outer edges instead of centering small images within oversized tracks. The gold offset frame changes side with the chapter.

At widths of 767px or less, or in portrait orientation, Services uses a content-led single column with 24px side gutters and artwork capped at 245px. It does not impose the landscape scene minimum. Actions stay visible and wrap as necessary. At widths up to 1199px, the price/actions group stacks to avoid crowding. Name Change also stacks in portrait/mobile, with its illustration placed first and capped at 230px; its default hero and exploration sections use two columns.

About's six expertise cards form a three-column, two-row grid only at widths of at least 1024px in landscape. Each card puts the square image beside three distinct rows: title, two icon-supported focus topics and actions. The image normally spans all three rows; at 1024–1199px landscape, actions span the full card width beneath the image and text. Topics remain hidden in the incumbent portrait/mobile card layout. Preserve the existing overlapping About proof tray and the independent mobile/portrait arrangement.

## Elevation & Depth

Services uses flat chapter bands separated by fine gold-toned seams. Depth belongs to the square illustration, its offset outline and restrained action shadows. Artwork rests on `8px 12px 24px -12px rgb(24 17 34 / 38%)` and lifts slightly on landscape hover. The Name Change preparation panel has `0 16px 30px -18px rgb(24 17 34 / 40%)`; About expertise cards retain `0 14px 28px -16px rgb(24 17 34 / 35%)`. These are scoped treatments, not a mandate for glass cards throughout the site. Extension values and representative component previews are recorded in [.impeccable/design.json](.impeccable/design.json).

## Shapes

Services chapter seams and illustration crops stay square. The artwork's thin outline is offset by 8px; it is not a rounded card around the whole consultation. Services actions use the soft 8px corners recorded above, and the Name Change preparation panel uses 12px corners. About expertise cards keep 16px corners, 10px image corners and 8px action corners. Existing Home card, portrait and proof-tray shapes remain governed by its review.

## Components

### Navigation and chapters

The six index links use the existing `/services?focus=<service-id>` pattern. A valid selection focuses and scrolls to its matching section, allowing the measured header plus 12px clearance. In landscape the index is a contrasting plum band with light labels, gold icons, an 8px corner radius and a light-gold inset keyboard focus ring. Its former top/bottom rules and the first chapter's extra seam are removed; subsequent chapter seams remain within the reading frame. Portrait/mobile keep the incumbent light index. Each chapter keeps a semantic heading, description, two topic labels, price and persistent actions. The action focus ring is 3px with 5px offset; dark help-section links receive a light gold ring. Do not require hover to reveal useful content.

### Artwork and topics

Reuse the five existing service WebP illustrations with their per-service framing values in `publicServices.js`. The distinct [Name-Change.png](src/assets/images/Name-Change.png) asset uses its complete image without the legacy artwork crop or scale adjustment. Images are decorative beside their text headings and use empty alternative text; the first Services image and the Name Change hero load eagerly, while later chapter images load lazily. Topic icons come from the existing Lucide set, with two short labels supplied by the shared data.

### Prices and actions

Public prices and wording come from `publicServices.js`, with `ServicePrice` keeping the Prashna `per question` unit adjacent to its value. On 2026-09-09 the designer confirmed Name Change at ₹5,100 with `Book Now`, leading to `/booking?service=name-change` from Services, About and its own detail page. That booking choice shares the public price and is preselected by these links. Other Services/About booking actions retain `/booking`; Read More keeps each `/services/<service-id>` destination. Public durations remain hidden. Existing appointment prices, service values, scheduling and backend behavior still have their own future review; the new Name Change option does not change those rules. The Name Change page explains the consultation and preparation without inventing proof or a legal paperwork flow.

### Motion and interaction

Services chapter content is readable before the observer runs. In landscape at widths of at least 1024px, when reduced motion is not requested, each chapter receives one short assembly: artwork 700ms, copy 760ms and seam 900ms, all using `cubic-bezier(.16, 1, .3, 1)`. Artwork and copy approach from opposing 28px horizontal offsets with 10px vertical movement. Actions use 200ms transitions and a 2px hover lift; landscape artwork uses 300ms transitions and a 5px hover lift.

Under `prefers-reduced-motion: reduce`, Services and Name Change remove CSS animation, transition and hover translation, and focused chapter navigation scrolls immediately. This is a local rule and does not claim that the inherited About motion or certificate autoplay has been changed.

## Do's and Don'ts

### Do:

- Do preserve the approved Home/About identity and use the Services tokens only within their declared scope.
- Do keep all six consultations, their illustrations, two focus topics and visible actions easy to compare.
- Do allow short landscape screens and long text to grow without clipping, and inspect mobile independently.
- Do keep the protected About Outfit hero title, shared header/main-footer sizing and booking behavior intact.

### Don't:

- Don't apply the historical generic Cinzel/Playfair/Inter suggestions or older palette table to the approved refined surfaces.
- Don't turn the Services chapter pattern or its square artwork into a universal rule for unrelated pages.
- Don't invent a Name Change price, consultation duration, outcome guarantee or supporting credential.
- Don't treat inherited certificate placeholders, promotional claims or generated composition text as validated evidence.

---

<!-- Historical design record follows verbatim. The scoped addendum above and the existing page reviews take precedence where explicitly stated. -->

# AstroAdvice Website - Design System & Visual Guidelines

This document outlines the design principles, visual aesthetics, color systems, and UI component standards used on the **AstroAdvice by Kundan Singh** web platform.

About review update (2026-09-08): [ABOUT_REVIEW.md](ABOUT_REVIEW.md) records the landscape viewport scenes, matching proof tray, six compact expertise cards and scoped type parity with Home. Preserve the original Outfit `Astrologer Kundan Singh` hero title and shared header/main-footer sizing. Mobile retains its incumbent layout while receiving the added expertise card. The copyright/legal row now uses gently glowing gold site-wide. Certificate images remain incumbent placeholders and need real supporting material before publication.

Homepage review update (2026-09-08): the designer requested refinement, not a redesign. Preserve the overlapping proof strip, continuously moving testimonials, automatic services and existing visual identity. The current decisions and verification in [HOMEPAGE_REVIEW.md](HOMEPAGE_REVIEW.md) supersede the general typography and animation examples below for the homepage. The specifically requested footer refinements and navigation usability fixes are shared; other page bodies remain unchanged pending page-by-page review.

**Approval boundary for future pages:** collect and discuss proposed structural, interaction or design-philosophy changes before implementing them. Changing a moving marquee into a click-through carousel or removing a section-overlapping strip requires discussion. Ordinary approved typography, spacing, responsive sizing and alignment refinements may proceed. Visually inspect the existing page and the result at laptop, large-desktop and phone sizes.

Latest approved homepage detail: square full-width section corners, a direct navy-to-light-beige hero/features transition with one continuous features/services background, and a narrow subtle marquee edge fade. Keep the approved rounded cards, portrait frames and overlapping statistics tray.

Latest scope restriction: new refinements are for landscape layouts, not a mobile redesign. At widths of at least 1024px in landscape orientation, the proof tray now has a warm gold-beige surround and normalized Source Sans 3 labels/actions; service artwork has individually tuned framing with consistent captions; the review control is removed and the marquee pauses on hover/focus, with more clearance before its callout. Mobile and portrait layouts retain their existing treatment and review control. The standalone illustrated Specialties section and restyled service choices are proposals awaiting approval, not completed design changes. See the latest verification record in HOMEPAGE_REVIEW.md.

Final homepage touch-up before the About review: landscape hero copy and portrait move inward by 10% of their respective column widths. The introductory pill is about 25% wider, with 15% smaller text and a small gold icon before each word. Header brand text is 20% larger; readable two-line phone details sit horizontally beside Book Appointment, on its left. At 1024–1199px landscape widths, navigation receives a second row to prevent crowding. These changes remain homepage-only and do not alter mobile or portrait layouts. The larger Specialties/Services proposal is deferred while the designer moves page by page; wait for About-page inputs before editing that page.

---

## 🎨 1. Color Palette System

The visual design is built around an immersive, premium celestial dark theme designed to evoke luxury, mystery, and astronomical clarity.

### Primary Colors

| Color Name | Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Deep Royal Purple** | `bg-royal-purple` | `#2A132E` | Header, footer, premium sections |
| **Dark Plum** | `bg-dark-plum` | `#55393F` | Text, icons, secondary accents |
| **Rich Gold** | `bg-rich-gold` | `#DDB195` | Buttons, highlights, decorative elements |
| **Antique Gold** | `bg-antique-gold` | `#A6755D` | Icons, borders, illustrations |

### Background Colors

| Color Name | Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Warm Ivory** | `bg-warm-ivory` | `#FDF9F7` | Primary main body background |
| **Soft Cream** | `bg-soft-cream` | `#FCF3ED` | Cards and content blocks |
| **Light Blush Beige**| `bg-blush-beige` | `#E7D3CE` | Secondary backgrounds |
| **Misty Rose** | `bg-misty-rose` | `#F0E4E3` | Section separators |

### Accent Colors

| Color Name | Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Soft Gold** | `bg-soft-gold` | `#DDB195` | CTA buttons |
| **Champagne** | `bg-champagne` | `#EBDCD4` | Hover states |
| **Dusty Taupe** | `bg-dusty-taupe` | `#BDA9A8` | Borders |
| **Peach Beige** | `bg-peach-beige` | `#F7F0EE` | Card backgrounds |

---

## ✍️ 2. Typography & Font System

Standard browser sans-serifs are avoided to ensure a premium editorial feel.
* **Headers & Titles (`h1`, `h2`, `h3`)**: Cinematic serif families (e.g., `Cinzel` or `Playfair Display`) to convey classical wisdom.
* **Body Copy & Input Labels**: Elegant, readable sans-serif (e.g., `Outfit` or `Inter`) for maximum readability on small mobile screens.

---

## ✨ 3. Visual Accents & Animations

To make the page feel alive and engaging:
1. **Glassmorphism**: Cards and navigation headers use translucent backgrounds with subtle borders to look like floating layers of glass:
   ```css
   background: rgba(24, 17, 34, 0.7);
   backdrop-filter: blur(12px);
   border: 1px solid rgba(211, 175, 84, 0.15);
   ```
2. **Micro-Animations**:
   * Hover effects on buttons scale up slightly (`scale: 1.02`) and brighten.
   * Floating planet spheres rotate or drift subtly using Framer Motion.
   * Key status states (like success checkmarks) pulse to guide user attention.

---

## 📅 4. Interactive Booking States

The time slot selection uses an intuitive visual system:
* **Green Slots (`#10B981`)**: Interactive buttons that are open and clickable.
* **Red Slots (`#EF4444`)**: Statically disabled buttons indicating that the slot is fully booked (2 bookings registered in the hour limit).
* **Hover State**: Highlights selected options in rich gold borders.
