"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import StaffDashboard from "@/modules/operations/StaffDashboard";
import OperationsPage from "@/modules/operations/OperationsPage";
import styles from "./page.module.css";

type View = "dashboard" | "detail";

export default function StaffOperationsClient() {
  const searchParams = useSearchParams();
  const initial = searchParams?.get("view") === "detail" ? "detail" : "dashboard";
  const [view, setView] = useState<View>(initial);
  const effectiveView: View = searchParams?.get("view") === "detail" ? "detail" : view;

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${effectiveView === "dashboard" ? styles.tabActive : ""}`}
          onClick={() => setView("dashboard")}
        >
          Tổng quan ca
        </button>
        <button
          className={`${styles.tab} ${effectiveView === "detail" ? styles.tabActive : ""}`}
          onClick={() => setView("detail")}
        >
          Chi tiết & Lọc ngày
        </button>
      </div>

      {effectiveView === "dashboard" ? <StaffDashboard /> : <OperationsPage />}
    </div>
  );
}
