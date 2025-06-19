from fastapi import FastAPI, Query
from pydantic import BaseModel
from service import fetch_and_summarize
from supabase import create_client
from supabase_config import SUPABASE_URL, SUPABASE_KEY

app = FastAPI()

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

class PaperResponse(BaseModel):
    title: str
    authors: str
    published: str
    pdf_link: str
    bibtex: str
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
