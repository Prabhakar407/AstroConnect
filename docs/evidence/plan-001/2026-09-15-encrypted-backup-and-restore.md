# Encrypted production backup and restore — 2026-09-15

## Outcome

The existing GitHub Actions backup route is now configured and proven against the permanent production database and the client-controlled Google Drive. A successful run exported the database through its direct maintenance connection, validated the PostgreSQL archive, encrypted it before upload, uploaded the encrypted archive and checksum, read the uploaded bytes back for a hash comparison and reported `1/15 retained`.

No plaintext database archive, customer record or private decryption key was uploaded to GitHub or Google Drive. The downloaded Google OAuth credential was removed from the repository folder after the restricted connection was created.

## Permanent configuration

- Workflow: `.github/workflows/production-database-backup.yml`, daily schedule plus deliberate manual recovery runs.
- Source revision: `40babc2` on `main` and `design/page-by-page`.
- Successful run: [GitHub Actions run 34948253416](https://github.com/Prabhakar407/AstroConnect/actions/runs/34948253416), 46 seconds.
- Destination: the app-owned `astro-advice-production-backups` folder in the approved private Google Drive.
- Google permission: `drive.file`, limited to files created by this backup connection.
- Protected GitHub values: direct database maintenance connection, public encryption recipient and restricted Drive connection. Values are not recorded here.
- Private decryption identity: retained outside Git and provider storage in the owner-only local project-secret directory. It is not reproduced in this evidence.

## Storage ceiling

The workflow keeps exactly the 15 newest successful encrypted archives, including deliberate manual runs. Each archive has one small checksum companion. Cleanup begins only after the newest archive has passed remote byte-for-byte hash verification. It validates the app-owned filename before removal, operates only inside the dedicated folder, bypasses Drive Trash so expired copies stop consuming storage, and verifies that no more than 15 archives remain.

A focused regression started with 16 synthetic archive/checksum pairs plus one unrelated file, added a new backup, and finished with exactly 15 archives. The two oldest archive/checksum pairs were removed and the unrelated file remained unchanged. The test passed.

## Recovery proof

The successful encrypted archive and checksum were downloaded from Drive into a temporary local directory. The checksum passed. The archive decrypted with the separately held private identity and `scripts/restore-database-backup.sh` restored it into a new, empty local database named exactly `astro_booking_restore_test`; the restore script refuses any other database name.

Readback found all 15 schema migrations, four booking records and one inquiry record. Only aggregate counts were printed. The temporary database, decrypted archive and downloaded encrypted files were removed afterward. No production write, provider callback, email, Calendar event, payment or delivery-job replay occurred.

## Verification

- Live GitHub workflow: passed.
- Drive readback: one encrypted archive and one checksum, `1/15` retained.
- Remote checksum: passed.
- Isolated restore: passed.
- Retention regression: 1/1 passed.
- Backup shell syntax and repository diff checks: passed.
- Production frontend build: passed with the pre-existing bundle-size warning.
- Frontend lint: no errors; existing unrelated warnings remain.

## Remaining operating handoff

The code, protected values, schedule, Drive upload, exact retention and isolated recovery are proven. The operator still needs a second controlled offline copy of the private decryption identity and confirmed GitHub Actions failure notifications. Those are access/handover duties, not missing backup code. The next naturally scheduled successful run should be checked during the agreed observation window; the workflow's schedule itself has already executed on prior days.
