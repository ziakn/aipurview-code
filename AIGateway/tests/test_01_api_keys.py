"""E2E: API Key Management"""

import pytest

pytestmark = pytest.mark.asyncio


async def test_create_api_key(api):
    """Create an API key — should be stored encrypted."""
    res = await api.post("/keys", json={
        "key_name": "E2E Test Key",
        "provider": "openai",
        "api_key": "sk-test-e2e-fake-key-for-testing-1234567890abcdef",
    })
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    assert data["id"]
    assert data["key_name"] == "E2E Test Key"
    # Raw key must never appear in response
    assert "sk-test-e2e" not in str(data)
    set_state("e2e_api_key_id = data["id"]


async def test_list_api_keys_masked(api):
    """List API keys — keys should be masked."""
    res = await api.get("/keys")
    assert res.status_code == 200
    keys = res.json()["data"]
    assert len(keys) > 0
    for key in keys:
        assert "masked_key" in key
        assert "encrypted_key" not in key
        assert len(key["masked_key"]) < 30  # "sk-t...cdef" style


async def test_create_api_key_format_validation(api):
    """Create key with invalid format — should fail validation."""
    res = await api.post("/keys/verify", json={
        "provider": "openai",
        "api_key": "bad-key",
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["valid"] is False


async def test_create_api_key_unknown_provider_skips_verify(api):
    """Unknown provider — verification skipped, assumed valid."""
    res = await api.post("/keys/verify", json={
        "provider": "unknown-provider",
        "api_key": "any-key-format",
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["valid"] is True


async def test_delete_api_key(api):
    """Delete API key — hard delete, gone from DB."""
    key_id = get_state("e2e_api_key_id", None)
    if not key_id:
        pytest.skip("No key to delete")
    res = await api.delete(f"/keys/{key_id}")
    assert res.status_code == 200

    # Verify it's gone
    res2 = await api.get("/keys")
    ids = [k["id"] for k in res2.json()["data"]]
    assert key_id not in ids
