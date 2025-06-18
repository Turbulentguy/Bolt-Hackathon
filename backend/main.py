from fastapi import FastAPI, Query
from pydantic import BaseModel
from service import fetch_and_summarize

app = FastAPI()

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
    return result
