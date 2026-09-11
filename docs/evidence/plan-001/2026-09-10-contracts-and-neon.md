# Plan 1 — Booking contracts and permanent Neon connection

Date: 2026-09-10. This records the implementation following the user's instruction to continue local work rather than stop at a status announcement. [Plan 1](../../PLAN-001-booking-inquiries-and-client-calendar.md) remains the sole execution tracker.

## Outcome and limits

Implemented the structured booking, quote acknowledgement, receipt authorization/status and coordinated server-clock foundations. Initialized the user's permanent Neon project and verified the application's restricted pooled connection. Local regression and browser checks passed. **This is not a completed payment/meeting/email system, an actual Vercel deployment or a live booking release.**

No new hosted project, branch, database replacement, billed service, keep-awake loop or activation switch was introduced. The existing marketing design was retained; this pass changes booking behavior, validation and error recovery, not page art direction.

## Permanent resource changes actually performed

| Item | Observed result |
| --- | --- |
| Project | `astro-advice-by-kundan-singh`, `fancy-water-31658958` |
| Owner / plan | NeuraFlow, `neuraflowindia@gmail.com`, organization `org-silent-queen-86019579`, Free `free_v3` |
| Location / version | AWS Singapore `aws-ap-southeast-1`; SQL reports PostgreSQL `16.15 (b357239)` |
| Existing branch / database | Sole/default `production`, `br-rough-lake-b3ira3cc`; `neondb` |
| Schema | Migrations 001–004 applied explicitly and checksums verified; already-applied SQL is immutable |
| Runtime access | SQL-created `astro_booking_app`; pooled endpoint `ep-morning-boat-b3bcu6uq-pooler.c-4.ap-southeast-1.aws.neon.tech` |
| Maintenance access | Existing `neondb_owner`, direct endpoint `ep-morning-boat-b3bcu6uq.c-4.ap-southeast-1.aws.neon.tech`; not for website request handlers |
| Permission proof | No superuser, create-database, create-role, replication, bypass-RLS, `neon_superuser` membership, database CREATE or public-schema CREATE privilege |
| Connection proof | Actual restricted psycopg connection: readiness/checksums, transaction-scoped schedule lock and client-link TLS succeeded; setup rerun succeeded without password replacement |
| Business records | SQL confirmed zero bookings and zero inquiries; no customer submission made in Neon |
| Vercel | Source now pins `regions: ["sin1"]`; no actual deployment, account change or observed execution region |

The provider's connection-string helper initially returned a pooled owner URI. The operator explicitly used the inspected direct hostname for maintenance instead of assuming its return was suitable. Application credentials were generated privately and retained before creating the runtime login. The operation touched only the intended existing project/database.

Credential handling: the Windows-mounted worktree did not enforce owner-only POSIX file modes. The temporary credential file was moved out immediately; it is now in **`/home/anan/.local/share/astro-advice-by-kundan-singh/booking.env`**, outside Git and `/tmp`, with folder mode `700` and file mode `600`. This location is an operator-machine fact, not a credential or Vercel setting value. No secret value is in this document, screenshots, source manifest or chat output. Future deployment transfers only the runtime connection into protected Vercel settings; maintenance stays separate. Do not delete/recreate the role merely to recover a lost password.

## Implementation details

