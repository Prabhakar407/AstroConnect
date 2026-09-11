# Plan 1 — Local baseline and first hosting-preparation checkpoint

Date: 2026-09-10. Stages: P1-01 locally verified; P1-03 **in progress**, not complete. Branch `design/page-by-page`, HEAD `3f09f6b91a272419ba13afba2fa1731c13bc996d` plus existing uncommitted changes and this slice. [Plan 1](../../PLAN-001-booking-inquiries-and-client-calendar.md) remains the only progress tracker.

This report retains the first preparation checkpoint below. A later **Switch-removal follow-up** at the end records the subsequent 79-test source and Vercel access check; the original 75-test manifest remains historical, not the later source fingerprint.

## Outcome

The existing website/backend baseline was rerun before editing. The first bounded preparation slice is implemented and checked locally. Public checkout and booking-purpose verification remain disabled. No account, billing link, hosted database, real email/invitation/payment, deployment, commit, push or PR was created. No old dummy store was opened, migrated or deleted.

| Area | Implemented in this slice | Proof limit |
| --- | --- | --- |
| Hosting candidate | Native `api/index.py` exports the existing FastAPI app; Vite stays the framework; API rewrite precedes SPA fallback; 30-second function ceiling; no cron/beta Services/paid memory setting | Configuration assertions and local source build/import, not a Vercel platform build or hosted routing test |
| Clean source package | `scripts/prepare-hosting.mjs` copies only approved source/config/assets to a new temporary folder, rejects indirect files, emits hashes and excludes archives, screenshots, tests and private configuration | Filename review and limited credential-pattern checks performed locally, not a complete secret scan; actual Vercel upload/function bundle still needs inspection |
| Dependencies | Runtime requirements pinned against tested constraints; unused legacy/Calendar SDKs excluded; React Router 7.18.3, PostCSS 8.5.28, nanoid 3.3.18 | Point-in-time advisory results, not a security certification |
| Website/server connection | Both request helpers share explicit configuration; `same-origin` preserves `/api` once; absent/conflicting/unsafe config rejects; redirects and cached API reads rejected; HTTP errors retain status | Local real API smoke plus mocked form/private journeys; no hosted HTTPS cookie/provider callback proof |
| Resource use | Removed unconditional app-load backend warm-up | Hidden/idle browser polling, global email budgets, provider/helper quotas and actual connection limits remain open |
| Scheduling | New holds/availability enforce at least 30 minutes' notice using DB time; unchanged internal retries retain frozen fee/deadline; policy returns DB clock/horizon/slots/notice | Public receipt-bound checkout, quote acknowledgement and browser-authoritative time integration remain open |
| Private calendar rules | Historical server reads allowed; past writes still denied; whole-day closure protects earlier confirmed appointments and writes only future claims; past partial ranges/Sundays/empty ranges denied | UI history navigation, operation retry identity and exception/inquiry lists remain open |
| Database preparation | Explicit secure remote configuration; no startup/session options or indirect host override; transaction-local timeouts and transaction locks; automatic prepared statements disabled; connections close on success/failure | Local PostgreSQL only; Neon pooled/TLS/role/concurrency/cold-wait proof remains open |
| Schema maintenance | Readiness compares every packaged migration's checksum; maintenance command requires a separate direct URL and refuses known Neon pooler hosts | No new migration; runtime/maintenance least-privilege role installation remains open |
| Content consistency | Corrected primary phone and split office hours in search-engine metadata; no visible page redesign | Marketing completeness/content approval remains P1-09/P1-13 |

The Vercel Functions/routing guidance kept the preparation on native capabilities. Neon guidance prompted transaction-local settings and a separate direct maintenance connection without an ORM/runtime rewrite. Browser guidance required actual screenshots and a post-capture review; it did not authorize a design overhaul.

## Fresh verification

Environment: Node 20.19.5; Python 3.12.3; Vite 8.1.5; PostgreSQL 16.2 local tooling; Chromium from the installed Playwright verification environment. PostgreSQL 16.2 is an existing isolated test binary, **not** a recommendation to deploy an old patch version. Repeat relevant tests on the supported major/current patch chosen for Neon.

