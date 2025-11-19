from flask import Blueprint, request, jsonify
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_PUBLIC_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Supabase Auth API endpoint
AUTH_BASE_URL = f"{SUPABASE_URL}/auth/v1"
DB_BASE_URL = f"{SUPABASE_URL}/rest/v1"

# Create the Blueprint
profile_bp = Blueprint('profile', __name__)


def get_user_from_token(auth_header):
    """Helper function to verify token and get user info."""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, {"error": "Missing or invalid authorization header"}, 401

    token = auth_header.split(' ')[1]

    # Verify token with Supabase
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
    }

    try:
        response = requests.get(
            f"{AUTH_BASE_URL}/user",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            user_data = response.json()
            return user_data, None, None
        else:
            return None, {"error": "Invalid or expired token"}, 401

    except requests.exceptions.RequestException as e:
        return None, {"error": f"Authentication failed: {e}"}, 500


@profile_bp.route('/profile', methods=['GET'])
def get_profile():
    """Get the current user's profile information."""
    auth_header = request.headers.get('Authorization')
    user_data, error, status = get_user_from_token(auth_header)

    if error:
        return jsonify(error), status

    # Return user profile data
    return jsonify({
        "id": user_data.get('id'),
        "email": user_data.get('email'),
        "created_at": user_data.get('created_at'),
    }), 200


@profile_bp.route('/profile/email', methods=['PUT'])
def update_email():
    """Update the user's email address."""
    auth_header = request.headers.get('Authorization')
    user_data, error, status = get_user_from_token(auth_header)

    if error:
        return jsonify(error), status

    data = request.get_json()
    new_email = data.get('email')

    if not new_email:
        return jsonify({"error": "New email is required"}), 400

    current_email = user_data.get('email')
    user_id = user_data.get('id')

    # Check if trying to update to the same email
    if new_email.lower() == current_email.lower():
        return jsonify({"error": "New email must be different from current email"}), 400

    # Use Admin API with Service Key to update the user's email
    admin_headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }

    try:
        # Update via Admin API endpoint
        admin_url = f"{AUTH_BASE_URL}/admin/users/{user_id}"
        response = requests.put(
            admin_url,
            headers=admin_headers,
            json={"email": new_email},
            timeout=10
        )

        if response.status_code == 200:
            # Also update the profiles table
            service_headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }

            profile_response = requests.patch(
                f"{DB_BASE_URL}/profiles?id=eq.{user_id}",
                headers=service_headers,
                json={"email": new_email},
                timeout=5
            )

            if profile_response.status_code not in [200, 204]:
                return jsonify({
                    "error": "Email updated in auth but profile sync failed. Please contact support."
                }), 500

            return jsonify({
                "message": "Email updated successfully!",
                "email": new_email
            }), 200
        else:
            error_data = response.json()
            return jsonify({"error": error_data.get('msg', error_data.get('message', 'Failed to update email'))}), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to update email: {e}"}), 500


@profile_bp.route('/profile/password', methods=['PUT'])
def update_password():
    """Update the user's password."""
    auth_header = request.headers.get('Authorization')
    user_data, error, status = get_user_from_token(auth_header)

    if error:
        return jsonify(error), status

    data = request.get_json()
    new_password = data.get('password')

    if not new_password:
        return jsonify({"error": "New password is required"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user_id = user_data.get('id')

    # Use Admin API with Service Key to update the user's password
    admin_headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }

    try:
        admin_url = f"{AUTH_BASE_URL}/admin/users/{user_id}"
        response = requests.put(
            admin_url,
            headers=admin_headers,
            json={"password": new_password},
            timeout=10
        )

        if response.status_code == 200:
            return jsonify({"message": "Password updated successfully"}), 200
        else:
            error_data = response.json()
            return jsonify({"error": error_data.get('msg', error_data.get('message', 'Failed to update password'))}), response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to update password: {e}"}), 500
