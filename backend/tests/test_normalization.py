import pytest
from services.caching.normalize import normalize_text, compute_hash

def test_normalize_text_removes_scripts():
    """Test that script tags are removed"""
    text = "Hello <script>alert('xss')</script> world"
    normalized = normalize_text(text)
    assert "script" not in normalized
    assert "xss" not in normalized
    assert "Hello" in normalized
    assert "world" in normalized

def test_normalize_text_removes_styles():
    """Test that style tags are removed"""
    text = "Hello <style>.bg{color:red}</style> world"
    normalized = normalize_text(text)
    assert "style" not in normalized
    assert "color" not in normalized

def test_normalize_text_removes_query_params():
    """Test that query parameters are removed"""
    text = "Visit https://example.com?utm_source=test&session_id=123"
    normalized = normalize_text(text)
    assert "utm_source" not in normalized
    assert "session_id" not in normalized

def test_compute_hash_deterministic():
    """Test that hash computation is deterministic"""
    text = "Some legal document content"
    hash1 = compute_hash(text)
    hash2 = compute_hash(text)

    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 hex is 64 chars

def test_compute_hash_different_content():
    """Test that different content produces different hashes"""
    hash1 = compute_hash("Content A")
    hash2 = compute_hash("Content B")

    assert hash1 != hash2
