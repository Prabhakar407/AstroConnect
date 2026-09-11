# Hosted readiness checkpoint — authentication and routing

## Follow-up: authenticated platform 404 responses

The user reports Vercel NOT_FOUND for both /api/health and /api/ready. The branch preview URL was rechecked against the current Vercel GitHub bot link and matches; the deployment is marked Ready. These responses do not establish database failure or successful Python invocation.

Source inspection found cleanUrls enabled alongside explicit /api/index.py and /index.html rewrite destinations. Vercel's current configuration documentation explicitly prohibits extension-bearing rewrite destinations with cleanUrls. Removed the unnecessary cleanUrls option, retaining API-first routing and existing file destinations. Added a hosting regression assertion. No design, credentials, schema, protection, production branch or domain change. This corrects a documented configuration inconsistency; actual hosted routing must still be verified after the replacement preview builds.

Reference: https://vercel.com/docs/project-configuration/vercel-json#rewrites (checked 2026-09-11).

Verification: all four `src.backend.tests.test_hosting` tests pass in the local runtime environment. The restricted runner stalled in its request-thread test and was stopped; the unrestricted rerun completed normally. `git diff --check` passes. This is configuration and application proof, not a simulation of the hosted Vercel router. No UI changed and no new screenshots are claimed. Publish only the existing draft PR branch and observe its replacement preview; do not merge main.

## Earlier checkpoint

Rechecked PR #1: OPEN/draft at 90dc96161297cae60e49e5b0d7be4dd823ad668e, Vercel SUCCESS. No merge, source push or deployment in this check.

The browser tool started with a blank session. Navigating directly to the existing branch preview's /api/health redirected to Vercel Login. This establishes that the deployment-protection boundary is reached, not that Python failed. No credential, protection bypass, access request or unrelated Vercel connector was used. No forms, database writes, email, payment or calendar actions were invoked.

Reviewed actual handlers: /api/health returns status online and booking_enabled false without storage; /api/ready checks the packaged migration checksums against the database and returns storage_ready plus booking_enabled false, or a safe storage error. Neither handler writes records or sends notifications. False booking_enabled is expected while checkout remains unimplemented; it is not an instruction to add a switch.

Current user-only check: in the browser signed into the website's Vercel account, open the branch preview URLs ending /api/health and /api/ready and paste their short visible results. No screenshots, passwords, cookies or connection strings are needed. If either renders the website, reports invocation failure or remains at Vercel access denial, report that rather than claiming readiness.

The user has reported saving provider settings in Production. Vercel Preview settings are separate; branch-specific overrides are supported. Their presence/absence has not been independently verified. Do not assume Production values reach this preview, broadly copy all secrets, relax allowed origins, or remove deployment protection. After observed results, configure only the needed existing connection/identity settings for design/page-by-page and the exact preview origin; then redeploy that preview only. Client Google login requires the client's real account and approved Google origins and remains unverified.

References: https://vercel.com/docs/environment-variables and https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication (checked 2026-09-11).
