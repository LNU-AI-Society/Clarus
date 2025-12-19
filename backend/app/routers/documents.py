import io

from fastapi import APIRouter, File, HTTPException, UploadFile
from pypdf import PdfReader

from app.gemini_client import analyze_document
from app.schemas import AnalysisResult

router = APIRouter()

@router.post("/api/documents/analyze", response_model=AnalysisResult)
async def analyze_docs(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    filename = file.filename.lower()
    text = ""

    try:
        contents = await file.read()

        if filename.endswith(".pdf"):
            # Extract text from PDF
            pdf_file = io.BytesIO(contents)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith(".txt") or filename.endswith(".md"):
            text = contents.decode("utf-8")
        else:
             # Basic fallback for other text types, or error
             try:
                 text = contents.decode("utf-8")
             except:
                 raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or Text.")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from document.")

        # Analyze
        return analyze_document(text, file.filename)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
