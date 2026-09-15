#!/usr/bin/env bash
set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
result_path="${1:-$repository_root/verification-results/backend-release.json}"
postgres_bin="${ASTRO_POSTGRES_BIN:-}"
test_python="${ASTRO_TEST_PYTHON:-$repository_root/.venv/bin/python}"

if [[ "$test_python" != */* ]]; then
  test_python="$(command -v "$test_python" || true)"
fi
if [[ -z "$test_python" || ! -x "$test_python" ]]; then
  echo "The Python test environment is missing. Install the locked backend dependencies first." >&2
  exit 1
fi

if [[ -z "$postgres_bin" ]]; then
  for candidate in /usr/lib/postgresql/*/bin; do
    if [[ -x "$candidate/initdb" && -x "$candidate/pg_ctl" && -x "$candidate/createdb" ]]; then
      postgres_bin="$candidate"
    fi
  done
fi
if [[ -z "$postgres_bin" || ! -x "$postgres_bin/initdb" || ! -x "$postgres_bin/pg_ctl" ]]; then
  echo "PostgreSQL server tools are required. Install PostgreSQL 16 or set ASTRO_POSTGRES_BIN." >&2
  exit 1
fi

work_root="$(mktemp -d /tmp/astro-booking-check.XXXXXX)"
data_dir="$work_root/data"
socket_dir="$work_root/socket"
log_file="$work_root/postgres.log"
mkdir -p "$socket_dir" "$(dirname "$result_path")"

cleanup() {
  if [[ -f "$data_dir/postmaster.pid" ]]; then
    "$postgres_bin/pg_ctl" -D "$data_dir" -m fast -w stop >/dev/null 2>&1 || true
  fi
  case "$work_root" in
    /tmp/astro-booking-check.*) rm -rf -- "$work_root" ;;
    *) echo "Refusing unexpected test cleanup path: $work_root" >&2 ;;
  esac
}
trap cleanup EXIT INT TERM

"$postgres_bin/initdb" --auth=trust --encoding=UTF8 --no-locale -D "$data_dir" >/dev/null
if ! "$postgres_bin/pg_ctl" -D "$data_dir" -l "$log_file" -o "-F -k $socket_dir -c listen_addresses=''" -w start >/dev/null; then
  echo "The isolated PostgreSQL server did not start:" >&2
  tail -40 "$log_file" >&2 || true
  exit 1
fi
"$postgres_bin/createdb" -h "$socket_dir" -U "$(id -un)" astro_booking_test

owner_url="host=$socket_dir dbname=astro_booking_test user=$(id -un)"
runtime_url="host=$socket_dir dbname=astro_booking_test user=astro_booking_test_app"

cd "$repository_root"
PYTHONPATH="$repository_root" ASTRO_TEST_DATABASE_ADMIN_URL="$owner_url" \
  "$test_python" scripts/provision-test-database.py
PYTHONPATH="$repository_root" \
ASTRO_TEST_DATABASE_ADMIN_URL="$owner_url" \
ASTRO_TEST_DATABASE_URL="$runtime_url" \
"$test_python" scripts/run-backend-tests.py --mode release --result "$result_path"
