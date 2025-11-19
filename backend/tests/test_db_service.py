"""
Unit tests for db_service.py

Tests database operations including collections, plants, and forum functionality.
Uses mocking to avoid requiring actual Supabase connection.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import db_service


class TestDatabaseServiceImport:
    """Test that the module imports correctly"""

    def test_db_service_is_importable(self):
        """Verify that core database service module correctly imported"""
        assert db_service is not None
        assert hasattr(db_service, 'save_plant_to_collection')


class TestCreateEmptyCollection:
    """Test collection creation functionality"""

    @patch('db_service.supabase')
    def test_create_empty_collection_success(self, mock_supabase):
        """Test successful creation of an empty collection"""
        # Mock the Supabase response
        mock_response = Mock()
        mock_response.data = [{"id": 1, "collection_name": "My Garden", "status": "Active"}]
        mock_response.error = None

        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response

        result = db_service.create_empty_collection("user-123", "My Garden")

        assert result["status"] == "success"
        assert len(result["data"]) == 1
        assert result["data"][0]["collection_name"] == "My Garden"

    @patch('db_service.supabase')
    def test_create_duplicate_collection_name(self, mock_supabase):
        """Test creating collection with duplicate name returns error"""
        mock_response = Mock()
        mock_response.data = None
        mock_error = Mock()
        mock_error.code = '23505'
        mock_error.message = "Unique constraint violation"
        mock_response.error = mock_error

        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response

        result = db_service.create_empty_collection("user-123", "My Garden")

        assert result["status"] == "error"
        assert "already exists" in result["message"]


class TestSavePlantToCollection:
    """Test saving plants to collections"""

    @patch('db_service.supabase')
    def test_save_plant_to_existing_collection(self, mock_supabase):
        """Test saving a plant to an existing collection"""
        # Mock finding the collection
        mock_collection_response = Mock()
        mock_collection_response.data = [{"id": 1}]
        mock_collection_response.error = None

        # Mock inserting the plant
        mock_plant_response = Mock()
        mock_plant_response.data = [{"id": 10, "common_name": "Snake Plant"}]
        mock_plant_response.error = None

        # Configure the mock chain
        mock_table = Mock()
        mock_supabase.table.return_value = mock_table

        # First call finds collection, second inserts plant
        mock_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = mock_collection_response
        mock_table.insert.return_value.execute.return_value = mock_plant_response

        plant_data = {"common_name": "Snake Plant", "scientific_name": "Sansevieria"}
        result = db_service.save_plant_to_collection("user-123", plant_data, "My Garden")

        assert result["status"] == "success"

    @patch('db_service.create_empty_collection')
    @patch('db_service.supabase')
    def test_save_plant_creates_collection_if_not_exists(self, mock_supabase, mock_create):
        """Test that saving a plant creates collection if it doesn't exist"""
        # Mock collection not found
        mock_not_found = Mock()
        mock_not_found.data = []
        mock_not_found.error = None

        # Mock successful plant insert
        mock_plant_response = Mock()
        mock_plant_response.data = [{"id": 10, "common_name": "Snake Plant"}]
        mock_plant_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = mock_not_found
        mock_table.insert.return_value.execute.return_value = mock_plant_response

        # Mock the collection creation
        mock_create.return_value = {"status": "success", "data": [{"id": 1}]}

        plant_data = {"common_name": "Snake Plant"}
        result = db_service.save_plant_to_collection("user-123", plant_data, "New Garden")

        # Verify collection creation was called
        mock_create.assert_called_once_with("user-123", "New Garden")


class TestGetUserCollections:
    """Test retrieving user collections"""

    @patch('db_service.supabase')
    def test_get_collections_with_plants(self, mock_supabase):
        """Test retrieving collections with plants"""
        # Mock parent collections
        mock_parents = Mock()
        mock_parents.data = [
            {"id": 1, "collection_name": "Indoor Plants"},
            {"id": 2, "collection_name": "Outdoor Garden"}
        ]
        mock_parents.error = None

        # Mock child plants
        mock_children = Mock()
        mock_children.data = [
            {"id": 10, "collection_id": 1, "common_name": "Snake Plant"},
            {"id": 11, "collection_id": 1, "common_name": "Pothos"},
            {"id": 12, "collection_id": 2, "common_name": "Tomato"}
        ]
        mock_children.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table

        # First call gets parents, second gets children
        execute_mock = Mock()
        execute_mock.execute.side_effect = [mock_parents, mock_children]
        mock_table.select.return_value.eq.return_value.order.return_value = execute_mock
        mock_table.select.return_value.in_.return_value.order.return_value.execute.return_value = mock_children

        result = db_service.get_user_collections("user-123")

        assert result["status"] == "success"
        assert "Indoor Plants" in result["data"]
        assert "Outdoor Garden" in result["data"]
        assert len(result["data"]["Indoor Plants"]) == 2
        assert len(result["data"]["Outdoor Garden"]) == 1

    @patch('db_service.supabase')
    def test_get_collections_empty(self, mock_supabase):
        """Test retrieving collections when user has none"""
        mock_response = Mock()
        mock_response.data = []
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response

        result = db_service.get_user_collections("user-123")

        assert result["status"] == "empty"
        assert "No collections found" in result["message"]


