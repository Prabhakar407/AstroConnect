---
version: 1
slug: "src-component-testimonial-jsx"
primary_target: "src/Component/Testimonial.jsx"
related_targets: ["src/Component/Testimonial.css","src/data/testimonialContent.js"]
---

# Testimonials: featured voices, consultation context and self-paced reviews

## Scope and visitor job

Approved extension of the existing Testimonials page, not a replacement identity. A prospective visitor should understand what a consultation feels like, read at their own pace, then explore a service or book. Preserve the shared header/footer and the existing featured carousel, arrows and six-dot navigation. Keep the wider content frame near 70% on landscape, with a compact-screen safety exception. Mobile is independently content-led.

## Approved structure and composition choice

1. Familiar light, centered featured-testimonial opening; responsive available-viewport height and readable supporting text.
2. Three illustrated consultation stories: one wide featured story, two smaller companions.
3. Six concise reviews, with populated service filters and visible selected states.
4. A brief invitation using the existing Services and Booking destinations.

The user approved this four-part recommendation and delegated execution and critique. Three image-generated composition studies were compared: editorial feature and companions, paired story rows, and a denser journal. The editorial option was selected for varied pacing and a clear lead; paired rows were repetitive, while the journal was denser than this reading task needs. Studies are in `.impeccable/mocks/testimonials-{editorial,paired,journal}.png`. No concept roll: the approved local extension already pins the structure.

## Comp interpretation and element inventory

- Preserve the real shared navigation and footer, not the study's generated replacements.
- Preserve the incumbent light hero and centered quotation, rating treatment, author attribution, arrows/dots and booking action. Do not import the study's dark hero, fabricated slogan or new metrics.
- Use the selected study's wide illustrated story above two smaller illustrated stories, followed by a lighter review collection and a short dark close.
- Carry the actual site's Source Serif 4 / Source Sans 3 typography, navy/plum/gold/beige materials, square section seams and restrained engraving-style raster artwork. The study is a composition reference, not authority to change the font or invent client outcomes.
- Keep initials as neutral identity markers rather than inventing client portraits. Do not add production-facing metadata such as “sample”, “illustrative” or “awaiting approval”.

These adaptations were declared before implementation. No QUALITY BAR catalog card applies: this is an extension of the incumbent world, not a catalog-world selection.

## Content and interaction

The client explicitly authorized plausible provisional names, dates, quotations and consultation scenarios for the finished page while exact source material is collected. The page must read as finished customer-facing content: no editorial labels or placeholder disclosures are shown. Scenarios explain the question, conversation and takeaway without guaranteed outcomes, numerical success claims or aggregate ratings. The client will replace or confirm the wording later.

Carousel cycles every 12 seconds, pauses while hovered, focused, offscreen or in a hidden tab, and stops after manual selection/touch or for reduced-motion preferences. Slide height is reserved to prevent jumping controls. Review filters are independent of the carousel. Story artwork assembles once on landscape, with content visible at rest; reduced motion removes the movement. Booking/backend workflows remain untouched.

## Review and unresolved decisions

Verify laptop 1366×768, desktop 2560×1440 and phone 390×844, including full story/review sections, navigation controls, filters, reduced motion and links. Do not force a long reading section to clip just to hit a viewport boundary. Publication is authorized as part of the 2026-09-13 release slice; exact client wording may still be replaced later without changing the layout.
