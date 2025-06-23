import os
import urllib.parse
import urllib.request
import feedparser
import io
import time
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import openai
import ssl
import requests

load_dotenv()

# Fix SSL context issues for Windows
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except:
    pass

# Set environment variables to fix SSL issues
os.environ['PYTHONHTTPSVERIFY'] = '0'
if 'SSL_CERT_FILE' in os.environ:
    del os.environ['SSL_CERT_FILE']

# Initialize OpenAI with error handling
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("[ERROR] OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY is required")

# Set OpenAI client with proper configuration
try:
    client = openai.OpenAI(
        api_key=openai_api_key,
        timeout=60.0,  # Increase timeout
    )
    print("[INFO] OpenAI client initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize OpenAI client: {e}")
    client = None

headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://yourdomain.com)"
}

def urlopen_with_retry(req, retries=3, delay=2):
    """Improved urlopen with multiple connection strategies"""
    url = req.full_url if hasattr(req, 'full_url') else str(req)
    
    for attempt in range(retries):
        try:
            # Strategy 1: Use requests library (most reliable)
            try:
                headers_dict = dict(req.headers) if hasattr(req, 'headers') else headers
                response = requests.get(url, headers=headers_dict, timeout=30, verify=False)
                response.raise_for_status()
                
                # Create a response-like object for compatibility
                class MockResponse:
                    def __init__(self, content):
                        self._content = content.encode('utf-8')
                    def read(self):
                        return self._content
                    def decode(self, encoding='utf-8'):
                        return self._content.decode(encoding)
                
                print(f"✓ Connected using requests library (attempt {attempt+1})")
                return MockResponse(response.text)
            except Exception as requests_error:
                print(f"Requests failed: {requests_error}")
            
            # Strategy 2: urllib with custom SSL context
            try:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                response = urllib.request.urlopen(req, timeout=30, context=ssl_context)
                print(f"✓ Connected using urllib with SSL context (attempt {attempt+1})")
                return response
            except Exception as ssl_error:
                print(f"urllib with SSL context failed: {ssl_error}")
            
            # Strategy 3: Basic urllib
            try:
                response = urllib.request.urlopen(req, timeout=30)
                print(f"✓ Connected using basic urllib (attempt {attempt+1})")
                return response
            except Exception as basic_error:
                print(f"Basic urllib failed: {basic_error}")
            
            # Strategy 4: Try HTTP fallback
            if url.startswith('https://'):
                try:
                    http_url = url.replace('https://', 'http://')
                    http_req = urllib.request.Request(http_url, headers=headers)
                    response = urllib.request.urlopen(http_req, timeout=30)
                    print(f"✓ Connected using HTTP fallback (attempt {attempt+1})")
                    return response
                except Exception as http_error:
                    print(f"HTTP fallback failed: {http_error}")
            
        except Exception as e:
            print(f"Error on attempt {attempt+1}/{retries}: {e}")
            if attempt < retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
    
    raise Exception("Failed after retries with all connection strategies")

def load_used_papers():
    if not os.path.exists("used_papers.txt"):
        return set()
    with open("used_papers.txt", "r", encoding="utf-8") as f:
        return set(line.strip() for line in f.readlines())

def save_used_paper(paper_id):
    with open("used_papers.txt", "a", encoding="utf-8") as f:
        f.write(paper_id + "\n")

