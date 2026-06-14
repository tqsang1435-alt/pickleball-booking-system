"use client";

import { useState, useEffect, useRef } from "react";
import { searchUsers } from "@/services/promotionApi";
import type { UserSearchResult } from "@/types/promotion";

interface UserSelectorProps {
  token: string;
  selectedUsers: UserSearchResult[];
  onAdd: (user: UserSearchResult) => void;
  onRemove: (userId: number) => void;
}

export default function UserSelectorForVoucher({
  token,
  selectedUsers,
  onAdd,
  onRemove,
}: UserSelectorProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!keyword.trim() || keyword.trim().length < 1) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchUsers(token, keyword);
        // Lọc bỏ user đã chọn
        const selectedIds = new Set(selectedUsers.map((u) => u.UserID));
        setResults(data.filter((u) => !selectedIds.has(u.UserID)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [keyword, token, selectedUsers]);

  return (
    <div>
      <label style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.4rem", display: "block" }}>
        🔍 Tìm kiếm và chọn người dùng
      </label>

      {/* Search input */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Nhập tên, email hoặc số điện thoại..."
        style={{
          width: "100%",
          padding: "0.55rem 0.75rem",
          border: "1.5px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "0.9rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Search results */}
      {results.length > 0 && (
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          marginTop: "0.3rem",
          background: "white",
          maxHeight: "180px",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}>
          {results.map((u) => (
            <div
              key={u.UserID}
              onClick={() => { onAdd(u); setKeyword(""); setResults([]); }}
              style={{
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{u.FullName}</div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{u.Email}</div>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {u.RoleName || "Player"}
              </span>
            </div>
          ))}
        </div>
      )}
      {searching && (
        <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.3rem" }}>
          Đang tìm kiếm...
        </p>
      )}

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", color: "#374151" }}>
            Đã chọn ({selectedUsers.length} người):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {selectedUsers.map((u) => (
              <span
                key={u.UserID}
                style={{
                  background: "#f3e8ff",
                  border: "1px solid #d8b4fe",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#6d28d9",
                }}
              >
                {u.FullName}
                <button
                  onClick={() => onRemove(u.UserID)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.85rem",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
