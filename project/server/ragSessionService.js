import fetch from 'node-fetch';

// In-memory session store (for demo; use Redis/DB in production)
const sessionStore = {};

const FASTAPI_URL = process.env.FASTAPI_URL || 'https://equally-lowest-wearing-muscles.trycloudflare.com/chatbot';

export async function createRagSessionFromUrl(pdfUrl) {
  // ส่ง request ไปยัง FastAPI backend ที่ cloudflare
  const response = await fetch(`${FASTAPI_URL}/create_rag_session_from_url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdf_url: pdfUrl })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`FastAPI error: ${err}`);
  }
  const data = await response.json();
  return data.session_id;
}

export function getRagProgress(sessionId) {
  return sessionStore[sessionId]?.progress || '';
}
