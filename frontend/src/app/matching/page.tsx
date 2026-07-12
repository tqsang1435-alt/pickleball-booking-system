"use client";

import React from "react";
import MatchingLayout from "@/modules/matching/MatchingLayout";

export default function MatchingPage() {
  return (
    <div style={{ 
      background: 'radial-gradient(circle at top right, rgba(35, 190, 120, 0.07), transparent 35%), linear-gradient(180deg, #F7FAF5 0%, #F1F7EF 100%)', 
      minHeight: "100vh",
      padding: "20px 0"
    }}>
      <MatchingLayout />
    </div>
  );
}
