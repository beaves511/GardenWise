import requests
import os
from dotenv import load_dotenv

# from flask import jsonify

# Load environment variables (necessary for Supabase keys)
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_PUBLIC_KEY")
# NOTE: The Supabase Service Role Key is used for high-privilege operations like inserting a profile
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_KEY")

# Supabase Auth API endpoint structure
AUTH_BASE_URL = f"{SUPABASE_URL}/auth/v1"
DB_BASE_URL = f"{SUPABASE_URL}/rest/v1"


# --- Helper Function for Database Insert ---


def create_user_profile_record(user_id: str, email: str):
    """Inserts a new record into the 'profiles' table using the Service Key."""

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    profile_data = {
        "id": user_id,
        "email": email,
    }

    try:
        response = requests.post(
            f"{DB_BASE_URL}/profiles",
            headers=headers,
            json=profile_data,
            timeout=5
        )
        # Check for non-success codes (e.g., 409 Conflict if profile already exists)
        if response.status_code >= 400:
            print(
                f"ERROR: Failed to create profile for {email}. Status: {response.status_code}. Response: {response.text}")
            # We don't crash the signup, but we log the error
            return False

        print(f"SUCCESS: Profile created for user ID {user_id}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Profile creation failed. {e}")
        return False


# --- Core Authentication Functions ---

def sign_up(email, password):
    """Registers a new user with Supabase Auth and creates a database profile."""
    url = f"{AUTH_BASE_URL}/signup"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    data = {"email": email, "password": password}

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        auth_data = response.json()

        if response.status_code == 200 and 'user' in auth_data:
            user_id = auth_data['user']['id']
            # CRITICAL STEP: Create the profile record asynchronously
            create_user_profile_record(user_id, email)

            # Return the raw successful Auth response (which might include a token if configured)
            return auth_data, 200
        else:
            # Handle Supabase API errors (e.g., user already registered)
            return auth_data, response.status_code

    except requests.exceptions.RequestException as e:
        return {"error": f"Network error during signup: {e}"}, 500


def sign_in(email, password):
    """Authenticates user and retrieves JWT token and user ID."""
    url = f"{AUTH_BASE_URL}/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    data = {"email": email, "password": password}

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        auth_data = response.json()

        return auth_data, response.status_code

    except requests.exceptions.RequestException as e:
        return {"error": f"Network error during signin: {e}"}, 500
