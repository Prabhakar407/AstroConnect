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
remote_path="astro-drive:${remote_folder}"
max_backups=15

printf '%s' "${ASTRO_BACKUP_RCLONE_CONFIG}" > "${config}"
pg_dump --dbname="${ASTRO_BACKUP_DATABASE_URL}" --format=custom --compress=9 \
  --no-owner --no-acl --file="${plain}"

# Reject a malformed/incomplete archive before encryption and upload.
pg_restore --list "${plain}" >/dev/null
age --recipient "${ASTRO_BACKUP_AGE_RECIPIENT}" --output "${encrypted}" "${plain}"
sha256sum "${encrypted}" | sed "s#${work_dir}/##" > "${checksum}"

rclone copyto --config "${config}" "${encrypted}" \
  "${remote_path}/${name}.age" --immutable
rclone copyto --config "${config}" "${checksum}" \
  "${remote_path}/${name}.age.sha256" --immutable

local_hash="$(sha256sum "${encrypted}" | cut -d' ' -f1)"
remote_hash="$(rclone cat --config "${config}" \
  "${remote_path}/${name}.age" | sha256sum | cut -d' ' -f1)"
if [[ "${local_hash}" != "${remote_hash}" ]]; then
  echo "Uploaded backup verification failed." >&2
  exit 1
fi

# Keep an exact storage ceiling even when an operator starts additional manual
# runs. Lexicographic order matches the UTC timestamp embedded in every name.
# Cleanup starts only after the new encrypted archive has passed remote hash
# verification. It is permanently limited to this app-owned folder and the
# validated backup/checksum filename pair; Drive Trash is bypassed so expired
# copies do not continue consuming the account's storage allowance.
backup_listing="$(rclone lsf --config "${config}" "${remote_path}" \
  --files-only --max-depth 1 --include 'astro-advice-*.dump.age')"
backup_files=()
while IFS= read -r backup_file; do
  [[ -n "${backup_file}" ]] && backup_files+=("${backup_file}")
done < <(printf '%s\n' "${backup_listing}" | LC_ALL=C sort)

if (( ${#backup_files[@]} > max_backups )); then
  remove_count=$(( ${#backup_files[@]} - max_backups ))
  for (( index=0; index<remove_count; index++ )); do
    backup_file="${backup_files[index]}"
    if [[ ! "${backup_file}" =~ ^astro-advice-[0-9]{8}T[0-9]{6}Z-(manual|[0-9]+)-[0-9]+\.dump\.age$ ]]; then
      echo "Refusing to remove an unexpected backup name: ${backup_file}" >&2
      exit 1
    fi
    rclone delete --config "${config}" "${remote_path}" --max-depth 1 \
      --drive-use-trash=false --include "/${backup_file}" \
      --include "/${backup_file}.sha256" --exclude '*'
  done
fi

remaining_listing="$(rclone lsf --config "${config}" "${remote_path}" \
  --files-only --max-depth 1 --include 'astro-advice-*.dump.age')"
remaining_count="$(printf '%s\n' "${remaining_listing}" | sed '/^$/d' | wc -l)"
if (( remaining_count > max_backups )); then
  echo "Backup retention verification failed: ${remaining_count} archives remain." >&2
  exit 1
fi

echo "Encrypted database backup uploaded and verified: ${name}.age (${remaining_count}/${max_backups} retained)"
