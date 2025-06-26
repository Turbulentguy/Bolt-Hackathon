# Bolt-Hackathon

# Botchana

A comprehensive AI-powered research paper discovery and analysis platform that allows users to search, summarize, upload, and chat with academic papers using advanced RAG (Retrieval-Augmented Generation) technology.

## 🚀 Features

### Core Functionality
- **Paper Search & Summarization**: Search ArXiv papers by keywords and get AI-generated summaries
- **PDF Upload & Analysis**: Upload your own PDF papers for AI analysis and summarization
- **RAG Chat System**: Interactive chat with papers using retrieval-augmented generation
- **Paper Discovery**: Browse featured papers by category from ArXiv
- **Search History**: Track and revisit your previous searches and uploads

### Technical Features
- **User Authentication**: Secure login/registration with Supabase Auth
- **Real-time Processing**: Live progress tracking for PDF processing and RAG session creation
- **Responsive Design**: Modern, mobile-friendly interface with Tailwind CSS
- **Error Handling**: Comprehensive error handling and user feedback
- **Database Integration**: Automatic saving of search results and user data

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling
- **Bolt.new** for frontend structure

### Backend
- **FastAPI** (Python) for main API
- **Node.js/Express** for proxy and additional services
- **OpenAI GPT-4o-mini** for text summarization
- **PyPDF2** for PDF text extraction
- **ArXiv API** for paper discovery

### Database & Storage
- **Supabase** for authentication and data storage
- **PostgreSQL** (via Supabase) for paper metadata
- **Supabase Storage** for uploaded PDF files

### AI & ML
- **OpenAI API** for text summarization and chat
- **RAG (Retrieval-Augmented Generation)** for intelligent paper chat
- **Text chunking** for efficient document processing

## 🚀 Getting Started

### Prerequisites
- Node.js recommendation 22.15 and npm/pnpm
- Python recommendation 3.12.3 and pip
- OpenAI API key
- Supabase account and project

### Environment Setup

1. **Frontend Environment** (`.env` in project root):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

2. **Backend Environment** (`.env` in backend folder):
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
ARXIV_API_BASE_URL=https://export.arxiv.org/api/query
ARXIV_MAX_RESULTS=20
ARXIV_RETRY_ATTEMPTS=3
```

### supabase_config.py
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

3. **Server Environment** (`.env` in server folder):
```env
OPENAI_API_KEY=your_openai_api_key
FASTAPI_URL=http://localhost:8000
PORT=8000
```

### Installation & Running

1. **Install Dependencies**:
```bash
# Frontend
cd project
npm install

# Backend
cd ../backend
pip install -r requirements.txt

2. **Database Setup**:
```sql
-- Run in Supabase SQL editor
CREATE TABLE papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  published TEXT,
  pdf_link TEXT,
  bibtex TEXT,
  summary TEXT,
  arxiv_id TEXT UNIQUE,
  categories TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Papers are viewable by everyone" ON papers FOR SELECT USING (true);
CREATE POLICY "Papers are insertable by everyone" ON papers FOR INSERT WITH CHECK (true);
```

3. **Start Services**:
```bash
# Terminal 1: Backend (FastAPI)
cd backend
uvicorn main:app

# Terminal 2: Frontend (React)
cd project
npm run dev
```

4. **Access the Application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## 🔧 Configuration

### ArXiv Categories
The app supports various ArXiv categories including:
- `cs.AI` - Artificial Intelligence
- `cs.CV` - Computer Vision
- `cs.LG` - Machine Learning
- `cs.CL` - Natural Language Processing
- `cs.RO` - Robotics
- And many more...

### API Endpoints

#### Main API (FastAPI - Port 8000)
- `GET /summarize?query={query}` - Search and summarize papers
- `POST /upload-pdf` - Upload and analyze PDF
- `GET /papers/all` - Get papers by category
- `GET /papers/categories` - Get papers by multiple categories

#### RAG Chat API (via proxy - Port 3001)
- `POST /api/create_rag_session` - Create RAG session from uploaded PDF
- `POST /api/create_rag_session_from_url` - Create RAG session from PDF URL
- `POST /api/chat_with_rag` - Chat with paper using RAG
- `GET /api/rag_progress/{session_id}` - Get RAG processing progress

## 🔒 Security Features

- **Supabase Authentication** with email/password
- **Row Level Security** (RLS) for database access
- **Input validation** and sanitization
- **CORS configuration** for API security
- **Environment variable** protection

## 📊 Performance Optimizations

- **Code splitting** with React lazy loading
- **API response caching** where appropriate
- **Image optimization** and lazy loading
- **Bundle size optimization** with Vite
- **Database query optimization**

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Database Connection**: Check Supabase credentials and RLS policies
3. **OpenAI API**: Verify API key and rate limits
4. **PDF Processing**: Ensure PDFs are text-based, not image-only
5. **File Upload**: Check file size limits and storage configuration

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **ArXiv** for providing open access to research papers
- **OpenAI** for GPT models and API
- **Supabase** for backend infrastructure
- **Tailwind CSS** for the design system
- **React** and **FastAPI** communities

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
Papersum (Discord: https://discord.gg/2mq937xv)

---

**Built with bolt for the research community**
