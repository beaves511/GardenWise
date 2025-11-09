from flask import jsonify
import requests
import os
import json

# --- CONFIGURATION ---
# The GEMINI_API_KEY must be set in your backend/.env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Use the best model for flash and fast generation
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025" 
# Use the correct API URL structure
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

# System instruction is crucial for enforcing the spatial planning constraint (Novelty Claim)
SYSTEM_PROMPT = (
    "You are a world-class, professional garden planner. Your task is to provide a concise, textual "
    "plan for planting based on the user's input. The plan MUST be formatted clearly with numbered or "
    "bulleted lists. You MUST prioritize efficient use of space, considering plant width, height, "
    "and sunlight requirements provided by the user. Do not use markdown formatting outside of basic "
    "list formatting."
)

def generate_garden_plan(user_input: str):
    """
    Sends the user's garden prompt to the Gemini API and returns the plan text.
    """
    if not GEMINI_API_KEY:
        return {"status": "error", "message": "Gemini API key is missing from environment."}, 500
        
    headers = {
        "Content-Type": "application/json",
    }
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_input}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        }
    }
    
    try:
        # Send request to Gemini API
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status() # Raise exception for 4xx or 5xx status codes
        
        data = response.json()
        
        # Check if the structure is valid and extract the text
        if data.get('candidates') and data['candidates'][0].get('content') and data['candidates'][0]['content'].get('parts'):
            plan_text = data['candidates'][0]['content']['parts'][0].get('text')
            
            if plan_text:
                return {"status": "success", "plan": plan_text}, 200
            
            return {"status": "error", "message": "AI returned a response but no plan text was generated."}, 500

    except requests.exceptions.RequestException as e:
        print(f"Gemini API Network Error: {e}")
        return {"status": "error", "message": f"Network error communicating with AI service: {e}"}, 500
    except Exception as e:
        print(f"AI Service General Error: {e}")
        return {"status": "error", "message": "An unexpected error occurred during AI processing."}, 500