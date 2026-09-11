# Plan 1 — Archived hosting options (not execution instructions)

**Archived on 2026-09-10. Everything below is decision history, including headings that say “current”, “next” or “recommendation”.** The latest user clarification requires **no mandatory Vercel Pro feature**, not survival of a Vercel shutdown. The B1 requirement to duplicate/move all screens was an overinterpretation. Read [the current hosting/alignment review](PLAN-001-no-card-hosting-review.md) and [Plan 1](PLAN-001-booking-inquiries-and-client-calendar.md) for the corrected scope. No archived provider instruction authorizes setup, billing or a rewrite.

Reviewed: 2026-09-10. Status: **options review, not an approved replacement or implementation proof**.

[Plan 1](PLAN-001-booking-inquiries-and-client-calendar.md) remains the execution tracker. This companion records the new constraint, researched alternatives and the checks needed before choosing one. It is not Plan 2.

## Current correction — booking must not depend on Vercel Pro, 2026-09-10

**A2 below is superseded, not the current recommendation.** The user clarifies that Vercel Pro may fund the marketing website only; appointments, inquiries, the private calendar and their processing must remain usable without Pro ever being purchased. The previous A2 proposal hosted those handlers on Vercel and did not satisfy this stricter dependency boundary.

Vercel supports FastAPI on Hobby, and that free tier does not silently become paid simply because Python is deployed. However, [Hobby's published rules](https://vercel.com/docs/plans/hobby) restrict commercial use and pause functionality at usage limits. Low booking volume does not establish a commercial exception. Preserve the user's present pre-launch arrangement; do not generalize it into permanent commercial approval or ask them to reconfirm the same facts.

**Corrected direction B1, subject to feasibility proof:** put the operational application on a separate genuine no-card host. Cloudflare Workers Free with static assets, Queues and scheduled recovery is the candidate to evaluate; it must execute the actual handlers, not relay them to Vercel. Retain the existing database/business contracts, email/Google connections and proposed backup requirements. No billing activation, provider migration or backend rewrite is authorized by this clarification.

The dependency review must cover the whole journey:

- Host booking, inquiry, private-calendar and booking-status screens and their required assets on the free origin, with an approved direct access route. An API elsewhere is insufficient while all usable screens still depend on Vercel.
- Keep API handlers, sessions/secrets, Google consent callbacks, Razorpay/Resend callbacks, delivery processing, schedules and customer email/receipt links off Vercel. Do not route the free application's traffic back through a Vercel-only proxy, redirect, login or middleware.
- If Vercel remains for marketing, its links may lead to the independent application, but Vercel must not be needed to reach that application. All Home/Contact/Prashna inquiry purposes need an accessible independent equivalent, without creating a second data store or changing their verification rules.
- If the requirement includes the entire marketing website continuing when paid hosting is unavailable, a free hosting route for those pages is also needed. Cloudflare supports serving the existing built static site; deciding a canonical domain, approved alternate URL or later migration is separate from this read-only review. Do not promise that independent records keep an unavailable Vercel website visible.

Official evidence: [no-card Workers](https://www.cloudflare.com/products/workers/), [static asset hosting and free delivery](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Python package compatibility](https://developers.cloudflare.com/workers/languages/python/packages/). Current Free limits include 100,000 requests/day and 10 ms CPU per HTTP request/Cron invocation. Existing source uses synchronous psycopg transactions/advisory locks and Google HTTP libraries; Cloudflare Python package/HTTP support differs and its Python runtime is labelled beta. Neither direct compatibility nor a required full rewrite has been proven. Do not declare production suitability from a marketing free-tier offer.

**Next proof, before committing to a host:** bounded compatibility and resource-use assessment; preserve PostgreSQL transaction semantics and all security/business tests. If adaptation requires a main runtime/language change, present the specific work and regression scope before implementing it. Add T29: in an isolated test, make Vercel unavailable and complete the authorized synthetic operational journeys using the independent origin. Never disable a real deployment or change a real billing plan for this test. Hosted provider actions still require their test consent.

**Architecture review:** the requirement is low-volume paid booking without subscription dependence, not maximum platform reuse. A2's handler dependency is a V2 structural mismatch; leaving only the API independent while UI/callbacks still require Vercel would compound it (V3). B1 complexity is provisionally about 5/10 during compatibility work, not a measured maintenance score; effort and monthly maintenance hours remain unknown. Hard question: can the complete journey run when Vercel is unreachable? Stop selection if no-card/commercial eligibility, runtime limits or T29 cannot pass; keep accepted records/recovery intact. Existing non-destructive stop rules apply. No automatic record deletion, unused-system shutdown or invented staffing requirement.

Evidence: current plan, `src/App.jsx`, `src/lib/formApi.js`, backend storage/dependencies and relevant C05/C06/C09 contracts inspected. Documentation/research only; no code changes, deployment, account/billing change or runtime/provider tests.

## Superseded A2 recommendation — retained as decision history

**Launch scope is settled:** Vercel Pro is the one approved paid infrastructure exception once the business launches. All other supporting services must remain genuinely free and no-card while within their limits, including years after launch. Do not ask the duration question again. Low booking volume is the user's forecast, not measured total traffic or a guarantee against quota exhaustion. No paid Marketplace bundles or silent upgrades are authorized; create supporting accounts directly with their providers when authorized, not as bill-through-Vercel subscriptions.

**Recommendation A2:** keep both React/Vite and existing Python/FastAPI booking handlers on Vercel; retain Neon Free and Resend Free; use Cloudflare Workers Free + Queues + a Cron Trigger only as a small delivery/recovery helper. This combines the useful parts of earlier A/B without moving the main Python backend to Workers. It replaces QStash in the recommendation because the latter's specific no-card activation remains unverified. It does not authorize provisioning or declare the integrations tested.

| Need | Recommended component | Published limits / selection boundary |
| --- | --- | --- |
| Website and booking execution | Existing Vercel; Pro at launch | Native FastAPI is supported. Keep within included usage; Pro metered overages are not an unlimited approved expense. No paid add-ons. |
| Authoritative records | Neon Free PostgreSQL | No-card/no time limit advertised; 0.5 GB and 100 CU-hours/project/month. Actual account quotas and compute fit remain to verify. |
| Dispatch, retries and recovery | Cloudflare Workers Free + Queues + Cron Trigger | Workers no-card signup; Queues Free 10,000 operations/day, 24-hour retention. A normal delivered message uses about three operations; retries also count. |
| Email verification and notifications | Resend Free | No-card onboarding; 3,000 emails/month, maximum 100/day shared across all transactional uses. |
| Client login and online meetings | Existing Google account/project, Google identity and Calendar-created Meet conferences | Keep project unbilled. Prove client authorization and conference capability. No paid Workspace subscription or separate billed Meet API assumed. |
| Retained backup destination, proposed | Private client-owned Google Drive free storage | Up to 15 GB shared with Gmail/Photos, not a dedicated backup allowance. Check existing space, cap retention and encrypt archives before upload. |
| Backup execution, proposed | GitHub Actions Free, standard Linux runner in a client-controlled private repository | 2,000 included minutes/month on GitHub Free; blocked without a payment method when quota is exhausted. No larger runners, paid account, backup artifacts/caches or public repository storage of customer data. |
| Payments, separate business expense | Existing Razorpay plan | Standard gateway has no setup/maintenance fee, but successful-payment fees and applicable taxes are deducted from settlements. Do not describe this as free processing or interpret the infrastructure rule as cancelling the requested integration. |

Primary evidence: [Vercel FastAPI](https://vercel.com/docs/frameworks/backend/fastapi), [Neon pricing](https://neon.com/pricing), [Workers no-card offer](https://www.cloudflare.com/products/workers/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), [Resend pricing](https://resend.com/pricing), [Resend no-card onboarding](https://resend.com/philosophy), [Calendar usage](https://developers.google.com/workspace/calendar/api/guides/quota), [Google storage](https://support.google.com/mail/answer/6374270?hl=en), [Drive API usage](https://developers.google.com/workspace/drive/api/guides/limits), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Razorpay fees](https://razorpay.com/pricing/).

### A2 implementation and proof boundaries

- Cloudflare officially supports [publishing to a queue over HTTP](https://developers.cloudflare.com/queues/examples/publish-to-a-queue-via-http/) from Python/other hosts, and [consumer Workers that POST to external APIs](https://developers.cloudflare.com/queues/reference/how-queues-works/). Keep payment/booking/Calendar/email logic on Vercel; the small Worker relays opaque job IDs to one fixed authenticated handler. Never accept an arbitrary destination URL from queue input or include customer details/credentials in messages. Bind credentials to the correct account/test environment, authenticate the receiver and tolerate duplicate/reordered work.
- Use one [Cloudflare Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/) for the proposed 15-minute safety sweep, including before Vercel Pro. No visitor-dependent recovery or keep-awake pings. Saved PostgreSQL jobs outlive Cloudflare's 24-hour queue retention; replay only unfinished eligible work, not stale confirmations or expired OTPs. A successful handler acknowledgement must mean a durably recorded result. Verify Worker CPU/time/request limits and Vercel timeout/retry interactions; do not assume a small helper is automatically within quota.
- Vercel-native Python avoids a main backend port, but package/dependency compatibility, Neon pooling/locks, cookies, callbacks, raw signed bodies and same-origin API routing still need real-host proof. No Vercel Workflow/Queues beta, paid storage, monitoring add-on or marketplace subscription is necessary for this recommendation.
- Free Neon compute includes recovery sweeps, form/admin reads, retries, backup exports and test activity, not just completed bookings. At minimum 0.25 CU with five-minute idle suspension, a 15-minute round-the-clock sweep alone is approximately 60 CU-hours per 30 days before ordinary traffic; this is a planning estimate, not a benchmark. Measure headroom and reduce unnecessary work without weakening recovery.
- Backup recommendation is new and explicit, not implemented. Use PostgreSQL's supported consistent export tooling on a bounded GitHub job; encrypt before upload; use limited app-file Drive consent and separately recoverable encryption keys. Never place database archives in Git, public downloads, Actions artifacts, logs or caches. Approval of this table is not consent to access the client's Drive or create a repository/workflow. Verify client ownership/source permissions, protected workflow access, account no-card state and shared usage first.
- Scheduled GitHub workflows can be delayed or dropped under load. They are proposed for backups, never time-critical paid-booking delivery. [Schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Define retention and acceptable data-loss window with D04/D07, monitor the last successful verified export independently, handle missed runs/storage-full/revoked consent, and perform an isolated restore before accepting this route. Do not claim six-hour Neon recovery plus an untested nightly export is complete backup protection.
- Google documents standard Calendar/Drive API use without additional charges and planned excess-usage pricing changes later in 2026. Keep billing unlinked and verify current account eligibility/quotas at onboarding and release. Free terms cannot be guaranteed for the next two years; a future incompatible rule triggers review, not automatic billing.
- Vercel Pro is not a guaranteed flat maximum bill. [Spend Management](https://vercel.com/docs/spend-management) can notify/pause but may act minutes after the threshold; it excludes Marketplace subscriptions, seats and separate add-ons and can affect all projects on a team. Inspect the client team and agree resource/overage boundaries before activation; never auto-pause unrelated projects or promise a perfect hard ceiling.

**Next:** validate A2 account eligibility, hosting/helper fit and the proposed private backup route, then rebase the affected Plan 1 contracts. No new question about whether Vercel Pro is acceptable is needed. The earlier A/B/C comparison below is retained as decision history; pending-duration statements there are superseded by this clarification.

## 1. The changed requirement

The user now requires free infrastructure without entering payment details, linking a billing account, accepting automatic overage charges or relying on a card-backed trial. This supersedes the previous willingness to consider mandatory Google billing. Cloud Run, Cloud Tasks and the proposed billed Google Scheduler/Storage/Secret Manager route cannot proceed under this requirement. Leave `astrologer-kundan-singh` unbilled and preserve its existing configuration.

Do not confuse a free allowance on a paid billing account with a free plan. A provider requiring billing, a card for identity verification, a paid marketplace subscription or automatic upgrade fails this selection gate. Do not attempt a workaround or provision it anyway. Account screens and the applicable service terms must match the researched offer; lack of a card alone is not proof against an invoice obligation.

The user has confirmed Vercel Pro at launch as the sole paid infrastructure exception; all other services remain no-card long-term within free limits. This is a future plan decision, not authority to purchase today or change the domain. Razorpay processing fees/merchant verification and domain renewal remain separate existing business costs.

## 2. Requirement anchor and inspected code

- Jobs: accept one correctly priced paid booking per slot; verify and deliver email/Meet details; save inquiries; protect the client's availability calendar; recover failures and preserve records.
- Scale: pre-handover, dummy records; ten possible 30-minute sessions on a working day. Actual future visitors, inquiries and failed/abandoned checkout volume are unknown.
- Existing `src/backend/storage.py` uses psycopg, PostgreSQL transactions and `pg_advisory_xact_lock`; this is not a file-based store. `delivery_jobs` already holds durable work intent. `application.py` uses FastAPI and explicit provider gates; requirements include Python Google libraries and psycopg binary dependencies.
- Preserve six services/prices, 30-minute sessions, approved D10 notice, IST horizon, private-calendar protections, phone cancellation and visual design. Hosting reassessment does not authorize changing these or rewriting the backend.
- The previous provider connections were incomplete. Replacing the hosting proposal does not mean deleting a working Google delivery integration. Existing local checks are still dated evidence, not proof of any proposed host.

## 3. Options

### A. Vercel Hobby + Neon Free + QStash Free + Resend Free

**First candidate for preserving the existing code during the currently permitted development phase.** Retain the existing React/Vite website and Python/FastAPI booking server. Vercel officially supports FastAPI; this is not an assumption that Python must be rewritten as JavaScript. Adapt entrypoint/build/routing and prove the actual dependencies, connection limits and execution time. Avoid adopting Vercel Services beta solely to combine deployments: first evaluate the supported native FastAPI route and, if needed, a separate backend project with a same-origin website proxy. No publication is authorized by this review. [FastAPI support](https://vercel.com/docs/frameworks/backend/fastapi).

Use Neon for the existing PostgreSQL model; add QStash for immediate background delivery, retries and a recurring recovery request. The database, not QStash logs, remains the source of unfinished-work truth. No extra Redis database, second queue or always-running worker is proposed.

| Part | Published evidence | Gate or limitation |
| --- | --- | --- |
| Vercel Hobby | Free plan; usage exhaustion can pause functionality until its reset. FastAPI supported. | Current non-commercial arrangement is user-reported, not independently verified. Paid commercial transition conflicts with a permanent no-card rule. Hobby team collaboration and Git-source permissions require inspection; no password sharing or account-ownership workaround. |
| Neon Free | Pricing lists no credit card/time limit, 100 CU-hours/project/month, 0.5 GB/project, short recovery history. | Direct pricing fetch failed during review; official indexed pricing was readable. Verify current account limits and quota failure behaviour; no claim that the whole app will fit without measurement. |
| QStash Free | Published $0 plan, 1,000 messages/day, ten active schedules, seven-day max message delay, three-day dead-letter history. | **QStash-specific no-card activation and non-billable excess handling remain unverified.** Upstash's explicit no-card help text refers to free databases, not specifically QStash. Do not generalize it into a completed no-card proof. Verify the actual QStash account flow/terms or provider clarification before selecting this package. |
| Resend Free | Published no-card onboarding, 3,000 emails/month and 100/day; paid overages are a separate paid-plan feature. | Verification codes, both participants' confirmations, inquiries and retries share limits. Check current sending-domain and recipient restrictions and the account's actual free-plan state. |

Sources: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Neon pricing](https://neon.com/pricing), [QStash pricing](https://upstash.com/pricing/qstash), [Upstash payment-method wording](https://upstash.com/docs/common/account/add-payment-method), [Resend onboarding](https://resend.com/philosophy), [Resend pricing](https://resend.com/pricing).

Important implementation implications:

- Vercel Hobby's native cron runs at most daily, with loose timing. It cannot implement the proposed 15-minute recovery check; do not disguise 96 different daily cron jobs as a replacement. QStash schedules are the candidate replacement. [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [QStash schedules](https://upstash.com/docs/qstash/features/schedules).
- One 15-minute schedule creates 96 scheduled calls/day before ordinary deliveries and retries. Include both test/live accounts, other projects and usage across the applicable quota scope. Scheduling cannot be implemented by browser timers or an in-process background loop.
- Keep jobs and deadlines in PostgreSQL. Do not schedule ten-day reminders directly into a provider with a seven-day delay limit. Meeting creation is immediate after verified payment; no requirement currently demands ten-day queue retention.
- Replace Google service-account task verification with QStash's supported signature verification: exact body/destination, active/next signing keys, replay/duplicate safety and explicit environment boundaries. Never trust the mere presence of an identifying header.
- A Vercel function must finish bounded work within its limit. `waitUntil`, threads or framework background tasks do not replace a durable job ledger/recovery trigger. Preserve transaction atomicity and call providers outside database locks.
- Prove `/api` ordering, callback URL stability, secure cookies, raw webhook bytes and private-route protection on hosted previews. Preserve public checkout disabled until the real integration tests pass.

**Verdict:** most economical in development effort for the current phase, but not yet certified as a complete no-card package. QStash activation, backup storage/automation, real limits and future Vercel use must pass before approval.

### B. Cloudflare Workers Free + Queues/Cron + Neon Free + Resend Free

**Candidate to evaluate first if permanent no-card hosting is required.** Cloudflare explicitly advertises no-card Workers signup; Queues is now available on Workers Free. Published limits include 100,000 Worker requests/day, 10 ms CPU per invocation, and 10,000 queue operations/day with 24-hour free queue retention. Reading/deleting/retrying messages also uses operations: this is not 10,000 fully delivered jobs/day. [Workers offer](https://www.cloudflare.com/products/workers/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/).

Cloudflare can host the static website as well if a later Vercel move is approved. No immediate site/domain move is proposed. Keep Neon PostgreSQL rather than casually replacing transaction/lock semantics with SQLite/D1. D1's free offer is real but would add a second database migration; it is not needed merely to compare hosting.

The current FastAPI/psycopg/Google dependency combination is not proven to run unchanged in Workers. Cloudflare supports Python, but that does not establish compatibility with this application's binary dependencies, connections and CPU budget. First do a bounded compatibility check; if a JavaScript/TypeScript port is needed, get explicit approval and rerun every booking/security/concurrency test. Do not sell this as a drop-in switch or an inevitable full rewrite before testing.

Preserve the database job ledger across the shorter queue retention. Cron performs recovery with no visitors; queue consumers remain authenticated and idempotent. CPU, provider-signature verification, token refresh and database transactions must fit at real cold/warm limits. No paid Workers plan, Containers, paid access add-on or R2 activation is included. A storage product's free allowance is not proof it permits no-card signup.

**Verdict:** stronger long-term no-card hosting candidate, but greater adaptation risk/work than A. Exact account eligibility, terms, backups and fit remain to prove; no automatic selection or rewrite.

### C. Render Free + Neon Free + a verified free task service + Resend Free

Render supports Python and documents suspending free services rather than buying extra bandwidth when no payment method exists. Its own free-tier overview says no card is required. Keep Neon; do not use Render's expiring free PostgreSQL store for durable bookings. [Render free rules](https://render.com/docs/free), [Render's own free-tier description](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026).

The web server sleeps after 15 minutes without incoming traffic and may take about a minute to start. Excess service-initiated traffic, including external database/API calls, may also cause suspension requiring a paid upgrade. It still needs a no-card background recovery service; do not revive keep-awake pings as a reliability promise.

**Verdict:** reasonable for a limited demonstration; not the recommended live paid-booking experience. This is not an equivalent reliability substitute merely because it preserves Python.

## 4. What stays, and what must be redesigned

Keep the Google project unbilled. Google sign-in and the Calendar/Meet connection are distinct from Cloud Run hosting. Standard Calendar API use currently has no additional charge, but Google documents future changes to excess usage later in 2026. Verify actual no-billing authorization/conference capability and quotas; do not enable a different billed Google API or promise permanent unlimited use. [Calendar usage policy](https://developers.google.com/workspace/calendar/api/guides/quota).

Keep Razorpay as the proposed payment provider, but its real-payment processing fees and merchant bank/verification requirements are not free infrastructure. Test mode is not real charging. Confirm the client-facing fee/settlement arrangement at the existing payment stage. [Razorpay pricing](https://razorpay.com/pricing/).

The backup/secret plan must change with hosting, not be forgotten:

- Google Cloud Storage/Secret Manager are no longer approved options under the no-billing rule. Candidate providers' protected server-only environment settings can hold application secrets; never use browser variables or public Git files.
- Neon's short recovery window is not retained independent backups. No free no-card backup destination and automated export/restore route has been selected or proven in this review. Evaluate a client-controlled private destination and bounded export process before claiming the package complete; do not add Google Drive scopes, R2 billing, private GitHub storage or a manual operator obligation silently.
- Client-owned encrypted local copies can be considered for development only. If proposed for ongoing use, identify the human responsibility, availability and acceptable loss window explicitly; do not label that automatic unattended recovery.
- Quota failures can interrupt a paid consultation's preparation after payment. Prevent new checkout when known unhealthy or without adequate quota headroom; preserve already captured payments and jobs, expose a support path and reconcile after recovery. Do not promise to avoid every post-payment outage on a hard-capped free plan.

## 5. Selection gates before implementation or signup

1. Launch scope is settled: Vercel Pro is the sole paid infrastructure exception; other services stay no-card after launch. Preserve the current development arrangement and arrange the authorized Pro transition at launch, not now.
2. Verify every selected product is the explicit Free plan, client-controlled, with no card, billing link, trial conversion, marketplace payment path or excess-charge obligation. Stop if any screen contradicts the offer. Do not delete another account's card as a workaround.
3. Cover the whole job: hosting, database, task delivery, independent recovery, email, private secrets and retained/restorable backups. A partial list is not an end-to-end selection.
4. Approve the candidate and perform a bounded compatibility/usage check before rewriting the detailed Plan 1 provider contracts. Measure startup, CPU/duration, parallel database connections, signatures, scheduled recovery and quota exhaustion. This review did not run those tests.
5. Rebase P1-03–P1-11, C05/C09, D02–D04 and T15/T16/T26 onto the selected providers. Retain every business/security requirement and test ID; add proof for no-card boundaries and whole-chain quota exhaustion. Provider names in older sections are suspended design history until this rebase.

## 6. Architecture review and stop rules

**Summary:** the user needs a small booking system, not a collection of cloud products. The previous Google setup does not satisfy the newly clarified account constraint. Reusing FastAPI/PostgreSQL reduces work, but only if the whole no-card chain is real. Payment safety, durable delivery and backups are requirements, not optional complexity.

**Requirement-to-complexity ratio:** reviewer estimate, not a measured score: A about 3/10; B about 5/10 during adaptation; C about 4/10 after handling sleeping-server failure cases. These are comparative judgments, not evidence of future reliability.

| Finding | Severity | Simpler action / removal effort |
| --- | --- | --- |
| Keeping billed Google services because they were previously planned | V2: conflicts with the actual constraint | Suspend provider-specific implementation now; documentation change only because no hosted integration was completed. |
| Rewriting proven PostgreSQL occupancy rules while changing host | V2: avoidable second migration | Retain one PostgreSQL store; a database replacement needs a distinct justification/approval. |
| Adding several schedulers or using a browser/background thread as recovery | V2: complexity or unsafe shortcut | One selected task/recovery mechanism plus the existing durable ledger; implementation effort not estimated without a chosen provider. |
| Calling cardless hosting a complete zero-risk booking service | V3: hides downstream delivery/backup/quota risks | Make every dependent service and recovery route pass the same gate. |

**Maintenance debt:** not quantified; no observed maintenance history for these proposed hosts. Do not invent monthly support-hour savings. The main rework cost is application compatibility for B, versus a small provider adapter and hosting changes for A.

**Hard question:** is no-card hosting permanent? If yes, choosing a temporary Vercel route creates a known later migration rather than eliminating hosting cost.

**Safe stop/review criteria (not destructive automation):**

- Stop provider onboarding if payment details, billed service activation or automatic overage acceptance is required. Preserve the account/data and report the failed criterion.
- Keep new checkout off if required delivery, storage, quota headroom or security checks fail; continue protecting existing records and reconcile accepted payments. Never erase records, remove a provider or cancel real meetings automatically.
- Require retained-backup restoration and all affected payment/concurrency tests before live use. A free provider's outage/retention limit must be disclosed, not hidden by a success message.
- User owns the product/provider decision; client/maintainer operating responsibility remains D07. No invented second employee or automatic deletion based on low usage. The skill's generic zero-usage destruction and staffing rules are inappropriate here and are not adopted.
- Before selected-provider integration, record actual limits and permitted synthetic tests. Recheck measured capacity and failed-job visibility before release and during the agreed handover window; this is not an indefinite monitoring promise.
- No extra database, framework rewrite or paid add-on without written user value and the simpler alternative. No claims of cardless sign-up or zero overages without product-specific evidence.

## Evidence boundary

Read current planning/setup files and relevant FastAPI/storage/dependency source; used architecture-review, Vercel Functions and Neon guidance plus official provider documentation. Inspected no private cloud account, created no resources and ran no app/provider tests. No UI changes or fresh screenshots were needed for this hosting-options review. No credentials were read or written. Existing code and public checkout remain unchanged.
