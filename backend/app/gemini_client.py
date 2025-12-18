import google.generativeai as genai
from typing import List
from app.config import settings
from app.schemas import Document
import logging
import random

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

def answer_with_context(question: str, context: List[Document]) -> str:
    """
    Generates an answer based on the provided context passages.
    """
    
    context_text = "\n\n".join([f"Source [{i+1}] ({doc.title}): {doc.snippet}" for i, doc in enumerate(context)])

    rag_prompt = f"""You are Clarus, a helpful Swedish legal assistant.
Use the following context to answer the user's question. 
If the answer is not in the context, say that you don't know based on the provided information.
Do not make up laws or facts. 

Context:
{context_text}

User Question: {question}

Answer (in Swedish or English as appropriate):"""

    # Reuse logic for API call vs Simulation
    api_key = settings.GEMINI_API_KEY
    if not api_key or "placeholder" in api_key.lower():
         logger.warning("Gemini RAG: API Key missing/placeholder. Returning simulated RAG response.")
         if context:
             return f"Simulated RAG: Based on {context[0].title}, I can tell you that: {context[0].snippet[:50]}..."
         else:
             return "Simulated RAG: I could not find any relevant documents in my database to answer this."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(rag_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini RAG: {e}")
        return f"Simulated RAG (Error): Could not generate answer using context. (API Error: {str(e)})"
