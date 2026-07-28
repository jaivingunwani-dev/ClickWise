import re
import hashlib
from typing import Optional

def normalize_text(raw_text: str) -> str:
    """
    Normalize raw document text for consistent hashing.

    Removes:
    - Dynamic HTML tags, inline styles, and scripts
    - Query parameters from URLs
    - Excessive whitespace
    - Dynamic CSS classes

    Returns normalized plain text suitable for deterministic SHA-256 hashing.
    """
    if not raw_text:
        return ""

    text = raw_text.strip()

    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)

    text = re.sub(r'\?[^"\s<>]+', '', text)
    text = re.sub(r'utm_\w+=[\w\-\.]+', '', text)
    text = re.sub(r'session_id=[\w\-\.]+', '', text)

    text = re.sub(r'style="[^"]*"', '', text)
    text = re.sub(r'class="[^"]*"', '', text)

    text = re.sub(r'\s+', ' ', text)

    return text.strip()

def compute_hash(text: str) -> str:
    """
    Compute deterministic SHA-256 hash of normalized text.

    Args:
        text: Normalized plain text

    Returns:
        Hex-encoded SHA-256 hash
    """
    normalized = normalize_text(text)
    return hashlib.sha256(normalized.encode()).hexdigest()
