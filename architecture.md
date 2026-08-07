# AstroAdvice Website & Booking Engine - Architecture Documentation

This document provides a simple, comprehensive overview of the technical architecture, directory structure, data flow, and security configurations of the **AstroAdvice** web platform.

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