class TestDeleteOperations:
    """Test delete operations"""

    @patch('db_service.supabase')
    def test_delete_plant_record(self, mock_supabase):
        """Test deleting a single plant record"""
        mock_response = Mock()
        mock_response.data = [{"id": 10}]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.delete.return_value.eq.return_value.execute.return_value = mock_response

        result = db_service.delete_plant_record("user-123", "10")

        assert result["status"] == "success"

    @patch('db_service.supabase')
    def test_delete_collection_container(self, mock_supabase):
        """Test deleting entire collection (CASCADE delete)"""
        mock_response = Mock()
        mock_response.data = [{"id": 1}]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response

        result = db_service.delete_collection_container("user-123", "My Garden")

        assert result["status"] == "success"


class TestRenameCollection:
    """Test collection rename functionality"""

    @patch('db_service.supabase')
    def test_rename_collection_success(self, mock_supabase):
        """Test successfully renaming a collection"""
        # Mock check for new name (not found)
        mock_check = Mock()
        mock_check.data = []
        mock_check.error = None

        # Mock successful update
        mock_update = Mock()
        mock_update.data = [{"id": 1, "collection_name": "New Name"}]
        mock_update.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table

        # Configure separate call chains
        select_chain = Mock()
        select_chain.eq.return_value.eq.return_value.limit.return_value.execute.return_value = mock_check
        mock_table.select.return_value = select_chain

        update_chain = Mock()
        update_chain.eq.return_value.eq.return_value.execute.return_value = mock_update
        mock_table.update.return_value = update_chain

        result = db_service.rename_collection("user-123", "Old Name", "New Name")

        assert result["status"] == "success"

    @patch('db_service.supabase')
    def test_rename_collection_duplicate_name(self, mock_supabase):
        """Test renaming to an existing collection name"""
        # Mock check for new name (found)
        mock_check = Mock()
        mock_check.data = [{"id": 2, "collection_name": "Existing Name"}]
        mock_check.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table

        select_chain = Mock()
        select_chain.eq.return_value.eq.return_value.limit.return_value.execute.return_value = mock_check
        mock_table.select.return_value = select_chain

        result = db_service.rename_collection("user-123", "My Garden", "Existing Name")

        assert result["status"] == "error"
        assert "already exists" in result["message"]


class TestForumOperations:
    """Test forum post and comment operations"""

    @patch('db_service.supabase')
    def test_create_forum_post(self, mock_supabase):
        """Test creating a new forum post"""
        mock_response = Mock()
        mock_response.data = [{"id": 1, "title": "Test Post", "content": "Content"}]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value.execute.return_value = mock_response

        result = db_service.create_forum_post("user-123", "Test Post", "Content")

        assert result["status"] == "success"

    @patch('db_service.supabase')
    def test_get_recent_forum_posts(self, mock_supabase):
        """Test retrieving recent forum posts with author info"""
        mock_response = Mock()
        mock_response.data = [
            {
                "id": 1,
                "title": "Test Post",
                "content": "Content",
                "profiles": {"email": "user@example.com"}
            }
        ]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

        result = db_service.get_recent_forum_posts()

        assert result["status"] == "success"
        assert result["data"][0]["author_email"] == "user@example.com"
        assert "profiles" not in result["data"][0]

    @patch('db_service.supabase')
    def test_create_forum_comment(self, mock_supabase):
        """Test creating a forum comment"""
        mock_response = Mock()
        mock_response.data = [{"id": 1, "content": "Great post!"}]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value.execute.return_value = mock_response

        result = db_service.create_forum_comment("user-123", "1", "Great post!")

        assert result["status"] == "success"

    @patch('db_service.supabase')
    def test_create_nested_comment_reply(self, mock_supabase):
        """Test creating a nested reply to a comment"""
        mock_response = Mock()
        mock_response.data = [{"id": 2, "content": "Reply", "parent_comment_id": "1"}]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value.execute.return_value = mock_response

        result = db_service.create_forum_comment("user-123", "1", "Reply", parent_comment_id="1")

        assert result["status"] == "success"

    @patch('db_service.supabase')
    def test_get_post_comments(self, mock_supabase):
        """Test retrieving comments for a post"""
        mock_response = Mock()
        mock_response.data = [
            {
                "id": 1,
                "content": "Comment 1",
                "profiles": {"email": "user1@example.com"},
                "parent_comment_id": None
            },
            {
                "id": 2,
                "content": "Reply",
                "profiles": [{"email": "user2@example.com"}],
                "parent_comment_id": 1
            }
        ]
        mock_response.error = None

        mock_table = Mock()
        mock_supabase.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response

        result = db_service.get_post_comments("1")

        assert result["status"] == "success"
        assert len(result["data"]) == 2
        assert result["data"][0]["author_email"] == "user1@example.com"
        assert result["data"][1]["author_email"] == "user2@example.com"


class TestErrorHandling:
    """Test error handling scenarios"""

    @patch('db_service.supabase', None)
    def test_operations_fail_when_supabase_not_initialized(self):
        """Test that operations fail gracefully when Supabase is not initialized"""
        result = db_service.create_empty_collection("user-123", "Test")

        assert result["status"] == "error"
        assert "Database client failed" in result["message"]
