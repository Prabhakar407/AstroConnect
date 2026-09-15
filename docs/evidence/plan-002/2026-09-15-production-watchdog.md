# Production watchdog release evidence

Date: 2026-09-15

This record covers the permanent replacement for the unavailable Cloudflare Worker email-alert option. It contains no credentials, customer data, provider response bodies or private operational identifiers.

## Released source and database

- Pull request [#20](https://github.com/Prabhakar407/AstroConnect/pull/20) merged into `main` as `032130c6f46960e27022e5d5f37d3269464268a8`.
- Vercel reported a successful production deployment for that exact merge commit.
- Additive migration `016_recovery_heartbeat.sql` was applied to the existing production database before the source release.
- The restricted application role was rechecked after the migration. It can select, insert and update the singleton heartbeat but cannot delete it or gain schema, database or role-management privileges.
- No customer, booking, inquiry, payment, Calendar, email or Sheet record was created, changed or removed by the migration.

## Certification

- The complete local release suite passed all ten groups, including 271 Python tests with zero skips against isolated PostgreSQL 16, the real local Cloudflare runtime, all browser/responsive/accessibility suites, tracked-secret scanning and both dependency audits.
- Exact candidate GitHub runs [35009346609](https://github.com/Prabhakar407/AstroConnect/actions/runs/35009346609) and [35009408328](https://github.com/Prabhakar407/AstroConnect/actions/runs/35009408328) passed before merge.
- The official-domain production suite passed after release: 15 public pages, all safe API reads, anonymous/private refusals and the booking page at laptop, large-desktop, short-landscape and mobile sizes. It performed zero application writes.

## Real scheduled signal

- Immediately after deployment, `/api/recovery-health` correctly returned `503 attention_required` because no recovery run had yet completed on the new release.
- The existing Cloudflare schedule then completed a genuine recovery pass. At 19:01 UTC, the official endpoint changed to `200 healthy` without a visitor or manual recovery call.
- The public response contains only `healthy` or `attention_required`; it exposes no customer data, provider/account detail, count, identity, run reference or timestamp.
- GitHub **Production watchdog** run [35011190220](https://github.com/Prabhakar407/AstroConnect/actions/runs/35011190220) then passed against the official homepage, API liveness, booking readiness and the real recovery heartbeat. It made four reads and no writes.

## Operational meaning

Cloudflare continues to perform recovery every 15 minutes. GitHub checks the official website and the database-backed completion signal four times an hour. A failed/incomplete recovery leaves the heartbeat stale; durable work requiring attention records an unhealthy result. Either condition fails the GitHub workflow and uses the already-proved repository workflow-failure email route. The monitor never disables bookings or changes provider configuration automatically.
