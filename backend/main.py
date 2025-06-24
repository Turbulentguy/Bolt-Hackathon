from fastapi import FastAPI, Query, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from service import fetch_and_summarize, process_uploaded_pdf, fetch_all_arxiv_papers, fetch_papers_by_category
from supabase import create_client
from supabase_config import SUPABASE_URL, SUPABASE_KEY
import io

app = FastAPI()

# Add CORS middleware
try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for development
        allow_credentials=False,  # Must be False when using "*" for origins
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    print("[INFO] CORS middleware added successfully")
except ImportError:
    print("[WARNING] CORS middleware not available - frontend connections may be restricted")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Backend is running successfully"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": "2025-06-24"}

@app.options("/{path:path}")
def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {}

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

class AllArticlesResponse(BaseModel):
    total_found: int
    category: str
    start: int
    max_results: int
    articles: list

class SubjectArticlesResponse(BaseModel):
    total_subjects: int
    total_articles: int
    results_by_subject: dict

class AllPapersResponse(BaseModel):
    papers: list
    total: int
    start: int
    max_results: int

class CategoryPapersResponse(BaseModel):
    papers: list
    total: int
    categories: list

@app.get("/summarize", response_model=PaperResponse)
def summarize(query: str = Query(..., description="เช่น ai image processing")):
    result = fetch_and_summarize(query)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Save result to Supabase
    try:
        supabase.table("papers").insert({
            "title": result["title"],
            "authors": result["authors"],
            "published": result["published"],
            "pdf_link": result["pdf_link"],
            "bibtex": result["bibtex"],
            "summary": result["summary"]
        }).execute()
    except Exception as db_error:
        print(f"[WARNING] Failed to save to database: {db_error}")
        # Continue without database save
    
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

