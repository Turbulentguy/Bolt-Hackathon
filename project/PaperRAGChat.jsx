import React, { useState, useRef } from "react";

// เพิ่ม CSS สำหรับ animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// เพิ่ม style element ลงใน head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

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

// ฟังก์ชันสำหรับ format ข้อความให้สวยงาม
const formatMessage = (text) => {
  if (!text) return '';
  
  // แปลงข้อความให้มี formatting
  return text
    // จัดการ Markdown headers (largest to smallest)
    .replace(/^##### (.*$)/gm, '<h5 style="font-size: 14px; font-weight: bold; margin: 8px 0 4px 0; color: inherit;">$1</h5>')
    .replace(/^#### (.*$)/gm, '<h4 style="font-size: 16px; font-weight: bold; margin: 10px 0 4px 0; color: inherit;">$1</h4>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 10px 0 5px 0; color: inherit;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 12px 0 6px 0; color: inherit;">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="font-size: 22px; font-weight: bold; margin: 14px 0 8px 0; color: inherit;">$1</h1>')
    
    // จัดการ Math notation - ป้องกันการแปลงใน $...$ และ $$...$$
    .replace(/\$\$([^$]+)\$\$/g, '<span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-size: 13px;">$$1$</span>')
    .replace(/\$([^$]+)\$/g, '<span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 1px 3px; border-radius: 3px; font-size: 13px;">$1</span>')
    
    // Bold และ Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // จัดการ Code blocks และ inline code
    .replace(/```([^`]+)```/g, '<pre style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 4px 0; overflow-x: auto;">$1</pre>')
    .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 1px 3px; border-radius: 3px; font-family: monospace; font-size: 13px;">$1</code>')
    
    // จัดการ Lists - เฉพาะที่เริ่มต้นบรรทัด
    .replace(/^(\d+)\.\s+(.+$)/gm, '<div style="margin: 2px 0;">$1. $2</div>')
    .replace(/^[-*+]\s+(.+$)/gm, '<div style="margin: 2px 0;">• $1</div>')
    
    // จัดการ paragraph breaks - เฉพาะที่จำเป็น
    .replace(/\n\s*\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    
    .trim();
};
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

// เพิ่ม CSS สำหรับ formatting ข้อความ
const messageStyle = `
  .message-content strong {
    font-weight: bold;
    color: inherit;
  }
  .message-content em {
    font-style: italic;
    color: inherit;
  }
  .message-content h1,
  .message-content h2,
  .message-content h3,
  .message-content h4 {
    margin: 8px 0 4px 0;
    color: inherit;
  }
  .message-content code {
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }
  .message-content pre {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .message-content br {
    line-height: 1.4;
  }
`;

// เพิ่ม style element ลงใน head
if (typeof document !== 'undefined') {
  const messageStyleElement = document.createElement('style');
  messageStyleElement.textContent = messageStyle;
  document.head.appendChild(messageStyleElement);
}

export default function PaperRAGChat({ paperTitle, papers }) {
  const [pdf, setPdf] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingPaperId, setLoadingPaperId] = useState(null);
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
    if (!sessionId || !message.trim()) return;
    
    const currentMessage = message.trim();
    console.log("Sending message:", currentMessage); // Debug log
    
    // Clear input immediately
    setMessage("");
    
    // Add user message to chat immediately
    setChat((prevChat) => {
      const newChat = [...prevChat, { sender: "user", text: currentMessage }];
      console.log("Updated chat with user message:", newChat); // Debug log
      return newChat;
    });
    
    setProgress("Thinking...");
    
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("message", currentMessage);
    
    try {
      // ส่ง chat ไปที่ proxy Node.js (ผ่าน /chatbot/chat_with_rag) โดยใช้ RAG_API
      const res = await fetch(`${RAG_API}/chat_with_rag`, {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Received response:", data); // Debug log
        
        setChat((prevChat) => {
          const newChat = [
            ...prevChat,
            { sender: "rag", text: data.rag_reply },
            { sender: "gpt", text: data.gpt_reply },
          ];
          console.log("Updated chat with responses:", newChat); // Debug log
          return newChat;
        });
        setProgress("");
      } else {
        console.error("API error:", res.status); // Debug log
        setProgress("Error in chat");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setProgress("Error in chat");
    }
  };

  // ฟังก์ชันเมื่อกดปุ่ม Chat ในแต่ละ paper
  const handleChat = async (paper) => {
    const paperId = paper.id || paper.title; // ใช้ id หรือ title เป็น unique identifier
    setLoadingPaperId(paperId);
    
    try {
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
    } catch (error) {
      console.error('Error handling chat:', error);
      setProgress("เกิดข้อผิดพลาดในการเริ่มต้น chat");
    } finally {
      setLoadingPaperId(null);
    }
  };

  const filteredPapers = selectedCategory
    ? papers.filter((p) => p.category === selectedCategory)
    : papers;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Paper Assistant</h1>
        <p className="text-gray-600">Chat with research papers using advanced RAG technology</p>
      </div>
      
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-center gap-4">
          <label htmlFor="cat-select" className="text-sm font-semibold text-gray-700">Filter by Category:</label>
          <select
            id="cat-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-6 mb-8">
        {filteredPapers.map((paper, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-blue-500">
            <div className="mb-3">
              <h3 className="text-xl font-bold text-gray-800 leading-tight mb-2">{paper.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className="font-medium">By: {paper.authors}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {paper.year}
                </span>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">{paper.summary}</p>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "13px",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                  border: "none",
                  cursor: loadingPaperId === (paper.id || paper.title) ? "not-allowed" : "pointer",
                  background: loadingPaperId === (paper.id || paper.title) 
                    ? "linear-gradient(135deg, #9CA3AF, #6B7280)" 
                    : "linear-gradient(135deg, #EC4899, #8B5CF6, #4F46E5)",
                  color: "white",
                  transform: loadingPaperId === (paper.id || paper.title) ? "none" : "translateY(0)",
                  flex: "0 0 auto",
                  minWidth: "100px"
                }}
                onClick={() => handleChat(paper)}
                disabled={loadingPaperId === (paper.id || paper.title)}
                onMouseEnter={(e) => {
                  if (!loadingPaperId) {
                    e.target.style.transform = "translateY(-2px) scale(1.02)";
                    e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingPaperId) {
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = "0 3px 12px rgba(0,0,0,0.15)";
                  }
                }}
              >
                {loadingPaperId === (paper.id || paper.title) ? (
                  <>
                    <div style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid transparent",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    Loading
                  </>
                ) : (
                  <>
                    💬 Chat
                  </>
                )}
              </button>
              
              <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #FB923C, #EF4444)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: "0 0 auto",
                    minWidth: "90px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px) scale(1.02)";
                    e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
                    e.target.style.background = "linear-gradient(135deg, #F97316, #DC2626)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = "0 3px 12px rgba(0,0,0,0.15)";
                    e.target.style.background = "linear-gradient(135deg, #FB923C, #EF4444)";
                  }}
                >
                  📄 ArXiv
                </button>
              </a>
              
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #FBBF24, #EAB308)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: "0 0 auto",
                    minWidth: "80px"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px) scale(1.02)";
                    e.target.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
                    e.target.style.background = "linear-gradient(135deg, #F59E0B, #D97706)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0) scale(1)";
                    e.target.style.boxShadow = "0 3px 12px rgba(0,0,0,0.15)";
                    e.target.style.background = "linear-gradient(135deg, #FBBF24, #EAB308)";
                  }}
                >
                  📑 PDF
                </button>
              </a>
            </div>
          </div>
        ))}
      </div>
      {filteredPapers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No papers found</h3>
          <p className="text-gray-500">Try selecting a different category or check back later.</p>
        </div>
      )}
      
      {!showChat && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Your Own Paper</h3>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
            />
            <button 
              onClick={startChatWithPaper} 
              disabled={!pdf}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                border: "none",
                cursor: pdf ? "pointer" : "not-allowed",
                background: pdf 
                  ? "linear-gradient(135deg, #10B981, #059669, #0D9488)" 
                  : "linear-gradient(135deg, #D1D5DB, #9CA3AF)",
                color: pdf ? "white" : "#6B7280"
              }}
              onMouseEnter={(e) => {
                if (pdf) {
                  e.target.style.transform = "translateY(-2px) scale(1.02)";
                  e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
                  e.target.style.background = "linear-gradient(135deg, #059669, #047857, #0F766E)";
                }
              }}
              onMouseLeave={(e) => {
                if (pdf) {
                  e.target.style.transform = "translateY(0) scale(1)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  e.target.style.background = "linear-gradient(135deg, #10B981, #059669, #0D9488)";
                }
              }}
            >
              🚀 Start Chat
            </button>
          </div>
        </div>
      )}
      {showChat && (
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl mx-auto border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Chat Assistant</h3>
            <button 
              onClick={() => {setShowChat(false); setChat([]); setSessionId(""); setProgress("");}}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "#F3F4F6",
                color: "#9CA3AF",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#FEE2E2";
                e.target.style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#F3F4F6";
                e.target.style.color = "#9CA3AF";
              }}
            >
              ✕
            </button>
          </div>
          
          {progress && (
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-blue-700 text-sm font-medium">{progress}</span>
              </div>
            </div>
          )}
          
          <div className="border border-gray-200 rounded-lg min-h-[300px] max-h-[400px] overflow-y-auto p-4 mb-4 bg-gray-50">
            {chat.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💬</div>
                <p>Start a conversation about the paper...</p>
              </div>
            ) : (
              <div>
                {chat.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: m.sender === "user" ? "right" : "left",
                      marginBottom: "16px"
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        maxWidth: "85%",
                        padding: "16px",
                        borderRadius: "16px",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        background: m.sender === "user" 
                          ? "linear-gradient(135deg, #3B82F6, #1D4ED8)"
                          : m.sender === "rag"
                          ? "linear-gradient(135deg, #DCFCE7, #BBF7D0)"
                          : "linear-gradient(135deg, #FEE2E2, #FECACA)",
                        color: m.sender === "user" 
                          ? "white"
                          : m.sender === "rag"
                          ? "#166534"
                          : "#991B1B",
                        border: m.sender === "user" 
                          ? "none"
                          : m.sender === "rag"
                          ? "1px solid #BBF7D0"
                          : "1px solid #FECACA",
                        borderBottomRightRadius: m.sender === "user" ? "6px" : "16px",
                        borderBottomLeftRadius: m.sender === "user" ? "16px" : "6px"
                      }}
                    >
                      <div style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        marginBottom: "6px",
                        opacity: 0.8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {m.sender === "user" ? "YOU" : m.sender === "rag" ? "📚 RAG ANALYSIS" : "🤖 AI ASSISTANT"}
                      </div>
                      <div 
                        className="message-content"
                        style={{
                          lineHeight: "1.6",
                          wordBreak: "break-word"
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessage(m.text) 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question about the paper..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={!sessionId}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!sessionId || !message.trim()}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                border: "none",
                cursor: (sessionId && message.trim()) ? "pointer" : "not-allowed",
                background: (sessionId && message.trim())
                  ? "linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)"
                  : "linear-gradient(135deg, #D1D5DB, #9CA3AF)",
                color: (sessionId && message.trim()) ? "white" : "#6B7280"
              }}
              onMouseEnter={(e) => {
                if (sessionId && message.trim()) {
                  e.target.style.transform = "translateY(-2px) scale(1.02)";
                  e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
                  e.target.style.background = "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)";
                }
              }}
              onMouseLeave={(e) => {
                if (sessionId && message.trim()) {
                  e.target.style.transform = "translateY(0) scale(1)";
                  e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  e.target.style.background = "linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)";
                }
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
