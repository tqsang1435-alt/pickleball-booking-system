"use client";

import React, { useState, useEffect, useRef } from "react";
import * as api from "@/services/matchingApi";
import styles from "./MatchingLayout.module.css";

interface TeammatesTabProps {
  token: string;
  userProfile: api.PlayerProfile | null;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function TeammatesTab({ token, userProfile, showToast }: TeammatesTabProps) {
  const [loading, setLoading] = useState(false);
  const [teammates, setTeammates] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [inviteMsg, setInviteMsg] = useState("Chào bạn, mình cùng ghép cặp đánh Pickleball nhé!");
  const [sendingInvite, setSendingInvite] = useState(false);

  // AI Matching states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTeammateResults, setAiTeammateResults] = useState<api.AITeammateResult[]>([]);
  const [aiTeammateFallback, setAiTeammateFallback] = useState(false);
  const [aiTeammateFallbackReason, setAiTeammateFallbackReason] = useState("");

  const lastRunProfileKeyRef = useRef<string>("");


  const hasCompleteProfile =
    userProfile &&
    userProfile.AvailableStartTime &&
    userProfile.AvailableEndTime;

  useEffect(() => {
    if (!hasCompleteProfile) return;

    async function loadTeammates() {
      try {
        setLoading(true);
        const data = await api.getSuitableTeammates(token);
        setTeammates(data || []);
      } catch (err: any) {
        showToast(err.message || "Không thể tải danh sách đồng đội gợi ý", "error");
      } finally {
        setLoading(false);
      }
    }

    loadTeammates();
  }, [token, userProfile]);

  function formatTime(timeVal: any): string {
    if (!timeVal) return "";
    const str = String(timeVal);
    if (str.includes("T")) {
      const parts = str.split("T")[1];
      return parts ? parts.substring(0, 5) : str.substring(0, 5);
    }
    return str.substring(0, 5);
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    try {
      setSendingInvite(true);
      await api.sendInvitation(token, {
        receiverId: selectedPlayer.UserID,
        groupId: null,
        invitationType: "InviteToPlay",
        message: inviteMsg,
      });
      showToast(`Gửi lời mời ghép cặp tới ${selectedPlayer.FullName} thành công!`);
      setSelectedPlayer(null);
    } catch (err: any) {
      showToast(err.message || "Gửi lời mời thất bại. Có thể hai người đã có lời mời chờ xử lý hoặc đã ghép cặp.", "error");
    } finally {
      setSendingInvite(false);
    }
  };

  useEffect(() => {
    if (!token || !userProfile) return;

    // Check if the user has at least one of play style or goal filled
    const hasRequiredFields = !!(userProfile.PlayStyle?.trim() || userProfile.Goal?.trim());
    if (!hasRequiredFields) {
      setAiTeammateResults([]);
      return;
    }

    const profileKey = `${userProfile.PlayStyle || ""}|${userProfile.Goal || ""}|${userProfile.SkillLevel || ""}|${userProfile.PlayingRole || ""}|${userProfile.AvailableStartTime || ""}|${userProfile.AvailableEndTime || ""}`;

    if (lastRunProfileKeyRef.current === profileKey) {
      return;
    }

    lastRunProfileKeyRef.current = profileKey;

    async function runAiMatching() {
      try {
        setIsAiLoading(true);
        const data = await api.matchTeammatesByAI(token);
        const results = data && Array.isArray(data.results) ? data.results : [];
        setAiTeammateResults(results);
        setAiTeammateFallback(!!data?.fallback);
        setAiTeammateFallbackReason(data?.fallbackReason || "");
      } catch (err: any) {
        console.error("AI teammate matching error:", err);
        setAiTeammateResults([]);
      } finally {
        setIsAiLoading(false);
      }
    }

    runAiMatching();
  }, [token, userProfile]);




  const sortedTeammates = React.useMemo(() => {
    const items = [...teammates];
    return items.map(item => {
      const player = item.profile || {};
      const aiResult = aiTeammateResults.find(r => r.player?.UserID === player.UserID);
      const scoreVal = aiResult && typeof aiResult.score === "number" 
        ? Math.round(aiResult.score) 
        : (typeof item.matchingScore !== "undefined" ? Math.round(item.matchingScore) : 0);
      return {
        ...item,
        finalScore: scoreVal
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }, [teammates, aiTeammateResults]);

  if (!hasCompleteProfile) {
    return (
      <div className={styles.alertWarning}>
        <strong>⚠️ Yêu cầu thông tin:</strong> Vui lòng cập nhật và hoàn thiện thời gian rảnh (giờ bắt đầu và kết thúc) của bạn trong tab <strong>Hồ sơ chơi bóng</strong> trước khi tìm đồng đội.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>Tìm kiếm đồng đội & Đối thủ</h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "0.25rem" }}>Kết nối, ghép cặp và thách đấu bằng công cụ thông minh AI của Pickle Club.</p>
        </div>
      </div>

      {/* AI matching automatically runs when profile is loaded or updated */}

      {/* AI Loading State */}
      {isAiLoading && (
        <div style={{ padding: "1.5rem", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "10px", backgroundColor: "#f8fafc", marginBottom: "1.5rem" }}>
          <div className={styles.loadingInner} style={{ fontSize: "15px", color: "#4f46e5", padding: 0 }}>
            🤖 AI đang phân tích hồ sơ và tìm đồng đội phù hợp...
          </div>
        </div>
      )}

      {/* Section: AI Indicator Badge */}
      {!isAiLoading && aiTeammateResults.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "12px", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe", color: "#6d28d9", padding: "0.25rem 0.625rem", borderRadius: "20px", fontWeight: "600" }}>
            ✨ Đã tối ưu hóa danh sách bằng AI
          </span>
          {aiTeammateFallback && (
            <span style={{ fontSize: "11px", backgroundColor: "#fff7ed", border: "1px solid #ffedd5", color: "#c2410c", padding: "0.25rem 0.5rem", borderRadius: "6px", fontWeight: "600" }} title={aiTeammateFallbackReason}>
              ⚠️ Gợi ý nội bộ (AI Offline)
            </span>
          )}
        </div>
      )}

      {/* Default Match List Title */}
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#334155" }}>
          👥 Đồng đội phù hợp (Mặc định)
        </h4>
        <p style={{ fontSize: "13px", color: "#64748b", marginTop: "0.15rem" }}>
          Danh sách đề xuất dựa trên khung giờ rảnh và trình độ cơ bản của bạn.
        </p>
      </div>

      {loading ? (
        <div className={styles.loadingInner}>Đang tìm kiếm đồng đội phù hợp...</div>
      ) : teammates.length === 0 ? (
        <div className={styles.emptyState}>Không tìm thấy đồng đội nào phù hợp trong khung giờ rảnh của bạn hiện tại.</div>
      ) : (
        <div className={styles.gridList}>
          {sortedTeammates.map((item) => {
            const player = item.profile || {};
            
            // Find if this player candidate has an AI compatibility result
            const aiResult = aiTeammateResults.find(r => r.player?.UserID === player.UserID);
            
            // Prioritize AI matching score over default score
            const hasScore = aiResult ? typeof aiResult.score === "number" : typeof item.matchingScore !== "undefined";
            const scoreVal = aiResult && typeof aiResult.score === "number" 
              ? Math.round(aiResult.score) 
              : (typeof item.matchingScore !== "undefined" ? Math.round(item.matchingScore) : null);
            
            const scores = item.scores || {};
            
            return (
              <div 
                className={styles.card} 
                key={player.PlayerProfileID} 
                style={aiResult ? { border: "1px solid #c084fc", boxShadow: "0 4px 6px -1px rgba(168, 85, 247, 0.1)" } : undefined}
              >
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarWrap}>
                      {player.AvatarURL ? (
                        <img src={player.AvatarURL} alt={player.FullName} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder} style={aiResult ? { backgroundColor: "#ddd6fe", color: "#6d28d9" } : undefined}>
                          {player.FullName ? player.FullName.charAt(0).toUpperCase() : "P"}
                        </div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                          <h4 className={styles.cardName}>{player.FullName}</h4>
                          {aiResult && (
                            <span style={{ 
                              fontSize: "10px", 
                              backgroundColor: "#f5f3ff", 
                              color: "#6d28d9", 
                              border: "1px solid #ddd6fe", 
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
                        <span className={styles.cardTag} style={aiResult ? { backgroundColor: "#f5f3ff", color: "#6d28d9" } : undefined}>
                          {player.PlayingRole}
                        </span>
                      </div>
                    </div>
                    {hasScore && (
                      <div className={styles.scoreBadge} style={aiResult ? { backgroundColor: "#f5f3ff", borderColor: "#c084fc" } : undefined}>
                        <span className={styles.scoreVal} style={aiResult ? { color: "#6d28d9" } : undefined}>{scoreVal}%</span>
                        <span className={styles.scoreText} style={aiResult ? { color: "#7c3aed" } : undefined}>Match</span>
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
                      <span>{player.SkillLevel}</span>
                    </div>
                    <div className={styles.cardMetaItem}>
                      <strong>Kinh nghiệm:</strong>
                      <span>{player.ExperienceYears} năm</span>
                    </div>
                    <div className={styles.cardMetaItem}>
                      <strong>Khung giờ rảnh:</strong>
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>
                        {formatTime(player.AvailableStartTime)} - {formatTime(player.AvailableEndTime)}
                      </span>
                    </div>
                    {player.PlayStyle && (
                      <div className={styles.cardMetaItem} style={{ flexDirection: "column", gap: "0.125rem", marginTop: "0.25rem" }}>
                        <strong>Phong cách chơi:</strong>
                        <span style={{ color: "#475569", fontSize: "13px" }}>{player.PlayStyle}</span>
                      </div>
                    )}

                    {/* AI Reasons & Explanation */}
                    {aiResult && aiResult.reasons && aiResult.reasons.length > 0 && (
                      <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: "#f9f5ff", borderRadius: "8px", border: "1px dashed #e9d5ff" }}>
                        <strong style={{ fontSize: "12px", color: "#7c3aed", display: "block", marginBottom: "0.25rem" }}>🤖 Phân tích từ AI:</strong>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "12px", color: "#5b21b6", lineHeight: "1.4" }}>
                          {aiResult.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {!aiResult && scores && (
                    <div className={styles.scoreDetailsGrid}>
                      <div className={styles.scoreDetailMini}>
                        <span>Trình độ:</span>
                        <strong>{Math.round(scores.skillScore || 0)}%</strong>
                      </div>
                      <div className={styles.scoreDetailMini}>
                        <span>Vai trò:</span>
                        <strong>{Math.round(scores.roleScore || 0)}%</strong>
                      </div>
                      <div className={styles.scoreDetailMini}>
                        <span>Lịch rảnh:</span>
                        <strong>{Math.round(scores.scheduleScore || 0)}%</strong>
                      </div>
                      <div className={styles.scoreDetailMini}>
                        <span>Kinh nghiệm:</span>
                        <strong>{Math.round(scores.experienceScore || 0)}%</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className={styles.primaryBtn}
                    style={{ width: "100%", background: aiResult ? "#6d28d9" : undefined }}
                  >
                    Ghép cặp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPlayer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Gửi lời mời ghép cặp</h4>
              <button className={styles.closeBtn} onClick={() => setSelectedPlayer(null)}>×</button>
            </div>
            <form onSubmit={handleSendInvitation}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Gửi tới:</label>
                <input
                  type="text"
                  value={selectedPlayer.FullName}
                  disabled
                  className={styles.input}
                  style={{ backgroundColor: "#f8fafc" }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Lời nhắn mời chơi:</label>
                <textarea
                  value={inviteMsg}
                  onChange={(e) => setInviteMsg(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className={styles.secondaryBtn}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className={styles.primaryBtn}
                >
                  {sendingInvite ? "Đang gửi..." : "Gửi lời mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
