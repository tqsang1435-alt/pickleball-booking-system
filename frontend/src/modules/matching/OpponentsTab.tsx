"use client";

import React, { useState, useEffect, useRef } from "react";
import * as api from "@/services/matchingApi";
import styles from "./MatchingLayout.module.css";
import CustomTimePicker from "./components/CustomTimePicker";

interface OpponentsTabProps {
  token: string;
  userProfile: api.PlayerProfile | null;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const timeOptions = Array.from({ length: (23 - 5) * 4 + 1 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

export default function OpponentsTab({ token, userProfile, showToast }: OpponentsTabProps) {
  const [myGroups, setMyGroups] = useState<api.PlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [opponents, setOpponents] = useState<any[]>([]);
  const [loadingMyGroups, setLoadingMyGroups] = useState(false);
  const [loadingOpponents, setLoadingOpponents] = useState(false);

  const [selectedOpponentGroup, setSelectedOpponentGroup] = useState<any | null>(null);
  const [challengeMsg, setChallengeMsg] = useState("Chào bạn, nhóm mình cùng giao lưu thi đấu Pickleball nhé!");
  const [challengeDate, setChallengeDate] = useState("");
  const [challengeStartTime, setChallengeStartTime] = useState("");
  const [challengeEndTime, setChallengeEndTime] = useState("");
  const [sendingChallenge, setSendingChallenge] = useState(false);

  // AI Opponent states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOpponentResults, setAiOpponentResults] = useState<api.AIOpponentResult[]>([]);
  const [aiOpponentFallback, setAiOpponentFallback] = useState(false);
  const [aiOpponentFallbackReason, setAiOpponentFallbackReason] = useState("");
  const [aiOpponentError, setAiOpponentError] = useState("");

  const lastRunGroupIdRef = useRef<string>("");

  useEffect(() => {
    if (!token || !userProfile || !selectedGroupId) {
      setAiOpponentResults([]);
      setAiOpponentError("");
      return;
    }

    const hasRequiredFields = !!(userProfile.PlayStyle?.trim() || userProfile.Goal?.trim());
    if (!hasRequiredFields) {
      setAiOpponentResults([]);
      setAiOpponentError("");
      return;
    }

    const key = `${selectedGroupId}|${userProfile.PlayStyle || ""}|${userProfile.Goal || ""}`;
    if (lastRunGroupIdRef.current === key) return;
    lastRunGroupIdRef.current = key;

    async function runAiOpponents() {
      try {
        setIsAiLoading(true);
        setAiOpponentError("");
        const data = await api.matchOpponentsByAI(token);
        const results = data && Array.isArray(data.results) ? data.results : [];
        setAiOpponentResults(results);
        setAiOpponentFallback(!!data?.fallback);
        setAiOpponentFallbackReason(data?.fallbackReason || "");
      } catch (err: any) {
        console.error("AI opponents matching error:", err);
        setAiOpponentResults([]);
        setAiOpponentError(err.message || "Không thể tìm cặp đối thủ phù hợp.");
      } finally {
        setIsAiLoading(false);
      }
    }

    runAiOpponents();
  }, [token, selectedGroupId, userProfile]);

  useEffect(() => {
    async function loadMyGroups() {
      try {
        setLoadingMyGroups(true);
        const data = await api.getUserGroups(token);
        // Only show groups where current user is Leader (since only Leader can send challenges)
        setMyGroups(data || []);
      } catch (err: any) {
        showToast(err.message || "Không thể tải nhóm chơi của bạn", "error");
      } finally {
        setLoadingMyGroups(false);
      }
    }
    loadMyGroups();
  }, [token]);

  useEffect(() => {
    if (!selectedGroupId) {
      setOpponents([]);
      return;
    }

    async function loadOpponents() {
      try {
        setLoadingOpponents(true);
        const data = await api.getSuitableOpponents(token, Number(selectedGroupId));
        const filtered = (data || []).filter((item: any) => {
          const opponent = item.group || {};
          const isMember = myGroups.some((mg) => mg.GroupID === opponent.GroupID);
          const isSelected = opponent.GroupID === Number(selectedGroupId);
          const isClosed = opponent.Status === "Closed";
          return !isMember && !isSelected && !isClosed;
        });
        setOpponents(filtered);
      } catch (err: any) {
        showToast(err.message || "Không thể tải nhóm đối thủ phù hợp", "error");
      } finally {
        setLoadingOpponents(false);
      }
    }
    loadOpponents();
  }, [selectedGroupId, token, myGroups]);

  const handleSendChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedOpponentGroup) return;

    if (!challengeDate) {
      showToast("Vui lòng chọn ngày thi đấu.", "error");
      return;
    }
    if (!challengeStartTime) {
      showToast("Vui lòng chọn giờ bắt đầu.", "error");
      return;
    }
    if (!challengeEndTime) {
      showToast("Vui lòng chọn giờ kết thúc.", "error");
      return;
    }

    const [startH, startM] = challengeStartTime.split(":").map(Number);
    const [endH, endM] = challengeEndTime.split(":").map(Number);
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    if (endVal <= startVal) {
      showToast("Giờ kết thúc phải lớn hơn giờ bắt đầu.", "error");
      return;
    }

    if (startH < 5 || (endH > 23 || (endH === 23 && endM > 0))) {
      showToast("Khung giờ thi đấu phải nằm trong khoảng từ 05:00 đến 23:00.", "error");
      return;
    }

    try {
      setSendingChallenge(true);
      await api.sendInvitation(token, {
        receiverId: selectedOpponentGroup.CreatorID,
        groupId: Number(selectedGroupId),
        targetGroupId: selectedOpponentGroup.GroupID,
        invitationType: "InviteOpponent",
        message: challengeMsg,
        challengeDate,
        challengeStartTime,
        challengeEndTime,
      });
      showToast("Đã gửi lời mời thách đấu.");
      setSelectedOpponentGroup(null);
    } catch (err: any) {
      showToast(err.message || "Không thể gửi lời mời thách đấu", "error");
    } finally {
      setSendingChallenge(false);
    }
  };

  const sortedOpponents = React.useMemo(() => {
    const items = [...opponents];
    return items.map(item => {
      const opponent = item.group || {};
      const aiResult = aiOpponentResults.find(r => r.opponentTeam?.groupId === opponent.GroupID);
      const scoreVal = aiResult && typeof aiResult.score === "number" 
        ? Math.round(aiResult.score) 
        : (typeof item.opponentScore !== "undefined" ? Math.round(item.opponentScore) : 0);
      return {
        ...item,
        finalScore: scoreVal
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }, [opponents, aiOpponentResults]);

  return (
    <div>
      <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "0.5rem" }}>Tìm kiếm đối thủ</h3>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "1.5rem" }}>
        Lựa chọn một trong các nhóm của bạn để tìm kiếm các nhóm đối thủ có trình độ tương đương cùng giao lưu, cọ sát.
      </p>

      {loadingMyGroups ? (
        <div className={styles.loadingInner}>Đang tải danh sách nhóm của bạn...</div>
      ) : myGroups.length === 0 ? (
        <div className={styles.alertWarning}>
          Bạn cần là thành viên hoặc quản lý của ít nhất một nhóm chơi bóng để sử dụng tính năng tìm kiếm đối thủ.
        </div>
      ) : (
        <div style={{ marginBottom: "2rem" }}>
          <div className={styles.formGroup} style={{ maxWidth: "400px" }}>
            <label className={styles.label}>Chọn nhóm của bạn:</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
              className={styles.select}
            >
              <option value="">-- Chọn nhóm chơi --</option>
              {myGroups.map((g) => (
                <option key={g.GroupID} value={g.GroupID}>
                  {g.GroupName} ({g.SkillLevel})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedGroupId && (
        <div>
          {/* AI Loading State */}
          {isAiLoading && (
            <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed #fca5a5", borderRadius: "10px", backgroundColor: "#fff5f5", marginBottom: "1.5rem" }}>
              <div className={styles.loadingInner} style={{ fontSize: "15px", color: "#dc2626", padding: 0 }}>
                🤖 AI đang phân tích hồ sơ và tìm cặp đối thủ phù hợp...
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "0.25rem" }}>Đang đánh giá sức mạnh, lối chơi và mục tiêu của các đội đối thủ.</p>
            </div>
          )}

          {/* Light notification if opponent matching fails or teammate is missing */}
          {!isAiLoading && aiOpponentError && (
            <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              💡 {aiOpponentError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
              Nhóm đối thủ được đề xuất
            </h4>
            {!isAiLoading && aiOpponentResults.length > 0 && (
              <span style={{ fontSize: "11px", backgroundColor: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.25rem 0.5rem", borderRadius: "6px", fontWeight: "600" }}>
                ✨ {aiOpponentFallback ? "Gợi ý nội bộ (AI Offline)" : "AI Đã tối ưu hóa"}
              </span>
            )}
          </div>

          {loadingOpponents ? (
            <div className={styles.loadingInner}>Đang tìm kiếm nhóm đối thủ phù hợp...</div>
          ) : opponents.length === 0 ? (
            <div className={styles.emptyState}>Không tìm thấy nhóm đối thủ nào phù hợp có trình độ tương đương với nhóm của bạn.</div>
          ) : (
            <div className={styles.gridList}>
              {sortedOpponents.map((item) => {
                const opponent = item.group || {};
                
                // Find if this opponent group has an AI analysis result
                const aiResult = aiOpponentResults.find(r => r.opponentTeam?.groupId === opponent.GroupID);
                
                // Prioritize AI matching score over default score
                const hasScore = aiResult ? typeof aiResult.score === "number" : typeof item.opponentScore !== "undefined";
                const scoreVal = aiResult && typeof aiResult.score === "number" 
                  ? Math.round(aiResult.score) 
                  : (typeof item.opponentScore !== "undefined" ? Math.round(item.opponentScore) : null);

                return (
                  <div 
                    className={styles.card} 
                    key={opponent.GroupID}
                    style={aiResult ? { border: "1px solid #fca5a5", boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.1)" } : undefined}
                  >
                    <div>
                      <div className={styles.cardHeader}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                            <h4 className={styles.cardName}>{opponent.GroupName}</h4>
                            {aiResult && (
                              <span style={{ 
                                fontSize: "10px", 
                                backgroundColor: "#ffe4e4", 
                                color: "#b91c1c", 
                                border: "1px solid #fecaca", 
                                padding: "0.15rem 0.35rem", 
                                borderRadius: "4px", 
                                fontWeight: "600",
                                marginLeft: "0.4rem",
                                display: "inline-block"
                              }}>
                                ✨ AI
                              </span>
                            )}
                          </div>
                          <span className={styles.cardTag} style={aiResult ? { backgroundColor: "#ffe4e4", color: "#b91c1c" } : { backgroundColor: "#fee2e2", color: "#991b1b" }}>
                            Đại diện: {opponent.CreatorName || opponent.CreatorEmail || "Ẩn danh"}
                          </span>
                        </div>
                        {hasScore && (
                          <div className={styles.scoreBadge} style={aiResult ? { backgroundColor: "#ffe4e4", borderColor: "#fca5a5", color: "#b91c1c" } : { borderColor: "#fca5a5" }}>
                            <span className={styles.scoreVal} style={{ color: "#dc2626" }}>{scoreVal}%</span>
                            <span className={styles.scoreText} style={{ color: "#7f1d1d" }}>Match</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for AI scores */}
                      {aiResult && scoreVal !== null && (
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden", marginBottom: "1rem", marginTop: "-0.5rem" }}>
                          <div style={{ width: `${scoreVal}%`, height: "100%", backgroundColor: scoreVal >= 80 ? "#10b981" : scoreVal >= 60 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                      )}

                      <div className={styles.cardBody}>
                        <div className={styles.cardMetaItem}>
                          <strong>Trình độ:</strong>
                          <span>{opponent.SkillLevel}</span>
                        </div>
                        <div className={styles.cardMetaItem}>
                          <strong>Kinh nghiệm TB:</strong>
                          <span>{opponent.AverageExperience || 0} năm</span>
                        </div>
                        <div className={styles.cardMetaItem}>
                          <strong>Thành viên:</strong>
                          <span>{opponent.CurrentPlayers} / {opponent.MaxPlayers || 4}</span>
                        </div>
                        {opponent.Description && (
                          <div className={styles.cardMetaItem} style={{ flexDirection: "column", gap: "0.125rem", marginTop: "0.5rem" }}>
                            <strong>Giới thiệu:</strong>
                            <span style={{ color: "#475569", fontSize: "13px" }}>{opponent.Description}</span>
                          </div>
                        )}

                        {/* AI Reasons & Explanation */}
                        {aiResult && aiResult.reasons && aiResult.reasons.length > 0 && (
                          <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: "#fff5f5", borderRadius: "8px", border: "1px dashed #fecaca" }}>
                            <strong style={{ fontSize: "12px", color: "#dc2626", display: "block", marginBottom: "0.25rem" }}>🤖 Phân tích từ AI:</strong>
                            <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "12px", color: "#991b1b", lineHeight: "1.4" }}>
                              {aiResult.reasons.map((r, idx) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <button
                        onClick={() => {
                          setSelectedOpponentGroup(opponent);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setChallengeDate(tomorrow.toISOString().split("T")[0]);
                          setChallengeStartTime("08:00");
                          setChallengeEndTime("10:00");
                        }}
                        className={styles.primaryBtn}
                        style={{ width: "100%" }}
                      >
                        Thách đấu
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedOpponentGroup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Thách đấu đối thủ</h4>
              <button className={styles.closeBtn} onClick={() => setSelectedOpponentGroup(null)}>×</button>
            </div>
            <form onSubmit={handleSendChallenge}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nhóm của bạn:</label>
                <input
                  type="text"
                  value={myGroups.find((g) => g.GroupID === Number(selectedGroupId))?.GroupName || ""}
                  disabled
                  className={styles.input}
                  style={{ backgroundColor: "#f8fafc" }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Giao đấu với nhóm:</label>
                <input
                  type="text"
                  value={selectedOpponentGroup.GroupName}
                  disabled
                  className={styles.input}
                  style={{ backgroundColor: "#f8fafc" }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Ngày thi đấu mong muốn:</label>
                <input
                  type="date"
                  value={challengeDate}
                  onChange={(e) => setChallengeDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Giờ bắt đầu:</label>
                  <CustomTimePicker
                    value={challengeStartTime}
                    onChange={(val) => setChallengeStartTime(val)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Giờ kết thúc:</label>
                  <CustomTimePicker
                    value={challengeEndTime}
                    onChange={(val) => setChallengeEndTime(val)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Lời nhắn mời giao hữu:</label>
                <textarea
                  value={challengeMsg}
                  onChange={(e) => setChallengeMsg(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setSelectedOpponentGroup(null)}
                  className={styles.secondaryBtn}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingChallenge}
                  className={styles.primaryBtn}
                >
                  {sendingChallenge ? "Đang gửi..." : "Gửi thách đấu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
