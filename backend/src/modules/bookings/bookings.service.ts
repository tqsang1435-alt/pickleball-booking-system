import { requestRefund } from "@/modules/refunds/refunds.service";
import { createNotification } from "@/modules/notifications/notifications.service";
import { CreateCourtBookingInput, CreateCoachBookingInput, CreateComboBookingInput, CancelBookingInput, CancelBookingResult, CheckInInput, CheckInResult } from "./bookings.type";
import { findUserById, findCourtByIdForBooking, findCoachByIdForBooking, findAvailableCourtSlot, findAvailableCoachSchedule, findBookingWithPaymentById, repoCreateCourtBooking, repoCreateCoachBooking, repoCreateComboBooking, repoCancelBookingById, repoCheckInBookingById, repoMockPayBooking, repoReleaseExpiredHoldings, repoAutoCheckInExpired, repoMarkCompletedExpiredCheckins, findBookingsByUserId, findBookingsByCoachUserId, findBookingById, findDailyBookingsForStaff, repoCreateTeamBooking } from "./bookings.repository";
import { calculateHours, validateBookingDate, validateHoldingLimit, validateCoachFeePerHour } from "./bookings.validation";
import { isScheduleExpired } from "../coaches/coaches.validation";
import { sendBookingCreatedEmail, sendPaymentSuccessEmail, sendCoachAssignedEmail, sendNoShowEmail, sendPaymentExpiredEmail } from "@/utils/mail";

// ---- Create Bookings ----

/**
 * UC-13: Dat san Court.
 * BR-22: requireAuth (xu ly o controller).
 * BR-23: validateBookingDate.
 * BR-40: max 3 Holding.
 * BR-25/27/28: xu ly trong repository (transaction SERIALIZABLE, HoldUntil).
 */
export async function createCourtBooking(input: CreateCourtBookingInput) {
  // BR-23 + Real-time check
  validateBookingDate(input.bookingDate, input.startTime);

  // BR-22 (userId da duoc lay tu JWT o controller)
  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  // BR-40
  await validateHoldingLimit(input.userId);

  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;

  // BR-24/27: tim slot kha dung
  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio nay da bi dat hoac khong co slot phu hop");

  // BR-39: Khong cho dat vao slot da Cancelled (xu ly bang Status check o DB)
  const result = await repoCreateCourtBooking({
    userId: input.userId,
    courtId: input.courtId,
    slotId: slot.SlotID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
  });

  if (result && result.BookingID) {
    try {
      void createNotification({
        userId: input.userId,
        title: "Booking đã được tạo",
        message: "Booking của bạn đã được tạo và đang chờ thanh toán.",
        notificationType: "Booking",
      });

      void sendBookingCreatedEmail(user.Email, {
        playerName: user.FullName,
        bookingCode: result.BookingCode,
        bookingType: "Sân (Court)",
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        courtName: court.CourtName,
      });
    } catch (err) {
      console.warn("Error sending booking created email/notification:", err);
    }
  }

  return result;
}

/**
 * UC-13 mo rong: Dat Coach.
 * BR-41: Coach phai Approved.
 * BR-42/43: Coach fee trong khoang hop le.
 * BR-44/46: xu ly trong repository (Available + buffer 15 phut).
 */
export async function createCoachBooking(input: CreateCoachBookingInput) {
  validateBookingDate(input.bookingDate, input.startTime);

  if (isScheduleExpired(input.bookingDate, input.endTime)) {
    throw new Error("Khung giờ này đã kết thúc, không thể đặt lịch.");
  }

  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  await validateHoldingLimit(input.userId);

  const coach = await findCoachByIdForBooking(input.coachId);
  if (!coach) throw new Error("HLV khong ton tai");
  if (coach.Status !== "Approved") throw new Error("HLV chua duoc duyet (BR-41)");

  // BR-42/43
  validateCoachFeePerHour(Number(coach.HourlyRate));

  const hours = calculateHours(input.startTime, input.endTime);
  const coachFee = Number(coach.HourlyRate) * hours;

  // BR-44/46: findAvailableCoachSchedule da kiem tra buffer 15 phut
  const coachSchedule = await findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!coachSchedule) {
    throw new Error("HLV khong co lich trong khung gio nay hoac vi pham buffer 15 phut (BR-46)");
  }

  const result = await repoCreateCoachBooking({
    userId: input.userId,
    coachId: input.coachId,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    coachFee,
  });

  if (result && result.BookingID) {
    try {
      void createNotification({
        userId: input.userId,
        title: "Booking đã được tạo",
        message: "Booking của bạn đã được tạo và đang chờ thanh toán.",
        notificationType: "Booking",
      });

      const coachName = coach && coach.UserID ? (await findUserById(coach.UserID))?.FullName || "HLV" : "HLV";

      void sendBookingCreatedEmail(user.Email, {
        playerName: user.FullName,
        bookingCode: result.BookingCode,
        bookingType: "HLV (Coach)",
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        coachName: coachName,
      });
    } catch (err) {
      console.warn("Error sending coach booking created email/notification:", err);
    }
  }

  return result;
}

