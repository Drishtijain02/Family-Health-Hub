# HealthHub OCR Service

This service extracts text from medical reports using OCR. It acts as the bridge between Avii's Medical Records upload and Drishti's AI Analysis.

## API Endpoint

**URL:** `/api/extract-text`
**Method:** `POST`

## Request Format (AVII OCR INTEGRATION)

The service accepts a `multipart/form-data` request with a single file.

### Input
What file format does OCR accept?
- `PDF`
- `PNG`
- `JPG` / `JPEG`

**Example cURL Request:**
```bash
curl -X POST "http://localhost:8000/api/extract-text" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/medical_report.pdf"
```

## Response Format (HANDOFF TO DRISHTI)

The response is a structured JSON object. Drishti's AI layer should use the `text` field as its input.
*Note: This service does not interpret the medical meaning. It only extracts the text.*

### Success Output
```json
{
  "success": true,
  "text": "Extracted and cleaned text from the medical report..."
}
```

### Error Output
```json
{
  "success": false,
  "text": "",
  "error": "Unable to extract text: [reason]"
}
```

## Setup & Execution

### Prerequisites
1. **Python 3.8+**
2. **Tesseract OCR**: 
   - Windows: Install from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH.
   - Mac: `brew install tesseract`
   - Linux: `sudo apt-get install tesseract-ocr`
3. **Poppler** (for PDF support):
   - Windows: Download [poppler for windows](http://blog.alivate.com.au/poppler-windows/) and add to PATH.
   - Mac: `brew install poppler`
   - Linux: `sudo apt-get install poppler-utils`

### Installation
```bash
pip install -r requirements.txt
```

### Running the Server
```bash
python main.py
```
The server will start on `http://localhost:8000`.

## Testing (25-26 AUGUST MVP)

The system performs basic text cleaning:
- Removes excessive spaces.
- Removes unnecessary line breaks.
- Cleans obvious OCR artifacts.
- Preserves numbers, units, and headings.
- **Does not modify medical values.**

You can test with:
1. CBC report
2. Vitamin D report
3. Thyroid report
4. Prescription
5. Poor-quality/scanned report
