import json
import logging
from typing import List

import google.generativeai as genai

from app.config import settings
from app.schemas import AnalysisResult, Document

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

def analyze_document(text: str, filename: str) -> AnalysisResult:
    """
    Analyzes the provided document text and returns a structured summary.
    """
    prompt = f"""You are Clarus, a legal AI assistant. Analyze the following document text from "{filename}".
Provide a structured analysis in valid JSON format with the following keys:
- "summary": A brief summary of the document (max 3 sentences).
- "key_points": A list of 3-5 crucial points or clauses.
- "risks": A list of potential risks or unfavorable terms for the user.
- "suggested_questions": A list of 3 follow-up questions the user might want to ask about this document.

IMPORTANT: This is for informational purposes only. Do not provide legal advice.

Document Text (truncated if too long):
{text[:10000]}
"""

    api_key = settings.GEMINI_API_KEY

    # Simulation
    if not api_key or "placeholder" in api_key.lower():
         logger.warning("Gemini Analysis: Key missing/placeholder. Returning simulated analysis.")
         return AnalysisResult(
             summary=f"This appears to be a document named '{filename}'. It discusses terms and conditions common in such agreements.",
             key_points=["Term 1: Confidentiality obligation.", "Term 2: Termination notice of 3 months.", "Term 3: Non-compete clause."],
             risks=["Ambiguous definition of 'Confidential Information'.", "Unilateral termination rights."],
             suggested_questions=["What is the notice period?", "Are there penalties for early termination?", "Is the non-compete enforceable?"]
         )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)

        # Clean up code blocks if Gemini wraps JSON in ```json ... ```
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)

        return AnalysisResult(**data)
    except Exception as e:
        logger.error(f"Error analyzing document: {e}")
        # Fallback to avoid crash
        return AnalysisResult(
            summary="Error analyzing document.",
            key_points=["Could not extract points due to an error."],
            risks=[],
            suggested_questions=[]
        )
