"""Application entry point. Imports never contact providers or create databases."""

if __package__:
    from .application import create_app
else:
    # Preserve the existing `uvicorn main:app` launch from src/backend.
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from src.backend.application import create_app

app = create_app()
