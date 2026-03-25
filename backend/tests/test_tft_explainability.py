"""Tests for TFT explainability service."""

import pytest
from app.services.tft_explainability_service import (
    explain_rule_vs_attention,
    FEATURE_DESCRIPTIONS,
)


def test_feature_descriptions_not_empty():
    assert len(FEATURE_DESCRIPTIONS) > 10


def test_explain_no_attention():
    rules = [{"feature": "precip_24h", "contribution": 30}]
    result = explain_rule_vs_attention(rules, None)
    assert result["comparison_available"] is False
    assert result["rule_only"] == rules


def test_explain_with_agreement():
    rules = [
        {"feature": "precip_24h", "contribution": 40},
        {"feature": "humidity", "contribution": 15},
    ]
    attention = {
        "precip_24h": 0.35,
        "humidity": 0.20,
        "soil_moisture": 0.15,
    }
    result = explain_rule_vs_attention(rules, attention)
    assert result["comparison_available"] is True
    assert len(result["agreements"]) > 0


def test_explain_with_disagreement():
    rules = [
        {"feature": "precip_24h", "contribution": 50},
    ]
    attention = {
        "precip_24h": 0.01,
        "soil_moisture": 0.8,
    }
    result = explain_rule_vs_attention(rules, attention)
    assert result["comparison_available"] is True
    assert len(result["disagreements"]) > 0


@pytest.mark.asyncio
async def test_attention_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/risk/28/explain/attention")
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_comparison_endpoint(client, mock_external_apis):
    response = await client.get("/api/v1/risk/28/explain/comparison?hazard=flood")
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.json()
        assert "comparison_available" in data