def download_pdf_text_from_arxiv(entry):
    # ค้นหา pdf link จาก entry.links - try multiple methods
    pdf_link = None
    
    # Handle both dictionary and object entry formats
    links = None
    entry_id = None
    
    if hasattr(entry, 'links'):
        links = entry.links
        entry_id = entry.id
    elif isinstance(entry, dict):
        links = entry.get('links', [])
        entry_id = entry.get('id', '')
    
    # Method 1: Look for explicit PDF title
    if links:
        for link in links:
            if isinstance(link, dict):
                if link.get('title') == 'pdf':
                    pdf_link = link.get('href')
                    break
            elif hasattr(link, 'title') and link.title == 'pdf':
                pdf_link = link.href
                break
        
        # Method 2: Look for PDF in href or type
        if not pdf_link:
            for link in links:
                if isinstance(link, dict):
                    href = link.get('href', '')
                    link_type = link.get('type', '')
                    if 'pdf' in href.lower() or link_type == 'application/pdf':
                        pdf_link = href
                        break
                elif hasattr(link, 'href'):
                    href = getattr(link, 'href', '')
                    link_type = getattr(link, 'type', '')
                    if 'pdf' in href.lower() or link_type == 'application/pdf':
                        pdf_link = href
                        break
    
    # Method 3: Construct PDF link from ArXiv ID
    if not pdf_link and entry_id:
        arxiv_id = entry_id.split("/")[-1].replace('v', 'v').split('v')[0]  # Clean version numbers
        pdf_link = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

    if not pdf_link:
        print("[ERROR] No PDF link found")
        return None

    # Ensure HTTPS
    if pdf_link.startswith("http://"):
        pdf_link = "https://" + pdf_link[len("http://"):]

    # Enhanced headers for better PDF access
    pdf_headers = {
        **headers,
        'Accept': 'application/pdf,*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    }

    # Try primary PDF link with enhanced error handling
    try:
        print(f"Trying primary PDF link: {pdf_link}")
        response = requests.get(pdf_link, headers=pdf_headers, timeout=30, stream=True)
        response.raise_for_status()
        
        # Verify it's actually a PDF
        content_type = response.headers.get('content-type', '').lower()
        if 'pdf' not in content_type and len(response.content) < 1000:
            raise Exception(f"Invalid content type: {content_type}")
            
    except Exception as e:
        print(f"[WARNING] Primary link failed: {e}")
        # Fallback: try alternative ArXiv PDF URL format
        if entry_id:
            fallback_id = entry_id.split("/")[-1]
            fallback_link = f"https://arxiv.org/pdf/{fallback_id}.pdf"
            print(f"Trying fallback: {fallback_link}")
            try:
                response = requests.get(fallback_link, headers=pdf_headers, timeout=30, stream=True)
                response.raise_for_status()
                
                # Verify fallback PDF
                content_type = response.headers.get('content-type', '').lower()
                if 'pdf' not in content_type and len(response.content) < 1000:
                    raise Exception(f"Fallback also invalid: {content_type}")
                    
            except Exception as e2:
                print(f"[ERROR] Both PDF links failed: {e2}")
                return None
        else:
            print("[ERROR] No entry ID available for fallback")
            return None

    try:
        pdf_data = response.content
        
        # Validate PDF data
        if len(pdf_data) < 1000:  # PDF should be at least 1KB
            print("[ERROR] PDF data too small, likely not a valid PDF")
            return None
            
        if not pdf_data.startswith(b'%PDF'):
            print("[ERROR] Invalid PDF header")
            return None
            
        pdf_file = io.BytesIO(pdf_data)
        reader = PdfReader(pdf_file)
        
        # Check if PDF has pages
        if len(reader.pages) == 0:
            print("[ERROR] PDF has no pages")
            return None

        text = ""
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += page_text + "\n"
            except Exception as page_error:
                print(f"[WARNING] Failed to extract text from page {page_num}: {page_error}")
                continue
        
        # Validate extracted text
        if not text.strip():
            print("[ERROR] No text could be extracted from PDF")
            return None
            
        if len(text.strip()) < 100:  # Ensure we have substantial content
            print("[WARNING] Very little text extracted, might be image-based PDF")
            
        return text.strip()
        
    except Exception as pdf_error:
        print(f"[ERROR] PDF processing failed: {pdf_error}")
        return None


def summarize_text_with_gpt(text):
    try:
        if not client:
            raise Exception("OpenAI client not initialized")
            
        # Truncate text if it's too long to avoid token limits
        max_chars = 10000  # Reduced for better reliability
        if len(text) > max_chars:
            text = text[:max_chars] + "... [truncated]"
            
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "You are a helpful assistant specialized in summarizing research papers. "
                    "Your task is to provide a concise summary of the provided text, "
                    "highlighting the main findings, methodology, and conclusions."
                )},
                {"role": "user", "content": f"""Please summarize this research paper:\n\n{text}"""}
            ],
            max_tokens=1000,  # Reduced for better reliability
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[ERROR] OpenAI API error: {e}")
        # Return a fallback summary based on the text content
        lines = text.split('\n')
        summary_lines = []
        
        # Try to find abstract or introduction
        abstract_started = False
        for i, line in enumerate(lines[:50]):  # Check first 50 lines
            line_clean = line.strip().lower()
            if 'abstract' in line_clean and len(line_clean) < 20:
                abstract_started = True
                continue
            elif abstract_started and line.strip():
                if line_clean.startswith(('introduction', '1.', 'keywords', 'key words')):
                    break
                summary_lines.append(line.strip())
                if len(summary_lines) >= 10:  # Limit lines
                    break
        
        if not summary_lines:
            # Fallback to first meaningful lines
            for line in lines[:30]:
                if line.strip() and len(line.strip()) > 20:
                    summary_lines.append(line.strip())
                    if len(summary_lines) >= 5:
                        break
        
        fallback_summary = ' '.join(summary_lines)[:800] + "..."
        return f"[AI Summary unavailable - API error] Paper excerpt: {fallback_summary}"

def make_bibtex(entry):
    key = entry.id.split('/')[-1]
    authors = ", ".join([author.name for author in entry.authors]) if hasattr(entry, "authors") else "Unknown"
    title = entry.title.replace('\n', ' ').strip()
    year = entry.published[:4] if hasattr(entry, "published") else "????"
    return f"@article{{{key},\n  title={{ {title} }},\n  author={{ {authors} }},\n  year={{ {year} }},\n  url={{ {entry.id} }}\n}}"

