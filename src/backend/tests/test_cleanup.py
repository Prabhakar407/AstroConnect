"""Expired authentication housekeeping; no hosted database or provider calls."""
import os
import unittest
from datetime import timedelta

from src.backend.tests import test_foundation as foundation


@unittest.skipUnless(os.getenv('ASTRO_TEST_DATABASE_URL'), 'Requires isolated local database.')
class CleanupTests(unittest.TestCase):
    setUpClass = classmethod(foundation.PostgresTests.setUpClass.__func__)
    setUp = foundation.PostgresTests.setUp

    def test_batches_are_bounded_and_live_limits_survive(self):
        with self.store.transaction() as conn:
            for i in range(251):
                conn.execute('INSERT INTO rate_limits VALUES (%s,1,%s)',
                             (str(i), self.time))
            conn.execute("INSERT INTO rate_limits VALUES ('live',5,%s)",
                         (self.time + timedelta(seconds=1),))
        self.assertEqual(self.store.cleanup_ephemeral()['rate_limits'], 250)
        self.assertEqual(self.store.cleanup_ephemeral()['rate_limits'], 1)
        self.assertEqual(self.store.cleanup_ephemeral()['rate_limits'], 0)
        with self.store.transaction() as conn:
            self.assertEqual(conn.execute('SELECT key,count FROM rate_limits').fetchall(),
                             [{'key': 'live', 'count': 5}])

    def test_expired_codes_and_grants_removed_live_ones_still_work(self):
        self.verification.issue('expired@example.com', 'contact', 'first')
        self.verification.issue('grant@example.com', 'contact', 'second')
        self.verification.verify('grant@example.com', 'contact', self.codes[-1][1], 'second')
        self.time += timedelta(minutes=15)
        self.verification.issue('live@example.com', 'contact', 'third')
        code = self.codes[-1][1]
        counts = self.store.cleanup_ephemeral()
        self.assertEqual(counts['email_challenges'], 1)
        self.assertEqual(counts['email_verifications'], 1)
        token = self.verification.verify('live@example.com', 'contact', code, 'third')
        self.assertTrue(token)
        self.assertEqual(self.store.cleanup_ephemeral()['email_verifications'], 0)

    def test_locked_expired_counter_is_skipped_then_removed(self):
        with self.store.transaction() as conn:
            conn.execute("INSERT INTO rate_limits VALUES ('locked',1,%s)", (self.time,))
        with self.store.transaction() as conn:
            conn.execute("SELECT * FROM rate_limits WHERE key='locked' FOR UPDATE")
            self.assertEqual(self.store.cleanup_ephemeral()['rate_limits'], 0)
        self.assertEqual(self.store.cleanup_ephemeral()['rate_limits'], 1)
