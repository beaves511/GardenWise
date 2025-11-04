from flask import jsonify
import requests
import os
from dotenv import load_dotenv

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
    
    # We use the Service Role Key because RLS might prevent the Anon Key from writing to the profiles table.
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
            print(f"ERROR: Failed to create profile for {email}. Status: {response.status_code}. Response: {response.text}")
            # We don't crash the signup, but we log the error
            return False

        print(f"SUCCESS: Profile created for user ID {user_id}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"NETWORK ERROR: Profile creation failed. {e}")
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

'''
from flask import current_app
import requests
import os
from dotenv import load_dotenv

# --- Supabase Configuration ---
# NOTE: This file assumes SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Define the base URL for the Supabase Auth endpoint
AUTH_URL = f"{SUPABASE_URL}/auth/v1"

def _handle_supabase_request(endpoint, data):
    """Helper function to make POST requests to Supabase Auth."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    url = f"{AUTH_URL}/{endpoint}"
    
    # CRITICAL CHECK: Ensure Supabase URL is available
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("CONFIG ERROR: Supabase credentials missing!")
        return {"error": "Server configuration error: Supabase keys are missing. Check .env."}, 500

    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status() # Raises an exception for 4xx/5xx status codes
        return response.json(), 200
    except requests.exceptions.HTTPError as e:
        print(f"Supabase Auth Error: {e.response.text}")
        try:
            # Attempt to return the specific error message from Supabase
            error_data = e.response.json()
            return {"error": error_data.get('msg') or error_data.get('error_description')}, e.response.status_code
        except:
            # Fallback for non-JSON errors
            return {"error": "Authentication failed due to external server error."}, 500
    except requests.exceptions.RequestException as e:
        return {"error": "Network error communicating with Supabase."}, 503

# --- Public API Functions ---

def sign_up(email, password):
    """Registers a new user with Supabase."""
    data = {"email": email, "password": password}
    return _handle_supabase_request("signup", data)

def sign_in(email, password):
    """Authenticates an existing user."""
    # Supabase uses this specific endpoint and grant type for password login
    data = {"email": email, "password": password}
    return _handle_supabase_request("token?grant_type=password", data)
'''