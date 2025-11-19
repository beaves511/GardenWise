import requests
import os
# import time
from dotenv import load_dotenv

# --- CONFIGURATION & ENVIRONMENT VARIABLE CHECK ---

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(SCRIPT_DIR, '.env')

# Explicitly check for the presence of the .env file for diagnostic purposes
if not os.path.exists(DOTENV_PATH):
    print("-" * 70)
    print("WARNING: .env file not found in the backend directory.")
    print(f"Expected path: {DOTENV_PATH}")
    print("Ensure .env file exists in the 'backend/' directory.")
    print("-" * 70)

# Load environment variables from the .env file in the same directory as this script
load_dotenv(DOTENV_PATH)

# Define and validate required configuration variables
RAPIDAPI_KEY = os.getenv("RAPID_API_KEY")
# e.g., "house-plants2.p.rapidapi.com"
RAPIDAPI_HOST = os.getenv("RAPID_API_HOST")
# e.g., "https://house-plants2.p.rapidapi.com/search"
RAPIDAPI_BASE_URL = os.getenv("RAPIDAPI_BASE_URL")

# Perenual API configuration for outdoor/other plants
PLANT_API_KEY = os.getenv("PLANT_API_KEY")
PERENUAL_BASE_URL = "https://perenual.com/api"

# CRITICAL CHECK: Ensure all required variables are present
if not RAPIDAPI_KEY or not RAPIDAPI_HOST or not RAPIDAPI_BASE_URL:
    missing_vars = []
    if not RAPIDAPI_KEY:
        missing_vars.append("RAPID_API_KEY")
    if not RAPIDAPI_HOST:
        missing_vars.append("RAPID_API_HOST")
    if not RAPIDAPI_BASE_URL:
        missing_vars.append("RAPIDAPI_BASE_URL")

    # Raise a runtime error to stop the application and clearly state the error
    raise ValueError(
        f"Missing RapidAPI environment variables: {', '.join(missing_vars)}. "
        "Check backend/.env file for typos or ensure the file is present."
    )

if not PLANT_API_KEY:
    print("-" * 70)
    print("WARNING: PLANT_API_KEY not found in environment variables.")
    print("Other plant searches will not work.")
    print("-" * 70)

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

        response.raise_for_status()

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
            "description": (
                plant_result.get(
                    'Description',
                    'No detailed description available.'
                ) or 'No detailed description available.'
            ),
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


def fetch_perenual_plant_details(plant_name):
    """
    Handles API call to Perenual API for outdoor/other plants.
    """
    print(f"Calling Perenual API for plant: {plant_name}...")

    try:
        # Search for plants by name (API v2)
        search_url = f"{PERENUAL_BASE_URL}/v2/species-list"
        params = {
            "key": PLANT_API_KEY,
            "q": plant_name
        }

        response = requests.get(
            search_url,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        # Check if response is HTML instead of JSON (indicates API error)
        content_type = response.headers.get('Content-Type', '')
        if 'text/html' in content_type or response.text.strip().startswith('<!DOCTYPE'):
            print(f"ERROR: Perenual API returned HTML instead of JSON. This usually indicates:")
            print(f"  - Invalid API key")
            print(f"  - API endpoint changed")
            print(f"  - Rate limit exceeded")
            print(f"  Response preview: {response.text[:200]}")
            return None

        perenual_data = response.json()

        # Get the first result from the search
        if not perenual_data.get('data') or len(perenual_data['data']) == 0:
            print(f"ERROR: No plant results found for {plant_name} in Perenual")
            return None

        # Get the first plant
        first_plant = perenual_data['data'][0]
        plant_id = first_plant.get('id')

        if not plant_id:
            print(f"ERROR: No plant ID found in Perenual response")
            return None

        # Fetch full plant details (API v2)
        details_url = f"{PERENUAL_BASE_URL}/v2/species/details/{plant_id}"
        details_params = {"key": PLANT_API_KEY}

        details_response = requests.get(
            details_url,
            params=details_params,
            timeout=10
        )

        details_response.raise_for_status()

        # Check if response is HTML instead of JSON
        content_type = details_response.headers.get('Content-Type', '')
        if 'text/html' in content_type or details_response.text.strip().startswith('<!DOCTYPE'):
            print(f"ERROR: Perenual API details endpoint returned HTML instead of JSON")
            return None

        plant_details = details_response.json()

        # Extract and normalize the data
        common_name = plant_details.get('common_name') or plant_name.capitalize()
        scientific_name = plant_details.get('scientific_name', ['N/A'])
        if isinstance(scientific_name, list):
            scientific_name = scientific_name[0] if scientific_name else 'N/A'

        # Get image URL
        image_url = '/default_image.jpg'
        if plant_details.get('default_image') and plant_details['default_image'].get('regular_url'):
            image_url = plant_details['default_image']['regular_url']
        elif plant_details.get('default_image') and plant_details['default_image'].get('original_url'):
            image_url = plant_details['default_image']['original_url']

        # Extract care information
        watering = plant_details.get('watering') or 'Unknown'
        sunlight = plant_details.get('sunlight') or []
        if isinstance(sunlight, list):
            sunlight = ', '.join(sunlight) if sunlight else 'Unknown'
        elif not sunlight:
            sunlight = 'Unknown'

        # Build description
        description_parts = []
        if plant_details.get('description'):
            description_parts.append(plant_details['description'])

        # Add additional info
        if plant_details.get('type'):
            description_parts.append(f"Type: {plant_details['type']}.")
        if plant_details.get('cycle'):
            description_parts.append(f"Cycle: {plant_details['cycle']}.")

        description = ' '.join(description_parts) if description_parts else f"{common_name} is a plant species."

        # Safely format watering info
        if watering and watering != 'Unknown':
            watering_display = watering.capitalize()
        else:
            watering_display = 'Unknown'

        normalized_data = {
            "id": plant_details.get('id', 'perenual-1'),
            "common_name": common_name,
            "scientific_name": scientific_name,
            "description": description,
            "care_instructions": {
                "light": sunlight,
                "watering": watering_display,
                "fertilization": "Follow general plant care guidelines.",
                "ideal_temp": "Varies by species - check local climate compatibility"
            },
            "image_url": image_url
        }

        return normalized_data

    except requests.exceptions.HTTPError as e:
        print(
            f"HTTP ERROR from Perenual API: Status {e.response.status_code}. "
            f"Details: {e.response.text}"
        )
        return None

    except requests.exceptions.RequestException as e:
        print(f"NETWORK ERROR connecting to Perenual API: {e}")
        return None

    except Exception as e:
        print(f"INTERNAL ERROR during Perenual data processing: {e}")
        return None


def fetch_plant_by_type(plant_name, plant_type='indoor'):
    """
    Main function to fetch plant details based on the plant type.
    Routes to the appropriate API based on plant_type.

    Args:
        plant_name: Name of the plant to search for
        plant_type: Either 'indoor' or 'other' to determine which API to use

    Returns:
        Normalized plant data dictionary or None
    """
    if plant_type == 'indoor':
        return fetch_and_cache_plant_details(plant_name)
    else:
        return fetch_perenual_plant_details(plant_name)
