import os
import urllib.parse
import urllib.request
import feedparser
import io
import time
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import openai

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://yourdomain.com)"
}

def urlopen_with_retry(req, retries=3, delay=2):
    for attempt in range(retries):
        try:
            return urllib.request.urlopen(req)
        except Exception as e:
            print(f"Error: {e}. Retry {attempt+1}/{retries} after {delay} sec.")
            time.sleep(delay)
    raise Exception("Failed after retries")

def load_used_papers():
    if not os.path.exists("used_papers.txt"):
        return set()
    with open("used_papers.txt", "r", encoding="utf-8") as f:
        return set(line.strip() for line in f.readlines())

def save_used_paper(paper_id):
    with open("used_papers.txt", "a", encoding="utf-8") as f:
        f.write(paper_id + "\n")

import requests

def download_pdf_text_from_arxiv(entry):
    # ค้นหา pdf link จาก entry.links
    pdf_link = next((l.href for l in entry.links if l.get('title') == 'pdf'), None)

    if not pdf_link:
        return None

    if pdf_link.startswith("http://"):
        pdf_link = "https://" + pdf_link[len("http://"):]

    # พยายามโหลดด้วยลิงก์หลักก่อน
    try:
        print(f"Trying primary PDF link: {pdf_link}")
        response = requests.get(pdf_link, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        # ถ้าล้มเหลว ลองใช้ fallback link
        fallback_id = entry.id.split("/")[-1]
        fallback_link = f"https://arxiv.org/pdf/{fallback_id}.pdf"
        print(f"[WARNING] Primary link failed. Trying fallback: {fallback_link}")
        try:
            response = requests.get(fallback_link, headers=headers, timeout=10)
            response.raise_for_status()
        except Exception as e2:
            print(f"[ERROR] Fallback PDF link also failed: {e2}")
            return None

    pdf_data = response.content
    pdf_file = io.BytesIO(pdf_data)
    reader = PdfReader(pdf_file)

    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    return text


def summarize_text_with_gpt(text):
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                "คุณคือผู้ช่วยด้านวิชาการสำหรับนักพัฒนา "
                "มีหน้าที่สรุปงานวิจัยอย่างแม่นยำและครบถ้วนจากเนื้อหาที่ให้มา โดยไม่ใส่ความคิดเห็นหรือข้อมูลอื่นเพิ่มเติม"
            )},
            {"role": "user", "content": f"""กรุณาสรุปงานวิจัยดังต่อไปนี้:\n\n{text}"""}
        ],
        max_tokens=2800,
        temperature=0.4
    )
    return response.choices[0].message.content.strip()

def make_bibtex(entry):
    key = entry.id.split('/')[-1]
    authors = ", ".join([author.name for author in entry.authors]) if hasattr(entry, "authors") else "Unknown"
    title = entry.title.replace('\n', ' ').strip()
    year = entry.published[:4] if hasattr(entry, "published") else "????"
    return f"@article{{{key},\n  title={{ {title} }},\n  author={{ {authors} }},\n  year={{ {year} }},\n  url={{ {entry.id} }}\n}}"

def fetch_and_summarize(query: str):
    used_papers = load_used_papers()
    base_url = 'https://export.arxiv.org/api/query?'
    params = {
        'search_query': f'all:{query}',
        'start': 0,
        'max_results': 100
    }

    url = base_url + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=headers)
    response = urlopen_with_retry(req)
    data = response.read().decode('utf-8')
    feed = feedparser.parse(data)

    for entry in feed.entries:
        paper_id = entry.id
        if paper_id in used_papers:
            continue

        text = download_pdf_text_from_arxiv(entry)
        if not text:
            continue

        summary = summarize_text_with_gpt(text)
        bibtex = make_bibtex(entry)

        save_used_paper(paper_id)

        pdf_link = next((l.href for l in entry.links if l.get('title') == 'pdf'), "N/A")
        if pdf_link.startswith('http://'):
            pdf_link = 'https://' + pdf_link[len('http://'):]

        return {
            "title": entry.title,
            "authors": ", ".join([author.name for author in entry.authors]) if hasattr(entry, "authors") else "Unknown",
            "published": entry.published if hasattr(entry, "published") else "Unknown",
            "pdf_link": pdf_link,
            "bibtex": bibtex,
            "summary": summary
        }

    return {"error": "ไม่พบงานวิจัยที่สามารถดาวน์โหลดหรือสรุปได้"}
