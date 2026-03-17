"""E2E: Virtual Key Management"""

import pytest

pytestmark = pytest.mark.asyncio


async def test_create_virtual_key(api):
    """Create virtual key — returns plaintext once."""
    res = await api.post("/virtual-keys", json={"name": "E2E Test VK"})
    assert res.status_code == 201, res.text
    data = res.json()["data"]
    assert data["key"].startswith("sk-vw-")
    assert data["id"]
    set_state("e2e_vk_id = data["id"]
    set_state("e2e_vk_plain = data["key"]


async def test_list_virtual_keys_no_plaintext(api):
    """List virtual keys — plaintext must never appear."""
    res = await api.get("/virtual-keys")
    assert res.status_code == 200
    keys = res.json()["data"]
    for k in keys:
        assert "key_hash" not in str(k)
        assert "key_prefix" in k
        assert k["key_prefix"].startswith("sk-vw-")


async def test_revoke_virtual_key(api):
    """Revoke a virtual key — should set revoked_at."""
    vk_id = get_state("e2e_vk_id", None)
    if not vk_id:
        pytest.skip("No VK")
    res = await api.post(f"/virtual-keys/{vk_id}/revoke")
    assert res.status_code == 200


async def test_revoked_key_rejected_at_gateway(gateway):
    """Revoked virtual key should be rejected by the gateway."""
    vk = get_state("e2e_vk_plain", None)
    if not vk:
        pytest.skip("No VK")
    res = await gateway.post(
        "/v1/chat/completions",
        virtual_key=vk,
        json={"model": "any-slug", "messages": [{"role": "user", "content": "hi"}]},
    )
    assert res.status_code == 401


async def test_invalid_virtual_key_rejected(gateway):
    """Invalid virtual key format — 401."""
    res = await gateway.post(
        "/v1/chat/completions",
        virtual_key="not-a-valid-key",
        json={"model": "any-slug", "messages": [{"role": "user", "content": "hi"}]},
    )
    assert res.status_code == 401


async def test_missing_auth_header_rejected(gateway):
    """No Authorization header — 401."""
    res = await gateway.post(
        "/v1/chat/completions",
        json={"model": "any-slug", "messages": [{"role": "user", "content": "hi"}]},
    )
    assert res.status_code == 401


async def test_delete_virtual_key(api):
    """Delete virtual key."""
    vk_id = get_state("e2e_vk_id", None)
    if not vk_id:
        pytest.skip("No VK")
    res = await api.delete(f"/virtual-keys/{vk_id}")
    assert res.status_code == 200
