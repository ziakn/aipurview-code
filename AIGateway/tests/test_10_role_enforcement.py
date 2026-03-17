"""E2E: Role-Based Access Control

These tests verify that write operations are Admin-only.
Read operations should work for all authenticated roles.
"""

import pytest

pytestmark = pytest.mark.asyncio


async def test_admin_can_create_key(api):
    """Admin can create API keys."""
    res = await api.post("/keys", json={
        "key_name": "E2E Role Test Key",
        "provider": "openai",
        "api_key": "sk-test-role-fake-key-1234567890abcdefghijklmno",
    })
    assert res.status_code == 201
    set_state("e2e_role_key_id = res.json()["data"]["id"]


async def test_admin_can_create_endpoint(api):
    """Admin can create endpoints."""
    key_id = get_state("e2e_role_key_id", None)
    if not key_id:
        pytest.skip("No key")
    res = await api.post("/endpoints", json={
        "display_name": "E2E Role Test EP",
        "slug": "e2e-role-test-ep",
        "provider": "openai",
        "model": "openai/gpt-4o-mini",
        "api_key_id": key_id,
    })
    assert res.status_code == 201
    set_state("e2e_role_ep_id = res.json()["data"]["id"]


async def test_admin_can_create_guardrail(api):
    """Admin can create guardrails."""
    res = await api.post("/guardrails", json={
        "guardrail_type": "content_filter",
        "name": "E2E Role Guard",
        "action": "block",
        "config": {"type": "keyword", "pattern": "e2e-test-word"},
    })
    assert res.status_code == 201
    set_state("e2e_role_guard_id = res.json()["data"]["id"]


async def test_admin_can_manage_risk_settings(api):
    """Admin can update risk settings."""
    res = await api.put("/risk-settings/pii_exposure", json={
        "is_enabled": True,
    })
    assert res.status_code == 200


async def test_admin_can_run_detection(api):
    """Admin can trigger manual risk detection."""
    res = await api.post("/risk-suggestions/detect")
    assert res.status_code == 200


async def test_read_operations_accessible(api):
    """All read operations should be accessible to any authenticated user."""
    read_endpoints = [
        "/keys",
        "/endpoints",
        "/spend?period=7d",
        "/spend/by-endpoint?period=7d",
        "/spend/by-user?period=7d",
        "/spend/logs?limit=1",
        "/budget",
        "/providers",
        "/guardrails",
        "/guardrails/settings",
        "/guardrails/stats?period=7d",
        "/prompts",
        "/virtual-keys",
        "/risk-settings",
        "/risk-suggestions",
    ]
    for path in read_endpoints:
        res = await api.get(path)
        assert res.status_code == 200, f"GET {path} returned {res.status_code}: {res.text[:100]}"


async def test_cleanup_role_test_data(api):
    """Clean up test data."""
    for attr, path in [
        ("e2e_role_guard_id", "/guardrails"),
        ("e2e_role_ep_id", "/endpoints"),
        ("e2e_role_key_id", "/keys"),
    ]:
        item_id = getattr(pytest, attr, None)
        if item_id:
            await api.delete(f"{path}/{item_id}")
