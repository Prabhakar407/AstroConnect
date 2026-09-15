"""Run backend tests and make skipped coverage explicit in a JSON result."""

import argparse
import json
import os
import sys
import time
import unittest
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(REPOSITORY_ROOT))


DATABASE_SKIP_MARKERS = (
    "isolated local database",
    "isolated local test database",
    "dedicated isolated test database",
    "dedicated astro_test_database_url",
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("fast", "release"), required=True)
    parser.add_argument("--result", required=True)
    args = parser.parse_args()

    started = time.monotonic()
    suite = unittest.defaultTestLoader.discover("src/backend/tests")
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    unexpected_skips = []
    for test, reason in result.skipped:
        if args.mode == "release" or not any(marker in reason.lower() for marker in DATABASE_SKIP_MARKERS):
            unexpected_skips.append({"test": str(test), "reason": reason})

    database_configured = bool(os.getenv("ASTRO_TEST_DATABASE_URL"))
    configuration_error = (
        (args.mode == "release" and not database_configured)
        or (args.mode == "fast" and database_configured)
    )
    payload = {
        "mode": args.mode,
        "tests_run": result.testsRun,
        "failures": len(result.failures),
        "errors": len(result.errors),
        "skips": len(result.skipped),
        "unexpected_skips": unexpected_skips,
        "database_configured": database_configured,
        "duration_seconds": round(time.monotonic() - started, 3),
        "passed": result.wasSuccessful() and not unexpected_skips and not configuration_error,
    }
    Path(args.result).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload))
    return 0 if payload["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
