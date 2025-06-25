import React, { useState, useRef } from "react";

// Utility สำหรับดึง API URL จาก env (รองรับ Vite)
const API_URL = import.meta.env.VITE_API_URL || "";
const RAG_API = API_URL + "/api";

const categories = [
  { value: "cs.AI", label: "Artificial Intelligence" },
  { value: "cs.CV", label: "Computer Vision" },
  { value: "cs.LG", label: "Machine Learning" },
  { value: "cs.CL", label: "Computation and Language" },
  { value: "math.ST", label: "Statistics Theory" },
  // เพิ่มหมวดหมู่ที่ต้องการได้ที่นี่
];

// ปรับปรุง fetchPdfFile ให้เร็วขึ้นและรองรับ UI loading ที่เหมาะสม
async function fetchPdfFile(url, onProgress) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  const contentLength = +res.headers.get('Content-Length');
  let receivedLength = 0;
  let chunks = [];
  while(true) {
    const {done, value} = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedLength += value.length;
    if (onProgress && contentLength) {
      onProgress(Math.round(receivedLength / contentLength * 100));
    }
  }
  let blob = new Blob(chunks);
  return new File([blob], url.split('/').pop() || 'paper.pdf', { type: blob.type });
}

// ปรับปรุงฟังก์ชันสร้าง session จาก URL ให้รับ RAG_API
async function createRagSessionFromUrl(pdfUrl, setProgress) {
  setProgress("กำลังสร้าง session จาก URL ...");
  const res = await fetch(`${RAG_API}/create_rag_session_from_url`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdf_url: pdfUrl })
  });
  if (res.ok) {
    const data = await res.json();
    return data.session_id;
  } else {
    setProgress("สร้าง session ไม่สำเร็จ");
    return null;
  }
}

export default function PaperRAGChat({ paperTitle, papers }) {
  const [pdf, setPdf] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const polling = useRef(null);

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
  };

  const startChatWithPaper = async () => {
    if (!pdf) return;
    setProgress("Uploading PDF...");
    setShowChat(true);
    const formData = new FormData();
    formData.append("pdf", pdf);
    // กลับไปยิงที่ /api/create_rag_session (Node.js จะ proxy ให้เอง)
    const res = await fetch(`${RAG_API}/create_rag_session`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setSessionId(data.session_id);
      setProgress("Processing...");
      polling.current = setInterval(async () => {
        const progRes = await fetch(`${RAG_API}/rag_progress/${data.session_id}`);
        const progData = await progRes.json();
        setProgress(progData.progress);
        if (progData.progress && progData.progress.startsWith("Completed")) {
          clearInterval(polling.current);
        }
      }, 1000);
    } else {
      setProgress("Failed to create RAG");
    }
  };

  const sendMessage = async () => {
    if (!sessionId || !message) return;
    setChat((c) => [...c, { sender: "user", text: message }]);
    setProgress("Thinking...");
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("message", message);
    // ส่ง chat ไปที่ proxy Node.js (ผ่าน /chatbot/chat_with_rag) โดยใช้ RAG_API
    const res = await fetch(`${RAG_API}/chat_with_rag`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setChat((c) => [
        ...c,
        { sender: "rag", text: data.rag_reply },
        { sender: "gpt", text: data.gpt_reply },
      ]);
      setProgress("");
      setMessage("");
    } else {
      setProgress("Error in chat");
    }
  };

  // ฟังก์ชันเมื่อกดปุ่ม Chat ในแต่ละ paper
  const handleChat = async (paper) => {
    if (paper.pdfUrl && paper.pdfUrl.startsWith('http')) {
      setProgress("กำลังสร้าง session จาก URL ...");
      // ส่งไปที่ RAG_API (proxy) แทน RAG_API + /api
      const session_id = await createRagSessionFromUrl(paper.pdfUrl, setProgress);
      if (session_id) {
        setSessionId(session_id);
        setShowChat(true);
        // polling progress
        polling.current = setInterval(async () => {
          const progRes = await fetch(`${RAG_API}/rag_progress/${session_id}`);
          const progData = await progRes.json();
          setProgress(progData.progress);
          if (progData.progress && progData.progress.startsWith("Completed")) {
            clearInterval(polling.current);
          }
        }, 1000);
      }
    } else {
      setProgress("กำลังดาวน์โหลด PDF (0%) ...");
      const file = await fetchPdfFile(paper.pdfUrl, percent => setProgress(`กำลังดาวน์โหลด PDF (${percent}%) ...`));
      setPdf(file);
      setShowChat(true);
      setTimeout(() => startChatWithPaper(), 100);
    }
  };

  const filteredPapers = selectedCategory
    ? papers.filter((p) => p.category === selectedCategory)
    : papers;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
      <h2>Chatbot RAG (PDF Paper)</h2>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <label htmlFor="cat-select" style={{ fontWeight: 600 }}>Filter by Category:</label>
        <select
          id="cat-select"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: "1px solid #bbb" }}
        >
          <option value="">All</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      {filteredPapers.map((paper, idx) => (
        <div key={idx} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", marginBottom: 20, padding: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a237e" }}>{paper.title}</div>
          <div style={{ color: "#555", margin: "8px 0" }}>By: {paper.authors} <span style={{ background: "#e3f2fd", color: "#1976d2", borderRadius: 8, padding: "2px 8px", fontSize: 12, marginLeft: 8 }}>{paper.year}</span></div>
          <div style={{ color: "#444", marginBottom: 12 }}>{paper.summary}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              style={{ background: "#8e24aa", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}
              onClick={() => handleChat(paper)}
            >
              💬 Chat
            </button>
            <button
              style={{ background: "#6c47ff", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}
              onClick={() => window.open(paper.pdfUrl, "_blank")}
            >
              🔍 Summarize PDF
            </button>
            <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ background: "#e3f2fd", color: "#1976d2", border: "none", borderRadius: 20, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}>ArXiv</button>
            </a>
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ background: "#fffde7", color: "#fbc02d", border: "none", borderRadius: 20, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }}>PDF</button>
            </a>
          </div>
        </div>
      ))}
      {filteredPapers.length === 0 && <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>No papers found in this category.</div>}
      {!showChat && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <button onClick={startChatWithPaper} disabled={!pdf}>
            เริ่มคุยกับ Paper นี้
          </button>
        </div>
      )}
      {showChat && (
        <div style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0002",
          padding: 24,
          maxWidth: 500,
          margin: "32px auto",
          minHeight: 350
        }}>
          <div style={{ marginBottom: 16, color: "#888", fontSize: 15 }}>
            Progress: {progress}
          </div>
          <div style={{
            border: "1px solid #ccc",
            minHeight: 180,
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
            background: "#f8fafd"
          }}>
            {chat.map((m, i) => (
              <div
                key={i}
                style={{
                  textAlign: m.sender === "user" ? "right" : "left",
                  margin: 4,
                  fontSize: 15
                }}
              >
                <b style={{ color: m.sender === "user" ? "#1976d2" : m.sender === "rag" ? "#388e3c" : "#d32f2f" }}>
                  {m.sender === "user"
                    ? "คุณ"
                    : m.sender === "rag"
                    ? "RAG"
                    : "ChatGPT"}
                  :
                </b>{" "}
                {m.text}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์คำถามเกี่ยวกับ paper..."
              style={{ flex: 1, borderRadius: 6, border: "1px solid #bbb", padding: 8, fontSize: 15 }}
              disabled={!sessionId}
            />
            <button
              onClick={sendMessage}
              disabled={!sessionId || !message}
              style={{ background: "#8e24aa", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
