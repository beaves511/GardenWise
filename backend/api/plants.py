from flask import Blueprint, request, jsonify
# Import the service directly for public plant search logic
from plant_service import fetch_and_cache_plant_details 
import os

# Define the new Blueprint. This handles all public /plants routes.
plants_bp = Blueprint('plants', __name__)

@plants_bp.route('/plants', methods=['GET'])
def public_plant_search():
    """
    Handles GET requests for publicly viewable plant search results.
    This route does NOT require the @token_required decorator.
    e.g., /api/v1/plants?name=Fern
    """
    plant_name = request.args.get('name')
    
    if not plant_name:
        return jsonify({"message": "Missing 'name' query parameter."}), 400

    print(f"--- PUBLIC SEARCH HIT --- Searching for: '{plant_name}'") 
    
    # Check if the service layer is available (assuming plant_service loads)
    if 'fetch_and_cache_plant_details' not in globals():
         return jsonify({"message": "Server Initialization Error: Plant service is not running."}), 500

    try:
        # Call the external service layer to get the data list
        # NOTE: This function now handles returning a list of results based on the search query.
        data = fetch_and_cache_plant_details(plant_name)
        
        if data:
            return jsonify(data), 200
        
        # If the service returns None or an empty list
        return jsonify({"message": f"Plant '{plant_name}' not found in any database."}), 404
        
    except Exception as e:
        # Catch unexpected errors during service execution
        print(f"Server-side exception during public plant search: {e}")
        return jsonify({"message": "Internal Server Error during search."}), 500
