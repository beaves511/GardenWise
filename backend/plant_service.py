import requests
import os
# import time
from dotenv import load_dotenv

# --- CONFIGURATION & ENVIRONMENT VARIABLE CHECK ---

# Explicitly check for the presence of the .env file for diagnostic purposes
DOTENV_PATH = os.path.join(os.getcwd(), '.env')
if not os.path.exists(DOTENV_PATH):
    print("-" * 70)
    print("WARNING: .env file not found in the current working directory.")
    print(f"Expected path: {DOTENV_PATH}")
    print("Ensure terminal is running from the 'backend/' directory.")
    print("-" * 70)

# Load environment variables. This must run in every file that needs them.
load_dotenv()

# Define and validate required configuration variables
RAPIDAPI_KEY = os.getenv("RAPID_API_KEY")
# e.g., "house-plants2.p.rapidapi.com"
RAPIDAPI_HOST = os.getenv("RAPID_API_HOST")
# e.g., "https://house-plants2.p.rapidapi.com/search"
RAPIDAPI_BASE_URL = os.getenv("RAPIDAPI_BASE_URL")

# CRITICAL CHECK: Ensure all required variables are present
if not RAPIDAPI_KEY or not RAPIDAPI_HOST or not RAPIDAPI_BASE_URL:
    missing_vars = []
    if not RAPIDAPI_KEY:
        missing_vars.append("RAPIDAPI_KEY")
    if not RAPIDAPI_HOST:
        missing_vars.append("RAPIDAPI_HOST")
    if not RAPIDAPI_BASE_URL:
        missing_vars.append("RAPIDAPI_BASE_URL")

    # Raise a runtime error to stop the application and clearly state the error
    raise ValueError(
        f"Missing RapidAPI environment variables: {', '.join(missing_vars)}. "
        "Check backend/.env file for typos or ensure the file is present."
    )

# --- CACHING SETUP (Disabled for direct testing) ---
PLANT_CACHE = {}
CACHE_DURATION_SECONDS = 60 * 60 * 24 * 7


def fetch_and_cache_plant_details(plant_name):
    """
    Handles API call to RapidAPI, error handling, and data normalization.
    """

    # 1. We skip cache logic for now

    print(f"Calling RapidAPI directly for plant: {plant_name}...")

    # Define the required RapidAPI headers and query parameters
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    # The API uses 'query' as the parameter name
    querystring = {"query": plant_name}

    # --- API CALL EXECUTION ---
    try:
        response = requests.get(
            RAPIDAPI_BASE_URL,
            headers=headers,
            params=querystring,
            timeout=10
        )

        # DEBUG: Check the final URL being sent (should now be correct)
        print(f"DEBUG FINAL URL: {response.url}")

        response.raise_for_status()

        # DEBUG: Check the start of the response body
        print(f"DEBUG API Status: {response.status_code}")
        raw_text = response.text
        print(f"DEBUG Raw Body Start: {raw_text[:200]}...")

        rapidapi_data = response.json()

        # --- DATA NORMALIZATION / TRANSFORMATION ---

        # Extract the first result and handle the nested 'item' key
        # The response is a list of dictionaries
        first_item = rapidapi_data[0] if isinstance(
            rapidapi_data, list) and rapidapi_data else None

        # Get the actual plant data object from the nested 'item' key
        plant_result = first_item.get('item') if first_item else None

        if not plant_result:
            print(
                f"ERROR: No detailed plant result found for {plant_name}")
            return None

        # Extract common name (which is a list) and convert to a string
        common_name_list = plant_result.get(
            'Common name', [plant_name.capitalize()])
        common_name = (
            common_name_list[0]
            if isinstance(common_name_list, list) and common_name_list
            else common_name_list
        )

        # Extract temperatures
        temp_min_c = plant_result.get('Temperature min', {}).get('C', 'N/A')
        temp_max_c = plant_result.get('Temperature max', {}).get('C', 'N/A')

        primary_image_url = plant_result.get('Url')
        if (
            not primary_image_url
            or not primary_image_url.endswith(('.jpg', '.png', '.gif'))
        ):
            primary_image_url = plant_result.get('Img')

        normalized_data = {
            "id": plant_result.get('id', 'mock-1'),
            "common_name": common_name,
            "scientific_name": plant_result.get('Latin name', 'N/A'),
            "description": plant_result.get('Description',
                                            'No detailed description available.') or 'No detailed description available.',
            "care_instructions": {
                # Map exact API key names (with spaces) to internal names
                "light": plant_result.get('Light ideal', 'Unknown'),
                "watering": plant_result.get('Watering', 'Unknown'),
                "fertilization": "Not specified in API response.",
                "ideal_temp": f"Min: {temp_min_c}°C, Max: {temp_max_c}°C"
            },
            # Map 'Img' key to 'image_url'
            "image_url": plant_result.get('Img', '/default_image.jpg')
        }

        return normalized_data

    except requests.exceptions.HTTPError as e:
        # Catches 401 (Unauthorized), 404, 500 from the external API
        print(
            f"HTTP ERROR from RapidAPI: Status {e.response.status_code}. "
            f"Details: {e.response.text}"
        )
        return None

    except requests.exceptions.RequestException as e:
        # Catches network errors
        print(f"NETWORK ERROR connecting to RapidAPI: {e}")
        return None

    except Exception as e:
        # Catches JSONDecodeError or other unexpected internal errors
        print(f"INTERNAL ERROR during data processing: {e}")
        return None
