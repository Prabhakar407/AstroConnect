"""Explicit database setup. Never imported or invoked by a website request.

Reads a private operator file; writes generated credentials back to that file,
never stdout. Run only for the agreed permanent database after schema review.
"""
import argparse
import os
import secrets
import stat

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo

from .storage import StorageUnavailable, Store

RUNTIME_ROLE = "astro_booking_app"
PRIVILEGES = {
    "schema_migrations": "SELECT",
    "bookings": "SELECT, INSERT, UPDATE",
    "closures": "SELECT, INSERT, UPDATE",
    "slot_claims": "SELECT, INSERT, DELETE",
    "payments": "SELECT, INSERT",
    "inquiries": "SELECT, INSERT, UPDATE",
    "email_events": "SELECT, INSERT",
    "verification_emails": "SELECT, INSERT",
    "delivery_jobs": "SELECT, INSERT, UPDATE",
    "email_challenges": "SELECT, INSERT, UPDATE, DELETE",
    # PostgreSQL requires UPDATE privilege for housekeeping's FOR UPDATE lock,
    # even though the final operation only deletes expired verification grants.
    "email_verifications": "SELECT, INSERT, UPDATE, DELETE",
    "rate_limits": "SELECT, INSERT, UPDATE, DELETE",
    "admin_identity": "SELECT, INSERT",
    "admin_sessions": "SELECT, INSERT, UPDATE, DELETE",
    "admin_login_challenges": "SELECT, INSERT, DELETE",
    "google_connection": "SELECT, INSERT, UPDATE",
    "payment_orders": "SELECT, INSERT, UPDATE",
    "payment_observations": "SELECT, INSERT, UPDATE",
    "payment_events": "SELECT, INSERT, UPDATE",
    "booking_calendar_events": "SELECT, INSERT, UPDATE",
    "payment_cases": "SELECT, INSERT, UPDATE",
    "google_authorizations": "SELECT, INSERT, DELETE",
    "recovery_heartbeat": "SELECT, INSERT, UPDATE",
}


def read_config(filename):
    # Linux-private operator file, not an implicitly loaded website .env file.
    with open(filename, encoding="utf-8") as source:
        mode = os.fstat(source.fileno()).st_mode
        if not stat.S_ISREG(mode) or stat.S_IMODE(mode) & 0o077:
            raise ValueError("Operator credentials require an owner-only file.")
        return dict(line.rstrip('\n').split('=', 1) for line in source if line.strip() and not line.startswith('#'))


def prepare(filename, expected_host):
    config = read_config(filename)
    maintenance = config["ASTRO_MIGRATION_DATABASE_URL"]
    parts = conninfo_to_dict(maintenance)
    if parts.get("host") != expected_host or "-pooler" in expected_host or not expected_host.endswith('.aws.neon.tech') or parts.get("dbname") != "neondb":
        raise ValueError("The maintenance connection does not match the approved direct database.")
    endpoint, domain = expected_host.split('.', 1)
    pooled_host = f"{endpoint}-pooler.{domain}"
    store = Store(maintenance)
    with store.transaction() as conn:
        existing = conn.execute("SELECT rolname FROM pg_roles WHERE rolname=%s", (RUNTIME_ROLE,)).fetchone()
    if existing and not config.get("ASTRO_DATABASE_URL"):
        raise ValueError("The application login already exists; recover its configuration instead of replacing it.")
    if not config.get("ASTRO_DATABASE_URL"):
        runtime = {**parts, "user": RUNTIME_ROLE, "password": secrets.token_urlsafe(32),
                   "host": pooled_host}
        config["ASTRO_DATABASE_URL"] = make_conninfo(**runtime)
        # Generated operational output: keep the credential before creating its login.
        with open(filename, 'a', encoding='utf-8') as target:
            target.write("ASTRO_DATABASE_URL=" + config["ASTRO_DATABASE_URL"] + "\n")
            target.flush()
            os.fsync(target.fileno())
    runtime = conninfo_to_dict(config["ASTRO_DATABASE_URL"])
    if runtime.get("user") != RUNTIME_ROLE or runtime.get("dbname") != parts["dbname"] or runtime.get("host") != pooled_host:
        raise ValueError("The stored application connection does not match the approved database.")
    store.migrate()
    with store.transaction() as conn:
        if not existing:
            conn.execute(sql.SQL("CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS").format(sql.Identifier(RUNTIME_ROLE), sql.Literal(runtime["password"])))
        conn.execute(sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(sql.Identifier(parts["dbname"]), sql.Identifier(RUNTIME_ROLE)))
        conn.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(sql.Identifier(RUNTIME_ROLE)))
        for table, privileges in PRIVILEGES.items():
            conn.execute(sql.SQL("GRANT {} ON TABLE public.{} TO {}").format(sql.SQL(privileges), sql.Identifier(table), sql.Identifier(RUNTIME_ROLE)))
    app_store = Store(config["ASTRO_DATABASE_URL"])
    if not app_store.ready():
        raise ValueError("The website connection cannot verify the database structure.")
    with app_store.transaction(schedule=True) as conn:
        role = conn.execute("SELECT rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user").fetchone()
        create = conn.execute("SELECT has_schema_privilege(current_user,'public','CREATE') AS allowed").fetchone()
        inherited = conn.execute("SELECT pg_has_role(current_user,'neon_superuser','MEMBER') AS elevated,has_database_privilege(current_user,current_database(),'CREATE') AS db_create").fetchone()
        if any(role.values()) or create['allowed'] or any(inherited.values()):
            raise ValueError("The website login has excessive privileges; review its permissions.")
        # With pooling, pg_stat_ssl describes the pooler's internal database
        # connection. libpq reports encryption on our actual application link.
        if not conn.pgconn.ssl_in_use:
            raise ValueError("The website database connection is not encrypted.")
    print("Database migrations verified. Restricted pooled application connection and transaction lock verified. No customer records created.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True)
    parser.add_argument('--host', required=True, help='Explicit approved direct database hostname')
    args = parser.parse_args()
    try:
        prepare(args.config, args.host)
    except (psycopg.Error, StorageUnavailable, ValueError, KeyError, OSError):
        # Driver/provider error text can contain connection details or SQL literals.
        raise SystemExit("Database setup could not be completed. Credentials were not printed; inspect the named configuration and provider state before retrying.") from None


if __name__ == '__main__':
    main()
