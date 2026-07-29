# Dev 1: Backend Services (Phase 3) - Executable Prompts

**Role:** Backend Lead | **Budget:** ~$23 | **Time:** ~2 hours

---

## PROMPT 1: Risk Scoring from Supabase Rules [CRITICAL]

**File:** `backend/services/risk_scoring/risk_engine.py`
**Action:** Add async method to load red_flag_rules from Supabase instead of hardcoded dict
**Priority:** CRITICAL
**Tokens:** ~$4

```
Update the RiskScoringEngine class to:

1. Add a new method: `async def load_rules_from_db(self) -> None:`
   - Query Supabase table "red_flag_rules"
   - Map results: rule_code → {weight, pattern_keywords, description}
   - Store in self.RED_FLAGS (replacing hardcoded dict)
   - Call this in __init__

2. Update compute_risk_score to use self.RED_FLAGS

3. Add error handling: if DB fails, fallback to hardcoded rules

Keep the hardcoded rules as fallback. Test by importing and calling:
```python
from services.risk_scoring.risk_engine import risk_engine
import asyncio
asyncio.run(risk_engine.load_rules_from_db())
```

Expected output: risk_engine.RED_FLAGS now has 6+ rules from DB (or hardcoded fallback)
```

---

## PROMPT 2: Claude API Response Parsing & Structure [CRITICAL]

**File:** `backend/services/claude_client.py`
**Action:** Fix JSON parsing and add structured output validation
**Priority:** CRITICAL
**Tokens:** ~$5

```
Update ClaudeClient.analyze_document() to:

1. Change response format to include explicit JSON block:
   - Claude prompt should ask for output wrapped in ```json ... ```
   - Add a regex parser to extract JSON from markdown code blocks

2. Add validation schema using Pydantic:
   ```python
   from pydantic import BaseModel
   
   class DocumentAnalysis(BaseModel):
       executive_summary: str
       key_clauses: list[str]
       ai_training_clause: bool
       dark_patterns_detected: list[str]
       user_rights: list[str]
       user_responsibilities: list[str]
       risk_factors: list[str]
       disclaimer: str
   ```

3. Parse Claude output, validate with Pydantic, return dict
   - If validation fails, log error and return minimal valid dict

Test:
```python
analysis = await claude_client.analyze_document(
    "sample terms of service text here" * 50,
    "tos",
    "example.com"
)
assert "executive_summary" in analysis
assert isinstance(analysis["ai_training_clause"], bool)
```

Expected: analysis dict matches DocumentAnalysis schema, no KeyError
```

---

## PROMPT 3: End-to-End Caching Flow Test [HIGH]

**File:** `backend/tests/test_caching_e2e.py` (NEW FILE)
**Action:** Create integration test for cache hit/miss
**Priority:** HIGH
**Tokens:** ~$4

```
Create a new test file that:

1. Test cache miss (first scan):
   - POST to /api/v1/scan with sample document
   - Assert response.cached == False
   - Assert response.risk_score.score >= 0
   - Assert "disclaimer" in response.summary

2. Test cache hit (same document):
   - Extract content_hash from first response
   - POST same document again
   - Assert response.cached == True
   - Assert response.content_hash == previous hash

3. Test different document (cache miss):
   - POST with different content
   - Assert new content_hash != previous
   - Assert response.cached == False

Use pytest + TestClient:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cache_hit_miss():
    payload = {
        "content": "Terms of service document. " * 100,
        "domain": "test.com",
        "doc_type": "tos"
    }
    r1 = client.post("/api/v1/scan", json=payload)
    assert r1.status_code == 200
    assert r1.json()["cached"] == False
    
    r2 = client.post("/api/v1/scan", json=payload)
    assert r2.json()["cached"] == True
```

Expected: All 3 test cases pass
```

---

## PROMPT 4: Risk Level Assignment Logic [HIGH]

**File:** `backend/services/risk_scoring/risk_engine.py`
**Action:** Update risk level thresholds based on domain category
**Priority:** HIGH
**Tokens:** ~$3

```
Modify calculate_risk_score() to:

1. Accept platform_category parameter (saas, ecommerce, social, ai_tool)

2. Apply platform-specific multipliers BEFORE level assignment:
   - saas: 1.0x (baseline)
   - ecommerce: 1.1x (higher sensitivity)
   - social: 1.2x (highest sensitivity)
   - ai_tool: 1.3x (highest due to AI training clauses)

3. Risk level thresholds (post-multiplier):
   - 75+: CRITICAL (red)
   - 50-74: HIGH (orange)
   - 25-49: MEDIUM (yellow)
   - 0-24: LOW (green)

4. Return dict with:
   {
     "score": int,
     "level": str,
     "flags": list,
     "platform_category": str,
     "applied_multiplier": float
   }

Test with:
```python
result = await risk_engine.calculate_risk_score(
    analysis,
    document_text,
    platform_category="ai_tool"
)
assert result["level"] in ["low", "medium", "high", "critical"]
assert result["applied_multiplier"] == 1.3
```

Expected: Score adjusts by 1.3x for ai_tool category
```

---

## PROMPT 5: Logging & Error Handling Cleanup [MEDIUM]

**File:** `backend/main.py`, `backend/api/routes/documents.py`
**Action:** Add structured logging for debugging
**Priority:** MEDIUM
**Tokens:** ~$2

```
Update logging throughout backend:

1. In main.py:
   - Change print() to logger.info() for startup/shutdown
   - Add logger = logging.getLogger(__name__) at top

2. In documents.py:
   - Log cache hit/miss with content_hash
   - Log Claude API call start/finish with timing
   - Log error details (not just "Failed to scan document")

3. Format: [timestamp] [level] [function] message

4. Set log level via environment:
   - ENVIRONMENT=development → DEBUG
   - ENVIRONMENT=production → INFO

Test by running:
```bash
export ENVIRONMENT=development
python backend/main.py
# Should see debug logs in terminal
```

Expected: Console shows structured logs, no bare print() statements
```

---

## Quick Reference: What Each Prompt Delivers

| Prompt | Output | Used By |
|--------|--------|---------|
| 1 | DB-driven red flag rules | Frontend risk display |
| 2 | Validated Claude responses | All endpoints |
| 3 | Cache integrity tests | QA before demo |
| 4 | Risk level assignment | Risk score badge |
| 5 | Structured logging | Debugging during demo |

---

## Execution Checklist

- [ ] Prompt 1: Load rules from Supabase
- [ ] Prompt 2: Claude response validation
- [ ] Run test: `pytest backend/tests/test_documents.py -v`
- [ ] Prompt 3: E2E caching test
- [ ] Prompt 4: Platform-specific risk levels
- [ ] Prompt 5: Structured logging
- [ ] **Final**: `curl http://localhost:8000/api/health` → returns 200

Once all complete, notify Dev 2 & 3 that backend is ready for integration.