@app.get("/arxiv/all", response_model=AllArticlesResponse)
def get_all_arxiv_articles(
    category: str = Query(..., description="หมวดหมู่ของบทความ เช่น cs.AI, cs.CV, math.ST"),
    max_results: int = Query(default=20, description="จำนวนบทความสูงสุดที่ต้องการ"),
    start: int = Query(default=0, description="ตำแหน่งเริ่มต้นสำหรับการแบ่งหน้า")
):
    """
    ดึงบทความจาก arXiv ตามหมวดหมู่ที่กำหนด (ไม่รวม all category)
    """
    try:
        result = fetch_all_arxiv_papers(category=category, max_results=max_results, start=start)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Save articles to Supabase (optional - can be disabled for performance)
        try:
            for article in result["articles"]:
                supabase.table("papers").upsert({
                    "title": article["title"],
                    "authors": article["authors"],
                    "published": article["published"],
                    "pdf_link": article["pdf_link"],
                    "bibtex": article["bibtex"],
                    "summary": article["summary"],
                    "arxiv_id": article["id"],
                    "categories": article["categories"]
                }, on_conflict="arxiv_id").execute()
        except Exception as db_error:
            print(f"[WARNING] Failed to save to database: {db_error}")
            # Continue without database save
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_all_arxiv_articles: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/arxiv/subjects", response_model=SubjectArticlesResponse)
def get_arxiv_articles_by_subjects(
    subjects: str = Query(default="cs.AI,cs.CV,cs.LG,cs.CL", description="รายการหมวดหมู่ที่คั่นด้วยจุลภาค เช่น cs.AI,cs.CV,math.ST"),
    max_results_per_subject: int = Query(default=10, description="จำนวนบทความสูงสุดต่อหมวดหมู่")
):
    """
    ดึงบทความจาก arXiv จากหลายหมวดหมู่พร้อมกัน
    """
    try:
        subject_list = [s.strip() for s in subjects.split(",") if s.strip()]
        
        if not subject_list:
            raise HTTPException(status_code=400, detail="กรุณาระบุหมวดหมู่อย่างน้อย 1 หมวดหมู่")
        
        result = fetch_papers_by_category(
            subject_areas=subject_list, 
            max_results=max_results_per_subject
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_arxiv_articles_by_subjects: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/arxiv/categories")
def get_available_categories():
    """
    รายการหมวดหมู่ที่ใช้ได้ใน arXiv
    """
    categories = {
        "Computer Science": {
            "cs.AI": "Artificial Intelligence",
            "cs.AR": "Hardware Architecture", 
            "cs.CC": "Computational Complexity",
            "cs.CE": "Computational Engineering, Finance, and Science",
            "cs.CG": "Computational Geometry",
            "cs.CL": "Computation and Language",
            "cs.CR": "Cryptography and Security",
            "cs.CV": "Computer Vision and Pattern Recognition",
            "cs.CY": "Computers and Society",
            "cs.DB": "Databases",
            "cs.DC": "Distributed, Parallel, and Cluster Computing",
            "cs.DL": "Digital Libraries",
            "cs.DM": "Discrete Mathematics",
            "cs.DS": "Data Structures and Algorithmst",
            "cs.ET": "Emerging Technologies",
            "cs.FL": "Formal Languages and Automata Theory",
            "cs.GL": "General Literature",
            "cs.GR": "Graphics",
            "cs.GT": "Computer Science and Game Theory",
            "cs.HC": "Human-Computer Interaction",
            "cs.IR": "Information Retrieval",
            "cs.IT": "Information Theory",
            "cs.LG": "Machine Learning",
            "cs.LO": "Logic in Computer Science",
            "cs.MA": "Multiagent Systems",
            "cs.MM": "Multimedia",
            "cs.MS": "Mathematical Software",
            "cs.NA": "Numerical Analysis",
            "cs.NE": "Neural and Evolutionary Computing",
            "cs.NI": "Networking and Internet Architecture",
            "cs.OH": "Other Computer Science",
            "cs.OS": "Operating Systems",
            "cs.PF": "Performance",
            "cs.PL": "Programming Languages",
            "cs.RO": "Robotics",
            "cs.SC": "Symbolic Computation",
            "cs.SD": "Sound",
            "cs.SE": "Software Engineering",
            "cs.SI": "Social and Information Networks",
            "cs.SY": "Systems and Control"
        },
        "Mathematics": {
            "math.AC": "Commutative Algebra",
            "math.AG": "Algebraic Geometry",
            "math.AP": "Analysis of PDEs", 
            "math.AT": "Algebraic Topology",
            "math.CA": "Classical Analysis and ODEs",
            "math.CO": "Combinatorics",
            "math.CT": "Category Theory",
            "math.CV": "Complex Variables",
            "math.DG": "Differential Geometry",
            "math.DS": "Dynamical Systems",
            "math.FA": "Functional Analysis",
            "math.GM": "General Mathematics",
            "math.GN": "General Topology",
            "math.GR": "Group Theory",
            "math.GT": "Geometric Topology",
            "math.HO": "History and Overview",
            "math.IT": "Information Theory",
            "math.KT": "K-Theory and Homology",
            "math.LO": "Logic",
            "math.MG": "Metric Geometry",
            "math.MP": "Mathematical Physics",
            "math.NA": "Numerical Analysis",
            "math.NT": "Number Theory",
            "math.OA": "Operator Algebras",
            "math.OC": "Optimization and Control",
            "math.PR": "Probability",
            "math.QA": "Quantum Algebra",
            "math.RA": "Rings and Algebras",
            "math.RT": "Representation Theory",
            "math.SG": "Symplectic Geometry",
            "math.SP": "Spectral Theory",
            "math.ST": "Statistics Theory"
        },
        "Statistics": {
            "stat.AP": "Applications",
            "stat.CO": "Computation",
            "stat.ME": "Methodology",
            "stat.ML": "Machine Learning",
            "stat.OT": "Other Statistics",
            "stat.TH": "Theory"
        },
        "Physics": {
            "physics.acc-ph": "Accelerator Physics",
            "physics.ao-ph": "Atmospheric and Oceanic Physics",
            "physics.atom-ph": "Atomic Physics",
            "physics.atm-clus": "Atomic and Molecular Clusters",
            "physics.bio-ph": "Biological Physics",
            "physics.chem-ph": "Chemical Physics",
            "physics.class-ph": "Classical Physics",
            "physics.comp-ph": "Computational Physics",
            "physics.data-an": "Data Analysis, Statistics and Probability",
            "physics.ed-ph": "Physics Education",
            "physics.flu-dyn": "Fluid Dynamics",
            "physics.gen-ph": "General Physics",
            "physics.geo-ph": "Geophysics",
            "physics.hist-ph": "History and Philosophy of Physics",
            "physics.ins-det": "Instrumentation and Detectors",
            "physics.med-ph": "Medical Physics",
            "physics.optics": "Optics",
            "physics.plasm-ph": "Plasma Physics",
            "physics.pop-ph": "Popular Physics",
            "physics.soc-ph": "Physics and Society",
            "physics.space-ph": "Space Physics"
        }
    }
    
    return {
        "message": "รายการหมวดหมู่ที่ใช้ได้ใน arXiv API",
        "categories": categories,
        "usage_examples": [
            "/arxiv/all?category=cs.AI&max_results=10",            "/arxiv/subjects?subjects=cs.AI,cs.CV,cs.LG&max_results_per_subject=5",
            "/arxiv/papers?category=cs.AI&max_results=50&start=0"
        ]
    }

@app.get("/papers/all", response_model=AllPapersResponse)
def get_all_papers(
    category: str = Query(..., description="หมวดหมู่ของบทความ เช่น cs.AI, physics.gen-ph"),
    max_results: int = Query(20, description="จำนวนบทความที่ต้องการ"),
    start: int = Query(0, description="เริ่มต้นจากบทความที่")
):
    """
    ดึงบทความจาก arXiv ตามหมวดหมู่ที่กำหนด (ไม่รวม all category)
    """
    result = fetch_all_arxiv_papers(category=category, max_results=max_results, start=start)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # บันทึกลงฐานข้อมูล Supabase (optional)
    try:
        for paper in result["papers"]:
            supabase.table("papers").upsert({
                "paper_id": paper["id"],
                "title": paper["title"],
                "authors": ", ".join(paper["authors"]),
                "abstract": paper["abstract"],
                "published": paper["published"],
                "pdf_link": paper["pdf_link"],
                "arxiv_url": paper["arxiv_url"],
                "categories": ", ".join(paper["categories"])
            }, on_conflict="paper_id").execute()
    except Exception as db_error:
        print(f"[WARNING] Database save failed: {db_error}")
    
    return result

@app.get("/papers/categories", response_model=CategoryPapersResponse)
def get_papers_by_categories(
    categories: str = Query(..., description="หมวดหมู่ที่ต้องการ คั่นด้วยคอมมา เช่น cs.AI,cs.LG,physics.gen-ph"),
    max_per_category: int = Query(10, description="จำนวนบทความต่อหมวดหมู่")
):
    """
    ดึงบทความตามหมวดหมู่ที่กำหนด
    """
    category_list = [cat.strip() for cat in categories.split(",")]
    result = fetch_papers_by_category(category_list, max_per_category)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.get("/papers/recent")
def get_recent_papers(days: int = Query(7, description="จำนวนวันย้อนหลัง")):
    """
    ดึงบทความล่าสุดจาก arXiv
    """
    from datetime import datetime, timedelta
    
    # คำนวณวันที่
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # สร้าง query สำหรับดึงบทความในช่วงเวลาที่กำหนด
    date_query = f"submittedDate:[{start_date.strftime('%Y%m%d')}* TO {end_date.strftime('%Y%m%d')}*]"
    
    try:
        result = fetch_all_arxiv_papers(category="all", max_results=50)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "papers": result["papers"],
            "total": result["total"],
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recent papers: {str(e)}")
