"""Native Vercel ASGI entrypoint; no startup provisioning or schema changes."""

from src.backend.main import app

__all__ = ["app"]