def fetch_and_summarize(query: str):
    try:
        if not query or not query.strip():
            return {"error": "Query cannot be empty"}
            
        used_papers = load_used_papers()
        base_url = 'https://export.arxiv.org/api/query?'
        params = {
            'search_query': f'all:{query}',
            'start': 0,
            'max_results': 5  # Further reduced to avoid timeouts
        }

        print(f"[INFO] Searching ArXiv for: {query}")
        url = base_url + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        
        try:
            response = urlopen_with_retry(req)
            data = response.read().decode('utf-8')
            feed = feedparser.parse(data)
        except Exception as feed_error:
            print(f"[ERROR] Failed to fetch from ArXiv: {feed_error}")
            return {"error": "Failed to connect to ArXiv. Please try again later."}

        if not feed.entries:
            return {"error": "No papers found for your query."}

        print(f"[INFO] Found {len(feed.entries)} papers")
        processed_count = 0
        
        for entry in feed.entries:
            try:
                paper_id = entry.id
                if paper_id in used_papers:
                    print(f"[INFO] Skipping already used paper: {paper_id}")
                    continue
                
                processed_count += 1
                print(f"[INFO] Processing paper {processed_count}: {entry.title[:100]}...")
                
                text = download_pdf_text_from_arxiv(entry)
                if not text:
                    print(f"[WARNING] Could not extract text from {paper_id}")
                    continue

                summary = summarize_text_with_gpt(text)
                bibtex = make_bibtex(entry)

                save_used_paper(paper_id)

                # Extract PDF link more safely
                pdf_link = "N/A"
                try:
                    if hasattr(entry, 'links'):
                        for link in entry.links:
                            if hasattr(link, 'title') and link.title == 'pdf':
                                pdf_link = link.href
                                break
                            elif hasattr(link, 'href') and 'pdf' in link.href.lower():
                                pdf_link = link.href
                                break
                    
                    if pdf_link.startswith('http://'):
                        pdf_link = 'https://' + pdf_link[len('http://'):]
                except Exception as link_error:
                    print(f"[WARNING] Error extracting PDF link: {link_error}")

                result = {
                    "title": entry.title,
                    "authors": ", ".join([author.name for author in entry.authors]) if hasattr(entry, "authors") else "Unknown",
                    "published": entry.published if hasattr(entry, "published") else "Unknown",
                    "pdf_link": pdf_link,
                    "bibtex": bibtex,
                    "summary": summary
                }
                
                print(f"[INFO] Successfully processed paper: {entry.title[:50]}...")
                return result
                
            except Exception as entry_error:
                print(f"[ERROR] Error processing entry: {entry_error}")
                continue

        return {"error": "No suitable papers could be processed (all may have been used before or failed to process)."}
    
    except Exception as e:
        print(f"[ERROR] Unexpected exception in fetch_and_summarize: {e}")
        return {"error": f"Internal server error: {str(e)}"}

def process_uploaded_pdf(file_content, filename):
    """Process an uploaded PDF file and generate a summary using GPT-4o-mini."""
    try:
        print(f"[INFO] Processing uploaded file: {filename}")
        
        # Validate PDF data
        if len(file_content) < 1000:  # PDF should be at least 1KB
            print("[ERROR] PDF data too small, likely not a valid PDF")
            return {"error": "Invalid PDF file (too small)"}
            
        if not file_content.startswith(b'%PDF'):
            print("[ERROR] Invalid PDF header")
            return {"error": "Invalid PDF file format"}
            
        try:
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            # Check if PDF has pages
            if len(reader.pages) == 0:
                print("[ERROR] PDF has no pages")
                return {"error": "PDF has no pages"}

            text = ""
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text += page_text + "\n"
                except Exception as page_error:
                    print(f"[WARNING] Failed to extract text from page {page_num}: {page_error}")
                    continue
            
            # Validate extracted text
            if not text.strip():
                print("[ERROR] No text could be extracted from PDF")
                return {"error": "No text could be extracted from PDF"}
                
            if len(text.strip()) < 100:  # Ensure we have substantial content
                print("[WARNING] Very little text extracted, might be image-based PDF")
                return {"error": "Very little text could be extracted. The PDF might be image-based."}
                
            # Generate summary
            summary = summarize_text_with_gpt(text)
            
            # Create response
            result = {
                "filename": filename,
                "title": filename.replace('.pdf', ''),  # Basic title from filename
                "summary": summary
            }
            
            return result
            
        except Exception as pdf_error:
            print(f"[ERROR] PDF processing failed: {pdf_error}")
            return {"error": f"PDF processing failed: {str(pdf_error)}"}
            
    except Exception as e:
        print(f"[ERROR] Unexpected exception in process_uploaded_pdf: {e}")
        return {"error": f"Internal server error: {str(e)}"}



