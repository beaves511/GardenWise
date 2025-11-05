from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
# Import standard libraries for error checking
# import os
# from dotenv import load_dotenv
# import sys

# --- IMPORT BLUEPRINTS AND SERVICES ---
# Import the Auth Blueprint (Controller) we just created
try:
    # Assuming api/auth.py is structured correctly (see note below)
    from api.auth import auth_bp
    AUTH_BP_LOADED = True
except ImportError as e:
    AUTH_BP_LOADED = False
    print(f"Auth Blueprint failed to import. Details: {e}")
    # Define a dummy Blueprint to prevent app crash
    auth_bp = Blueprint('auth', __name__)

try:
    import db_service
    DB_SERVICE_LOADED = True
except ImportError as e:
    DB_SERVICE_LOADED = False
    print("-" * 60)
    print(f"DB Service 'db_service.py' failed to import. Details: {e}")
    print("Check file name and ensure 'supabase' module is installed.")
    print("-" * 60)

# Import the Plant Service (assuming it's a neighbor for simplicity)
try:
    from api.plants import plants_bp
    PLANTS_BP_LOADED = True
except ImportError as e:
    PLANTS_BP_LOADED = False
    print(f"Plants Blueprint failed to import. Details: {e}")
    plants_bp = Blueprint('plants', __name__)

try:
    from api.collections import collections_bp
    COLLECTIONS_BP_LOADED = True
except ImportError as e:
    COLLECTIONS_BP_LOADED = False
    print(f"Collections Blueprint failed to import. Details: {e}")
    collections_bp = Blueprint('collections', __name__)

# Initialize Flask App
app = Flask(__name__)
# Configure CORS to allow requests from Next.js (port 3000)
# Note: Using r"/api/*" ensures both /api/v1/plants and /api/v1/auth work
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- BLUEPRINT REGISTRATION (The critical step for the 404 fix) ---

# The plants route is registered here for now
# keep the plant_details function defined below but register the auth_bp now.
if AUTH_BP_LOADED:
    # Registers all routes defined in api/auth.py (e.g., /auth/login)
    # under the global prefix /api/v1, making the full URL: /api/v1/auth/login
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
else:
    print("Auth Blueprint not loaded. Endpoints unavailable.")

if COLLECTIONS_BP_LOADED:
    app.register_blueprint(collections_bp, url_prefix='/api/v1')
else:
    print("Collections Blueprint not loaded. Endpoints unavailable.")

if PLANTS_BP_LOADED:
    app.register_blueprint(plants_bp, url_prefix='/api/v1')
else:
    print("Plants Blueprint not loaded. Plant endpoints are unavailable.")


@app.route('/api/v1/test-db', methods=['POST'])
def test_db_insert():
    """Tests the database connection by inserting a hardcoded record."""
    if not DB_SERVICE_LOADED:
        return jsonify({"status": "error", "message": "Database "
                        "Service failed to load."}), 500

    # Hardcoded dummy data to ensure the database can be written to
    dummy_user_id = "TEST_USER_ID"

    # You can change the data payload to test different insertions
    data = request.get_json()
    plant_data = data.get('plant_data')
    collection_name = data.get('collection_name', 'Test Collection')

    if not plant_data:
        plant_data = {"common_name": "Test", "scientific_name": "Example"}

    print(f"Attempting to save record for User: {dummy_user_id}")

    try:
        result = db_service.save_plant_to_collection(
            dummy_user_id, plant_data,
            collection_name
        )

        if result['status'] == 'success':
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Server-side exception during DB test: {e}")
        return jsonify({"status": "error",
                        "message": (
                            f"Database insertion failed: {e}"
                            )
                        }), 500


# --- WELCOME PAGE / ROOT HEALTH CHECK ---

@app.route('/')
def index():
    """A simple health check and welcome endpoint."""
    # List available API endpoints for debugging/documentation
    available_routes = [
        "/api/v1/plants?name=<plant_name>",
        "/api/v1/auth/signup (POST)",
        "/api/v1/auth/login (POST)"
    ]
    return jsonify({
        "status": "ok",
        "message": "Welcome to the Gardening App API!",
        "version": "v1",
        "endpoints": available_routes
    })


# Run the app
if __name__ == '__main__':
    # removed degub=True for production safety
    app.run(port=5000)
