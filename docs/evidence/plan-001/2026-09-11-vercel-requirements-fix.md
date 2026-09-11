# Vercel preview packaging correction

The user supplied the complete failing build log for aeb98ea. Vite and dependency installation succeeded. Subsequent Python package discovery rejected root requirements.txt at position 84, where its nested constraints reference begins. Hardlink and frontend bundle-size messages were warnings, not the failure.

Reproduced the identical PYTHON_REQUIREMENTS_PARSE_ERROR locally with discoverPythonPackage from the installed Vercel CLI 59.11.7 toolchain, matching the hosted log.

Replaced root nested -c/-r references with the flat 36-package runtime set, retaining previously installed/tested versions and required extras. Development-only tools remain outside this list. No UI, booking rules, credentials, database or account settings changed.

The same parser now succeeds and recognizes .python-version as 3.12. The failed log's initial installer used 3.14.7; this does not establish the final function runtime. Subsequent deployment must prove hosted packaging/runtime behavior.

Four focused hosting tests pass, including a regression requiring flat exact pins aligned with direct backend dependencies and the tested lock. Offline pip dry-run confirms requirements are satisfied in the local runtime environment. Whitespace check passes. Earlier full backend and screenshot evidence remains historical; no UI changed.

Publish only on the existing draft PR branch and observe its automatic preview check. Do not merge main or infer real login/email/payment/meeting acceptance from a green build.
