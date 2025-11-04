from flask import Blueprint, request, jsonify
# FIX: Change import to reference the auth_service module,
# assuming it is available in the Python path (e.g., neighbor of app.py)
import auth_service

# Create the Blueprint
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/signup', methods=['POST'])
def signup_route():
    """Endpoint for user registration."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Delegate to the Service Layer using the module reference
    response, status = auth_service.sign_up(email, password)
    return jsonify(response), status


@auth_bp.route('/auth/login', methods=['POST'])
def login_route():
    """Endpoint for user sign-in."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    # Delegate to the Service Layer using the module reference
    response, status = auth_service.sign_in(email, password)

    # If successful login, Supabase returns user and session data
    if status == 200 and 'access_token' in response:
        return jsonify({
            "message": "Login successful",
            "token": response['access_token'],
            "user_id": response.get('user', {}).get('id')
        }), 200

    return jsonify(response), status
