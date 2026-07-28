import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_document():
    return {
        "content": "This is a sample legal document. " * 200,
        "url": "https://example.com/terms",
        "doc_type": "tos",
        "domain": "example.com"
    }

def test_analyze_document_basic(client, sample_document):
    """Test document analysis endpoint"""
    response = client.post("/api/documents/analyze", json=sample_document)
    assert response.status_code == 200

    data = response.json()
    assert data["domain"] == "example.com"
    assert data["doc_type"] == "tos"
    assert "risk_score" in data
    assert "summary" in data

def test_analyze_document_too_short(client):
    """Test that short documents are rejected"""
    response = client.post(
        "/api/documents/analyze",
        json={
            "content": "Too short",
            "url": "https://example.com/terms",
            "doc_type": "tos",
            "domain": "example.com"
        }
    )
    assert response.status_code == 400
