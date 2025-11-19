"""
Unit tests for plant_service.py

Tests plant search functionality for both indoor (RapidAPI) and outdoor (Perenual) plants.
Uses mocking to avoid requiring actual API keys.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Mock environment variables BEFORE importing plant_service
# This prevents the module initialization from failing due to missing .env file
os.environ['RAPID_API_KEY'] = 'test_rapid_api_key'
os.environ['RAPID_API_HOST'] = 'test.rapidapi.com'
os.environ['RAPIDAPI_BASE_URL'] = 'https://test.rapidapi.com/search'
os.environ['PLANT_API_KEY'] = 'test_plant_api_key'

import plant_service


class TestRapidAPIPlantSearch:
    """Test indoor plant search using RapidAPI"""

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_success(self, mock_get):
        """Test successful indoor plant search"""
        # Mock API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "item": {
                    "id": "123",
                    "Common name": ["Snake Plant"],
                    "Latin name": "Sansevieria trifasciata",
                    "Description": "A hardy indoor plant",
                    "Light ideal": "Low to bright indirect light",
                    "Watering": "Allow soil to dry between waterings",
                    "Temperature min": {"C": "15"},
                    "Temperature max": {"C": "30"},
                    "Img": "https://example.com/snake-plant.jpg",
                    "Url": "https://example.com/snake-plant-detail.jpg"
                }
            }
        ]
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("snake plant")

        assert result is not None
        assert result["common_name"] == "Snake Plant"
        assert result["scientific_name"] == "Sansevieria trifasciata"
        assert result["description"] == "A hardy indoor plant"
        assert result["care_instructions"]["light"] == "Low to bright indirect light"
        assert result["image_url"] == "https://example.com/snake-plant.jpg"

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_with_list_common_name(self, mock_get):
        """Test handling of common name as list"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "item": {
                    "id": "456",
                    "Common name": ["Pothos", "Devil's Ivy"],
                    "Latin name": "Epipremnum aureum",
                    "Description": "Easy to grow vine",
                    "Light ideal": "Medium to bright indirect",
                    "Watering": "Weekly",
                    "Temperature min": {"C": "18"},
                    "Temperature max": {"C": "27"},
                    "Img": "https://example.com/pothos.jpg"
                }
            }
        ]
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("pothos")

        assert result["common_name"] == "Pothos"  # Should take first from list

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_not_found(self, mock_get):
        """Test handling when plant is not found"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("nonexistent plant")

        assert result is None

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_http_error(self, mock_get):
        """Test handling of HTTP errors (401, 404, 500, etc.)"""
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_response.raise_for_status.side_effect = Exception("HTTP 401")
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("test plant")

        assert result is None

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_network_error(self, mock_get):
        """Test handling of network errors"""
        mock_get.side_effect = Exception("Network timeout")

        result = plant_service.fetch_and_cache_plant_details("test plant")

        assert result is None

    @patch('plant_service.requests.get')
    def test_fetch_indoor_plant_missing_description(self, mock_get):
        """Test handling when description is None or empty"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "item": {
                    "id": "789",
                    "Common name": ["Test Plant"],
                    "Latin name": "Testus plantus",
                    "Description": None,  # Missing description
                    "Light ideal": "Bright",
                    "Watering": "Daily",
                    "Temperature min": {"C": "20"},
                    "Temperature max": {"C": "25"},
                    "Img": "https://example.com/test.jpg"
                }
            }
        ]
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("test plant")

        assert result["description"] == "No detailed description available."


