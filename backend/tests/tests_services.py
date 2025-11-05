import pytest
import os

# CRITICAL FIX: Use relative import to access files in the parent directory (backend/)
from .. import db_service 

def test_db_service_is_importable():
    """
    Verifies that the core database service module is correctly imported 
    from the parent directory.
    
    If this test fails, it means the CI runner cannot find your db_service.py file,
    and the PYTHONPATH setup or the file structure is wrong.
    """
    # This assertion passes if the import statement above succeeded
    assert db_service is not None
    # Verify a critical function exists to ensure the module is fully loaded
    assert hasattr(db_service, 'save_plant_to_collection')
