// ============================================================
// coaches.buffer.ts — Shared Buffer Time Logic (05:00–23:00)
// ============================================================
//
// BUSINESS RULE:
//   Coach phải có ít nhất 15 phút nghỉ giữa hai buổi dạy khác nhau.
//   Vì các slot là nguyên giờ (1h), buffer 15 phút → block thêm 1 giờ
//   liền kề mỗi booking (giờ ngay sau và giờ ngay trước).
//
// BUFFER FORMULA (hour-granularity):
//   Booking active [startH, endH):
//     - Occupied: giờ trong [startH, endH)
//     - Buffer after:  giờ endH (nếu endH < 23)   — slot [endH:00, endH+1:00) bắt đầu trước endH+0:15
//     - Buffer before: giờ startH-1 (nếu startH-1 >= 5) — slot [startH-1:00, startH:00) kết thúc sau startH-0:15
//
// MULTI-SLOT BOOKING (cùng BookingID với StartTime=08:00, EndTime=10:00):
//   - Giờ 8 và 9 là OCCUPIED (bên trong range booking)
//   - Giờ 10 là BUFFER_AFTER (ngoài range, liền sau)
//   - Giờ 7 là BUFFER_BEFORE (ngoài range, liền trước)
//   - Giờ 9 KHÔNG phải buffer conflict nội bộ — nó là occupied
//
// ACTIVE STATUSES (theo init.sql schema):
//   Bookings.Status IN ('PendingPayment', 'Paid', 'Confirmed')
//   — xem C. Timeout evidence: Booking → Cancelled khi payment expire (expirePaymentAndCancelBooking)
// ============================================================

export const ACTIVE_BOOKING_STATUSES = ['PendingPayment', 'Paid', 'Confirmed'] as const;

export interface BookingSlot {
  Status: string;
  BookingDate: Date | string;
  StartTime: string; // "HH:MM"
  EndTime: string;   // "HH:MM"
}

export interface OccupiedResult {
  /** Tập hợp các giờ bị block (cả occupied lẫn buffer) — không được dùng làm startTime */
  blockedHours: Set<number>;
  /** Chỉ các giờ occupied (nằm trong range booking) */
  occupiedHours: Set<number>;
  /** Chỉ các giờ bị block do buffer (ngoài range booking) */
  bufferHours: Set<number>;
}

/**
 * Tính toán tập giờ bị block bởi active bookings trên một ngày cụ thể.
 *
 * @param bookings - danh sách booking của coach (toàn bộ, chưa filter)
 * @param date     - ngày cần tính, dạng "YYYY-MM-DD"
 * @returns OccupiedResult
 */
export function calcBookingBlockedHours(
  bookings: BookingSlot[],
  date: string
): OccupiedResult {
  const occupiedHours = new Set<number>();
  const bufferHours   = new Set<number>();

  for (const b of bookings) {
    // Chỉ tính active statuses
    if (!(ACTIVE_BOOKING_STATUSES as readonly string[]).includes(b.Status)) continue;

    // Normalize date
    const bDate = b.BookingDate instanceof Date
      ? b.BookingDate.toISOString().split('T')[0]
      : String(b.BookingDate).split('T')[0];

    if (bDate !== date) continue;

    const bookingStartH = parseInt(b.StartTime.split(':')[0], 10);
    const bookingEndH   = parseInt(b.EndTime.split(':')[0], 10);

    // 1. Mark occupied: [bookingStartH, bookingEndH)
    for (let hr = bookingStartH; hr < bookingEndH; hr++) {
      occupiedHours.add(hr);
    }

    // 2. Buffer AFTER: giờ ngay sau bookingEnd (nếu trong giờ hoạt động)
    //    Slot [bookingEndH, bookingEndH+1) bắt đầu tại bookingEnd:00 < bookingEnd:15 → bị block
    if (bookingEndH < 23) {
      bufferHours.add(bookingEndH);
    }

    // 3. Buffer BEFORE: giờ ngay trước bookingStart (nếu trong giờ hoạt động)
    //    Slot [bookingStartH-1, bookingStartH) kết thúc tại bookingStart:00 > bookingStart-0:15 → bị block
    if (bookingStartH > 5) {
      bufferHours.add(bookingStartH - 1);
    }
  }

  // blockedHours = occupied ∪ buffer (buffer có thể trùng với occupied trong edge cases)
  const blockedHours = new Set([...occupiedHours, ...bufferHours]);

  return { blockedHours, occupiedHours, bufferHours };
}

/**
 * Kiểm tra xem một range [requestStartH, requestEndH) có vi phạm buffer của active bookings không.
 *
 * Dùng trong createMySchedule để validate toàn bộ range được request, không chỉ startTime đầu tiên.
 *
 * @param bookings    - danh sách booking của coach
 * @param date        - ngày tạo lịch
 * @param startH      - giờ bắt đầu request (integer)
 * @param endH        - giờ kết thúc request (integer, exclusive)
 * @returns string | null — thông báo lỗi nếu vi phạm, null nếu ok
 */
export function checkBufferConflict(
  bookings: BookingSlot[],
  date: string,
  startH: number,
  endH: number
): string | null {
  const { blockedHours } = calcBookingBlockedHours(bookings, date);

  // Kiểm tra toàn bộ range [startH, endH)
  for (let hr = startH; hr < endH; hr++) {
    if (blockedHours.has(hr)) {
      // Phân loại lỗi để thông báo rõ hơn
      const { occupiedHours, bufferHours } = calcBookingBlockedHours(bookings, date);
      if (occupiedHours.has(hr)) {
        return `Giờ ${String(hr).padStart(2, '0')}:00 đã có booking active — không thể tạo lịch trùng`;
      }
      if (bufferHours.has(hr)) {
        return `Giờ ${String(hr).padStart(2, '0')}:00 vi phạm buffer 15 phút với booking active liền kề`;
      }
    }
  }
  return null;
}
