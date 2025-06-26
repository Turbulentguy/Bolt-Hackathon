import React, { useState, useRef } from "react";

export default function ChatbotRAG() {
  const [pdf, setPdf] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const polling = useRef(null);

  const handleFileChange = (e) => {
    setPdf(e.target.files[0]);
  };

  const uploadPdf = async () => {
    if (!pdf) return;
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
      // Start polling progress
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
      <h2>Chatbot RAG (PDF Paper)</h2>
      <div style={{ marginBottom: 16 }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={uploadPdf} disabled={!pdf}>Upload PDF</button>
      </div>
      <div style={{ marginBottom: 16, color: "#888" }}>Progress: {progress}</div>
      <div style={{ border: "1px solid #ccc", minHeight: 200, padding: 8, marginBottom: 16 }}>
        {chat.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === "user" ? "right" : "left", margin: 4 }}>
            <b>{m.sender === "user" ? "คุณ" : m.sender === "rag" ? "RAG" : "ChatGPT"}:</b> {m.text}
          </div>
        ))}
      </div>
      <div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="พิมพ์คำถามเกี่ยวกับ paper..."
          style={{ width: "80%" }}
          disabled={!sessionId}
        />
        <button onClick={sendMessage} disabled={!sessionId || !message}>Send</button>
      </div>
    </div>
  );
}
