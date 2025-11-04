from flask import Blueprint, request, jsonify
import jwt
import os
import db_service
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64
import functools  # <-- NEW IMPORT


# Create the Blueprint for collection routes
collections_bp = Blueprint('collections', __name__)


def token_required(f):
    """
    Decorator to verify the JWT token using the 
    Supabase PUBLIC KEY and extract the user ID. 
    This is the fix for the 401 error caused by 
    the ECC key.    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        # 1. Get the Authorization header and extract the token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Unauthorized access: Missing or invalid Authorization header."}), 401
        
        token = auth_header.split(' ')[1].strip()  # Clean the token string
        
        # FIX: Load the PUBLIC Key string for verification (ECC compatibility)
        # print(repr(os.getenv("SUPABASE_JWT_PEM")[:80]))
        # SUPABASE_PUBLIC_KEY = os.getenv('SUPABASE_PUBLIC_KEY_PEM').replace("\\\\n", "\n")
        # print(repr(SUPABASE_PUBLIC_KEY))
        # SUPABASE_PUBLIC_KEY = os.getenv('SUPABASE_JWT_PEM').replace("\\\\n", "\n")
        # print(repr(os.getenv("SUPABASE_JWT_PEM")[:80]))

        x_b64 = os.getenv("SUPABASE_JWT_X")
        y_b64 = os.getenv("SUPABASE_JWT_Y")

        # Convert base64url -> bytes
        x_bytes = base64.urlsafe_b64decode(x_b64 + "==")
        y_bytes = base64.urlsafe_b64decode(y_b64 + "==")

        # Create public key
        public_numbers = ec.EllipticCurvePublicNumbers(
            int.from_bytes(x_bytes, "big"),
            int.from_bytes(y_bytes, "big"),
            ec.SECP256R1()
        )
        public_key = public_numbers.public_key()

        # Export PEM string
        pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()


        data = jwt.decode(
                token, 
                pem, 
                algorithms=["ES256"], 
                audience="authenticated"
            )
        try:
            # CRITICAL FIXES APPLIED HERE:
            # 1. algorithms=["ES256"] matches the Supabase signing key type (ECC P-256)
            # 2. audience="authenticated" validates the token's 'aud' claim
            # 3. .encode('utf-8') is used to pass the string as bytes, necessary for PyJWT
           
            
            # 3. Attach the user_id (the 'sub' claim in Supabase tokens) to the request object
            request.user_id = data.get('sub') 
            
        except jwt.InvalidSignatureError:
            return jsonify({"error": "Invalid token signature."}, 401), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired."}, 401), 401
        except jwt.InvalidAudienceError:
            return jsonify({"error": "Invalid token audience."}, 401), 401
        except jwt.InvalidTokenError as e:
            # Catches other generic JWT errors (e.g., malformed token)
            print(f"JWT Decode Error: {e}")
            return jsonify({"error": "Authentication failed (malformed token)."}, 401), 401
        except Exception as e:
            # Catches final unknown errors (e.g., bad key format)
            print(f"General Auth Error: {e}")
            return jsonify({"error": "Authentication failed."}, 401), 401

        return f(*args, **kwargs)
    return decorated

@collections_bp.route('/collections', methods=['POST'])
@token_required
def add_to_collection():
    """
    Saves a plant to the user's collection.
    Requires: Valid JWT in Authorization header.
    Receives: JSON body with plant data.
    """
    user_id = request.user_id # Set by the @token_required decorator
    data = request.get_json()
    plant_data = data.get('plant_data')
    collection_name = data.get('collection_name', 'Default') # Default to 'Default' collection

    if not plant_data or not isinstance(plant_data, dict):
        return jsonify({"error": "Missing or invalid plant_data in request body."}), 400
    
    # Delegate to the Database Service Layer
    result = db_service.save_plant_to_collection(user_id, plant_data, collection_name)
    
    if result['status'] == 'success':
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@collections_bp.route('/collections', methods=['GET'])
@token_required
def get_user_collections_route():
    """
    Retrieves all collections for the authenticated user. (GET method)
    """
    user_id = request.user_id
    
    try:
        # Delegate to the Database Service Layer
        result = db_service.get_user_collections(user_id)
        
        if result['status'] == 'success':
            return jsonify(result['data']), 200
        
        # Returns 200 with an empty array if status is 'empty'
        if result['status'] == 'empty':
            return jsonify([]), 200
        
        # Handle general database failure
        return jsonify({"status": "error", "message": result['message']}), 500
        
    except Exception as e:
        # CRASH FIX: Catches the crash if db_service failed to initialize or execute query
        print(f"Database GET Crash: {e}")
        return jsonify({"status": "error", "message": "Failed to retrieve collections due to server error."}), 500
    
@collections_bp.route('/collections/create', methods=['POST'])
@token_required
def create_collection_route():
    """
    Creates a new, empty collection by inserting a minimal sentinel record.
    Requires: Valid JWT, JSON body with collection_name.
    """
    data = request.get_json()
    collection_name = data.get('collection_name')

    if not collection_name:
        return jsonify({"error": "Missing collection_name in request body."}), 400
    
    user_id = request.user_id # Guaranteed by @token_required
    
    try:
        # Call the new function from db_service to insert the sentinel record
        result = db_service.create_empty_collection(user_id, collection_name)
        
        if result['status'] == 'success':
            # Returns success message to the frontend modal
            return jsonify(result), 200
        
        # Handle the specific error code from db_service for duplicate collection names
        if result.get('code') == '23505':
            return jsonify({"status": "error", "message": "A collection with this name already exists."}), 409

        return jsonify(result), 500
    
    except Exception as e:
        print(f"Server-side exception during Create Collection: {e}")
        return jsonify({"status": "error", "message": "Failed to create collection due to server error."}), 500

@collections_bp.route('/collections/container/<collection_name>', methods=['DELETE'])
@token_required
def delete_collection_container_route(collection_name):
    """
    Deletes the parent collection container and all associated plants via CASCADE.
    """
    user_id = request.user_id
    
    try:
        # Calls the service function to delete the container
        result = db_service.delete_collection_container(user_id, collection_name)
        
        if result['status'] == 'success':
            # CRITICAL FIX: Check the length of the 'data' list instead of using .get('count')
            if isinstance(result.get('data'), list) and len(result['data']) > 0:
                return jsonify({"status": "success", "message": f"Collection '{collection_name}' and associated plants deleted."}), 200
            else:
                 # Handles case where collection name was valid but container not found for user (0 rows deleted)
                 return jsonify({"status": "error", "message": f"Collection '{collection_name}' not found for user, or no records deleted."}), 404
        
        # If the result status was 'error', return it directly
        return jsonify(result), 500 
    except Exception as e:
        print(f"Collection Container DELETE Crash: {e}")
        return jsonify({"status": "error", "message": "Failed to delete collection container due to server error."}), 500


@collections_bp.route('/collections/<string:plant_id>', methods=['DELETE'])
@token_required
def delete_from_collection_route(plant_id):
    """
    Deletes a single plant record from the user's collection. (DELETE method)
    Requires: JWT in Authorization header.
    Receives: plant_id (UUID) in URL path.
    """
    user_id = request.user_id 

    try:
        # Input validation for the ID
        if not plant_id:
             return jsonify({"error": "Missing plant ID in path."}), 400

        # Delegate to the Database Service Layer
        # The service layer must ensure the user_id matches the record owner (RLS is also doing this)
        result = db_service.delete_plant_record(user_id, plant_id)

        if result['status'] == 'success':
            return jsonify({"status": "success", "message": f"Plant {plant_id} deleted successfully."}), 200
        else:
            # If the plant wasn't found or delete failed
            return jsonify(result), 404 
            
    except Exception as e:
        print(f"Database DELETE Crash: {e}")
        return jsonify({"status": "error", "message": "Failed to delete plant due to server error."}), 500
