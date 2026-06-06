"use client";

import React, { useState, useEffect } from "react";
import * as api from "@/services/matchingApi";
import styles from "./MatchingLayout.module.css";

interface GroupsTabProps {
  token: string;
  userProfile: api.PlayerProfile | null;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export default function GroupsTab({ token, userProfile, showToast }: GroupsTabProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<api.PlayGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<api.PlayGroup | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for Edit Group
  const [editForm, setEditForm] = useState({
    groupName: "",
    skillLevel: "Intermediate",
    averageExperience: 1,
    description: "",
    status: "Open",
  });

  // Form states for Create Group
  const [createForm, setCreateForm] = useState({
    groupName: "",
    skillLevel: "Intermediate",
    description: "",
  });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getUserGroups(token);
      setGroups(data || []);
    } catch (err: any) {
      showToast(err.message || "Không thể tải danh sách nhóm chơi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [token]);

  const handleOpenEdit = (group: api.PlayGroup) => {
    setEditingGroup(group);
    setEditForm({
      groupName: group.GroupName || "",
      skillLevel: group.SkillLevel || "Intermediate",
      averageExperience: group.AverageExperience || 1,
      description: group.Description || "",
      status: group.Status || "Open",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      await api.updateGroup(token, editingGroup.GroupID, {
        groupName: editForm.groupName,
        skillLevel: editForm.skillLevel,
        averageExperience: Number(editForm.averageExperience),
        description: editForm.description,
        status: editForm.status,
      });

      // Update state locally for instant UI update
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.GroupID === editingGroup.GroupID
            ? {
                ...g,
                Status: editForm.status,
                GroupName: editForm.groupName,
                SkillLevel: editForm.skillLevel,
                AverageExperience: Number(editForm.averageExperience),
                Description: editForm.description,
              }
            : g
        )
      );

      showToast("Cập nhật thông tin nhóm thành công!");
      setEditingGroup(null);
      loadGroups();
    } catch (err: any) {
      showToast(err.message || "Cập nhật nhóm thất bại", "error");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGroup(token, {
        groupName: createForm.groupName,
        skillLevel: createForm.skillLevel,
        description: createForm.description,
      });
      showToast("Tạo nhóm chơi bóng thành công!");
      setShowCreateModal(false);
      setCreateForm({ groupName: "", skillLevel: "Intermediate", description: "" });
      loadGroups();
    } catch (err: any) {
      showToast(err.message || "Tạo nhóm thất bại", "error");
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?")) return;
    try {
      await api.leaveGroup(token, groupId);
      showToast("Rời nhóm thành công!");
      loadGroups();
    } catch (err: any) {
      showToast(err.message || "Rời nhóm chơi thất bại", "error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>Nhóm chơi bóng</h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "0.25rem" }}>Quản lý hoặc tham gia các nhóm chơi bóng để cùng luyện tập và thi đấu.</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
          + Tạo nhóm mới
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingInner}>Đang tải danh sách nhóm chơi...</div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>Bạn chưa tham gia nhóm chơi bóng nào. Hãy tạo nhóm hoặc tham gia lời mời ghép cặp!</div>
      ) : (
        <div className={styles.gridList}>
          {groups.map((group) => {
            const isLeader = userProfile && group.CreatorID === userProfile.UserID;

            return (
              <div className={styles.card} key={group.GroupID}>
                <div>
                  <div className={styles.cardHeader}>
                    <div>
                      <h4 className={styles.cardName}>{group.GroupName}</h4>
                      <span className={styles.cardTag} style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                        Trưởng nhóm: {isLeader ? "Tôi" : (group.CreatorName || "Ẩn danh")}
                      </span>
                    </div>
                    <span
                      className={styles.cardTag}
                      style={{
                        backgroundColor: group.Status === "Open" ? "#dcfce7" : "#fee2e2",
                        color: group.Status === "Open" ? "#166534" : "#991b1b",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {group.Status === "Open" ? "Hoạt động" : "Đã đóng"}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMetaItem}>
                      <strong>Yêu cầu trình độ:</strong>
                      <span>{group.SkillLevel}</span>
                    </div>
                    <div className={styles.cardMetaItem}>
                      <strong>Kinh nghiệm trung bình:</strong>
                      <span>{group.AverageExperience || 0} năm</span>
                    </div>
                    <div className={styles.cardMetaItem}>
                      <strong>Số thành viên:</strong>
                      <span>{group.CurrentPlayers} / {group.MaxPlayers || 4}</span>
                    </div>
                    {group.Description && (
                      <div className={styles.cardMetaItem} style={{ flexDirection: "column", gap: "0.125rem", marginTop: "0.5rem" }}>
                        <strong>Mô tả nhóm:</strong>
                        <span style={{ color: "#475569", fontSize: "13px" }}>{group.Description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  {isLeader ? (
                    <button
                      onClick={() => handleOpenEdit(group)}
                      className={styles.secondaryBtn}
                      style={{ flex: 1 }}
                    >
                      ⚙️ Chỉnh sửa nhóm
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveGroup(group.GroupID)}
                      className={styles.secondaryBtn}
                      style={{ flex: 1, color: "#ef4444", borderColor: "#fecaca" }}
                    >
                      Rời nhóm
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Tạo nhóm chơi mới</h4>
              <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên nhóm:</label>
                <input
                  type="text"
                  value={createForm.groupName}
                  onChange={(e) => setCreateForm({ ...createForm, groupName: e.target.value })}
                  placeholder="Ví dụ: Team phong trào Hải Châu..."
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Trình độ nhóm:</label>
                <select
                  value={createForm.skillLevel}
                  onChange={(e) => setCreateForm({ ...createForm, skillLevel: e.target.value })}
                  className={styles.select}
                >
                  <option value="Beginner">Mới chơi (Beginner)</option>
                  <option value="Intermediate">Khá (Intermediate)</option>
                  <option value="Advanced">Giỏi (Advanced)</option>
                  <option value="Professional">Chuyên nghiệp (Professional)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mô tả nhóm:</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Mô tả phong cách chơi, địa điểm hay sinh hoạt của nhóm..."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={styles.secondaryBtn}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editingGroup && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Chỉnh sửa thông tin nhóm</h4>
              <button className={styles.closeBtn} onClick={() => setEditingGroup(null)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên nhóm:</label>
                <input
                  type="text"
                  value={editForm.groupName}
                  onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Trình độ:</label>
                <select
                  value={editForm.skillLevel}
                  onChange={(e) => setEditForm({ ...editForm, skillLevel: e.target.value })}
                  className={styles.select}
                >
                  <option value="Beginner">Mới chơi (Beginner)</option>
                  <option value="Intermediate">Khá (Intermediate)</option>
                  <option value="Advanced">Giỏi (Advanced)</option>
                  <option value="Professional">Chuyên nghiệp (Professional)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Kinh nghiệm trung bình (năm):</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.averageExperience}
                  onChange={(e) => setEditForm({ ...editForm, averageExperience: Number(e.target.value) })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Trạng thái hoạt động:</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className={styles.select}
                >
                  <option value="Open">Hoạt động (Open)</option>
                  <option value="Closed">Đã đóng (Closed)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mô tả nhóm:</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className={styles.secondaryBtn}
                >
                  Hủy
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