- `domain.py`: stable SHA-256 quote version covers service/name/count/amount/currency/30-minute duration. Errors carry safe codes and field names.
- `models.py`: public booking requires stable request UUID, acknowledged quote, structured real birth date, normalized contact fields and exact booking date/time. Birth time/place/notes are optional and bounded. Unknown time is not midnight; future birth dates are checked against the database clock.
- Migration 003: compatible structured birth/quote/receipt columns; retains legacy text without guessing values; receipt digest/expiry consistency checks; renames challenge `delivered` to `send_accepted`.
- Migration 004: partial index supports the active-hold-per-email lookup.
- `storage.py`: receipt checks precede retry comparison/return; an unchanged authorized retry retains frozen price/deadline. New conflicting, invalid or changed-price requests preserve verification through transaction rollback. Email proof is checked before revealing an email's active-checkout state. Only one active hold per verified email is allowed.
- Status routes: `POST /api/booking-status` and `/api/inquiry-status` require an independent `X-Astro-Receipt` secret, compare its context-bound digest/expiry, limit reads per observed IP and return explicit limited summaries. No birth/contact notes, provider payloads or receipt values are exposed. Complete payment/link status depends on later integrations.
- `requestReceipt.js` / `formApi.js`: independent random UUID plus 256-bit secret; tab storage contains identifiers only. Network errors, server failures and malformed successful replies can recover the same saved inquiry. An uncertain unchanged retry checks status before another save; changed unconfirmed content cannot silently create a duplicate. This is immediate/same-tab recovery, **not** the unfinished cross-device email recovery or complete pre-code recovery UX.
- `useBookingSchedule.js` / booking form: uses server horizon/date/slot data; clamps month navigation; ignores a wrong device clock; rejects stale effect results; pauses hidden/long-idle polling; keeps typed details on read failure. Quote errors have a direct retry action. Verification uses a frozen draft, and new hold payloads carry separate birth fields/quote/receipt.
- `provision.py`: explicit operator-only setup, protected file input, exact host/database checks, no implicit environment fallback, no existing-password reset, forward migrations, explicit table grants, actual restricted connection/permission/TLS recheck. Never invoked from import or an HTTP request.
- `vercel.json`: single Singapore region, existing native Python/API-first candidate retained; no Pro-only product or additional enable flag.

## Verification

| Check | Result / evidence boundary |
| --- | --- |
| Backend suite | **97 tests passed, 0 skipped**, using only isolated local PostgreSQL and synthetic fixtures |
| JavaScript helpers | **11 tests passed** for policy, API address construction and receipt generation/storage |
| Inquiry browser helper | **20 assertions passed**, actual frontend helper with synthetic network/server/malformed replies; no real writes or messages |
| Full mocked form journeys | 1440×900, 2560×1440 and 390×844 passed; booking/questions, verification modal, Home/Contact/Prashna failures and saved inquiry UI; not real delivery/payment proof |
| Actual local API → Neon browser reads | 1440×900, 2560×1440, 1366×650 and 390×844 passed; browser clock fixed to 2035 and US timezone, real server horizon still correct; Prashna ten questions ₹11,000; recovery of simulated availability and quote failures; zero API POST requests and zero page errors |
| Visual inspection | Main agent inspected booking-form images at all four sizes plus laptop/mobile verification dialogs and mobile contact error state; no horizontal overflow. Sticky-header screenshot artifact corrected before final inspection |
| Permanent database | Explicit setup/rerun, role flags/membership/CREATE checks, real runtime TLS/schedule lock, managed patch and zero business-record counts verified |
| Source build | Final allowlisted 129-file package built with the lockfile; Python entrypoint imports without loading provider settings. Vite build is not a native Vercel runtime/bundle test |
| Lint | No errors; existing unused-import/hook warnings remain. No unrelated site-wide cleanup |
| Secret checks | Both current database password values absent from all 129 packaged source files; targeted URI/private-key/Resend-key pattern scan returned no matching file. This is a targeted check, not a complete historical secret-revocation audit |

### Reproducible commands and local artifacts

Run from repository `AstroConnect` unless specified. Integration reset tests accept only the named **local** test database/socket; never substitute the Neon connection.

```bash
ASTRO_TEST_DATABASE_URL='host=/tmp/astro-booking-check.AtRTSl dbname=astro_booking_test user=anan' \
  /tmp/astro-booking-check.AtRTSl/runtime-venv/bin/python -m unittest discover -s src/backend/tests -q
node --test tests/bookingPolicy.test.js tests/apiConfig.test.js tests/requestReceipt.test.js
npm run lint
node scripts/prepare-hosting.mjs
```

Browser environment used:

```text
PLAYWRIGHT_MODULE_PATH=/home/anan/.npm/_npx/9833c18b2d85bc59/node_modules/playwright
ASTRO_BROWSER_EXECUTABLE=/home/anan/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome
ASTRO_BROWSER_BASE=http://127.0.0.1:5186
```

Scripts: `tests/browser-booking-contracts.cjs`, `tests/browser-inquiry-recovery.cjs`, `tests/browser-booking.cjs`. The local Vite proxy used same-origin API mode and port 18000 for the local API. No email/Google/payment credential was supplied to this browser-check server. API access logging was off. Synthetic checks are not physical-device or client acceptance.

Artifacts retained locally:

