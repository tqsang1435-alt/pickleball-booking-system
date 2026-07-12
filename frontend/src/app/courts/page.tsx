"use client";

import { Suspense } from "react";
import CourtsPage from "@/modules/courts/CourtsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="container py-20 text-center" style={{ color: "#073b2b", fontWeight: 600 }}>Đang tải danh sách sân...</div>}>
      <CourtsPage />
    </Suspense>
  );
}
