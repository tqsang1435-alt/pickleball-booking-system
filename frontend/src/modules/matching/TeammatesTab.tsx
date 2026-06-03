"use client";

import React, { useState, useEffect } from "react";
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

  if (!hasCompleteProfile) {
    return (
      <div className={styles.alertWarning}>
        <strong>⚠️ Yêu cầu thông tin:</strong> Vui lòng cập nhật và hoàn thiện thời gian rảnh (giờ bắt đầu và kết thúc) của bạn trong tab <strong>Hồ sơ chơi bóng</strong> trước khi tìm đồng đội.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>Tìm kiếm đồng đội</h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "0.25rem" }}>Đề xuất những người chơi phù hợp dựa trên trình độ, giờ rảnh và vị trí địa lý của bạn.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingInner}>Đang tìm kiếm đồng đội phù hợp...</div>
      ) : teammates.length === 0 ? (
        <div className={styles.emptyState}>Không tìm thấy đồng đội nào phù hợp trong khung giờ rảnh của bạn hiện tại.</div>
      ) : (
        <div className={styles.gridList}>
          {teammates.map((item) => {
            const player = item.profile || {};
            const hasScore = typeof item.matchingScore !== "undefined";
            const scoreVal = hasScore ? Math.round(item.matchingScore) : null;
            const scores = item.scores || {};
            
            return (
              <div className={styles.card} key={player.PlayerProfileID}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatarWrap}>
                      {player.AvatarURL ? (
                        <img src={player.AvatarURL} alt={player.FullName} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {player.FullName ? player.FullName.charAt(0).toUpperCase() : "P"}
                        </div>
                      )}
                      <div>
                        <h4 className={styles.cardName}>{player.FullName}</h4>
                        <span className={styles.cardTag}>{player.PlayingRole}</span>
                      </div>
                    </div>
                    {hasScore && (
                      <div className={styles.scoreBadge}>
                        <span className={styles.scoreVal}>{scoreVal}%</span>
                        <span className={styles.scoreText}>Match</span>
                      </div>
                    )}
                  </div>

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
                  </div>

                  {scores && (
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
                    style={{ width: "100%" }}
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