/**
 * UC-15: Dat Combo (San + HLV cung giao dich - BR-28 atomic).
 */
export async function createComboBooking(input: CreateComboBookingInput) {
  validateBookingDate(input.bookingDate, input.startTime);

  if (isScheduleExpired(input.bookingDate, input.endTime)) {
    throw new Error("Khung giờ này đã kết thúc, không thể đặt lịch.");
  }

  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  await validateHoldingLimit(input.userId);

  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  const coach = await findCoachByIdForBooking(input.coachId);
  if (!coach) throw new Error("HLV khong ton tai");
  if (coach.Status !== "Approved") throw new Error("HLV chua duoc duyet (BR-41)");

  // BR-42/43
  validateCoachFeePerHour(Number(coach.HourlyRate));

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;
  const coachFee = Number(coach.HourlyRate) * hours;

  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio san da bi dat");

  // BR-46
  const coachSchedule = await findAvailableCoachSchedule(
    input.coachId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!coachSchedule) {
    throw new Error("HLV khong co lich trong khung gio nay hoac vi pham buffer 15 phut (BR-46)");
  }

  const result = await repoCreateComboBooking({
    userId: input.userId,
    courtId: input.courtId,
    coachId: input.coachId,
    slotId: slot.SlotID,
    coachScheduleId: coachSchedule.CoachScheduleID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
    coachFee,
  });

  if (result && result.BookingID) {
    try {
      void createNotification({
        userId: input.userId,
        title: "Booking đã được tạo",
        message: "Booking của bạn đã được tạo và đang chờ thanh toán.",
        notificationType: "Booking",
      });

      const coachName = coach && coach.UserID ? (await findUserById(coach.UserID))?.FullName || "HLV" : "HLV";

      void sendBookingCreatedEmail(user.Email, {
        playerName: user.FullName,
        bookingCode: result.BookingCode,
        bookingType: "Combo (Sân + HLV)",
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        courtName: court.CourtName,
        coachName: coachName,
      });
    } catch (err) {
      console.warn("Error sending combo booking created email/notification:", err);
    }
  }

  return result;
}

// ---- Cancel Booking (UC-17) ----

/**
 * UC-17: Huy booking.
 * BR-NEW-01: Chi cancel khi Status = PendingPayment hoac Confirmed.
 * BR-NEW-02: Chi chu booking hoac Admin/Staff duoc cancel.
 * BR-33: Huy >= 12 gio truoc → refund 100%.
 * BR-34: Huy < 12 gio va >= 2 gio → refund 70%.
 * BR-35: Huy < 2 gio → khong refund.
 * BR-NEW-03: Release slot/schedule ve Available.
 */
