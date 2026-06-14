"use client";

import { useState } from "react";
import StaffDashboard from "@/modules/operations/StaffDashboard";
import OperationsPage from "@/modules/operations/OperationsPage";
import styles from "./page.module.css";

type View = "dashboard" | "detail";

export default function Page() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className={styles.wrapper}>
      {/* Tab switcher */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${view === "dashboard" ? styles.tabActive : ""}`}
          onClick={() => setView("dashboard")}
        >
          🏠 Tổng quan ca
        </button>
        <button
          className={`${styles.tab} ${view === "detail" ? styles.tabActive : ""}`}
          onClick={() => setView("detail")}
        >
          📋 Chi tiết & Lọc ngày
        </button>
      </div>

      {view === "dashboard" ? <StaffDashboard /> : <OperationsPage />}
    </div>
  );
}
