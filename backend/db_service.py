from supabase import create_client, Client
import os
# import uuid

# --- Environment Setup ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Supabase client
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        print(f"FATAL: Could not initialize Supabase Client: {e}")
        supabase = None
else:
    print("FATAL: Supabase URL or Service Key missing.")
    supabase = None

# --- Helper to handle Supabase API calls and errors ---


def _handle_supabase_query(query_func):
    """Executes a Supabase query and handles standard API errors."""
    if not supabase:
        return {"status": "error", "message": "Database"
                " client failed to initialize."}

    try:
        # The query_func argument is the actual lambda function
        response = query_func()

        # Supabase API returns data in the 'data' key or an error object.
        if hasattr(response, 'error') and response.error:
            # Check for specific error code 23505 (unique constraint violation)
            if response.error.code == '23505':
                return {"status": "error", "message": "A record with this"
                        " name already exists.", "code": response.error.code}

            return {"status": "error", "message": response.error.message,
                    "code": response.error.code}

        if response.data is None or len(response.data) == 0:
            return {"status": "empty", "message": "No records found."}

        return {"status": "success", "data": response.data}

    except Exception as e:
        # Catch network or request exceptions
        print(f"Database Exception: {e}")
        return {"status": "error", "message": f"Database query failed: {e}"}

# --- CRUD Functions ---


def create_empty_collection(user_id, collection_name: str):
    """
    Creates the PARENT container record in the 'collections' table.
    """

    collection_record = {
        "user_id": user_id,
        "collection_name": collection_name,
        "status": "Active"
    }

    def query_func():
        # Targets the 'collections' table
        return supabase.table('collections').insert(collection_record,
                                                    count='exact',
                                                    returning='representation'
                                                    ).execute()

    return _handle_supabase_query(query_func)


def save_plant_to_collection(user_id, plant_data, collection_name: str):
    """
    Saves a plant record to the 'collection_plants' table, linking it
    to the correct collection PARENT record.
    """

    # 1. Find the parent collection ID based on user_id and collection_name
    def get_collection_id_func():
        # Targets the 'collections' table
        return supabase.table('collections').select('id').eq('user_id', user_id).eq('collection_name', collection_name).limit(1).execute()

    collection_response = _handle_supabase_query(get_collection_id_func)

    collection_id = None

    # --- CRITICAL FIX: Check if the collection needs to be created ---
    if collection_response['status'] == 'empty':
        # If collection doesn't exist, create it automatically
        print(
            f"{collection_name} not found. Creating new collection")
        create_result = create_empty_collection(user_id, collection_name)

        if create_result['status'] != 'success':
            return {"status": "error", "message": f"Failed to create necessary collection '{collection_name}'."}

        # FIX: Extract the ID directly from the creation response
        collection_id = create_result['data'][0]['id']

    elif collection_response['status'] == 'success':
        # Collection was found, extract the ID
        collection_id = collection_response['data'][0]['id']

    if not collection_id:
        return collection_response

    # 2. Prepare the child plant record
    plant_record = {
        "collection_id": collection_id,
        "common_name": plant_data.get('common_name', 'Unnamed Plant'),
        "plant_details_json": plant_data,  # Store the full JSON data
    }

    def query_func():
        # Insert the record into the collection_plants child table
        return (
                supabase
                .table('collection_plants')
                .insert(plant_record)
                .execute()
        )

    return _handle_supabase_query(query_func)


def get_user_collections(user_id: str):
    """
    Retrieves all collection records for a specific user ID, joining the parent and child tables.
    """
    # 1. Get all parent collections owned by the user
    def get_parents_func():
        # Targets the 'collections' table
        return supabase.table('collections').select('id, collection_name').eq('user_id', user_id).order('collection_name').execute()

    parents_response = _handle_supabase_query(get_parents_func)

    if parents_response['status'] == 'empty':
        return {"status": "empty", "message": "No collections found."}
    if parents_response['status'] == 'error':
        return parents_response

    # Defensive check: Ensure data is a list before proceeding
    parent_collections = parents_response.get('data')
    if not isinstance(parent_collections, list):
        print(
            f"Data Retrieval Error: Parent collections data not a list: {parent_collections}")
        return {"status": "error", "message": "Corrupt parent collection data structure."}

    # 2. Get all child plant records related to those parent collections
    collection_ids = [c.get('id') for c in parent_collections if isinstance(
        c, dict) and 'id' in c]  # Use .get for safety

    def get_children_func():
        # Targets the 'collection_plants' table
        return supabase.table('collection_plants').select('*').in_('collection_id', collection_ids).order('collection_id').execute()

    children_response = _handle_supabase_query(get_children_func)

    # Check for errors in children response (empty is okay)
    if children_response['status'] == 'error':
        if children_response['message'] != 'No records found.':
            return children_response
        else:
            # Convert the 'empty' error back to an empty successful state for the aggregation logic
            children_response = {'status': 'success', 'data': []}

    # 3. Join the data into the final structure { "Collection Name": [ {plant}, {plant} ] }
    children_data = children_response.get('data', [])

    try:
        # Create a mapping of collection_id to collection_name
        collection_name_map = {c['id']: c['collection_name']
                               for c in parent_collections}

        # Initialize plant map with all parent IDs
        plant_map = {c['id']: [] for c in parent_collections}

        # Aggregate children data
        if children_data:
            for plant in children_data:
                # Use .get() for safety
                collection_id = plant.get('collection_id')
                if collection_id and collection_id in plant_map:
                    plant_map[collection_id].append(plant)

        # 4. Final grouping and aggregation: Map IDs back to Names
        final_collections = {}
        for collection_id, plants_list in plant_map.items():
            collection_name = collection_name_map.get(collection_id)
            if collection_name:
                final_collections[collection_name] = plants_list

        return {"status": "success", "data": final_collections}

    except Exception as e:
        # FINAL CRASH CATCH: This ensures the server never crashes silently
        print(f"FATAL DATA AGGREGATION CRASH: {e}")
        return {"status": "error", "message": f"Server failed to aggregate collections data: {e}"}


def delete_plant_record(user_id, plant_id: str):
    """Deletes a single plant record from the collection_plants table by ID."""

    # NOTE: Since RLS is active on collection_plants (using the complex JOIN policy),
    # the client will automatically ensure the user owns the parent collection.

    def query_func():
        # Execute the delete query on the child table
        return supabase.table('collection_plants').delete().eq('id', plant_id).execute()

    return _handle_supabase_query(query_func)

# --- NEW FUNCTION: Deletes the Collection Container ---


def delete_collection_container(user_id, collection_name: str):
    """
    Deletes the parent collection container, relying on ON DELETE CASCADE
    in the database to delete all linked plant records.
    """

    def query_func():
        # Delete the collection container by user_id and name
        return supabase.table('collections').delete().eq('user_id', user_id).eq('collection_name', collection_name).execute()

    return _handle_supabase_query(query_func)
