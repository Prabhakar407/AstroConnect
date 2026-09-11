"""Native entrypoint and configuration checks, not Vercel hosted routing proof."""

import importlib
import json
import os
import re
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


class HostingTests(unittest.TestCase):
    def test_vercel_runtime_requirements_are_flat_and_match_tested_pins(self):
        root = Path(__file__).resolve().parents[3]
        def pins(path):
            result = {}
            for line in path.read_text().splitlines():
                if not line.strip() or line.startswith('#'):
                    continue
                match = re.fullmatch(r'([A-Za-z0-9_.-]+)(?:\[[A-Za-z0-9_,.-]+\])?==([A-Za-z0-9_.+-]+)', line)
                self.assertIsNotNone(match, f'{path.name} must contain flat exact pins: {line}')
                name = re.sub(r'[-_.]+', '-', match[1]).lower()
                self.assertNotIn(name, result)
                result[name] = match[2]
            return result
        runtime = pins(root / 'requirements.txt')
        direct = pins(root / 'src/backend/requirements.txt')
        tested = pins(root / 'src/backend/requirements-tested.lock')
        self.assertTrue(runtime)
        for name, version in runtime.items():
            self.assertEqual(tested.get(name), version, name)
        for name, version in direct.items():
            self.assertEqual(runtime.get(name), version, name)
        self.assertFalse({'fakeredis', 'redis', 'pytest', 'google-api-python-client'} & runtime.keys())

    def test_native_entrypoint_has_no_import_side_effects(self):
        with patch.dict(os.environ, {}, clear=True), patch("socket.socket", side_effect=AssertionError("Network during import")):
            importlib.reload(importlib.import_module("src.backend.main"))
            entrypoint = importlib.reload(importlib.import_module("api.index"))
        client = TestClient(entrypoint.app)
        self.assertEqual(client.get("/api/health").status_code, 200)
        self.assertEqual(len(client.get("/api/services").json()["services"]), 6)
        self.assertEqual(client.get("/api/ready").status_code, 503)
        self.assertEqual(client.post("/api/book-appointment", json={"paid": True}).status_code, 503)
        self.assertEqual(client.get("/api/missing").status_code, 404)
        self.assertTrue(client.get("/api/missing").headers["content-type"].startswith("application/json"))

    def test_route_order_and_hobby_bounded_configuration(self):
        root = Path(__file__).resolve().parents[3]
        config = json.loads((root / "vercel.json").read_text())
        self.assertEqual(config["framework"], "vite")
        self.assertEqual(config["regions"], ["sin1"])
        self.assertEqual(config["rewrites"][0], {"source": "/api/:path*", "destination": "/api/index.py"})
        self.assertEqual(config["rewrites"][-1]["destination"], "/index.html")
        self.assertEqual(config["functions"]["api/index.py"]["maxDuration"], 30)
        self.assertNotIn("crons", config)
        self.assertNotIn("services", config)
        self.assertNotIn("memory", config["functions"]["api/index.py"])
        self.assertLessEqual(len(config["functions"]["api/index.py"]["excludeFiles"]), 256)
        self.assertEqual((root / ".python-version").read_text().strip(), "3.12")

    def test_api_rejects_unknown_route_and_never_caches_private_responses(self):
        client = TestClient(importlib.import_module("api.index").app)
        for route in ("/api/health", "/api/services", "/api/ready", "/api/admin/session", "/api/not-found"):
            response = client.get(route)
            self.assertEqual(response.headers["cache-control"], "no-store")
            self.assertEqual(response.headers["x-vercel-enable-rewrite-caching"], "0")
            self.assertEqual(response.headers["referrer-policy"], "no-referrer")
