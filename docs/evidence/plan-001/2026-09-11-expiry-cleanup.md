# C03 bounded expiry cleanup — 2026-09-11

User reports Cloudflare queue token and all three intended Vercel Production settings saved. No secret received; provider association, permissions and execution remain unverified.

## Implementation

- `Store.cleanup_ephemeral()` selects at most 250 expired rows per table using row locks with `SKIP LOCKED`; covers rate limits, email challenges and email verification grants only. Expiry uses the database clock in production. Fixed identifiers, one-second statement/lock bounds and one transaction; no unbounded cleanup loop.
- Existing authenticated recovery runs dispatch first, then cleanup. No public housekeeping route, new scheduler, migration, setting or activation switch. Failed cleanup cannot undo already committed publication; endpoint failure remains visible to the helper.
- Removed unbounded rate-limit deletion from OTP issue. Code/grant validity and active counters remain enforced independently of cleanup. Bookings, inquiries, receipts and delivery history are not deleted.

## Checks and boundaries

- Isolated local PostgreSQL only, never permanent Neon: full Python suite checks capped batches, exact expiry, live-code/grant survival, skipping locked rows and recovery-route preservation of inquiries/jobs.
- Final `python -m unittest discover -s src/backend/tests -q`: **146 tests passed, no skips**, 8.807 seconds. `git diff --check` passed. Existing FastAPI/Starlette test-client deprecation warning remains. Isolated PostgreSQL was stopped successfully after the run.
- No frontend, email-template or visual changes; no new screenshot claim. No deployment, real email, source push or hosted database change.
- Shared mail quotas, retention indexes/capacity measurement at volume, provider delivery events and private attention views remain separate unfinished work. This is not completion of C03 or P1-06.
- Initial local PostgreSQL starts were blocked by sandbox socket permissions; permitted retry used only the existing `/tmp/astro-booking-check.AtRTSl` socket and no TCP listener. Stop it after verification.
