"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services/apiClient";
import { createWalkInBooking } from "@/services/bookingApi";
import { getCourts, getCourtSlots } from "@/services/courtApi";
import type { CourtSlot } from "@/services/courtApi";
import type { Court } from "@/types/court";
import type { ApiResponse } from "@/types/api";
import { getToken, getUser } from "@/utils/authStorage";
import { formatCurrency } from "@/utils/formatCurrency";
import { isValidPhone } from "@/utils/validators";
import styles from "./WalkInBooking.module.css";

type PaymentMethod = "Cash" | "BankTransfer";
type CustomerMode = "guest" | "account";

type SearchUserRow = {
  UserID: number;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
};

function todayVN() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

function formatTime(time: string) {
  if (!time) return "";
  if (time.includes("T")) return time.split("T")[1].slice(0, 5);
  return time.slice(0, 5);
}

function getPaymentMethodLabel(method: PaymentMethod) {
  return method === "Cash" ? "tiền mặt" : "chuyển khoản trực tiếp";
}

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function WalkInBookingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("Nhân viên");

  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [courtId, setCourtId] = useState<number | "">("");
  const [bookingDate, setBookingDate] = useState(todayVN);
  const [slotId, setSlotId] = useState<number | "">("");

  const [customerMode, setCustomerMode] = useState<CustomerMode>("guest");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<SearchUserRow[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastBookedTotal, setLastBookedTotal] = useState<number | null>(null);

  useEffect(() => {
    const t = getToken();
    const u = getUser();
    const role = String(u?.RoleName || u?.role || u?.roles?.[0] || "").toLowerCase();

    if (!t || (!role.includes("staff") && !role.includes("admin") && !role.includes("manager"))) {
      router.push("/login");
      return;
    }

    setToken(t);
    setStaffName(u?.FullName || u?.fullName || "Nhân viên");
  }, [router]);

  useEffect(() => {
    async function loadCourts() {
      try {
        setLoading(true);
        setCourts(await getCourts());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách sân.");
      } finally {
        setLoading(false);
      }
    }

    loadCourts();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!courtId || !bookingDate) {
        setSlots([]);
        setSlotId("");
        setLastBookedTotal(null);
        return;
      }

      try {
        setError("");
        const result = await getCourtSlots(Number(courtId), bookingDate);
        setSlots(result.filter((slot) => slot.Status === "Available"));
        setSlotId("");
        setLastBookedTotal(null);
      } catch (err) {
        setSlots([]);
        setError(err instanceof Error ? err.message : "Không thể tải khung giờ.");
      }
    }

    loadSlots();
  }, [courtId, bookingDate]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.SlotID === Number(slotId)),
    [slots, slotId]
  );

  async function searchCustomer() {
    if (!token || !keyword.trim()) return;
    setSearching(true);
    setError("");

    try {
      const res = await apiClient<ApiResponse<SearchUserRow[]>>(
        `/api/admin/users/search?keyword=${encodeURIComponent(keyword.trim())}`,
        { token }
      );
      setCustomers(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tìm được khách hàng.");
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    if (!token || !selectedSlot) return;

    setError("");
    setSuccess("");

    if (customerMode === "account" && !customerId) {
      setError("Vui lòng chọn khách hàng có tài khoản.");
      return;
    }

    if (customerMode === "guest" && (!guestName.trim() || !guestPhone.trim())) {
      setError("Vui lòng nhập tên và số điện thoại khách vãng lai.");
      return;
    }

    try {
      if (customerMode === "guest" && !isValidPhone(guestPhone.trim())) {
        setError("Số điện thoại khách vãng lai phải gồm đúng 10 chữ số.");
        return;
      }

      setSubmitting(true);
      const booking = await createWalkInBooking(token, {
        courtId: Number(courtId),
        bookingDate,
        startTime: formatTime(selectedSlot.StartTime),
        endTime: formatTime(selectedSlot.EndTime),
        customerId: customerMode === "account" ? Number(customerId) : undefined,
        guestName: customerMode === "guest" ? guestName.trim() : undefined,
        guestPhone: customerMode === "guest" ? guestPhone.trim() : undefined,
        paymentMethod,
      });

      setSuccess(
        `Đã đặt lịch thành công. Mã booking: ${booking.BookingCode}. Đã ghi nhận thanh toán bằng ${getPaymentMethodLabel(paymentMethod)}.`
      );
      setLastBookedTotal(Number(selectedSlot.Price));
      setSlotId("");
      setGuestName("");
      setGuestPhone("");
      setCustomerId("");
      setKeyword("");
      setCustomers([]);
      setSlots((current) => current.filter((slot) => slot.SlotID !== selectedSlot.SlotID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo booking tại quầy thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  const userInitials = staffName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "NV";

  return (
    <div className={styles.wrapper}>
      {/* ── Sticky Top Header Bar ── */}
      <header className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.breadcrumbs}>
            <span>Nhân viên</span>
            <span className={styles.chevron}>/</span>
            <span className={styles.currentCrumb}>Đặt sân trực tiếp</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Refresh button */}
          <button className={styles.btnIcon} onClick={() => window.location.reload()} title="Làm mới trang">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* User Round Initials Avatar */}
          <div className={styles.avatar} title={staffName}>
            {userInitials}
          </div>
        </div>
      </header>

      {/* ── Scrollable Content Area ── */}
      <div className={styles.contentArea}>
        <div className={styles.page}>
          <div className={styles.header}>
            <div>
              <h1>Đặt sân trực tiếp</h1>
              <p>Hỗ trợ Staff tạo booking tại quầy cho khách vãng lai hoặc khách đã có tài khoản.</p>
            </div>
            <div className={styles.staffBox}>
              <span>Nhân viên thực hiện</span>
              <strong>{staffName}</strong>
            </div>
          </div>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <h2>Thông tin sân</h2>
              <div className={styles.formGrid}>
                <label>
                  Ngày
                  <input type="date" value={bookingDate} min={todayVN()} onChange={(e) => setBookingDate(e.target.value)} />
                </label>
                <label>
                  Sân
                  <select value={courtId} onChange={(e) => setCourtId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Chọn sân</option>
                    {courts.map((court) => (
                      <option key={court.CourtID} value={court.CourtID}>
                        {court.CourtName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.full}>
                  Khung giờ còn trống
                  <select
                    value={slotId}
                    onChange={(e) => {
                      setSlotId(e.target.value ? Number(e.target.value) : "");
                      setLastBookedTotal(null);
                    }}
                    disabled={!courtId || loading}
                  >
                    <option value="">Chọn khung giờ</option>
                    {slots.map((slot) => (
                      <option key={slot.SlotID} value={slot.SlotID}>
                        {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)} · {formatCurrency(Number(slot.Price))}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={styles.panel}>
              <h2>Thông tin khách</h2>
              <div className={styles.segmented}>
                <button className={customerMode === "guest" ? styles.active : ""} onClick={() => setCustomerMode("guest")} type="button">
                  Khách vãng lai
                </button>
                <button className={customerMode === "account" ? styles.active : ""} onClick={() => setCustomerMode("account")} type="button">
                  Khách có tài khoản
                </button>
              </div>

              {customerMode === "guest" ? (
                <div className={styles.formGrid}>
                  <label>
                    Tên khách
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A" />
                  </label>
                  <label>
                    Số điện thoại
                    <input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(normalizePhoneInput(e.target.value))}
                      placeholder="0901234567"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.customerSearch}>
                  <div className={styles.searchLine}>
                    <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Nhập SĐT hoặc email" />
                    <button type="button" onClick={searchCustomer} disabled={searching || !keyword.trim()}>
                      {searching ? "Đang tìm" : "Tìm"}
                    </button>
                  </div>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">Chọn khách hàng</option>
                    {customers.map((customer) => (
                      <option key={customer.UserID} value={customer.UserID}>
                        {customer.FullName} · {customer.PhoneNumber || customer.Email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            <section className={`${styles.panel} ${styles.summary}`}>
              <h2>Thanh toán tại quầy</h2>
              <div className={styles.payments}>
                <label className={paymentMethod === "Cash" ? styles.payActive : ""}>
                  <input type="radio" checked={paymentMethod === "Cash"} onChange={() => setPaymentMethod("Cash")} />
                  Tiền mặt
                </label>
                <label className={paymentMethod === "BankTransfer" ? styles.payActive : ""}>
                  <input type="radio" checked={paymentMethod === "BankTransfer"} onChange={() => setPaymentMethod("BankTransfer")} />
                  Chuyển khoản trực tiếp
                </label>
              </div>

              <div className={styles.totalBox}>
                <span>Tổng tiền</span>
                <strong>
                  {selectedSlot
                    ? formatCurrency(Number(selectedSlot.Price))
                    : lastBookedTotal !== null
                      ? formatCurrency(lastBookedTotal)
                      : "Chưa chọn giờ"}
                </strong>
              </div>

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <button className={styles.submit} onClick={submit} disabled={submitting || !selectedSlot}>
                {submitting ? "Đang tạo booking..." : "Tạo booking tại quầy"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
