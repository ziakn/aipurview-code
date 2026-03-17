"""E2E: Prompt Management"""

import pytest

pytestmark = pytest.mark.asyncio


async def test_create_prompt(api):
    """Create a prompt."""
    res = await api.post("/prompts", json={
        "name": "E2E Test Prompt",
        "slug": "e2e-test-prompt",
        "description": "A test prompt for E2E",
    })
    assert res.status_code == 201, res.text
    set_state("e2e_prompt_id = res.json()["data"]["id"]


async def test_list_prompts(api):
    """List prompts — should include ours."""
    res = await api.get("/prompts")
    assert res.status_code == 200
    slugs = [p["slug"] for p in res.json()["data"]]
    assert "e2e-test-prompt" in slugs


async def test_create_prompt_version(api):
    """Create a version for the prompt."""
    pid = get_state("e2e_prompt_id", None)
    if not pid:
        pytest.skip("No prompt")
    res = await api.post(f"/prompts/{pid}/versions", json={
        "content": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello {{name}}!"},
        ],
        "model": "openai/gpt-4o-mini",
        "commit_message": "Initial version",
    })
    assert res.status_code == 201, res.text
    set_state("e2e_version_id = res.json()["data"]["id"]


async def test_list_versions(api):
    """List versions — should have version 1."""
    pid = get_state("e2e_prompt_id", None)
    if not pid:
        pytest.skip("No prompt")
    res = await api.get(f"/prompts/{pid}/versions")
    assert res.status_code == 200
    versions = res.json()["data"]
    assert len(versions) >= 1
    assert versions[0]["version"] == 1


async def test_publish_version(api):
    """Publish a version."""
    pid = get_state("e2e_prompt_id", None)
    vid = get_state("e2e_version_id", None)
    if not pid or not vid:
        pytest.skip("No prompt/version")
    # Get version number
    res = await api.get(f"/prompts/{pid}/versions")
    v_num = res.json()["data"][0]["version"]
    res = await api.post(f"/prompts/{pid}/versions/{v_num}/publish")
    assert res.status_code == 200


async def test_cleanup_prompt(api):
    """Delete test prompt."""
    pid = get_state("e2e_prompt_id", None)
    if pid:
        res = await api.delete(f"/prompts/{pid}")
        assert res.status_code == 200
