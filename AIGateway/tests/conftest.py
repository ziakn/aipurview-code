"""
Shared fixtures for AI Gateway E2E tests.

Requires running services:
  - Express backend on BACKEND_URL (default http://localhost:3000)
  - AI Gateway on GATEWAY_URL (default http://localhost:8100)
  - PostgreSQL + Redis

Environment variables:
  - VW_EMAIL: VerifyWise admin email (default gorkem.cetin@verifywise.ai)
  - VW_PASSWORD: VerifyWise admin password
  - BACKEND_URL: Express backend URL
  - GATEWAY_URL: AI Gateway URL
"""

import os
import httpx
import pytest
import pytest_asyncio

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8100")
VW_EMAIL = os.getenv("VW_EMAIL", "gorkem.cetin@verifywise.ai")
VW_PASSWORD = os.getenv("VW_PASSWORD", "")

# Shared state across tests (stored as module-level dict to avoid pytest attribute issues)
_state = {}


def get_state(key, default=None):
    return _state.get(key, default)


def set_state(key, value):
    _state[key] = value


@pytest.fixture(scope="session")
def event_loop_policy():
    """Use default event loop policy to avoid loop-closed errors."""
    import asyncio
    return asyncio.DefaultEventLoopPolicy()


@pytest_asyncio.fixture
async def http():
    """Async HTTP client (per-test to avoid loop-closed issues)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client


@pytest_asyncio.fixture
async def auth_token(http):
    """Login and return JWT token."""
    if not VW_PASSWORD:
        pytest.skip("VW_PASSWORD not set")
    res = await http.post(
        f"{BACKEND_URL}/api/users/login",
        json={"email": VW_EMAIL, "password": VW_PASSWORD},
    )
    assert res.status_code in (200, 202), f"Login failed: {res.status_code} {res.text}"
    return res.json()["data"]["token"]


@pytest_asyncio.fixture
async def api(http, auth_token):
    """Helper: make authenticated requests to the Express backend."""

    class API:
        def __init__(self, client, token):
            self._client = client
            self._headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

        async def get(self, path, **kwargs):
            return await self._client.get(
                f"{BACKEND_URL}/api/ai-gateway{path}",
                headers=self._headers,
                **kwargs,
            )

        async def post(self, path, **kwargs):
            return await self._client.post(
                f"{BACKEND_URL}/api/ai-gateway{path}",
                headers=self._headers,
                **kwargs,
            )

        async def put(self, path, **kwargs):
            return await self._client.put(
                f"{BACKEND_URL}/api/ai-gateway{path}",
                headers=self._headers,
                **kwargs,
            )

        async def patch(self, path, **kwargs):
            return await self._client.patch(
                f"{BACKEND_URL}/api/ai-gateway{path}",
                headers=self._headers,
                **kwargs,
            )

        async def delete(self, path, **kwargs):
            return await self._client.delete(
                f"{BACKEND_URL}/api/ai-gateway{path}",
                headers=self._headers,
                **kwargs,
            )

    return API(http, auth_token)


@pytest_asyncio.fixture
async def gateway(http):
    """Helper: make requests directly to the AI Gateway (virtual key auth)."""

    class Gateway:
        def __init__(self, client):
            self._client = client

        async def post(self, path, virtual_key=None, **kwargs):
            headers = {"Content-Type": "application/json"}
            if virtual_key:
                headers["Authorization"] = f"Bearer {virtual_key}"
            return await self._client.post(
                f"{GATEWAY_URL}{path}",
                headers=headers,
                **kwargs,
            )

        async def get(self, path, virtual_key=None, **kwargs):
            headers = {}
            if virtual_key:
                headers["Authorization"] = f"Bearer {virtual_key}"
            return await self._client.get(
                f"{GATEWAY_URL}{path}",
                headers=headers,
                **kwargs,
            )

    return Gateway(http)
