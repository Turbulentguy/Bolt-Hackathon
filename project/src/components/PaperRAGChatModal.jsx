import React from "react";
import PaperRAGChat from "../../PaperRAGChat";

export default function PaperRAGChatModal({ paper, onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, maxWidth: 700, width: "95vw",
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 32px #0003", position: "relative", padding: 24
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, background: "#eee",
            border: "none", borderRadius: 8, padding: 8, fontWeight: 700, cursor: "pointer", zIndex: 10
          }}
        >✕</button>
        <h3 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700, color: "#1a237e" }}>{paper.title}</h3>
        <PaperRAGChat papers={[paper]} paperTitle={paper.title} />
      </div>
    </div>
  );
}
