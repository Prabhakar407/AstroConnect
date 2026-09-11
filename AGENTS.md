# Persistent booking work plan

For booking, inquiries, private-calendar or their hosting/integration work:

1. Read [docs/README.md](docs/README.md), then [Plan 1](docs/PLAN-001-booking-inquiries-and-client-calendar.md), starting with **Resume here**, and the relevant [implementation contracts](docs/PLAN-001-implementation-contracts.md) before implementation.
2. Inspect the current worktree and relevant code before edits. Do not discard existing page-by-page changes or deploy the old remote version by mistake.
3. Follow Plan 1's approved requirements, stage dependencies, verification gates and external-action boundaries. Continue ordinary approved local work without asking for repeated approval; bring account-only actions, costs, scope changes and live release decisions to the user when needed.
4. Update Plan 1's resume checkpoint, stage status, evidence and decision log after each meaningful slice. Update supporting documents when their facts change. Do not mark a stage done without its required proof.
5. Keep local tests, hosted tests, real-provider tests and client acceptance distinct. Preserve the established website design and inspect mobile separately from landscape when changing an interface.
6. Never put credentials, verification codes, customer records or private access links in plans, screenshots, logs or commits.
7. For provider/account setup, research current official documentation and give complete, concrete steps. Do not routinely request dashboard screenshots or pause after every screen. Ask for a screenshot only when required information cannot be established from documentation or available read-only checks; prefer a short non-secret text answer where sufficient. This does not reduce Codex's responsibility to capture and inspect its own UI verification screenshots.
8. Build the intended permanent solution from the outset. Do not require disposable hosted test projects, duplicate staging stacks, planned replacement migrations, placeholder products or redundant activation switches. For this prelaunch site, verify within the official project/database and retain them for launch. Keep essential security, payment validation, data protection and verification. If a specific check would endanger real records or money, explain the concrete risk and agree the smallest necessary exception; do not silently add infrastructure or run destructive checks.

These navigation instructions supplement the user's standing preferences. They do not authorize purchases, destructive cleanup, real notifications/payments or an unspecified deployment.
