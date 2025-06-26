import os
import uuid
import io
from PyPDF2 import PdfReader
from fastapi import APIRouter, UploadFile, File, Form, Body, Request
from fastapi.responses import JSONResponse
from service import summarize_text_with_gpt
import requests

chatbot_router = APIRouter()

# In-memory session store (for demo; use DB in production)
session_rag_map = {}
progress_map = {}

@chatbot_router.post("/create_rag_session")
async def create_rag_session(pdf: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    progress_map[session_id] = "Uploading PDF"
    print(f"[RAG][{session_id}] Uploading PDF")
    file_content = await pdf.read()
    progress_map[session_id] = "Extracting and chunking text from PDF"
    print(f"[RAG][{session_id}] Extracting and chunking text from PDF")
    try:
        reader = PdfReader(io.BytesIO(file_content))
        # Efficient chunking for RAG
        chunks = []
        chunk = ""
        max_chunk_len = 2000  # characters, adjust for efficiency
        for page in reader.pages:
            page_text = page.extract_text()
            if not page_text:
                continue
            for paragraph in page_text.split('\n'):
                if len(chunk) + len(paragraph) > max_chunk_len:
                    chunks.append(chunk)
                    chunk = paragraph + "\n"
                else:
                    chunk += paragraph + "\n"
        if chunk:
            chunks.append(chunk)
        session_rag_map[session_id] = chunks
        progress_map[session_id] = f"Completed: {len(chunks)} chunks"
        print(f"[RAG][{session_id}] Completed: {len(chunks)} chunks")
        return {"session_id": session_id, "rag_chunks": len(chunks)}
    except Exception as e:
        progress_map[session_id] = f"Failed: {str(e)}"
        print(f"[RAG][{session_id}] Failed: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to create RAG: {str(e)}"})

@chatbot_router.post("/create_rag_session_from_url")
async def create_rag_session_from_url(request: Request):
    # รองรับทั้งแบบ embed และ JSON dict
    try:
        body = await request.json()
        pdf_url = body.get("pdf_url")
    except Exception:
        pdf_url = None
    if not pdf_url:
        # fallback: ลองอ่านแบบ embed (กรณี client เก่า)
        try:
            pdf_url = (await request.body()).decode()
        except Exception:
            pdf_url = None
    if not pdf_url:
        return {"error": "pdf_url is required"}
    session_id = str(uuid.uuid4())
    progress_map[session_id] = "กำลังดาวน์โหลด PDF (0%) ..."
    try:
        # Download PDF with progress
        with requests.get(pdf_url, stream=True) as r:
            r.raise_for_status()
            total = int(r.headers.get('content-length', 0))
            downloaded = 0
            chunks = []
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    chunks.append(chunk)
                    downloaded += len(chunk)
                    if total:
                        percent = int(downloaded / total * 100)
                        progress_map[session_id] = f"กำลังดาวน์โหลด PDF ({percent}%) ..."
        file_content = b"".join(chunks)
        progress_map[session_id] = "Extracting and chunking text from PDF"
        reader = PdfReader(io.BytesIO(file_content))
        chunks = []
        chunk = ""
        max_chunk_len = 2000
        for page in reader.pages:
            page_text = page.extract_text()
            if not page_text:
                continue
            for paragraph in page_text.split('\n'):
                if len(chunk) + len(paragraph) > max_chunk_len:
                    chunks.append(chunk)
                    chunk = paragraph + "\n"
                else:
                    chunk += paragraph + "\n"
        if chunk:
            chunks.append(chunk)
        session_rag_map[session_id] = chunks
        progress_map[session_id] = f"Completed: {len(chunks)} chunks"
        return {"session_id": session_id, "rag_chunks": len(chunks)}
    except Exception as e:
        progress_map[session_id] = f"Failed: {str(e)}"
        return JSONResponse(status_code=500, content={"error": f"Failed to create RAG: {str(e)}"})

@chatbot_router.post("/chat_with_rag")
async def chat_with_rag(
    session_id: str = Form(...),
    message: str = Form(...)
):
    chunks = session_rag_map.get(session_id, [])
    if not chunks:
        return JSONResponse(status_code=404, content={"error": "Session not found or RAG not created"})
    # RAG: ค้นหา chunk ที่เกี่ยวข้องมากที่สุด
    relevant = []
    for chunk in chunks:
        if message.lower() in chunk.lower():
            relevant.append(chunk)
    if not relevant:
        relevant = [chunks[0]]  # fallback: ใช้ chunk แรก
    context = "\n".join(relevant)
    # ตอบจาก RAG ก่อน
    prompt_rag = f"เนื้อหา paper ที่เกี่ยวข้อง:\n{context}\n\nคำถาม: {message}\nตอบ: "
    rag_reply = summarize_text_with_gpt(prompt_rag)
    # ส่งคำตอบ rag ไปถาม chatgpt อีกที
    prompt_gpt = f"นี่คือคำตอบจากระบบ RAG: {rag_reply}\n\nโปรดอธิบายหรือสรุปให้เข้าใจง่ายขึ้น หรือขยายความเพิ่มเติมเป็นภาษาไทย"
    gpt_reply = summarize_text_with_gpt(prompt_gpt)
    return {"rag_reply": rag_reply, "gpt_reply": gpt_reply}

@chatbot_router.get("/rag_progress/{session_id}")
async def rag_progress(session_id: str):
    return {"progress": progress_map.get(session_id, "Not found")}
