"""Create the restricted application role inside the isolated test database only."""

import os

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict

from src.backend.provision import PRIVILEGES
from src.backend.storage import Store


TEST_DATABASE = "astro_booking_test"
TEST_ROLE = "astro_booking_test_app"


def require_isolated(connection: str) -> None:
    parts = conninfo_to_dict(connection)
    host = parts.get("host", "")
    if parts.get("dbname") != TEST_DATABASE or not host.startswith("/tmp/astro-booking-check."):
        raise SystemExit("Refusing to provision outside the named isolated test database.")


def main() -> None:
    owner_url = os.environ.get("ASTRO_TEST_DATABASE_ADMIN_URL", "")
    if not owner_url:
        raise SystemExit("ASTRO_TEST_DATABASE_ADMIN_URL is required.")
    require_isolated(owner_url)

    Store(owner_url).migrate()
    with psycopg.connect(owner_url) as connection:
        connection.execute(
            sql.SQL(
                "CREATE ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE "
                "NOREPLICATION NOBYPASSRLS"
            ).format(sql.Identifier(TEST_ROLE))
        )
        connection.execute(
            sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
                sql.Identifier(TEST_DATABASE), sql.Identifier(TEST_ROLE)
            )
        )
        connection.execute(
            sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(
                sql.Identifier(TEST_ROLE)
            )
        )
        for table, privileges in PRIVILEGES.items():
            connection.execute(
                sql.SQL("GRANT {} ON TABLE public.{} TO {}").format(
                    sql.SQL(privileges), sql.Identifier(table), sql.Identifier(TEST_ROLE)
                )
            )
    print("Isolated schema migrated and restricted website role provisioned.")


if __name__ == "__main__":
    main()
