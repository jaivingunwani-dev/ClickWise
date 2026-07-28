import logging
import re
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

class RiskScoringEngine:
    """
    Deterministic, rule-based risk scoring system.

    Flags against a versioned red-flag ruleset and computes a weighted score.
    AI layer (Phase 4) will provide nuance context.
    """

    RED_FLAGS = {
        "FLAG_AI_TRAINING": {
            "category": "IP_RIGHTS",
            "weight": 20,
            "keywords": ["train", "ai model", "machine learning", "royalty-free", "license", "ip rights"],
            "description": "Royalty-free rights to user content for LLM/AI model training"
        },
        "FLAG_AUTO_RENEWAL": {
            "category": "SUBSCRIPTION_TRAP",
            "weight": 15,
            "keywords": ["auto-renew", "automatically renew", "auto renewal", "email notice"],
            "description": "Auto-renewal without explicit email notice"
        },
        "FLAG_DATA_SELLING": {
            "category": "DATA_PRIVACY",
            "weight": 25,
            "keywords": ["sell", "data broker", "third party", "share", "monetize"],
            "description": "Selling/sharing personal data with 3rd-party data brokers"
        },
        "FLAG_BINDING_ARBITRATION": {
            "category": "LEGAL",
            "weight": 15,
            "keywords": ["arbitration", "binding arbitration", "class action waiver", "dispute resolution"],
            "description": "Mandatory binding arbitration & class action waiver"
        },
        "FLAG_ACCOUNT_TERMINATION": {
            "category": "ACCOUNT_OWNERSHIP",
            "weight": 15,
            "keywords": ["terminate account", "immediately", "no grace period", "data export"],
            "description": "Immediate account termination without data export grace period"
        },
        "FLAG_TRACKING": {
            "category": "TRACKING",
            "weight": 10,
            "keywords": ["cross-site tracking", "canvas fingerprinting", "tracking"],
            "description": "Cross-site tracking / Canvas fingerprinting"
        }
    }

    PLATFORM_MULTIPLIERS = {
        "saas": 1.0,
        "ecommerce": 1.1,
        "social": 1.2,
        "ai_tool": 1.3,
        "software": 0.9
    }

    def compute_risk_score(
        self,
        text: str,
        platform_category: str = "saas"
    ) -> Tuple[int, str, List[str]]:
        """
        Compute risk score by detecting red flags in document text.

        Args:
            text: Normalized document text
            platform_category: Category of platform (saas, ecommerce, social, ai_tool, software)

        Returns:
            Tuple of (score: 0-100, level: str, fired_flags: list)
        """
        try:
            fired_flags = []
            base_score = 0

            text_lower = text.lower()

            for flag_code, flag_info in self.RED_FLAGS.items():
                keywords = flag_info["keywords"]

                if any(kw in text_lower for kw in keywords):
                    fired_flags.append({
                        "code": flag_code,
                        "category": flag_info["category"],
                        "weight": flag_info["weight"],
                        "description": flag_info["description"]
                    })
                    base_score += flag_info["weight"]

            multiplier = self.PLATFORM_MULTIPLIERS.get(platform_category, 1.0)
            final_score = min(int(base_score * multiplier), 100)

            if final_score >= 75:
                level = "critical"
            elif final_score >= 50:
                level = "high"
            elif final_score >= 25:
                level = "medium"
            else:
                level = "low"

            logger.info(f"Risk score: {final_score} ({level}) - Flags: {len(fired_flags)}")

            return final_score, level, fired_flags

        except Exception as e:
            logger.error(f"Risk scoring error: {str(e)}")
            return 0, "low", []

risk_engine = RiskScoringEngine()
