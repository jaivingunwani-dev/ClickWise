import pytest
from services.risk_scoring.risk_engine import risk_engine

def test_risk_scoring_high_risk():
    """Test detection of high-risk flags"""
    text = "We automatically renew your subscription. Your data will be sold to third parties for AI model training."

    score, level, flags = risk_engine.compute_risk_score(text)

    assert score > 50
    assert level in ["high", "critical"]
    assert len(flags) >= 2

def test_risk_scoring_low_risk():
    """Test low-risk document"""
    text = "You can cancel anytime. We do not sell your data. We use cookies only for functionality."

    score, level, flags = risk_engine.compute_risk_score(text)

    assert score <= 25
    assert level == "low"

def test_risk_scoring_with_platform_multiplier():
    """Test platform category multipliers"""
    text = "We sell your data."

    score_saas, level_saas, _ = risk_engine.compute_risk_score(text, "saas")
    score_social, level_social, _ = risk_engine.compute_risk_score(text, "social")

    # Social media should have higher score multiplier
    assert score_social >= score_saas