class TestPerenualPlantSearch:
    """Test outdoor plant search using Perenual API"""

    @patch('plant_service.requests.get')
    def test_fetch_outdoor_plant_success(self, mock_get):
        """Test successful outdoor plant search"""
        # Mock search response
        mock_search_response = Mock()
        mock_search_response.status_code = 200
        mock_search_response.headers = {'Content-Type': 'application/json'}
        mock_search_response.text = '{"data": [{"id": 1}]}'
        mock_search_response.json.return_value = {
            "data": [
                {
                    "id": 1,
                    "common_name": "Tomato",
                    "scientific_name": ["Solanum lycopersicum"]
                }
            ]
        }

        # Mock details response
        mock_details_response = Mock()
        mock_details_response.status_code = 200
        mock_details_response.headers = {'Content-Type': 'application/json'}
        mock_details_response.text = '{"id": 1}'
        mock_details_response.json.return_value = {
            "id": 1,
            "common_name": "Tomato",
            "scientific_name": ["Solanum lycopersicum"],
            "description": "Popular garden vegetable",
            "type": "Annual",
            "cycle": "Annual",
            "watering": "Regular",
            "sunlight": ["Full sun"],
            "default_image": {
                "regular_url": "https://example.com/tomato.jpg"
            }
        }

        mock_get.side_effect = [mock_search_response, mock_details_response]

        result = plant_service.fetch_perenual_plant_details("tomato")

        assert result is not None
        assert result["common_name"] == "Tomato"
        assert result["scientific_name"] == "Solanum lycopersicum"
        assert "Popular garden vegetable" in result["description"]
        assert result["care_instructions"]["watering"] == "Regular"
        assert result["care_instructions"]["light"] == "Full sun"

    @patch('plant_service.requests.get')
    def test_fetch_outdoor_plant_not_found(self, mock_get):
        """Test handling when plant is not found in Perenual"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'Content-Type': 'application/json'}
        mock_response.text = '{"data": []}'
        mock_response.json.return_value = {"data": []}
        mock_get.return_value = mock_response

        result = plant_service.fetch_perenual_plant_details("nonexistent plant")

        assert result is None

    @patch('plant_service.requests.get')
    def test_fetch_outdoor_plant_html_response(self, mock_get):
        """Test handling when API returns HTML instead of JSON (invalid key)"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.headers = {'Content-Type': 'text/html'}
        mock_response.text = '<!DOCTYPE html><html>Error page</html>'
        mock_get.return_value = mock_response

        result = plant_service.fetch_perenual_plant_details("test plant")

        assert result is None

    @patch('plant_service.requests.get')
    def test_fetch_outdoor_plant_missing_image(self, mock_get):
        """Test handling when plant has no image"""
        mock_search_response = Mock()
        mock_search_response.status_code = 200
        mock_search_response.headers = {'Content-Type': 'application/json'}
        mock_search_response.text = '{"data": [{"id": 1}]}'
        mock_search_response.json.return_value = {
            "data": [{"id": 1, "common_name": "Test Plant"}]
        }

        mock_details_response = Mock()
        mock_details_response.status_code = 200
        mock_details_response.headers = {'Content-Type': 'application/json'}
        mock_details_response.text = '{"id": 1}'
        mock_details_response.json.return_value = {
            "id": 1,
            "common_name": "Test Plant",
            "scientific_name": ["Testus plantus"],
            "default_image": None  # No image
        }

        mock_get.side_effect = [mock_search_response, mock_details_response]

        result = plant_service.fetch_perenual_plant_details("test plant")

        assert result["image_url"] == "/default_image.jpg"

    @patch('plant_service.requests.get')
    def test_fetch_outdoor_plant_multiple_sunlight(self, mock_get):
        """Test handling multiple sunlight requirements"""
        mock_search_response = Mock()
        mock_search_response.status_code = 200
        mock_search_response.headers = {'Content-Type': 'application/json'}
        mock_search_response.text = '{"data": [{"id": 1}]}'
        mock_search_response.json.return_value = {
            "data": [{"id": 1}]
        }

        mock_details_response = Mock()
        mock_details_response.status_code = 200
        mock_details_response.headers = {'Content-Type': 'application/json'}
        mock_details_response.text = '{"id": 1}'
        mock_details_response.json.return_value = {
            "id": 1,
            "common_name": "Rose",
            "scientific_name": ["Rosa"],
            "sunlight": ["Full sun", "Part shade"],  # Multiple values
            "watering": "Average",
            "default_image": {"regular_url": "https://example.com/rose.jpg"}
        }

        mock_get.side_effect = [mock_search_response, mock_details_response]

        result = plant_service.fetch_perenual_plant_details("rose")

        assert result["care_instructions"]["light"] == "Full sun, Part shade"


class TestPlantTypeRouter:
    """Test the main routing function that directs to appropriate API"""

    @patch('plant_service.fetch_and_cache_plant_details')
    def test_fetch_indoor_plant_type(self, mock_indoor):
        """Test that 'indoor' type routes to RapidAPI"""
        mock_indoor.return_value = {"common_name": "Snake Plant"}

        result = plant_service.fetch_plant_by_type("snake plant", "indoor")

        mock_indoor.assert_called_once_with("snake plant")
        assert result["common_name"] == "Snake Plant"

    @patch('plant_service.fetch_perenual_plant_details')
    def test_fetch_outdoor_plant_type(self, mock_outdoor):
        """Test that 'other' type routes to Perenual"""
        mock_outdoor.return_value = {"common_name": "Tomato"}

        result = plant_service.fetch_plant_by_type("tomato", "other")

        mock_outdoor.assert_called_once_with("tomato")
        assert result["common_name"] == "Tomato"

    @patch('plant_service.fetch_and_cache_plant_details')
    def test_fetch_default_to_indoor(self, mock_indoor):
        """Test that default type is indoor"""
        mock_indoor.return_value = {"common_name": "Fern"}

        result = plant_service.fetch_plant_by_type("fern")

        mock_indoor.assert_called_once_with("fern")


class TestDataNormalization:
    """Test that data is properly normalized across different API responses"""

    @patch('plant_service.requests.get')
    def test_normalized_structure_indoor(self, mock_get):
        """Test that indoor plant data is properly normalized"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "item": {
                    "id": "1",
                    "Common name": ["Test"],
                    "Latin name": "Testus",
                    "Description": "Description",
                    "Light ideal": "Bright",
                    "Watering": "Weekly",
                    "Temperature min": {"C": "15"},
                    "Temperature max": {"C": "25"},
                    "Img": "test.jpg"
                }
            }
        ]
        mock_get.return_value = mock_response

        result = plant_service.fetch_and_cache_plant_details("test")

        # Verify normalized structure
        assert "id" in result
        assert "common_name" in result
        assert "scientific_name" in result
        assert "description" in result
        assert "care_instructions" in result
        assert "image_url" in result

        # Verify care_instructions structure
        assert "light" in result["care_instructions"]
        assert "watering" in result["care_instructions"]
        assert "fertilization" in result["care_instructions"]
        assert "ideal_temp" in result["care_instructions"]
