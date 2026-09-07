import io
import re
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import pytesseract
import fitz  # PyMuPDF for fast digital text extraction
from pdf2image import convert_from_bytes

# Configure Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import uvicorn

app = FastAPI(title="HealthHub OCR Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://family-health-hub-eight.vercel.app",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_extracted_text(text: str) -> str:
    """
    Cleans the extracted text according to the specific rules:
    - Removing excessive spaces
    - Removing unnecessary line breaks
    - Cleaning obvious OCR artifacts
    - Preserving numbers, units, headings
    - NOT modifying medical values
    """
    if not text:
        return ""
    
    # Remove excessive spaces (e.g., multiple spaces to single space)
    # But preserve line breaks for now
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Strip leading/trailing spaces
        line = line.strip()
        if not line:
            continue
        
        # Replace multiple spaces with a single space
        line = re.sub(r' +', ' ', line)
        
        # Clean obvious OCR artifacts (e.g., pipe instead of l/I, but be careful not to break medical units)
        # e.g., Hemog|obin -> Hemoglobin
        line = line.replace('Hemog|obin', 'Hemoglobin')
        line = line.replace('Vitarnin', 'Vitamin')
        
        cleaned_lines.append(line)
        
    # Join lines, reducing multiple newlines to a single newline
    cleaned_text = '\n'.join(cleaned_lines)
    
    return cleaned_text

@app.post("/api/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extracts text from uploaded medical reports (PDF, PNG, JPG).
    Returns a strict JSON format required by Drishti's AI layer.
    """
    try:
        contents = await file.read()
        extracted_text = ""
        
        # Check file type
        content_type = file.content_type
        
        if content_type == "application/pdf":
            # OPTIMIZATION: Try to extract digital text first using PyMuPDF (super fast)
            doc = fitz.open(stream=contents, filetype="pdf")
            digital_text = ""
            for page in doc:
                digital_text += page.get_text() + "\n"
                
            # If we found a good amount of digital text, we don't need OCR!
            # (If it's just a few characters, it's probably a scanned image wrapper, so fallback to OCR)
            if len(digital_text.strip()) > 50:
                extracted_text = digital_text
            else:
                # FALLBACK: Convert scanned PDF to images and run OCR (slow)
                images = convert_from_bytes(contents, poppler_path=r'C:\poppler\poppler-26.07.0\Library\bin')
                for img in images:
                    text = pytesseract.image_to_string(img)
                    extracted_text += text + "\n"
        elif content_type in ["image/jpeg", "image/png", "image/jpg"]:
            # Process Image
            image = Image.open(io.BytesIO(contents))
            extracted_text = pytesseract.image_to_string(image)
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "text": "",
                    "error": f"Unsupported file format: {content_type}. Please upload PDF, PNG, or JPG."
                }
            )
            
        if not extracted_text.strip():
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "text": "",
                    "error": "Unable to extract text"
                }
            )
            
        cleaned_text = clean_extracted_text(extracted_text)
        
        return {
            "success": True,
            "text": cleaned_text
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "text": "",
                "error": f"Unable to extract text: {str(e)}"
            }
        )

if __name__ == "__main__":
    import os
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000))
    )
