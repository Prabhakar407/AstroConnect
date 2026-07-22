# Astraea Project Rules & AI Guidelines

These rules apply to all AI agents and coding assistants operating on the **Astraea Astrologer Website** codebase. Read and align with these guidelines before editing or generating code.

---

## 1. Collaboration & Communication Rules

- **No Unauthorized Edits**: Do not make any modifications to code files until explicitly asked to do so. Until then, reply in text, discuss approaches, and suggest solutions.
- **Clarification Over Assumptions**: If you do not understand a requirement, design decision, or code pattern, directly ask the developer for clarification. Do not make assumptions, hallucinate functionality, write wrong code, or install random packages.

---

## 2. Code Readability & Documentation

- **Use Structural Comments**: The codebase must remain highly understandable and readable. Use clear, descriptive comments to highlight different parts, layout sections, components, and logical blocks.
- **No Placeholders**: Do not write comments like `// TODO: implement later`, `/* ... rest of code ... */`, or `// Code remains unchanged`. Always provide fully-formed, functional, and production-ready code.
- **Maintain Comments**: Preserve all existing docstrings, documentation, inline comments, and licenses unless explicitly requested to change them.

---

## 3. Targeted Edits & Accuracy

- **Targeted Edits**: Prefer editing narrow, specific sections of code using precise replacement tools rather than rebuilding entire files from scratch. Unnecessary refactoring is strictly forbidden.

---

## 4. Dependency Management & Hallucination Prevention

- **Verify before Importing**: Never import any npm package or library that is not declared in `package.json`.
- **Pre-Install Requirement**: If a new library is required, search for standard installation practices, explain the reason to the developer, and install it via `npm install` first. Do not guess versions.
- **Module Systems**: Ensure imports conform to the module system defined in `package.json` (`"type": "module"` uses standard ES Modules `import/export`).

---

## 5. Tech Stack & Styling Guidelines

- **Tailwind CSS v4 Standard**: Use utility classes from Tailwind CSS v4.
- **Zero Config Configs**: Do not create or request a `tailwind.config.js` or separate PostCSS configuration files unless v4 plugins fail.
- **Tailwind Import**: CSS entry points must import Tailwind via `@import "tailwindcss";`. Do not use older directives like `@tailwind base;`.
- **Typography Standards**:
  - Headings (`h1`, `h2`, `h3`, etc.) must use the serif family (`font-serif`, mapped to `Cinzel`).
  - Body text must use the sans-serif family (`font-sans`, mapped to `Outfit`).
- **Color Palette Standards**: Use the defined luxury astrology color palette:
  | Color Name | Tailwind Class | Hex Value | Target Usage |
  | :--- | :--- | :--- | :--- |
  | Royal Purple | `bg-royal-purple` / `text-royal-purple` | `#2A132E` | Headers, footers, premium components |
  | Dark Plum | `bg-dark-plum` / `text-dark-plum` | `#55393F` | Text, icons, secondary accents |
  | Rich Gold | `bg-rich-gold` / `text-rich-gold` | `#fcb900` | Buttons, CTA highlights |
  | Antique Gold | `bg-antique-gold` / `text-antique-gold` | `#A6755D` | Borders, illustrations, accent icons |
  | Warm Ivory | `bg-warm-ivory` / `text-warm-ivory` | `#FDF9F7` | Primary main body background |
  | Soft Cream | `bg-soft-cream` / `text-soft-cream` | `#FCF3ED` | Cards, content containers |
  | Blush Beige | `bg-blush-beige` / `text-blush-beige` | `#E7D3CE` | Secondary sections and backgrounds |
  | Misty Rose | `bg-misty-rose` / `text-misty-rose` | `#F0E4E3` | Dividers and thin borders |
  | Champagne | `bg-champagne` / `text-champagne` | `#EBDCD4` | Hover states |
  | Dusty Taupe | `bg-dusty-taupe` / `text-dusty-taupe` | `#BDA9A8` | Structural border colors |
  | Peach Beige | `bg-peach-beige` / `text-peach-beige` | `#F7F0EE` | Highlighted cards & blocks |

---

## 6. Verification & Testing Workflow

- **Build Check**: Every modification to code files must be validated by running a production compilation check:
  ```bash
  npm run build
  ```
- **Lint Check**: Proactively run linters if errors occur or if the workspace contains an Oxlint configuration.
- **Check Paths**: Confirm files exist via file-system listing or searching before trying to modify them.