| Check | Result |
| --- | --- |
| Existing Python suite before edits | 58 tests passed, zero skips, on newly initialized local-only PostgreSQL |
| New gap cases before fixes | Reproduced notice, metadata, history, clock, closure, connection and checksum failures; not marked passing |
| Final Python suite | 75 tests passed, zero skips, in a fresh pinned environment; repeated successfully after restarting the disposable database. Includes prior concurrency/rollback/OTP/private-auth cases and new preparation cases; not backup-restore proof |
| JavaScript | Seven tests passed: four connection-mode/path checks and three policy/fee tests; also run individually to retain distinct test counts |
| Existing mocked public/private browser suites | Both passed before edits, after wiring changes and again after dependency patches at 1440×900, 2560×1440 and 390×844; no application errors or reported document/control overflow |
| Actual unconfigured local API + website | Same-origin smoke passed at those three sizes plus 1366×650: six services, JSON 404, no-store replies, unavailable readiness/policy, private entrance locked, checkout disabled even on a forged paid request |
| Frontend build | Passed for working tree and the final 124-file, 13,011,144-byte clean source package, using a fresh locked install and explicit same-origin mode; incumbent >500 kB bundle warning remains |
| Lint | 60 existing warnings, zero errors; no warnings in changed application helpers/entrypoint shell or staging script. No unrelated page cleanup was included |
| npm advisory check | Initial four package advisories; compatible patch updates applied; full final audit reports zero known vulnerabilities |
| Python advisory check | App packages had no reported advisories; new venv's bundled pip 24.0 was flagged. Temporary installer upgraded to 26.2; repeat scan reports zero known vulnerabilities, including the pinned test HTTP helper |
| Dependency consistency | Fresh runtime-only install and `pip check` passed; native entrypoint imports without network calls and finds all six services/two migrations |
| Whitespace/source preservation | `git diff --check` and explicit new-file/document checks; no secret-bearing historical backend deletion diff printed |

The HTTP test client still emits the inherited Starlette/httpx deprecation warning. It is a test-tooling follow-up, not a failed test or reason to change production authentication. The first restricted attempt could not bind the disposable PostgreSQL UNIX socket; the same isolated checks passed with local-process permission, without weakening the test database guards. A lint attempt inside the first staged copy lacked the repository lint configuration and scanned generated files; that was not a source-lint result. The staging allowlist was corrected to carry lint/ignore configuration, and the authoritative scoped source lint was rerun.

Package-manager review also caught npm removing unrelated native-platform `libc` metadata from the lockfile. Those entries were restored; only the intended four package versions and associated dependency/integrity metadata changed. The router advisory concerns unstable RSC APIs, which this HashRouter site does not use; updating remains sensible preparation, not evidence of a demonstrated site exploit. [Maintainer advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2), [PostCSS maintainer advisory](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp).

### Commands and isolated resources

The database guard remains unchanged: database name `astro_booking_test`, UNIX socket under `/tmp/astro-booking-check.*`, no TCP listener. New run directory: `/tmp/astro-booking-check.AtRTSl`. The earlier `/tmp/astro-booking-check.QCSqfy` provided existing PostgreSQL binaries and the baseline Python tooling only; its old database was not the test target.

```bash
# After starting the named disposable local database:
ASTRO_TEST_DATABASE_URL='host=/tmp/astro-booking-check.AtRTSl dbname=astro_booking_test' \
  /tmp/astro-booking-check.AtRTSl/runtime-venv/bin/python -m unittest discover -s src/backend/tests -v
node tests/apiConfig.test.js
node tests/bookingPolicy.test.js
npm run build
npm run lint
npm audit
node scripts/prepare-hosting.mjs
```

Browser scripts: [public forms](../../../tests/browser-booking.cjs), [private calendar](../../../tests/browser-private-calendar.cjs), [actual unconfigured same-origin smoke](../../../tests/browser-hosting.cjs). Use the environment-specific Playwright executable/module/output settings documented in the [backend runbook](../../../src/backend/README.md). The local proxy [test configuration](../../../tests/vite.hosting.config.js) is not deployed.

Before/after screenshots and browser JSON were produced under the new run directory; selected synthetic captures and results are retained in `.impeccable/plan-001-preparation-2026-09-10/`. The [source/evidence manifest](2026-09-10-source-manifest.json) records file hashes for reproducibility. A pre-edit full source manifest was not retained; the baseline is tied to its command order, branch/HEAD and screenshots, not claimed to be a separately reproducible clean commit.

