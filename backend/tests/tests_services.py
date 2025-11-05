# import pytest
# import os

# CRITICAL FIX: Use relative import (backend/)
from .. import db_service


def test_db_service_is_importable():
    """
    Verifies that core database service module correctly imported
    from the parent directory.

    If test fails, it means CI runner not find db_service.py file,
    and the PYTHONPATH setup or the file structure is wrong.
    """
    # This assertion passes if the import statement above succeeded
    assert db_service is not None
    # Verify a critical function exists to ensure the module is fully loaded
    assert hasattr(db_service, 'save_plant_to_collection')
