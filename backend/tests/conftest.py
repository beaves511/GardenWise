"""
Pytest configuration and fixtures for plant_service tests.

This sets up environment variables before any modules are imported,
preventing import-time errors from missing API keys in the .env file.
"""

import os
import pytest


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """
    Set up mock environment variables before any tests run.
    This prevents plant_service.py from raising errors during import.
    """
    # Set mock values for RapidAPI
    os.environ['RAPID_API_KEY'] = 'test_rapid_api_key_12345'
    os.environ['RAPID_API_HOST'] = 'test-host.p.rapidapi.com'
    os.environ['RAPIDAPI_BASE_URL'] = 'https://test-api.example.com/search'

    # Set mock value for Perenual API
    os.environ['PLANT_API_KEY'] = 'test_plant_api_key_67890'

    yield

    # Optional: Clean up after all tests complete
    # (Not strictly necessary since tests run in isolated process)