Final source digest: `f04ca5570ef5e5a92cf57f855b1e2929a16ab0a9faed2e8d237763e6f0971563`. Manifest covers 124 deployable source/config/asset files, 11 verification/script files and 19 retained evidence artifacts. The last restricted npm audit could not resolve its registry; a permitted read-only retry succeeded with zero advisories, and its JSON is retained. Ten current documents' local links were checked; no missing target was found.

Cleanup: stopped this run's local Vite servers on 5185/5186, Python server on 18000, `astro-plan1` browser session and disposable PostgreSQL server. Also stopped the earlier restricted test-client process. Kept the local test data/tooling/staging folders and evidence; did not stop another preview or delete any inherited files. This is local process cleanup, not a hosted resource change.

### Visual critique and recheck

Inspected the baseline booking laptop and private phone layouts, then the changed desktop/phone/error captures and real unconfigured screens. No styles, artwork, section structure or form layout were edited. Existing private-day captures were byte-identical across the initial wiring change; booking animations cause timing differences, so their files were inspected visually rather than labelled pixel-identical.

The first native smoke screenshots were premature: scroll-triggered content had not settled and a scrolled sticky rail overlaid the capture. Fixed the **test capture**, traversed the page to reveal its existing sections, returned to the top, waited for animations and repeated the four-view smoke. The mocked suite also froze the date rather than letting a controlled clock advance; this still stalled some animation captures. Replaced that test-only frozen clock with a running, predictable clock and repeated all three public viewports. Final retained captures use the corrected routines; baseline captures are kept as original evidence, including their timing limitations. Future P1-09 still needs the planned booking reading order, mobile agenda-first layout, notice/clock UX and completed checkout/dialog states; this preparation does not close T17/T27.

Visual findings carried forward: the large-screen form has uneven column heights when all Prashna slots are visible; phone booking is a long single-column form; the private phone page places closure controls before the day's agenda. These are existing layout/reading-order concerns for P1-09, not evidence that this preparation redesigned or completed the experience. Corrected captures show the saved-detail error state and locked entrance without clipping; no visual perfection claim is made.

- [Final large-screen booking, synthetic journey](../../../.impeccable/plan-001-preparation-2026-09-10/final/booking-questions-2560.png).
- [Phone save-error with retained details, synthetic journey](../../../.impeccable/plan-001-preparation-2026-09-10/final/booking-save-error-390.png).
- [Private calendar on phone, synthetic identity](../../../.impeccable/plan-001-preparation-2026-09-10/final/admin-day-390.png).
- [Short-landscape unconfigured booking, actual local API](../../../.impeccable/plan-001-preparation-2026-09-10/native/same-origin-booking-1366.png).
- [Locked private phone entrance, actual local API](../../../.impeccable/plan-001-preparation-2026-09-10/native/same-origin-private-390.png).

## Source/data-flow review and remaining work

| Entry | Current destination | Remaining integration |
| --- | --- | --- |
| Homepage request / Contact form | `contact` email-code purpose → `/api/contact` → PostgreSQL inquiry + pending job intent | Separate secure retry receipt, source attribution, actual Resend delivery/client notification and protected retrieval |
| Prashna service inquiry | `prashna` purpose → `/api/prashna` → inquiry + pending job intent | Same delivery/recovery work; not a paid question or reservation |
| Booking/service Book Now links | `/#/booking` selection → `/api/booking-policy`, `/api/availability`; booking-code and `/api/book-appointment` disabled | Structured birth inputs, server quote acknowledgement, receipt-bound checkout/status, Razorpay capture/order proof, meeting and delivery |
| Private page | `/api/admin/*` → pinned Google identity/session/CSRF and protected PostgreSQL operations | Real Google consent, history navigation, safe retry, inquiry/exception views, Calendar integration |
| WhatsApp links | Explicit user-opened link to confirmed client phone | No automatic WhatsApp/SMS integration or alert claimed |

No active legacy Redis/Sheets/SMTP fallback or service-worker registration was found in the inspected runtime paths. Retired `/api/help` remains 410 and does not dispatch. Existing historical SMTP/Upstash exposure still needs owner-authorized credential rotation; source cleanup is not revocation. Marketing header/footer retain the approved secondary phone, while booking/WhatsApp use the confirmed primary number. The footer/Home selection still has five service entries in some places; all six booking catalogue choices exist. Complete the six-service link/content inventory during P1-09, without redesigning the header/footer here.

