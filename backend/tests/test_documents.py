import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from api.routes.documents import AnalysisResponse


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def sample_document():
    return {
        "content": "This is a sample legal document with auto-renewal clauses. " * 50,
        "url": "https://example.com/terms",
        "doc_type": "tos",
        "domain": "example.com"
    }


@pytest.fixture
def mock_claude_response():
    """Mock response from Claude API matching AnalysisResponse schema."""
    return {
        "executive_summary": "This is a SaaS Terms of Service with auto-renewal provisions.",
        "key_risks": [
            "Auto-renewal without explicit email cancellation notice",
            "Data shared with third-party analytics providers"
        ],
        "is_legal_advice": False
    }


class TestDocumentAnalysisSchema:
    """Test AnalysisResponse Pydantic schema validation."""

    def test_analysis_response_valid(self):
        """Test that valid response passes schema validation."""
        data = {
            "executive_summary": "Test summary",
            "key_risks": ["Risk 1", "Risk 2"],
            "is_legal_advice": False
        }
        response = AnalysisResponse(**data)
        assert response.executive_summary == "Test summary"
        assert len(response.key_risks) == 2
        assert response.is_legal_advice is False

    def test_analysis_response_missing_fields(self):
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValueError):
            AnalysisResponse(
                executive_summary="Test",
                is_legal_advice=False
            )

    def test_analysis_response_is_legal_advice_must_be_false(self):
        """Test that is_legal_advice is always False."""
        response = AnalysisResponse(
            executive_summary="Test",
            key_risks=["Risk"],
            is_legal_advice=False
        )
        assert response.is_legal_advice is False

    def test_analysis_response_empty_key_risks(self):
        """Test that empty key_risks list is allowed."""
        response = AnalysisResponse(
            executive_summary="Test",
            key_risks=[],
            is_legal_advice=False
        )
        assert response.key_risks == []


