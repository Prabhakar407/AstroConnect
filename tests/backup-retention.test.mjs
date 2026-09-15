import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function writeExecutable(path, source) {
  writeFileSync(path, source, { mode: 0o700 });
  chmodSync(path, 0o700);
}

test('backup job keeps exactly the newest 15 archives and no unrelated files are removed', () => {
  const root = mkdtempSync(join(tmpdir(), 'astro-backup-retention-test.'));
  try {
    const bin = join(root, 'bin');
    const remote = join(root, 'remote');
    const backupFolder = join(remote, 'astro-advice-production-backups');
    mkdirSync(bin);
    mkdirSync(backupFolder, { recursive: true });

    writeExecutable(join(bin, 'pg_dump'), `#!/usr/bin/env bash
set -Eeuo pipefail
for argument in "$@"; do
  case "$argument" in --file=*) output="\${argument#--file=}" ;; esac
done
printf 'synthetic-postgres-archive' > "$output"
`);
    writeExecutable(join(bin, 'pg_restore'), `#!/usr/bin/env bash
set -Eeuo pipefail
exit 0
`);
    writeExecutable(join(bin, 'age'), `#!/usr/bin/env bash
set -Eeuo pipefail
while (( $# )); do
  case "$1" in
    --recipient) shift 2 ;;
    --output) output="$2"; shift 2 ;;
    *) input="$1"; shift ;;
  esac
done
cp "$input" "$output"
`);
    writeExecutable(join(bin, 'rclone'), `#!/usr/bin/env bash
set -Eeuo pipefail
operation="$1"
shift
positionals=()
includes=()
while (( $# )); do
  case "$1" in
    --config|--max-depth|--exclude) shift 2 ;;
    --include) includes+=("$2"); shift 2 ;;
    --immutable|--files-only|--drive-use-trash=false) shift ;;
    --*) shift ;;
    *) positionals+=("$1"); shift ;;
  esac
done
local_path() {
  printf '%s/%s' "$FAKE_REMOTE_ROOT" "\${1#astro-drive:}"
}
case "$operation" in
  copyto)
    destination="$(local_path "\${positionals[1]}")"
    mkdir -p "$(dirname "$destination")"
    cp "\${positionals[0]}" "$destination"
    ;;
  cat)
    cat "$(local_path "\${positionals[0]}")"
    ;;
  lsf)
    directory="$(local_path "\${positionals[0]}")"
    find "$directory" -maxdepth 1 -type f -name 'astro-advice-*.dump.age' -printf '%f\\n'
    ;;
  delete)
    directory="$(local_path "\${positionals[0]}")"
    for include in "\${includes[@]}"; do
      rm -f -- "$directory/\${include#/}"
    done
    ;;
  *)
    echo "Unexpected fake rclone operation: $operation" >&2
    exit 2
    ;;
esac
`);

    for (let index = 1; index <= 16; index += 1) {
      const day = String(index).padStart(2, '0');
      const name = `astro-advice-202601${day}T010101Z-${index}-1.dump.age`;
      writeFileSync(join(backupFolder, name), `archive-${index}`);
      writeFileSync(join(backupFolder, `${name}.sha256`), `checksum-${index}`);
    }
    writeFileSync(join(backupFolder, 'unrelated-client-file.txt'), 'must remain');

    const result = spawnSync('bash', [join(repoRoot, 'scripts', 'backup-database.sh')], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        RUNNER_TEMP: root,
        GITHUB_RUN_ID: '999999',
        GITHUB_RUN_ATTEMPT: '1',
        FAKE_REMOTE_ROOT: remote,
        ASTRO_BACKUP_DATABASE_URL: 'postgresql://synthetic.invalid/unused',
        ASTRO_BACKUP_AGE_RECIPIENT: 'age1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
        ASTRO_BACKUP_RCLONE_CONFIG: '[astro-drive]\ntype = drive\n',
      },
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /\(15\/15 retained\)/);
    const archives = readdirSync(backupFolder).filter(name => name.endsWith('.dump.age'));
    assert.equal(archives.length, 15);
    assert.equal(existsSync(join(backupFolder, 'astro-advice-20260101T010101Z-1-1.dump.age')), false);
    assert.equal(existsSync(join(backupFolder, 'astro-advice-20260102T010101Z-2-1.dump.age')), false);
    assert.equal(existsSync(join(backupFolder, 'astro-advice-20260101T010101Z-1-1.dump.age.sha256')), false);
    assert.equal(existsSync(join(backupFolder, 'astro-advice-20260102T010101Z-2-1.dump.age.sha256')), false);
    assert.equal(readFileSync(join(backupFolder, 'unrelated-client-file.txt'), 'utf8'), 'must remain');
    assert.ok(archives.some(name => name.includes('-999999-1.dump.age')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
