"""
Pytest configuration and fixtures for Click Wise backend tests.
"""

import pytest
import os
from dotenv import load_dotenv
from unittest.mock import patch, MagicMock

# Load test environment variables
load_dotenv('.env.test')


@pytest.fixture(autouse=True)
def mock_supabase():
    """Mock Supabase client to avoid actual API calls."""
    with patch('services.caching.cache_service.create_client') as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client
        yield mock_client
