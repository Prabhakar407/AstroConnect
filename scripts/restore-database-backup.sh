#!/usr/bin/env bash
set -Eeuo pipefail

# Restore verification is intentionally limited to a new, empty database whose
# name is exactly astro_booking_restore_test. It cannot overwrite production.

required=(ASTRO_RESTORE_DATABASE_URL ASTRO_BACKUP_AGE_IDENTITY ASTRO_BACKUP_FILE)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required restore setting: ${name}" >&2
    exit 2
  fi
done

for command_name in psql pg_restore age; do
  command -v "${command_name}" >/dev/null || {
    echo "Required restore command is unavailable: ${command_name}" >&2
    exit 2
  }
done

if [[ ! -f "${ASTRO_BACKUP_AGE_IDENTITY}" || ! -f "${ASTRO_BACKUP_FILE}" ]]; then
  echo "The private age identity or encrypted backup file was not found." >&2
  exit 2
fi

database_name="$(psql "${ASTRO_RESTORE_DATABASE_URL}" -Atqc 'select current_database()')"
if [[ "${database_name}" != 'astro_booking_restore_test' ]]; then
  echo "Restore checks may run only against astro_booking_restore_test." >&2
  exit 2
fi
if [[ "$(psql "${ASTRO_RESTORE_DATABASE_URL}" -Atqc "select count(*) from pg_class where relnamespace='public'::regnamespace and relkind in ('r','p')")" != '0' ]]; then
  echo "The restore-test database must be empty." >&2
  exit 2
fi

umask 077
plain="$(mktemp "${TMPDIR:-/tmp}/astro-advice-restore.XXXXXX.dump")"
trap 'rm -f -- "${plain}"' EXIT
age --decrypt --identity "${ASTRO_BACKUP_AGE_IDENTITY}" \
  --output "${plain}" "${ASTRO_BACKUP_FILE}"
pg_restore --exit-on-error --no-owner --no-acl \
  --dbname="${ASTRO_RESTORE_DATABASE_URL}" "${plain}"

psql "${ASTRO_RESTORE_DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc \
  "select case when count(*) >= 14 then 'restore verified' else 'restore incomplete' end from schema_migrations"
test "$(psql "${ASTRO_RESTORE_DATABASE_URL}" -Atqc 'select count(*) from schema_migrations')" -ge 14

echo "Encrypted backup restored into the isolated verification database."
