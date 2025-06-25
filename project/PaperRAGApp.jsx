import React, { useState, useRef } from "react";

function PaperSearch({ onSelect }) {
  const [pdf, setPdf] = useState(null);
  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 24, textAlign: "center" }}>
      <h2>ค้นหา/เลือก Paper เพื่อคุย</h2>
      <input type="file" accept="application/pdf" onChange={e => setPdf(e.target.files[0])} />
      <button
        style={{ marginLeft: 8, padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}
        onClick={() => pdf && onSelect(pdf)}
        disabled={!pdf}
      >
        เริ่มคุยกับ Paper นี้
      </button>
    </div>
  );
}

function ChatView({ pdf, onBack }) {
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const polling = useRef(null);

  React.useEffect(() => {
    const uploadPdf = async () => {
      setProgress("Uploading PDF...");
      const formData = new FormData();
      formData.append("pdf", pdf);
      const res = await fetch("/chatbot/create_rag_session", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setProgress("Processing...");
        polling.current = setInterval(async () => {
          const progRes = await fetch(`/chatbot/rag_progress/${data.session_id}`);
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
    uploadPdf();
    // cleanup polling
    return () => polling.current && clearInterval(polling.current);
  }, [pdf]);

  const sendMessage = async () => {
    if (!sessionId || !message) return;
    setChat((c) => [...c, { sender: "user", text: message }]);
    setProgress("Thinking...");
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("message", message);
    const res = await fetch("/chatbot/chat_with_rag", {
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

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
      <button onClick={onBack} style={{ marginBottom: 16, background: "#eee", border: "none", borderRadius: 4, padding: "6px 16px" }}>← กลับไปหน้าค้นหา</button>
      <h2>Chatbot RAG (PDF Paper)</h2>
      <div style={{ marginBottom: 16, color: "#888" }}>Progress: {progress}</div>
      <div style={{ border: "1px solid #ccc", minHeight: 200, padding: 8, marginBottom: 16, borderRadius: 8, background: "#fafbfc" }}>
        {chat.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === "user" ? "right" : "left", margin: 4 }}>
            <b style={{ color: m.sender === "user" ? "#1976d2" : m.sender === "rag" ? "#388e3c" : "#d32f2f" }}>
              {m.sender === "user" ? "คุณ" : m.sender === "rag" ? "RAG" : "ChatGPT"}:
            </b> {m.text}
          </div>
        ))}
      </div>
      <div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="พิมพ์คำถามเกี่ยวกับ paper..."
          style={{ width: "80%", borderRadius: 4, border: "1px solid #bbb", padding: 6 }}
          disabled={!sessionId}
        />
        <button onClick={sendMessage} disabled={!sessionId || !message} style={{ marginLeft: 8, background: "#1976d2", color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px" }}>Send</button>
      </div>
    </div>
  );
}

export default function PaperRAGApp() {
  const [selectedPdf, setSelectedPdf] = useState(null);
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {!selectedPdf ? (
        <PaperSearch onSelect={setSelectedPdf} />
      ) : (
        <ChatView pdf={selectedPdf} onBack={() => setSelectedPdf(null)} />
      )}
    </div>
  );
}
