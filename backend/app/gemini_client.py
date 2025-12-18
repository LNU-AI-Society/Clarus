import google.generativeai as genai
from app.config import settings
import logging

# Configure logging
logger = logging.getLogger(__name__)

def ask_gemini(prompt: str) -> str:
    """
    Sends a prompt to Google Gemini and returns the response text.
    If the API key is invalid or a placeholder, returns a simulated response.
    """
    api_key = settings.GEMINI_API_KEY
    
    # Simulation mode if key is missing or clearly a placeholder
    if not api_key or "placeholder" in api_key.lower():
        logger.warning("Gemini API Key is missing or placeholder. Returning simulated response.")
        return f"Simulated Gemini: I received your input '{prompt}'. (Configure a real API Key to talk to Gemini)"

    try:
        genai.configure(api_key=api_key)
        # Using gemini-pro for text-only prompts
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        # Graceful fallback so the app doesn't crash during dev
        return f"Simulated Gemini (Error Fallback): I received '{prompt}'. (API Error: {str(e)})"
