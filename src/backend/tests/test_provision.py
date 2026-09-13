"""Operator configuration checks use only temporary files and fake connection data."""
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.backend.provision import PRIVILEGES, prepare, read_config


class ProvisionTests(unittest.TestCase):
    def test_google_callback_can_lock_session_and_cannot_delete_saved_connection(self):
        self.assertIn('UPDATE', PRIVILEGES['admin_sessions'])
        self.assertEqual(PRIVILEGES['google_authorizations'], 'SELECT, INSERT, DELETE')
        self.assertNotIn('DELETE', PRIVILEGES['google_connection'])

    def test_housekeeping_tables_allow_row_locks_and_bounded_deletion(self):
        for table in ('rate_limits', 'email_challenges', 'email_verifications'):
            with self.subTest(table=table):
                permissions = set(PRIVILEGES[table].split(', '))
                self.assertTrue({'SELECT', 'UPDATE', 'DELETE'} <= permissions)
        # Housekeeping must not acquire deletion rights over business history.
        for table in ('bookings', 'inquiries', 'payments', 'delivery_jobs', 'booking_calendar_events', 'payment_cases'):
            self.assertNotIn('DELETE', PRIVILEGES[table])

    def test_private_operator_file_preserves_connection_equals(self):
        with tempfile.TemporaryDirectory() as folder:
            filename = Path(folder) / 'operator.env'
            filename.write_text('# Private operator settings\nASTRO_DATABASE_URL=host=example.invalid dbname=neondb\n')
            filename.chmod(0o600)
            self.assertEqual(read_config(filename)['ASTRO_DATABASE_URL'], 'host=example.invalid dbname=neondb')

    def test_operator_file_readable_by_others_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            filename = Path(folder) / 'operator.env'
            filename.write_text('ASTRO_DATABASE_URL=host=example.invalid\n')
            filename.chmod(0o644)
            with self.assertRaises(ValueError):
                read_config(filename)

    def test_wrong_database_or_host_cannot_start_migration(self):
        for connection, expected in [
            ('host=ep-example.c-4.ap-southeast-1.aws.neon.tech dbname=other', 'ep-example.c-4.ap-southeast-1.aws.neon.tech'),
            ('host=ep-example-pooler.c-4.ap-southeast-1.aws.neon.tech dbname=neondb', 'ep-example-pooler.c-4.ap-southeast-1.aws.neon.tech'),
            ('host=ep-other.c-4.ap-southeast-1.aws.neon.tech dbname=neondb', 'ep-example.c-4.ap-southeast-1.aws.neon.tech'),
            ('host=example.invalid dbname=neondb', 'example.invalid'),
        ]:
            with self.subTest(host=expected), patch('src.backend.provision.read_config', return_value={'ASTRO_MIGRATION_DATABASE_URL': connection}), patch('src.backend.provision.Store') as store:
                with self.assertRaises(ValueError):
                    prepare('not-a-real-file', expected)
                store.assert_not_called()

    def test_missing_configuration_is_not_loaded_from_environment(self):
        with patch.dict(os.environ, {'ASTRO_MIGRATION_DATABASE_URL': 'host=example.invalid dbname=neondb'}), patch('src.backend.provision.read_config', return_value={}):
            with self.assertRaises(KeyError):
                prepare('not-a-real-file', 'ep-example.c-4.ap-southeast-1.aws.neon.tech')
