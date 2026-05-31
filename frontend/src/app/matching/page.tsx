"use client";

import React from "react";

// Metadata cannot be exported from a Client Component. 
// Moving title and description to a layout or removing it here.

export default function MatchingPage() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "4rem 2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "1rem" }}>🚧</div>
        <h1
          style={{
            fontSize: "24px",
            color: "#0f172a",
            marginBottom: "1rem",
            fontWeight: "600",
          }}
        >
          Tính năng đang được phát triển
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#64748b",
            lineHeight: "1.6",
            marginBottom: "2rem",
          }}
        >
          Chúng tôi đang nỗ lực hoàn thiện chức năng <strong>Tìm người chơi</strong> (Matching) để mang đến trải nghiệm ghép đôi đánh Pickleball tuyệt vời nhất cho bạn. Vui lòng quay lại sau!
        </p>
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.history.back();
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
        >
          Quay lại trang trước
        </button>
      </div>
    </main>
  );
}
