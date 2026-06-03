"use client";

import React, { useState, useEffect } from "react";
import * as api from "@/services/matchingApi";
import styles from "./MatchingLayout.module.css";

interface OpponentsTabProps {
  token: string;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function OpponentsTab({ token, showToast }: OpponentsTabProps) {
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
          <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "1rem" }}>
            Nhóm đối thủ được đề xuất
          </h4>

          {loadingOpponents ? (
            <div className={styles.loadingInner}>Đang tìm kiếm nhóm đối thủ phù hợp...</div>
          ) : opponents.length === 0 ? (
            <div className={styles.emptyState}>Không tìm thấy nhóm đối thủ nào phù hợp có trình độ tương đương với nhóm của bạn.</div>
          ) : (
            <div className={styles.gridList}>
              {opponents.map((item) => {
                const opponent = item.group || {};
                const hasScore = typeof item.opponentScore !== "undefined";
                const scoreVal = hasScore ? Math.round(item.opponentScore) : null;

                return (
                  <div className={styles.card} key={opponent.GroupID}>
                    <div>
                      <div className={styles.cardHeader}>
                        <div>
                          <h4 className={styles.cardName}>{opponent.GroupName}</h4>
                          <span className={styles.cardTag} style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                            Đại diện: {opponent.CreatorName || opponent.CreatorEmail || "Ẩn danh"}
                          </span>
                        </div>
                        {hasScore && (
                          <div className={styles.scoreBadge} style={{ borderColor: "#fca5a5" }}>
                            <span className={styles.scoreVal} style={{ color: "#dc2626" }}>{scoreVal}%</span>
                            <span className={styles.scoreText} style={{ color: "#7f1d1d" }}>Match</span>
                          </div>
                        )}
                      </div>

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
                  <input
                    type="time"
                    value={challengeStartTime}
                    onChange={(e) => setChallengeStartTime(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={challengeEndTime}
                    onChange={(e) => setChallengeEndTime(e.target.value)}
                    className={styles.input}
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