- Final source directory `/tmp/astro-hosting-source.D576BH`, 129 files / 13,033,477 source bytes; permanent [source hash manifest](2026-09-10-contracts-source.manifest.json). Includes current unpublished design work; HEAD alone is not the implemented revision.
- In that source directory: `npm ci --ignore-scripts --offline`, then `VITE_API_MODE=same-origin VITE_API_URL= npm run build`; Python `api.index` import with the existing tested venv. No Vercel linking, upload or deployment.
- Final four-size real-read screenshots/results: `/tmp/astro-booking-contracts-final/`; before image `/tmp/astro-booking-contracts-before.png`.
- Mocked journey captures: `/tmp/astro-booking-contracts-mocked/`, with final repeat under `/tmp/astro-booking-contracts-mocked-final/`.
- Local regression PostgreSQL files `/tmp/astro-booking-check.AtRTSl/data`; venv under the same parent. These are disposable local verification tools, not hosted customer infrastructure.

## Failures found, corrected and remaining review findings

1. Five existing tests initially failed because their fixture classes did not yet expose the new receipt-aware hold helper. Fixed those fixtures; the complete suite then passed. No production authorization bypass was introduced for tests.
2. Vite on the Windows-mounted source initially served old cached frontend code despite a source edit. Restarted **only this check server** with `CHOKIDAR_USEPOLLING=true`; verified the new DOM and repeated checks. Do not treat old cached screenshots as current proof.
3. Element screenshots initially placed the sticky header across the middle of the long form. Changed capture to top-of-page full-page clipping, then recaptured and inspected. This was a capture artifact, not a reason to redesign the header.
4. A failed quote lookup had no direct retry. Added “Check fee again”, preserved details and verified recovery of the same selection.
5. The first expanded provisioning recheck read `pg_stat_ssl` behind pooling and reported failure: it described the internal pooler link, not our application's TLS. Actual libpq `ssl_in_use` was true. Corrected the check and reran setup successfully. Database schema/access were not broken and no customer data was involved.
6. Active-checkout lookup originally preceded checking the new request's email proof. Moved proof consumption before that private lookup inside the same transaction. Regression checks show an unverified caller does not learn that state and a valid conflicting request keeps its proof through rollback.
7. Existing Vite bundle warning remains (~694 KB minified main JS versus the 500 KB warning threshold). Existing unused imports/hooks remain; no unrelated performance/layout rewrite was bundled into this change. No new broad security certification is claimed from an offline install.
8. Final booking information order/review/payment/status presentation, full before-code/cross-device recovery, global send budgets and retention cleanup are still planned work. Source attribution and private inquiry/attention lists remain P1-07/P1-09. These are not silently marked complete by the foundations above.

## Next steps and authority boundary

- User-only account action: direct Resend Free sending-domain verification for permanent `mail.astroadvicebykundansingh.com`, following [the setup instructions](../../../BOOKING_SETUP.md#next-account-step--resend-sending-domain). Public nameservers identify Vercel DNS. No Marketplace installation, card, receiving-mail change, API key in chat or screenshot is required. Sender verification does not authorize customer sends.
- Continue the remaining local email/identity/recovery and delivery implementation without another approval request. Establish scoped real-send recipients before provider verification. Google consent/login must use the existing client project/account; no billed Google hosting.
- Vercel remains user-operated in the other account. Actual native package build, `/api` routing/raw bodies, HTTPS cookies, client IP trust, concurrency/wake/usage proof and reviewed-source publication remain open. Do not deploy the old remote code or call the local-to-Neon checks Vercel proof.
- No payment/Meet/notification worker is complete. Finish delivery/Calendar and Razorpay stages, full visual/security/failure checks, backup/monitoring decisions, authorized publication/PR and client handover before claiming Plan 1 done.
- Credentials stay in persistent owner-only operator storage. This turn's `astro-contracts` browser, API process 328852, Vite process 329937 and isolated PostgreSQL server were stopped after verification; ports 5186/18000 are no longer serving. The user's port-5183 preview and permanent resources were not changed. No business data or evidence files were deleted.
- Final readback: 62 local documentation links resolved; `git diff --check` passed; all 129 current source hashes match the retained manifest. The final source package built successfully, the Python entrypoint imported, and the complete three-size mocked browser journey was repeated successfully after the last frontend change.
