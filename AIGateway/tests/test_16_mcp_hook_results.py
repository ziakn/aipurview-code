"""E2E: native tool-call result capture (/v1/mcp/hook/result)."""
import os
import httpx
import pytest
from conftest import set_state, get_state

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8100")
_client = httpx.Client(timeout=30.0)


def test_setup_result_key_and_pii_rule(api):
    key_res = api.post("/mcp/agent-keys", json={"name": "E2E Result Key"})
    assert key_res.status_code in (200, 201), key_res.text
    set_state("result_agent_key", key_res.json()["data"]["plain_key"])
    rule_res = api.post("/mcp/guardrails", json={
        "name": "E2E Result PII Mask",
        "rule_type": "pii",
        "action": "mask",
        "config": {"entities": {"EMAIL_ADDRESS": "mask"}, "score_thresholds": {"ALL": 0.5}, "language": "en"},
    })
    assert rule_res.status_code in (200, 201), rule_res.text
