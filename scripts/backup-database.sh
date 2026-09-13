#!/usr/bin/env bash
set -Eeuo pipefail

# Consistent, encrypted production backup. The caller supplies a direct
# maintenance connection, an age public recipient and an rclone Drive config.
# No plaintext archive or decryption key is uploaded.

required=(ASTRO_BACKUP_DATABASE_URL ASTRO_BACKUP_AGE_RECIPIENT ASTRO_BACKUP_RCLONE_CONFIG)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required backup setting: ${name}" >&2
    exit 2
  fi
done

if [[ ! "${ASTRO_BACKUP_AGE_RECIPIENT}" =~ ^age1[0-9a-z]{20,}$ ]]; then
  echo "ASTRO_BACKUP_AGE_RECIPIENT is not a valid age public recipient." >&2
  exit 2
fi

for command_name in pg_dump pg_restore age rclone sha256sum; do
  command -v "${command_name}" >/dev/null || {
    echo "Required backup command is unavailable: ${command_name}" >&2
    exit 2
  }
done

umask 077
base_dir="${RUNNER_TEMP:-/tmp}"
work_dir="$(mktemp -d "${base_dir%/}/astro-advice-backup.XXXXXX")"
cleanup() {
  case "${work_dir}" in
    "${base_dir%/}"/astro-advice-backup.*) rm -rf -- "${work_dir}" ;;
    *) echo "Refusing to clean an unexpected backup path." >&2 ;;
  esac
}
trap cleanup EXIT

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
run_suffix="${GITHUB_RUN_ID:-manual}-${GITHUB_RUN_ATTEMPT:-1}"
name="astro-advice-${stamp}-${run_suffix}.dump"
plain="${work_dir}/${name}"
encrypted="${plain}.age"
checksum="${encrypted}.sha256"
config="${work_dir}/rclone.conf"
remote_folder="astro-advice-production-backups"

printf '%s' "${ASTRO_BACKUP_RCLONE_CONFIG}" > "${config}"
pg_dump --dbname="${ASTRO_BACKUP_DATABASE_URL}" --format=custom --compress=9 \
  --no-owner --no-acl --file="${plain}"

# Reject a malformed/incomplete archive before encryption and upload.
pg_restore --list "${plain}" >/dev/null
age --recipient "${ASTRO_BACKUP_AGE_RECIPIENT}" --output "${encrypted}" "${plain}"
sha256sum "${encrypted}" | sed "s#${work_dir}/##" > "${checksum}"

rclone copyto --config "${config}" "${encrypted}" \
  "astro-drive:${remote_folder}/${name}.age" --immutable
rclone copyto --config "${config}" "${checksum}" \
  "astro-drive:${remote_folder}/${name}.age.sha256" --immutable

local_hash="$(sha256sum "${encrypted}" | cut -d' ' -f1)"
remote_hash="$(rclone cat --config "${config}" \
  "astro-drive:${remote_folder}/${name}.age" | sha256sum | cut -d' ' -f1)"
if [[ "${local_hash}" != "${remote_hash}" ]]; then
  echo "Uploaded backup verification failed." >&2
  exit 1
fi

# Only this app-owned folder and filename pattern are eligible. Google Drive's
# default trash behaviour keeps removals recoverable while enforcing retention.
rclone delete --config "${config}" "astro-drive:${remote_folder}" \
  --min-age 15d --filter '+ astro-advice-*.dump.age' \
  --filter '+ astro-advice-*.dump.age.sha256' --filter '- *'

echo "Encrypted database backup uploaded and verified: ${name}.age"
