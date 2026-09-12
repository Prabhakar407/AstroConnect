# AstroAdvice Website & Booking Engine - Architecture Documentation

This document provides a simple, comprehensive overview of the technical architecture, directory structure, data flow, and security configurations of the **AstroAdvice** web platform.

## Current booking architecture — provider plan updated 2026-09-10

The approved foundation replaces the inherited backend described later in this document. The website remains React/Vite with FastAPI. [Plan 1](docs/PLAN-001-booking-inquiries-and-client-calendar.md) owns execution status, acceptance gates and the resume checkpoint; [BOOKING_ROADMAP.md](BOOKING_ROADMAP.md) retains requirements/history; [BOOKING_FOUNDATION_REVIEW.md](BOOKING_FOUNDATION_REVIEW.md) records dated local evidence; [src/backend/README.md](src/backend/README.md) is the current technical setup reference.

- `src/data/consultationCatalogue.json` supplies the six names, prices and per-question rule to the public catalogue, booking display and Python price calculation. The server calculates the charge; no submitted browser amount is trusted.
- `domain.py` contains the IST dates, ten-day horizon, office hours, half-hour starts and quantity rules. `storage.py` uses PostgreSQL transactions; a shared occupancy table plus a transaction lock coordinates bookings, expiring holds and client closures. No JSON/SQLite/Redis/spreadsheet fallback exists in the active backend.
- `application.py` exposes explicit public routes and fails closed when storage/email is missing. `/api/book-appointment` remains disabled: there is no working public payment flow yet. `main.py` only creates the app; import/startup does not contact providers or create local databases. Migrations are an explicit operator action.
- `verification.py` uses expiring, purpose-bound, one-use email verification and durable request/attempt limits. Codes and tokens are stored as digests. `resend_email.py` sends codes through the fixed Resend endpoint using saved-challenge idempotency, bounded response checks and the client's Gmail reply-to. It needs the actual sender/key/verification/storage settings, not an extra enable flag. Its transport/layout are locally checked; real delivery and shared account quota handling remain unproved/unfinished.
- `admin.py` and `PrivateCalendar.jsx` implement the client-only `/#/studio/calendar` route. Official Google identity verification, a one-use browser-bound nonce, secure HttpOnly sessions, exact-origin checks and CSRF protection guard the data and actions. The verified client Gmail account is pinned to Google's stable account identifier on first authorized login. Google setup and HTTPS same-site hosting still need verification. Google sign-in does not itself authorize Calendar access.
- Bookings, payments, cancellations, inquiries and delivery intent are durable SQL records. Migrations 005/006 separate per-recipient email processing from queue publication. `inquiry_delivery.py` handles frozen payloads/stable send keys; `inquiry_dispatch.py` publishes after commit and recovers due rows. The small Cloudflare queue/Cron helper invokes fixed authenticated Python routes with separate secrets; it has no database/provider credentials or public endpoint. Local checks pass, but hosted delivery, signed provider observations, mail budgets, private inquiry/attention views, Calendar/Meet and Razorpay remain open. Resend acceptance is not inbox delivery; inquiry processing excludes booking jobs.
- Public forms now wait for actual accepted responses, keep details on errors and do not default to the old hosted backend. Existing customer records were not inspected, copied, migrated or removed. The redacted legacy source is kept as non-executable history in `.archive/booking-backend-before-roadmap.txt`; exposed credentials still require provider-side rotation.

**Provider alignment — 2026-09-10:** booking must be Pro-independent, not Vercel-independent. Recommend existing React/Vite/FastAPI on Hobby-compatible Vercel hosting, Neon Free records and Resend Free, plus a small Cloudflare Free queue/Cron helper invoking protected Python handlers. Google identity/Calendar stay unbilled; proposed retained encrypted backups require consent and restore proof. No mandatory upgrade, paid-only feature, duplicate frontend or main Python-to-Workers port. See the [alignment review](docs/PLAN-001-no-card-hosting-review.md). This is a plan, not a completed deployment.

**Existing hosting clarification:** preserve the domain and approved design. A Vite/native `api/index.py` candidate now routes `/api` before the page fallback, with explicit same-origin helpers and uncached replies. An allowlisted temporary source package builds locally and the Python app imports without network side effects. Actual Vercel build/bundle, route/cookie forwarding, project/source mapping and Hobby execution remain unverified; see the [local checkpoint](docs/evidence/plan-001/2026-09-10-local-preparation.md). No beta Services or paid-only setting. Function/database/email quota failures remain possible while static pages load; no unconditional uptime/free-overage promise.

**Deployment boundary:** this is intermediate, locally tested implementation, not a live paid-booking service. The site is pre-handover and all existing records are confirmed dummy; no live-customer migration is needed. Remaining integrations, authorized notifications/payments, clean production data and backup/restore checks must be completed before release.

## Historical inherited architecture — not current operating instructions

Everything below is preserved for reference. Its JSON, SMTP, spreadsheet, Jitsi, availability, calendar-sharing and security claims do not describe the new active backend and are not verified production guarantees.

