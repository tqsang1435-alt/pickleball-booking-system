"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPromotionDetail, getPromotionUsers, revokeUserPromotion, updatePromotionStatus } from "@/services/promotionApi";
import type { AdminPromotion, PromotionUser } from "@/types/promotion";
import { getToken } from "@/utils/authStorage";
import PromotionStatusBadge from "@/modules/promotions/components/PromotionStatusBadge";

export default function AdminPromotionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [promo, setPromo] = useState<AdminPromotion | null>(null);
  const [users, setUsers] = useState<PromotionUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const p = await getPromotionDetail(token, Number(id));
      setPromo(p);
      if (p.ApplyScope === "Private") {
        const u = await getPromotionUsers(token, Number(id));
        setUsers(u);
      }
    } catch (err: any) {
      alert(err.message || "Lỗi tải dữ liệu");
      router.push("/admin/promotions");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRevoke(userId: number) {
    if (!confirm("Thu hồi voucher của user này?")) return;
    try {
      await revokeUserPromotion(getToken()!, Number(id), userId);
      loadData();
    } catch (err: any) {
      alert(err.message || "Không thể thu hồi");
    }
  }

  async function handleToggleStatus() {
    if (!promo) return;
    if (!confirm(`Đổi trạng thái voucher?`)) return;
    const newStatus = promo.Status === "Active" ? "Inactive" : "Active";
    try {
      await updatePromotionStatus(getToken()!, promo.PromotionID, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật");
    }
  }

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải...</div>;
  if (!promo) return null;

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", marginBottom: "1rem" }}>
        ← Quay lại
      </button>

      <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ margin: 0, color: "#4c1d95" }}>{promo.PromotionName}</h2>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#7c3aed", marginTop: "0.25rem" }}>
              {promo.PromotionCode}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <PromotionStatusBadge status={promo.Status} />
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={handleToggleStatus} style={{ background: "white", border: "1px solid #d1d5db", padding: "4px 12px", borderRadius: "6px", cursor: "pointer" }}>
                {promo.Status === "Active" ? "Tạm dừng" : "Kích hoạt"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Mức giảm</div>
            <div style={{ fontWeight: 600 }}>{promo.DiscountType === "Percent" ? `${promo.DiscountValue}%` : `${promo.DiscountValue.toLocaleString()}đ`}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Giảm tối đa</div>
            <div style={{ fontWeight: 600 }}>{promo.MaxDiscountAmount ? `${promo.MaxDiscountAmount.toLocaleString()}đ` : "Không giới hạn"}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Đơn tối thiểu</div>
            <div style={{ fontWeight: 600 }}>{promo.MinOrderAmount.toLocaleString()}đ</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Phạm vi</div>
            <div style={{ fontWeight: 600 }}>{promo.ApplyScope}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Lượt dùng</div>
            <div style={{ fontWeight: 600 }}>{promo.UsedCount} / {promo.UsageLimit || "∞"}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Lượt/User</div>
            <div style={{ fontWeight: 600 }}>{promo.PerUserLimit}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Từ ngày</div>
            <div style={{ fontWeight: 600 }}>{new Date(promo.StartDate).toLocaleDateString("vi-VN")}</div>
          </div>
          <div>
            <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Đến ngày</div>
            <div style={{ fontWeight: 600 }}>{new Date(promo.EndDate).toLocaleDateString("vi-VN")}</div>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
          <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Mô tả</div>
          <div>{promo.Description || "Không có"}</div>
        </div>
      </div>

      {/* Users List for Private */}
      {promo.ApplyScope === "Private" && (
        <div style={{ marginTop: "2rem", background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "1rem" }}>Người dùng được gán ({users.length})</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Tên</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Trạng thái</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Đã dùng lúc</th>
                <th style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.UserPromotionID}>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{u.FullName}<br/><span style={{fontSize:"0.8rem", color:"#6b7280"}}>{u.Email}</span></td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{u.Status}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>{u.UsedAt ? new Date(u.UsedAt).toLocaleString("vi-VN") : "-"}</td>
                  <td style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                    {u.Status === "Assigned" && (
                      <button onClick={() => handleRevoke(u.UserID)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Thu hồi</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} style={{ padding: "1rem", textAlign: "center" }}>Chưa gán user nào</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
