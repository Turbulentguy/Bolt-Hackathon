from fastapi import FastAPI, Query, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from service import fetch_and_summarize, process_uploaded_pdf
from supabase import create_client
from supabase_config import SUPABASE_URL, SUPABASE_KEY
import io

app = FastAPI()

# Add CORS middleware
try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:5173", 
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "*"  # Allow all origins during development
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("[INFO] CORS middleware added successfully")
except ImportError:
    print("[WARNING] CORS middleware not available - frontend connections may be restricted")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class PaperResponse(BaseModel):
    title: str
    authors: str
    published: str
    pdf_link: str
    bibtex: str
    summary: str

class FileUploadResponse(BaseModel):
    filename: str
    title: str
    summary: str

@app.get("/summarize", response_model=PaperResponse)
def summarize(query: str = Query(..., description="เช่น ai image processing")):
    result = fetch_and_summarize(query)
    if "error" in result:
        return {"detail": result["error"]}
    # Save result to Supabase
    supabase.table("papers").insert({
        "title": result["title"],
        "authors": result["authors"],
        "published": result["published"],
        "pdf_link": result["pdf_link"],
        "bibtex": result["bibtex"],
        "summary": result["summary"]
    }).execute()
    return result

@app.post("/upload-pdf", response_model=FileUploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Check if the uploaded file is a PDF
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file content
        file_content = await file.read()
        
        # Process the PDF
        result = process_uploaded_pdf(file_content, file.filename)
        
        # Check for errors
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Skip database operations to avoid potential Supabase errors
        print(f"[INFO] Successfully processed file: {result['filename']}")
        
        return result
    except Exception as e:
        print(f"[ERROR] Upload processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")
