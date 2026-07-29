import pytest
from services.risk_scoring.risk_engine import risk_engine

def test_risk_scoring_high_risk():
    """Test detection of high-risk flags"""
    text = "We automatically renew your subscription. We sell your data to data brokers and use it to train our AI model without compensation."

    score, level, flags = risk_engine.compute_risk_score(text)

    assert score > 50
    assert level in ["high", "critical"]
    assert len(flags) >= 2

def test_risk_scoring_low_risk():
    """Test low-risk document"""
    text = "This service provides basic functionality with transparent terms. Users can manage their accounts freely. Data privacy is respected through standard security measures."

    score, level, flags = risk_engine.compute_risk_score(text)

    assert score == 0
    assert level == "low"
    assert len(flags) == 0

def test_risk_scoring_with_platform_multiplier():
    """Test platform category multipliers"""
    text = "We sell your data."

    score_saas, level_saas, _ = risk_engine.compute_risk_score(text, "saas")
    score_social, level_social, _ = risk_engine.compute_risk_score(text, "social")

    # Social media should have higher score multiplier
    assert score_social >= score_saas
