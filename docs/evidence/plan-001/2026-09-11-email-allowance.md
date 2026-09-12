# Shared daily email reservations — 2026-09-11

## Completed locally

- `email_budget.py` reuses the existing PostgreSQL rate-limit store. All OTP purposes share the verification counter; OTP and inquiry notifications share a total counter independent of API keys or deployment name. There is no new provider, schema, environment switch or in-memory fallback.
- Total: 100 reserved attempts per UTC calendar day. Verification: at most 80, leaving 20 available for notifications on already saved records. This is an explicit engineering default, not measured account usage or 100 guaranteed delivered emails. Actual sends and conservative uncertain/failed attempts consume reservations; rollback before sending does not.
- A transaction advisory lock serializes reservations, including the first insert. The clock is read after acquiring it, preventing a waiting pre-midnight request from reverting a newer day's expiry. Locks are released before provider calls.
- Exhausted OTP allowance creates no new challenge or email. The existing API returns a plain retry/phone message and never grants verification. Existing per-email/IP limits still apply.
- Exhausted notification allowance leaves the saved job pending until the next UTC midnight, without incrementing attempts or starting an idempotency window. Previously uncertain sends still obey the existing no-blind-replay deadline. Existing authenticated recovery/queue handles due work, not a new scheduler.

## Verification

- Final isolated-PostgreSQL backend suite: **153 tests passed, zero skips**, 10.359 seconds. Existing FastAPI test-client deprecation warning remains.
- `git diff --check` passed. Hosting preparation produced `/tmp/astro-hosting-source.8ygvP1` (135 files, 13,064,500 bytes); package import and allowance-module/recovery-route presence passed without provider calls. This package is not deployed or freshly credential-scanned for publication. Isolated PostgreSQL stopped successfully afterward.
- Seven new regressions cover notification headroom, simultaneous last-allowance attempts, UTC rollover, transaction rollback, clock-after-lock ordering, denied verification, uncertain-send accounting and next-day notification resumption (some tests cover multiple cases).
- No frontend layout or email template changed. No new screenshot or hosted-delivery claim. No hosted database mutation, deployment, email, payment, invitation or source publication.
- Scope review identified an account question: whether other applications share the Resend team. User was asked asynchronously; answer pending at this checkpoint.
- Initial package route-inspection command assumed every FastAPI entry had `.path`; an included router does not. Corrected the diagnostic to inspect optional path attributes and reran successfully. This was a verification-command error, not an application change.

## Still open — do not infer full quota protection

Resend's [official quota reference](https://resend.com/docs/knowledge-base/account-quotas-and-limits), checked 2026-09-11, gives 100/day with UTC midnight reset and 3,000/month; sends and inbound mail share usage, and multiple recipients count individually. This application sends one recipient per request. Local reservations cannot count unrelated applications, prior usage, or inbound mail. Keeping the provider on Free is the no-paid-overage boundary, not this counter.

Monthly cycle/used allowance is not guessed or reset at an invented calendar boundary. Provider rejection is still authoritative, and existing bounded retry behavior is not proof of recovery from a month-long exhaustion. Final monthly handling, account usage alignment, signed delivery observations/source attribution and private inquiry/attention access remain unfinished before online acceptance. C03 and P1-06 are not marked complete.

The email skill informed preserving opaque idempotency identities and distinguishing acceptance from delivery. Its Marketplace/template-stack examples are not used: the user's direct Free Resend account and Python implementation remain unchanged.
