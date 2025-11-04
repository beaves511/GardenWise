from flask import Flask, jsonify, request
from flask_cors import CORS
# Import standard libraries for error checking
import os 
from dotenv import load_dotenv
import sys 

try:
    from plant_service import fetch_and_cache_plant_details 
    SERVICE_LOADED = True
except ImportError as e:
    SERVICE_LOADED = False
    print("-" * 60)
    print(f"CRITICAL INIT ERROR: Service 'plant_service.py' failed to import.")
    print("POSSIBLE FIX: Check if the file is named 'plant_service.py' and is in the 'backend/' folder.")
    print(f"Details: {e}")
    print("-" * 60)
    # Define a dummy function to prevent the rest of the application from crashing
    def fetch_and_cache_plant_details(name):
        raise RuntimeError("Service layer failed to load (Check console for ImportError).")


# Initialize Flask App
app = Flask(__name__)
# Configure CORS to allow requests from Next.js (port 3000)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- ROUTE DEFINITION (This registers the endpoint) ---

@app.route('/api/v1/plants', methods=['GET'])
def plant_details():
    """
    Handles GET requests for plant details by reading the 'name' query parameter.
    e.g., /api/v1/plants?name=Fern
    """
    # 1. Retrieve the plant name from the URL query string
    plant_name = request.args.get('name')
    
    if not plant_name:
        return jsonify({"message": "Missing 'name' query parameter. Use /api/v1/plants?name=... "}), 400

    # Debug print confirming the route was hit 
    print(f"--- ROUTE HIT --- Flask retrieved plant_name from query: '{plant_name}'") 
    
    # Check if the service layer was successfully loaded before trying to call it
    if not SERVICE_LOADED:
        return jsonify({"message": "Server Initialization Error: Plant service is not running."}), 500

    try:
        # Call the external service layer with the retrieved name
        data = fetch_and_cache_plant_details(plant_name)
        
        if data:
            # If data is successfully retrieved and normalized
            return jsonify(data), 200
        
        # If the service returns None (meaning the external API couldn't find the plant)
        return jsonify({"message": f"Plant '{plant_name}' not found."}), 404
        
    except Exception as e:
        # Catch unexpected errors during service execution
        print(f"Server-side exception during API call: {e}")
        return jsonify({"message": "Internal Server Error"}), 500


# --- WELCOME PAGE / ROOT HEALTH CHECK ---

@app.route('/')
def index():
    """A simple health check and welcome endpoint."""
    return jsonify({
        "status": "ok", 
        "message": "Welcome to the Gardening App API!",
        "version": "v1",
        "instructions": "Use the /api/v1/plants?name=<name> endpoint to search for plant details."
    })

# Run the app
if __name__ == '__main__':
    app.run(debug=True, port=5000)
