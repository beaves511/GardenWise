# tests/test_services.py

import pytest
import os


def test_service_layer_imports():
    """
    Verifies that the crucial service layer dependencies 
    can be imported by the API controllers.
    
    integration check for file paths and initial dependencies 
    are correctly set up in the environment.
    """
    try:
        # Attempt to import the core service files
        import db_service
        import auth_service
        from api.collections import collections_bp
        from api.auth import auth_bp
        # from api.ai_planner import ai_bp
        
        # If all imports succeed, the test passes
        assert db_service is not None
        assert auth_service is not None
        assert collections_bp is not None
        assert auth_bp is not None
        # assert ai_bp is not None

    except ImportError as e:
        # Fail the test explicitly if an import error occurs
        pytest.fail(f"CRITICAL DEPENDENCY FAILURE: Failed to importrequired service module. Error: {e}")


# This test ensures that the necessary environment variables are present 
# for the application to initialize without crashing (e.g., in db_service.py).
def test_environment_variables_are_loaded():
    """
    Checks if critical environment variables are available, even if mocked.
    """
    # NOTE: In a real CI, we mock these values. Here, we check for presence.
    required_keys = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "GEMINI_API_KEY"]
    
    for key in required_keys:
        # Check if the environment variable is present (os.getenv should return something)
        # In GitHub Actions, you must set these as repository secrets for a full test.
        if os.getenv(key) is None:
            pytest.fail(f"SECURITY WARNING: Critical environment variable '{key}' is missing or None.")
