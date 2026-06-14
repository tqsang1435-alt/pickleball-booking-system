"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import StaffDashboard from "@/modules/operations/StaffDashboard";
import OperationsPage from "@/modules/operations/OperationsPage";
import styles from "./page.module.css";

type View = "dashboard" | "detail";

export default function Page() {
  const searchParams = useSearchParams();
  const initial = searchParams?.get("view") === "detail" ? "detail" : "dashboard";
  const [view, setView] = useState<View>(initial as View);

  // If URL explicitly contains ?view=detail, prefer that when rendering
  const urlView = typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("view") : null;
  const effectiveView: View = urlView === "detail" ? "detail" : view;

  return (
    <div className={styles.wrapper}>
      {/* Tab switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${effectiveView === "dashboard" ? styles.tabActive : ""}`}
          onClick={() => setView("dashboard")}
        >
          🏠 Tổng quan ca
        </button>
        <button
          className={`${styles.tab} ${effectiveView === "detail" ? styles.tabActive : ""}`}
          onClick={() => setView("detail")}
        >
          📋 Chi tiết & Lọc ngày
        </button>
      </div>

      {effectiveView === "dashboard" ? <StaffDashboard /> : <OperationsPage />}
    </div>
  );
}
