"""Explicit schema setup using a separately configured direct maintenance URL."""

import os

import psycopg
from psycopg.conninfo import conninfo_to_dict
from .storage import StorageUnavailable, Store


def main():
    try:
        dsn = os.getenv("ASTRO_MIGRATION_DATABASE_URL", "")
        if not dsn:
            raise StorageUnavailable("Set ASTRO_MIGRATION_DATABASE_URL for the approved direct maintenance connection.")
        if "-pooler" in conninfo_to_dict(dsn).get("host", ""):
            raise StorageUnavailable("Use the direct, not pooled, database address for migrations.")
        Store(dsn).migrate()
    except psycopg.Error:
        raise SystemExit("The maintenance database address is invalid; check protected configuration.") from None
    except (StorageUnavailable, ValueError) as error:
        raise SystemExit(str(error)) from None
    print("Booking database migrations applied successfully.")


if __name__ == "__main__":
    main()