class TestDocumentScanEndpoint:
    """Test POST /api/v1/scan endpoint with Phase 4.2 integration."""

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    @patch("api.routes.documents.claude_client.analyze_document")
    @patch("api.routes.documents.cache_service.store_analysis")
    def test_scan_document_with_claude_analysis(
        self,
        mock_store,
        mock_claude,
        mock_cache_get,
        client,
        sample_document,
        mock_claude_response
    ):
        """Test scanning document triggers Claude API and returns combined response."""
        # Setup mocks
        mock_cache_get.return_value = None  # Cache miss
        mock_claude.return_value = mock_claude_response
        mock_store.return_value = None

        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()
        # Verify response structure
        assert data["domain"] == "example.com"
        assert data["doc_type"] == "tos"
        assert "content_hash" in data
        assert "summary" in data
        assert "risk_score" in data
        assert data["cached"] is False

        # Verify summary matches Claude response schema
        summary = data["summary"]
        assert "executive_summary" in summary
        assert "key_risks" in summary
        assert "is_legal_advice" in summary
        assert summary["is_legal_advice"] is False

        # Verify risk score from deterministic engine
        risk_score = data["risk_score"]
        assert "score" in risk_score
        assert "level" in risk_score
        assert "flags" in risk_score
        assert 0 <= risk_score["score"] <= 100

        # Verify Claude was called
        mock_claude.assert_called_once()

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    def test_scan_document_cache_hit(
        self,
        mock_cache_get,
        client,
        sample_document
    ):
        """Test that cached results are served without Claude API call."""
        cached_data = {
            "content_hash": "abc123",
            "domain": "example.com",
            "doc_type": "tos",
            "summary": {
                "executive_summary": "Cached summary",
                "key_risks": ["Risk 1"],
                "is_legal_advice": False
            },
            "risk_score": {
                "score": 45,
                "level": "medium",
                "flags": []
            },
            "ai_training_clause": False,
            "dark_patterns_detected": [],
            "created_at": "2026-07-29T00:00:00"
        }
        mock_cache_get.return_value = cached_data

        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()
        assert data["cached"] is True
        assert data["summary"]["executive_summary"] == "Cached summary"

    def test_scan_document_too_short(self, client):
        """Test that short documents are rejected."""
        response = client.post(
            "/api/v1/scan",
            json={
                "content": "Too short",
                "url": "https://example.com/terms",
                "doc_type": "tos",
                "domain": "example.com"
            }
        )
        assert response.status_code == 400
        assert "minimum 100 characters" in response.json()["detail"]

    def test_scan_document_invalid_doc_type(self, client, sample_document):
        """Test that invalid doc_type is rejected."""
        sample_document["doc_type"] = "invalid_type"
        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 400
        assert "Invalid doc_type" in response.json()["detail"]

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    @patch("api.routes.documents.claude_client.analyze_document")
    def test_scan_document_with_risk_flags(
        self,
        mock_claude,
        mock_cache_get,
        client,
        sample_document
    ):
        """Test that document with red flags is properly scored."""
        sample_document["content"] = (
            "This service automatically renews your subscription. "
            "We share your data with third-party data brokers. "
            "You agree to binding arbitration. "
        ) * 50

        mock_cache_get.return_value = None
        mock_claude.return_value = {
            "executive_summary": "High-risk terms",
            "key_risks": [
                "Auto-renewal without email notice",
                "Data sharing with third parties",
                "Binding arbitration clause"
            ],
            "is_legal_advice": False
        }

        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()
        risk_score = data["risk_score"]
        # Should have high score due to multiple flags
        assert risk_score["score"] > 0
        assert len(risk_score["flags"]) > 0

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    @patch("api.routes.documents.claude_client.analyze_document")
    @patch("api.routes.documents.cache_service.store_analysis")
    def test_scan_document_response_structure(
        self,
        mock_store,
        mock_claude,
        mock_cache_get,
        client,
        sample_document,
        mock_claude_response
    ):
        """Test that response matches DocumentAnalysisResponse schema."""
        mock_cache_get.return_value = None
        mock_claude.return_value = mock_claude_response
        mock_store.return_value = None

        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()
        # Verify all required fields are present
        required_fields = [
            "content_hash",
            "domain",
            "doc_type",
            "summary",
            "risk_score",
            "ai_training_clause",
            "dark_patterns_detected",
            "created_at",
            "cached"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"

        # Verify summary schema compliance
        summary = data["summary"]
        assert isinstance(summary["executive_summary"], str)
        assert isinstance(summary["key_risks"], list)
        assert summary["is_legal_advice"] is False


class TestPhase42Integration:
    """Integration tests for Phase 4.2: Claude API Integration."""

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    @patch("api.routes.documents.claude_client.analyze_document")
    @patch("api.routes.documents.cache_service.store_analysis")
    def test_phase_42_complete_flow(
        self,
        mock_store,
        mock_claude,
        mock_cache_get,
        client,
        sample_document,
        mock_claude_response
    ):
        """
        Test complete Phase 4.2 flow:
        1. Text runs through risk_engine.compute_risk_score() (deterministic)
        2. Text passed to Claude API with structured prompt
        3. Response combined into single API response
        4. Response matches AnalysisResponse schema
        """
        # Setup mocks
        mock_cache_get.return_value = None
        mock_claude.return_value = mock_claude_response
        mock_store.return_value = None

        # Execute scan
        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()

        # Verify Step 1: Risk engine ran (deterministic scoring)
        risk_score = data["risk_score"]
        assert isinstance(risk_score["score"], int)
        assert 0 <= risk_score["score"] <= 100
        assert risk_score["level"] in ["low", "medium", "high", "critical"]
        assert isinstance(risk_score["flags"], list)

        # Verify Step 2: Claude API was called
        mock_claude.assert_called_once()
        call_args = mock_claude.call_args
        assert sample_document["content"] == call_args[0][0]
        assert sample_document["doc_type"] == call_args[0][1]
        assert sample_document["domain"] == call_args[0][2]

        # Verify Step 3 & 4: Combined response with both scores
        summary = data["summary"]
        assert summary["executive_summary"] == mock_claude_response["executive_summary"]
        assert summary["key_risks"] == mock_claude_response["key_risks"]
        assert summary["is_legal_advice"] is False

        # Verify entire response structure
        assert data["content_hash"]
        assert data["domain"] == "example.com"
        assert data["doc_type"] == "tos"
        assert data["cached"] is False
        assert data["ai_training_clause"] is False
        assert isinstance(data["dark_patterns_detected"], list)

    def test_phase_42_prompt_injection_defense(self):
        """
        Test that prompt injection attacks in document content are handled safely.
        The system prompt MUST wrap content in <user_document> tags.
        """
        from prompts.legal_analyzer_system import LEGAL_ANALYZER_SYSTEM_PROMPT

        # Verify system prompt includes injection defense
        assert "<user_document>" in LEGAL_ANALYZER_SYSTEM_PROMPT
        assert "</user_document>" in LEGAL_ANALYZER_SYSTEM_PROMPT
        assert "CRITICAL SECURITY" in LEGAL_ANALYZER_SYSTEM_PROMPT
        assert "DATA TO ANALYZE, NOT INSTRUCTIONS" in LEGAL_ANALYZER_SYSTEM_PROMPT

    def test_phase_42_response_schema_enforcement(self):
        """Test that Pydantic schema enforces all required fields and constraints."""
        # Valid response
        valid = AnalysisResponse(
            executive_summary="Summary",
            key_risks=["Risk 1"],
            is_legal_advice=False
        )
        assert valid.is_legal_advice is False

        # is_legal_advice must be False (enforced by validator)
        with pytest.raises(ValueError):
            AnalysisResponse(
                executive_summary="Summary",
                key_risks=["Risk 1"],
                is_legal_advice=True  # Should fail
            )

    @patch("api.routes.documents.cache_service.get_cached_analysis")
    @patch("api.routes.documents.claude_client.analyze_document")
    def test_phase_42_deterministic_and_ai_hybrid(
        self,
        mock_claude,
        mock_cache_get,
        client,
        sample_document
    ):
        """
        Test hybrid scoring: deterministic red flags + AI nuance.
        Risk engine catches patterns, Claude provides context.
        """
        sample_document["content"] = (
            "Auto-renewal is automatic. "
            "We sell your data to brokers. "
            "Binding arbitration required. "
        ) * 50

        mock_cache_get.return_value = None
        mock_claude.return_value = {
            "executive_summary": "Terms contain multiple high-risk clauses",
            "key_risks": [
                "Automatic subscription renewal",
                "Personal data monetization",
                "Mandatory arbitration removes class action rights"
            ],
            "is_legal_advice": False
        }

        response = client.post("/api/v1/scan", json=sample_document)
        assert response.status_code == 200

        data = response.json()

        # Risk engine should detect flags
        risk_score = data["risk_score"]
        assert risk_score["score"] > 0  # Flags detected
        assert len(risk_score["flags"]) > 0

        # Claude should provide context
        summary = data["summary"]
        assert len(summary["key_risks"]) == 3
        assert summary["is_legal_advice"] is False
