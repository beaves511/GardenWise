"""
Unit tests for ai_service.py

Tests AI garden planning functionality using Google Gemini API.
Uses mocking to avoid requiring actual API key.
"""

import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import ai_service


class TestGeminiAPIConfiguration:
    """Test API configuration and setup"""

    def test_gemini_model_configured(self):
        """Test that Gemini model is properly configured"""
        assert ai_service.GEMINI_MODEL is not None
        assert "gemini" in ai_service.GEMINI_MODEL.lower()

    def test_system_prompt_exists(self):
        """Test that system prompt is defined"""
        assert ai_service.SYSTEM_PROMPT is not None
        assert len(ai_service.SYSTEM_PROMPT) > 0
        assert "garden" in ai_service.SYSTEM_PROMPT.lower()


class TestGenerateGardenPlan:
    """Test garden plan generation"""

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_success(self, mock_post):
        """Test successful garden plan generation"""
        # Mock successful API response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "Here's your garden plan:\n1. Plant tomatoes in full sun\n2. Plant lettuce in partial shade"
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        user_input = "I have a 10x10 foot garden with full sun. What should I plant?"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 200
        assert result["status"] == "success"
        assert "plan" in result
        assert "tomatoes" in result["plan"]
        assert "lettuce" in result["plan"]

    @patch('ai_service.GEMINI_API_KEY', None)
    def test_generate_garden_plan_missing_api_key(self):
        """Test handling when API key is missing"""
        user_input = "Plan my garden"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 500
        assert result["status"] == "error"
        assert "API key is missing" in result["message"]

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_empty_response(self, mock_post):
        """Test handling when API returns empty response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": None}]  # None text
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        user_input = "Plan my garden"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 500
        assert result["status"] == "error"

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_http_error(self, mock_post):
        """Test handling of HTTP errors (401, 429, 500, etc.)"""
        import requests
        mock_response = Mock()
        mock_response.status_code = 401
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("HTTP 401 Unauthorized")
        mock_post.return_value = mock_response

        user_input = "Plan my garden"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 500
        assert result["status"] == "error"
        assert "Network error" in result["message"]

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_network_timeout(self, mock_post):
        """Test handling of network timeout"""
        mock_post.side_effect = Exception("Connection timeout")

        user_input = "Plan my garden"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 500
        assert result["status"] == "error"

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_malformed_response(self, mock_post):
        """Test handling of malformed API response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_post.return_value = mock_response

        user_input = "Plan my garden"
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 500
        assert result["status"] == "error"
        assert "unexpected error" in result["message"].lower()

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_request_payload(self, mock_post):
        """Test that request payload is properly formatted"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Garden plan"}]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        user_input = "Test input"
        ai_service.generate_garden_plan(user_input)

        # Verify the payload structure
        call_args = mock_post.call_args
        payload = call_args[1]['json']

        assert "contents" in payload
        assert len(payload["contents"]) == 1
        assert payload["contents"][0]["role"] == "user"
        assert payload["contents"][0]["parts"][0]["text"] == "Test input"
        assert "systemInstruction" in payload
        assert payload["systemInstruction"]["parts"][0]["text"] == ai_service.SYSTEM_PROMPT

    @patch('ai_service.GEMINI_API_KEY', 'test-api-key')
    @patch('ai_service.requests.post')
    def test_generate_garden_plan_with_complex_input(self, mock_post):
        """Test garden planning with detailed user requirements"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "Garden Plan:\n1. Tomatoes - 3 plants in full sun area\n2. Basil - companion plant near tomatoes"
                            }
                        ]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        user_input = (
            "I have a 15x20 foot garden bed in zone 7. "
            "I want to grow tomatoes, peppers, and herbs. "
            "The area gets 8 hours of sun daily."
        )
        result, status_code = ai_service.generate_garden_plan(user_input)

        assert status_code == 200
        assert result["status"] == "success"
        assert "Tomatoes" in result["plan"]


class TestSystemPrompt:
    """Test that system prompt enforces garden planning constraints"""

    def test_system_prompt_mentions_spatial_planning(self):
        """Test that system prompt includes spatial planning guidance"""
        prompt = ai_service.SYSTEM_PROMPT.lower()
        assert "space" in prompt or "spatial" in prompt

    def test_system_prompt_mentions_formatting(self):
        """Test that system prompt includes formatting requirements"""
        prompt = ai_service.SYSTEM_PROMPT.lower()
        assert "list" in prompt or "format" in prompt

    def test_system_prompt_professional_tone(self):
        """Test that system prompt establishes professional context"""
        prompt = ai_service.SYSTEM_PROMPT.lower()
        assert "garden" in prompt and "planner" in prompt
