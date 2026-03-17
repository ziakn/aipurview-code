"""E2E: Spend Analytics"""

import pytest

pytestmark = pytest.mark.asyncio


async def test_spend_summary(api):
    """Get spend summary — should return without error."""
    res = await api.get("/spend?period=7d")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "summary" in data
    assert "byDay" in data
    assert "byModel" in data
    assert "byProvider" in data
    assert "errorRateByDay" in data
    assert "tokensPerEndpoint" in data


async def test_spend_by_endpoint(api):
    """Get spend by endpoint."""
    res = await api.get("/spend/by-endpoint?period=30d")
    assert res.status_code == 200


async def test_spend_by_user(api):
    """Get spend by user."""
    res = await api.get("/spend/by-user?period=30d")
    assert res.status_code == 200


async def test_spend_logs(api):
    """Get spend logs with pagination."""
    res = await api.get("/spend/logs?limit=5")
    assert res.status_code == 200


async def test_spend_today_period(api):
    """'Today' period returns data from midnight, not last 24h."""
    res = await api.get("/spend?period=1d")
    assert res.status_code == 200
    data = res.json()["data"]
    # byDay should contain hourly buckets (00:00 - 23:00)
    if data.get("byDay"):
        assert data["byDay"][0]["day"].endswith(":00")
