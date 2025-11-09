from flask import Blueprint, request, jsonify
# NOTE: Assuming the token_required decorator is available in api.collections
from api.collections import token_required
# Import the function from the AI Service Layer
from ai_service import generate_garden_plan
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64
import functools 
import jwt
import os 

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/ai/plan', methods=['POST'])
@token_required
def plan_garden_route():
    """
    Protected endpoint to receive user input and generate a garden plan using the AI service.
    Requires a valid JWT token in the Authorization header.
    """
    data = request.get_json()
    user_input = data.get('user_input')

    if not user_input:
        return jsonify({"error": "Missing user_input in request body."}), 400

    # Delegate the request to the AI Service Layer for processing by Gemini
    response, status = generate_garden_plan(user_input)
    
    return jsonify(response), status