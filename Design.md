# AstroAdvice Website - Design System & Visual Guidelines

This document outlines the design principles, visual aesthetics, color systems, and UI component standards used on the **AstroAdvice by Kundan Singh** web platform.

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