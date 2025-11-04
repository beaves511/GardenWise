import os
import sys
from dotenv import load_dotenv
import uuid
import db_service  # Assumes db_service.py is a neighbor file

# --- Configuration ---
# Ensure .env is loaded (necessary for db_service)
load_dotenv()

def run_database_test():
    test_user_id = "8f5ae83d-8286-4af4-8e41-5afe388ef292" 
    test_collection_name = "Yet Another Standalone Test Collection"
    test_plant_data = {
        "common_name": "Test Cactus",
        "scientific_name": "Debugus Example",
        "watering": "Once per month",
        "light": "Full sun"
    }

    print("-" * 35)
    print("ATTEMPTING STANDALONE DB INSERT")
    print("-" * 35)

    try:
        result = db_service.save_plant_to_collection(
            test_user_id,
            test_plant_data,
            test_collection_name
        )

        if result.get('status') == 'success':
            print("✅ SUCCESS! Database insertion verified.")
            print(f"Record saved with ID: {result.get('id')}")
            print(f"Check your Supabase 'collections' table for user ID: {test_user_id}")
        else:
            # If the service returns a failure dictionary
            print("❌ FAILURE! Database insertion failed.")
            print(f"Error Details: {result.get('error', 'Unknown database error.')}")
            print(f"Supabase Code: {result.get('code', 'N/A')}")
            
    except Exception as e:
        print("--- CRITICAL PYTHON CRASH ---")
        print(f"❌ FAILURE! Python runtime error: {e}")
        print("Check your SUPABASE_URL/SUPABASE_SERVICE_KEY in .env")

if __name__ == '__main__':
    run_database_test()