export async function cancelBooking(
  input: CancelBookingInput
): Promise<CancelBookingResult> {
  const booking = await findBookingWithPaymentById(input.bookingId);

  if (!booking) {
    throw new Error("Booking khong ton tai");
  }

  // BR-NEW-02: Kiem tra quyen cancel
  const isOwner = booking.UserID === input.userId;
  const isAdminOrStaff = input.userRoles.some((r) =>
    ["Admin", "Staff"].includes(r)
  );
  if (!isOwner && !isAdminOrStaff) {
    throw new Error("Ban khong co quyen huy booking nay (BR-NEW-02)");
  }

  // BR-NEW-01: Chi cancel khi dang PendingPayment hoac Confirmed
  if (!["PendingPayment", "Confirmed"].includes(booking.Status)) {
    throw new Error(
      `Khong the huy booking co trang thai ${booking.Status}. Chi huy duoc khi dang cho thanh toan hoac da xac nhan (BR-NEW-01)`
    );
  }

  // Tinh thoi gian den khi bat dau choi
  const bookingStartDateTime = new Date(
    `${booking.BookingDate.toString().split("T")[0]}T${booking.StartTime}:00`
  );
  const now = new Date();
  const hoursUntilStart = (bookingStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Tinh refund
  let refundPercent = 0;
  let refundNote = "";

  if (hoursUntilStart >= 12) {
    // BR-33: Huy truoc 12 gio → refund 100%
    refundPercent = 100;
    refundNote = "Huy truoc 12 gio - hoan 100% (BR-33)";
  } else if (hoursUntilStart >= 2) {
    // BR-34: Huy trong 2-12 gio → refund 70%
    refundPercent = 70;
    refundNote = "Huy trong 2-12 gio - hoan 70%, tru 30% phi (BR-34)";
  } else {
    // BR-35: Huy trong 2 gio → khong refund
    refundPercent = 0;
    refundNote = "Huy trong vong 2 gio - khong duoc hoan tien (BR-35)";
  }

  const totalAmount = Number(booking.TotalAmount);
  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const cancelReason = input.cancelReason ?? `Huy boi nguoi dung. ${refundNote}`;

  // BR-NEW-03: Cancel va release slot/schedule trong transaction
  await repoCancelBookingById(input.bookingId, cancelReason);

  // BR-36: Tao refund record (se xu ly trong 7 ngay lam viec - BR-37)
  const refundRecord = await requestRefund(
    input.bookingId,
    refundAmount,
    refundNote
  );

  // Gui notification cho user (BR-54 phan Player)
  void createNotification({
    userId: input.userId,
    title: "Booking da bi huy",
    message: `Booking #${booking.BookingCode} da bi huy. ${refundNote}`,
    notificationType: "Booking",
  });

  return {
    bookingId: input.bookingId,
    status: "Cancelled",
    refundAmount,
    refundPercent,
    refundNote,
    refundRecord,
  };
}

/**
 * BR-54: Coach chu dong huy booking Confirmed.
 * Player duoc hoan 100% trong 24 gio, gui notification ngay.
 */
export async function cancelBookingByCoach(
  bookingId: number,
  coachUserId: number
): Promise<CancelBookingResult> {
  const booking = await findBookingWithPaymentById(bookingId);

  if (!booking) throw new Error("Booking khong ton tai");
  if (booking.Status !== "Confirmed") {
    throw new Error("Chi co the huy booking o trang thai Confirmed (BR-54)");
  }

  const cancelReason =
    "HLV chu dong huy - hoan 100% trong 24 gio (BR-54)";

  await repoCancelBookingById(bookingId, cancelReason);

  const totalAmount = Number(booking.TotalAmount);

  // BR-54: Hoan 100%
  const refundRecord = await requestRefund(bookingId, totalAmount, cancelReason);

  // BR-54: Gui notification cho Player ngay lap tuc
  void createNotification({
    userId: booking.UserID,
    title: "HLV da huy lich day",
    message: `HLV da huy lich day cho booking #${booking.BookingCode}. Ban se duoc hoan 100% so tien (${totalAmount.toLocaleString("vi-VN")} VND) trong 24 gio.`,
    notificationType: "Booking",
  });

  // Gui notification cho coach
  void createNotification({
    userId: coachUserId,
    title: "Ban da huy lich day",
    message: `Ban da huy booking #${booking.BookingCode}. He thong se hoan 100% cho Player.`,
    notificationType: "Booking",
  });

  return {
    bookingId,
    status: "Cancelled",
    refundAmount: totalAmount,
    refundPercent: 100,
    refundNote: cancelReason,
    refundRecord,
  };
}

// ---- Check-in (BR-29/30) ----

/**
 * BR-29: Chi check-in khi booking da Confirmed.
 * BR-30: Thoi gian check-in hop le: tu 30 phut truoc den 15 phut sau gio bat dau.
 */
export async function checkInBooking(
  input: CheckInInput
): Promise<CheckInResult> {
  const booking = await findBookingById(input.bookingId);

  if (!booking) throw new Error("Booking khong ton tai");

  // Kiem tra ownership (Bo qua neu la Admin hoac Staff)
  const isAdminOrStaff = input.userRoles?.some((r) => ["Admin", "Staff"].includes(r));
  if (!isAdminOrStaff && booking.UserID !== input.userId) {
    throw new Error("Ban khong co quyen check-in booking nay");
  }

  // BR-29
  if (booking.Status !== "Confirmed") {
    throw new Error(
      `Chi check-in duoc khi booking o trang thai Confirmed (hien tai: ${booking.Status}) (BR-29)`
    );
  }

  // Lay gio hien tai o Viet Nam
  const nowVN = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  const vnDateStr = new Date(booking.BookingDate).toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = vnDateStr.split("/");
  const dateStr = `${year}-${month}-${day}`;

  const bookingStartDateTime = new Date(`${dateStr}T${booking.StartTime}:00`);
  const bookingEndDateTime = new Date(`${dateStr}T${booking.EndTime}:00`);

  // Duoc phep check-in truoc 30 phut
  if (nowVN.getTime() < bookingStartDateTime.getTime() - 30 * 60 * 1000) {
    throw new Error("Chưa đến thời gian check-in. Bạn chỉ có thể check-in sớm nhất trước 30 phút.");
  }

  // KHONG duoc check-in sau khi gio choi da ket thuc
  if (nowVN.getTime() > bookingEndDateTime.getTime()) {
    throw new Error("Đã quá thời gian check-in. Chỉ có thể check-in trong khoảng thời gian đặt sân.");
  }

  await repoCheckInBookingById(input.bookingId);

  const checkInTime = new Date().toISOString();

  // Gui notification
  void createNotification({
    userId: input.userId,
    title: "Check-in thanh cong",
    message: `Ban da check-in thanh cong cho booking #${booking.BookingCode}. Chuc ban choi vui ve!`,
    notificationType: "Booking",
  });

  return {
    bookingId: input.bookingId,
    status: "CheckedIn",
    checkInTime,
  };
}

// ---- Mock Pay ----

/**
 * Mock thanh toan: PendingPayment → Confirmed.
 * Dev sau thay bang VNPay/Momo webhook.
 */
export async function mockPayBooking(
  bookingId: number,
  userId: number,
  paymentMethod: "VNPay" | "Momo" = "VNPay"
) {
  const booking = await findBookingById(bookingId);

  if (!booking) throw new Error("Booking khong ton tai");
  if (booking.UserID !== userId) throw new Error("Ban khong co quyen thanh toan booking nay");
  if (booking.Status !== "PendingPayment") {
    throw new Error(`Booking o trang thai ${booking.Status}, khong the thanh toan`);
  }

  const deadline = new Date(calculatePaymentDeadline(booking.CreatedAt, booking.BookingDate, booking.StartTime));
  if (Date.now() > deadline.getTime()) {
    // Release the booking since it's expired
    await cancelBooking({
      bookingId,
      userId: booking.UserID,
      userRoles: ["Admin"], // Allow system cancellation
      cancelReason: "Hết hạn thanh toán",
    });
    throw new Error("Booking đã hết hạn thanh toán và đã tự động bị huỷ.");
  }

  await repoMockPayBooking(bookingId, paymentMethod);

  try {
    // Gui notification
    void createNotification({
      userId,
      title: "Thanh toan thanh cong",
      message: `Booking #${booking.BookingCode} da duoc thanh toan thanh cong qua ${paymentMethod}. Chuc ban choi vui ve!`,
      notificationType: "Payment",
    });

    const user = await findUserById(userId);
    if (user) {
      void sendPaymentSuccessEmail(user.Email, {
        bookingCode: booking.BookingCode,
        amount: booking.TotalAmount,
        bookingDate: booking.BookingDate,
        startTime: booking.StartTime,
        endTime: booking.EndTime,
      });
    }

    if (booking.CoachID) {
      const { getPool, sql } = await import("@/database/connection");
      const pool = await getPool();
      const coachRes = await pool.request().input("CoachID", sql.Int, booking.CoachID).query("SELECT UserID, FullName, Email FROM Coaches c JOIN Users u ON c.UserID = u.UserID WHERE c.CoachID = @CoachID");
      const coachData = coachRes.recordset[0];
      if (coachData && coachData.UserID) {
        void createNotification({
          userId: coachData.UserID,
          title: "Có lịch dạy mới",
          message: `Booking #${booking.BookingCode} đã được thanh toán và đặt lịch thành công với bạn.`,
          notificationType: "Booking"
        });

        if (coachData.Email) {
          void sendCoachAssignedEmail(coachData.Email, {
            bookingCode: booking.BookingCode,
            playerName: user ? user.FullName : "Player",
            bookingDate: booking.BookingDate,
            startTime: booking.StartTime,
            endTime: booking.EndTime,
            bookingType: booking.BookingType === "Combo" ? "Combo (Sân + HLV)" : "Thuê HLV",
          });
        }
      }
    }
  } catch (err) {
    console.warn("Error sending payment success/coach assigned notifications:", err);
  }

  return {
    bookingId,
    bookingCode: booking.BookingCode,
    status: "Confirmed",
    paymentMethod,
    message: "Thanh toan thanh cong. Booking da duoc xac nhan.",
  };
}

// ---- Release Expired (BR-26/31/32) ----

/**
 * BR-26: Giai phong cac booking het han.
 * (Modified): Tu dong check-in cac booking da het thoi gian choi thay vi No-show.
 */
export async function releaseExpiredBookings() {
  const [releasedData, autoCheckedInCount] = await Promise.all([
    repoReleaseExpiredHoldings(),  // BR-26
    repoAutoCheckInExpired(),        // Modified BR-31 (Auto Check-In)
  ]);

  for (const b of releasedData.expiredBookings) {
    void sendPaymentExpiredEmail(b.Email, {
      bookingCode: b.BookingCode,
    });
  }

  return {
    releasedHoldings: releasedData.releasedCount,
    autoCheckedIn: autoCheckedInCount,
    message: `Da giai phong ${releasedData.releasedCount} booking Holding het han, tu dong check-in ${autoCheckedInCount} booking da het gio`,
  };
}

/**
 * BR-32: Tu dong chuyen booking tu CheckedIn sang Completed.
 * Dieu kien: booking da check-in VA da het gio choi (EndTime + 30 phut).
 */
export async function completeCheckedInBookings() {
  const completedCount = await repoMarkCompletedExpiredCheckins();

  return {
    completedCount,
    message: `Da hoan thanh ${completedCount} booking CheckedIn het gio choi (BR-32)`,
  };
}

// ---- Helper: Calculate Payment Deadline ----

function calculatePaymentDeadline(createdAt: Date, bookingDate: Date | string, startTime: string): string {
  // DB stores local time via GETDATE(), but mssql driver treats it as UTC.
  // So '2026-06-06 10:59:00' becomes '2026-06-06T10:59:00Z' (which is 17:59 local).
  // We must subtract 7 hours to get the real UTC time.
  const realUtcTime = new Date(createdAt).getTime() - 7 * 60 * 60 * 1000;
  const deadline1 = new Date(realUtcTime + 10 * 60 * 1000);

  const dateStr = new Date(bookingDate).toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [month, day, year] = dateStr.split("/");
  const deadline2 = new Date(`${year}-${month}-${day}T${startTime}:00+07:00`);

  return deadline1 < deadline2 ? deadline1.toISOString() : deadline2.toISOString();
}

// ---- View Bookings ----

export async function getMyBookings(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  const bookings = await findBookingsByUserId(userId);
  
  return bookings.map((b) => ({
    ...b,
    PaymentDeadline: b.Status === "PendingPayment" 
      ? calculatePaymentDeadline(b.CreatedAt, b.BookingDate, b.StartTime) 
      : null
  }));
}

export async function getCoachReceivedBookings(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  const bookings = await findBookingsByCoachUserId(userId);

  return bookings.map((b) => ({
    ...b,
    PaymentDeadline: b.Status === "PendingPayment"
      ? calculatePaymentDeadline(b.CreatedAt, b.BookingDate, b.StartTime)
      : null
  }));
}

export async function getBookingDetail(bookingId: number, userId: number, userRoles: string[]) {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new Error("Booking khong ton tai");

  // Chi chu booking hoac Admin/Staff moi xem duoc chi tiet
  const isOwner = booking.UserID === userId;
  const isAdminOrStaff = userRoles.some((r) => ["Admin", "Staff"].includes(r));

  if (!isOwner && !isAdminOrStaff) {
    throw new Error("Ban khong co quyen xem booking nay");
  }

  const paymentDeadline = booking.Status === "PendingPayment"
    ? calculatePaymentDeadline(booking.CreatedAt, booking.BookingDate, booking.StartTime)
    : null;

  return { ...booking, PaymentDeadline: paymentDeadline };
}

/**
 * UC-49: Staff xem booking trong ngay.
 * BR-NEW-04: Chi Staff/Admin moi duoc goi (xu ly o controller).
 */
export async function getDailyBookings(date?: string) {
  const bookings = await findDailyBookingsForStaff(date);
  return bookings.map((b) => ({
    ...b,
    PaymentDeadline: b.Status === "PendingPayment"
      ? calculatePaymentDeadline(b.CreatedAt || new Date(), b.BookingDate, b.StartTime)
      : null
  }));
}

// ---- Team Booking (UC-36) ----

/**
 * UC-36: Dat san sau khi ghep nhom thanh cong.
 *
 * BR dependencies:
 * - BR-23: Ngay dat >= hom nay
 * - BR-28: Transaction locking chong double booking
 * - BR-40: Max 3 Holding cung luc (ap dung cho tat ca thanh vien nhom)
 * - BR-91: Nhom toi da 4 nguoi (validate tu PlayGroups module)
 * - BR-92: Player max 3 nhom active (validate tu PlayGroups module)
 *
 * TODO: Implement day du sau khi PlayGroups & PlayerMatching module hoan thanh.
 *       Can goi: playgroupsService.validateGroupForBooking(groupId)
 *                matchingService.validateMatchStatus(matchId)
 */
export async function createTeamBooking(input: {
  userId: number;      // Nguoi dat (leader of group)
  groupId: number;     // PlayGroup ID sau khi match thanh cong
  courtId: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
}) {
  // BR-23
  validateBookingDate(input.bookingDate, input.startTime);

  // Validate user
  const user = await findUserById(input.userId);
  if (!user) throw new Error("Nguoi dung khong ton tai");
  if (user.Status !== "Active") throw new Error("Tai khoan nguoi dung khong hoat dong");

  // BR-40
  await validateHoldingLimit(input.userId);

  // Validate court
  const court = await findCourtByIdForBooking(input.courtId);
  if (!court) throw new Error("San khong ton tai");
  if (court.Status !== "Available") throw new Error("San hien khong kha dung");

  // ===================================================
  // TODO: Validate PlayGroup status (cho module Matching)
  // Uncomment khi PlayGroups module da implement:
  //
  // const group = await playgroupsRepo.findGroupById(input.groupId);
  // if (!group) throw new Error("Nhom choi khong ton tai (UC-36)");
  // if (group.Status !== 'Matched') {
  //   throw new Error("Nhom chua duoc ghep thanh cong, khong the dat san (UC-36)");
  // }
  // if (group.LeaderID !== input.userId) {
  //   throw new Error("Chi leader nhom moi co quyen dat san cho ca nhom (UC-36)");
  // }
  // ===================================================

  const hours = calculateHours(input.startTime, input.endTime);
  const courtFee = Number(court.PricePerHour) * hours;

  const slot = await findAvailableCourtSlot(
    input.courtId,
    input.bookingDate,
    input.startTime,
    input.endTime
  );
  if (!slot) throw new Error("Khung gio san da bi dat hoac khong co slot phu hop");

  // Tao booking voi type = 'Team' va ghi nhan groupId
  return repoCreateTeamBooking({
    userId: input.userId,
    groupId: input.groupId,
    courtId: input.courtId,
    slotId: slot.SlotID,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime: input.endTime,
    courtFee,
  });
}
