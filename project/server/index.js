import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchAndSummarize } from './arxivService.js';
import { createRagSessionFromUrl, getRagProgress } from './ragSessionService.js';
import fetch from 'node-fetch';
import multer from 'multer';
import { proxyMultipart } from './proxyMultipart.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FASTAPI_URL = process.env.FASTAPI_URL || 'https://equally-lowest-wearing-muscles.trycloudflare.com/chatbot';

app.use(cors());
app.use(express.json());
const upload = multer();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Paper Summarizer API is running' });
});

// Main endpoint for processing papers
app.post('/api/process-paper', async (req, res) => {
  try {
    const { query, maxResults = 1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required' 
      });
    }

    console.log(`Processing query: ${query}`);
    
    const result = await searchAndSummarize(query, maxResults);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing paper:', error);
    res.status(500).json({ 
      error: 'Failed to process paper',
      message: error.message 
    });
  }
});

// Endpoint สำหรับสร้าง RAG session จาก PDF URL
app.post('/api/create_rag_session_from_url', async (req, res) => {
  try {
    const { pdf_url } = req.body;
    if (!pdf_url) return res.status(400).json({ error: 'pdf_url is required' });
    const sessionId = await createRagSessionFromUrl(pdf_url);
    res.json({ session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint สำหรับดึง progress
app.get('/api/rag_progress/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const progress = getRagProgress(sessionId);
  res.json({ progress });
});

// Proxy /chatbot/* ไปยัง FastAPI backend
app.use('/chatbot', upload.any(), async (req, res, next) => {
  const url = FASTAPI_URL + req.url;
  const method = req.method;
  const headers = { ...req.headers };
  delete headers['host'];

  // รองรับ multipart/form-data
  if (req.is('multipart/form-data')) {
    return proxyMultipart(req, res, FASTAPI_URL);
  }

  let body = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    if (req.is('application/json')) {
      body = JSON.stringify(req.body);
    } else if (req.is('application/x-www-form-urlencoded')) {
      body = new URLSearchParams(req.body).toString();
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    const contentType = response.headers.get('content-type');
    res.status(response.status);
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});