---

## 🌌 Tech Stack Overview

The project is built using a modern decoupled architecture, combining a responsive React user experience with a lightweight Python microservice.

### 1. Frontend (Client-side)
* **Framework**: React.js (Vite build tool)
* **Routing**: React Router DOM (v6+)
* **Styling**: Custom Vanilla CSS (Glassmorphic dark-theme celestial UI)
* **Animations**: Framer Motion (Smooth, responsive transition states)
* **Icons**: Lucide React / React Icons

### 2. Backend (Server-side)
* **Framework**: FastAPI (High-performance Python web framework)
* **Server**: Uvicorn (ASGI web server)
* **Packages**: `google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib`, `pydantic`, `email-validator`

### 3. Integrations & Storage
* **Calendar Integration**: Google Calendar API v3
* **Local Database**: Lightweight JSON file storage (`local_queries.json`)
* **Email System**: SMTP Mail server connectivity (TLS/Gmail App Passwords)
* **Video Sessions**: Dynamic Jitsi Meet meeting room API

---

## 📂 Project Directory Structure

```text
Astrologer_Website/
├── dist/                          # Compiled production assets (static HTML/JS/CSS)
├── node_modules/                  # Frontend dependencies
├── src/                           # Frontend React Source Code
│   ├── assets/                    # Static assets (images, logos, planet graphics)
│   ├── Component/                 # UI View Components
│   │   ├── Navbar.jsx             # Top Navigation bar
│   │   ├── Footer.jsx             # Site Footer with contact information
│   │   ├── Home.jsx               # Landing Page (includes Contact & Query Form)
│   │   ├── Contact.jsx            # Separate Contact page & Helpline links
│   │   ├── Services.jsx           # Service packages & readings overview
│   │   ├── ServiceDetail.jsx      # Specialized intake forms (Prashna Kundali details)
│   │   └── Appointment_Booking.jsx# Interactive calendar appointment scheduler
│   ├── App.jsx                    # Routing & global theme wrapper
│   └── main.jsx                   # React DOM Entrypoint
│
├── src/backend/                   # FastAPI Backend Source Code
│   ├── .env                       # Backend Environment Variables (ignored by Git)
│   ├── main.py                    # Primary API routes, business logic, email, & calendar helpers
│   ├── service_account.json       # Private Google Cloud API Credentials key (ignored by Git)
│   ├── calendar_config.json       # Dynamic tracking of the generated Calendar ID (ignored by Git)
│   └── local_queries.json         # Unified customer query database storage log (ignored by Git)
│
├── .gitignore                     # Git safety rules (secures private keys and local databases)
├── package.json                   # Node package dependencies
├── vite.config.js                 # Vite compiler settings
└── architecture.md                # [This File] Architecture & Technical documentation
```

---

## ⚡ Main System Features & Data Flow

### 1. Unified Customer Query Intake (Home / Contact / Prashna Page)
Whenever a user fills in a contact query or horizontal horary (Prashna Kundali) question:
1. The React form submits a POST payload to `/api/contact` or `/api/prashna`.
2. The FastAPI backend appends the query to `local_queries.json` using a unified schema:
   ```json
   {
       "query_type": "general_contact" | "prashna_kundali",
       "name": "Client Name",
       "phone": "+91XXXX...",
       "timestamp": "ISO-8601"
   }
   ```
3. An automated alert email is compiled and sent to `astroadvicebyks@gmail.com` using the server's background SMTP handler.

### 2. Double-Booking Protected Calendar Engine
When a client goes to the booking page:
1. **Interactive Grid**: The frontend queries `/api/availability?date=YYYY-MM-DD`.
2. **IST Mapping Check**: The backend queries the Google Calendar API using India Standard Time (`+05:30`) to search for events in the local hour windows.
3. **Limit Enforced**: If a slot has 2 or more bookings (as per `MAX_BOOKINGS_PER_HOUR` in `.env`), the button turns **red (Unavailable)**.
4. **Secure Insertion**:
   * If a slot is available, a new event is inserted into a dedicated secondary calendar named **`AstroAdvice Bookings`**.
   * The calendar is shared with the astrologer's personal email (`astroadvicebyks@gmail.com`) as **Read-Only** (`role: reader`) so clients/astrologers cannot delete booking data.
5. **Session URL**: Generates a dynamic Jitsi Meet room link (`https://meet.jit.si/...`) for private communication, adding it to the email alert, calendar description, and user success screen.

---

## 🔒 Security & Git Protection

A strict configuration exists in `.gitignore` to prevent any credentials leak:
* **`service_account.json`**: Restricts access to your Google Calendar cloud database.
* **`.env`**: Keeps SMTP Gmail passwords and operational configuration safe.
* **`calendar_config.json`**: Restricts exposure of active Google Calendar IDs.
* **`local_queries.json`**: Prevents customer details and mobile numbers from being published to GitHub.