**Mandatory P1-03 follow-up, before treating preparation as complete:** structured fields/forward schema; separate receipt authorization and limited responses; acknowledged/frozen quote version; one active checkout per verified email; policy/availability response and browser clock agreement; hidden/idle polling limits; complete feature readiness; real native Vercel build/bundle/path preservation; runtime versus maintenance roles; connection/concurrency and cold/pool-wait bounds. Do not expose `Store.hold` or `confirm_paid` as public shortcuts.

**Account-dependent proof:** exact project/source mapping and stable approved test origin, actual Hobby execution, Neon pooled/TLS transactions and Free-plan configuration, approved test recipients, Google/Resend/Cloudflare and later Razorpay. No current test proves email delivery, Meet joining, provider callback signatures, queue recovery, quota fit, backup restoration or customer acceptance. T01–T29 remain pending integrated evidence, even where this slice supplies useful local coverage.

**Next user-only item:** the Vercel dashboard URL for this website's project, requested without credentials. Do not re-ask for the known domain, ownership or Google project identifiers. Continue the named local contracts while scoped account inspection is arranged. No upgrade/card is required for that inspection.

Primary implementation references checked: [Vercel native Python functions](https://vercel.com/docs/functions/runtimes/python/api-directory), [Python packaging](https://vercel.com/docs/functions/runtimes/python), [official configuration schema](https://openapi.vercel.sh/vercel.json), [Neon transaction pooling](https://neon.com/docs/connect/connection-pooling). The modern docs recommend Services for new multi-framework apps; this candidate uses the still-supported file-based function route to avoid that beta dependency. Its actual Vercel build/routing must pass before adoption; discuss the smallest supported alternative if it does not.

## Switch-removal follow-up — 2026-09-10

- User supplied the target `neura-flow1/astrologer-website-kundan-singh` and explicitly requested less complexity. Read-only target lookup returned `INVALID_ARGUMENT`. Team discovery succeeded but exposed only `neura-flow-s-projects`; its project list did not contain the target. No target settings, deployment or billing information was available. Correct connected-app scope is required, not a new project or another URL request.
- Removed the redundant `email_enabled`/`admin_enabled` settings and environment lookups in `application.py` and the extra admin switch condition in `admin.py`; updated the admin fixture. Actual provider settings suffice. Requests still require verification secret/storage or the authorized Google identity, session, origin and anti-forgery checks. No import-time send and no connection to a real email/Google provider in this test run.
- Added four focused preparation tests. Before correction: one failure and one error reproduced the redundant off-switch; two negative tests passed. Afterwards: **79 tests passed, zero skips**, in 3.203 seconds on the same disposable PostgreSQL fixture. Earlier 75-test evidence is not relabelled. Command: `ASTRO_TEST_DATABASE_URL='host=/tmp/astro-booking-check.AtRTSl dbname=astro_booking_test' /tmp/astro-booking-check.AtRTSl/runtime-venv/bin/python -m unittest discover -s src/backend/tests -q`.
- Repeated `tests/browser-hosting.cjs` against the actual unconfigured local API at 1440×900, 2560×1440, 390×844 and 1366×650: all passed, no application errors or horizontal overflow. Inspected homepage, short-landscape/desktop booking and phone private entrance; no interface styles/layouts changed. Browser verification guidance was used for the fresh page/control/error and screenshot checks. Configured sign-in behavior is covered by simulated-identity integration tests, not a real Google login or a changed-screen claim.
- The simplification review also removed the proposed stale-health auto-stop requirement from C09 and named the booking placeholders' replacement during P1-08/P1-09. It did not remove validation, introduce a replacement flag, change prices/rules or implement checkout.
- [Follow-up source/result manifest](2026-09-10-simplification-manifest.json) identifies the four changed Python/test files and retained synthetic screenshots/results. `git diff --check` passed; retired setting names occur only in regression tests/runbook/history, not active runtime checks. No frontend build rerun was necessary for these backend-only edits; the earlier build/advisory result remains dated evidence, not a fresh scan.
- Local setup correction: the first test-database start omitted its explicit socket options and failed at the absent default socket directory. Restarted with the named `/tmp` socket and TCP disabled; no hosted database was touched. Existing test-tool deprecation warning remains. Temporary database and browser/server processes are stopped after verification; records/artifacts retained. No real sends, billing, deployment, commit/push or PR.
