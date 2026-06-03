"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/authStorage";
import * as api from "@/services/matchingApi";
import styles from "./MatchingLayout.module.css";

import ProfileTab from "./ProfileTab";
import TeammatesTab from "./TeammatesTab";
import GroupsTab from "./GroupsTab";
import OpponentsTab from "./OpponentsTab";
import InvitationsTab from "./InvitationsTab";

export default function MatchingLayout() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "teammates" | "groups" | "opponents" | "invitations">("profile");
  const [userProfile, setUserProfile] = useState<api.PlayerProfile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      // User is not logged in - redirect to /login
      if (typeof window !== "undefined") {
        alert("Vui lòng đăng nhập để sử dụng tính năng ghép cặp.");
      }
      router.push("/login");
    } else {
      setToken(t);
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;

    async function fetchPendingCount() {
      try {
        const res = await api.getPendingInvitationCount(token!);
        setPendingCount(res.count);
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    }

    fetchPendingCount();

    window.addEventListener("invitation-count-change", fetchPendingCount);

    return () => {
      window.removeEventListener("invitation-count-change", fetchPendingCount);
    };
  }, [token, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (checkingAuth || !token) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "#64748b" }}>Đang kiểm tra thông tin đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toast Alert overlay */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: toast.type === "success" ? "#166534" : "#991b1b",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            fontWeight: "500",
            fontSize: "14px",
            transition: "all 0.3s ease",
          }}
        >
          {toast.type === "success" ? "✅ " : "❌ "}
          {toast.message}
        </div>
      )}

      <div className={styles.titleArea}>
        <h1 className={styles.title}>Player Matching & Teams</h1>
        <p className={styles.subtitle}>
          Kết nối những người chơi cùng đam mê, thiết lập nhóm đánh và tổ chức các trận đấu Pickleball giao hữu.
        </p>
      </div>

      <div className={styles.dashboard}>
        <aside className={styles.sidebar}>
          <nav className={styles.tabList}>
            <button
              onClick={() => setActiveTab("profile")}
              className={`${styles.tabButton} ${activeTab === "profile" ? styles.tabButtonActive : ""}`}
            >
              👤 Hồ sơ chơi bóng
            </button>
            <button
              onClick={() => setActiveTab("teammates")}
              className={`${styles.tabButton} ${activeTab === "teammates" ? styles.tabButtonActive : ""}`}
            >
              🤝 Tìm đồng đội
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`${styles.tabButton} ${activeTab === "groups" ? styles.tabButtonActive : ""}`}
            >
              👥 Nhóm chơi bóng
            </button>
            <button
              onClick={() => setActiveTab("opponents")}
              className={`${styles.tabButton} ${activeTab === "opponents" ? styles.tabButtonActive : ""}`}
            >
              🔥 Tìm cặp đối thủ
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`${styles.tabButton} ${activeTab === "invitations" ? styles.tabButtonActive : ""}`}
            >
              <span>✉️ Hộp thư lời mời</span>
              {pendingCount > 0 && (
                <span className={styles.badge}>
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          </nav>
        </aside>

        <main className={styles.contentArea}>
          {activeTab === "profile" && (
            <ProfileTab
              token={token}
              onProfileUpdated={(p) => setUserProfile(p)}
              showToast={showToast}
            />
          )}

          {activeTab === "teammates" && (
            <TeammatesTab
              token={token}
              userProfile={userProfile}
              showToast={showToast}
            />
          )}

          {activeTab === "groups" && (
            <GroupsTab
              token={token}
              userProfile={userProfile}
              showToast={showToast}
              key={refreshTrigger} // Automatically re-mounts / refreshes group lists when refreshTrigger increments
            />
          )}

          {activeTab === "opponents" && (
            <OpponentsTab
              token={token}
              showToast={showToast}
            />
          )}

          {activeTab === "invitations" && (
            <InvitationsTab
              token={token}
              onActionSuccess={triggerRefresh}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
