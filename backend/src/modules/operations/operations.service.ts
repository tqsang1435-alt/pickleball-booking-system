import { repoGetTodayOperations, repoGetBookingStatus, repoUpdateBookingStatus, repoGetExpiredConfirmedBookings } from "./operations.repository";
import { findBookingById, findUserById } from "../bookings/bookings.repository";
import { createAuditLog } from "../logs/logs.service";
import { createNotification } from "../notifications/notifications.service";
import { sendNoShowEmail } from "@/utils/mail";
import { getPool, sql } from "@/database/connection";
import { TodayOperationsData, OperationSummary } from "./operations.type";

function getVNAbsoluteTime(dateUtc: Date, timeUtc: Date): Date {
  const year = dateUtc.getUTCFullYear();
  const month = dateUtc.getUTCMonth() + 1;
  const date = dateUtc.getUTCDate();
  
  const hours = timeUtc.getUTCHours();
  const minutes = timeUtc.getUTCMinutes();
  
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+07:00`;
  return new Date(isoString);
}

export async function autoMarkNoShowBookings(targetDate: string): Promise<number> {
  const bookings = await repoGetExpiredConfirmedBookings(targetDate);
  const now = new Date();
  let autoNoShowCount = 0;

  for (const booking of bookings) {
    const bookingStart = getVNAbsoluteTime(booking.BookingDate, booking.StartTime);
    const minNoShowTime = new Date(bookingStart.getTime() + 15 * 60000);

    if (now >= minNoShowTime) {
      const note = "Auto No-show: Khách không check-in sau 15 phút.";
      
      // Update status to NoShow and store note in CancelReason
      await repoUpdateBookingStatus(booking.BookingID, 'NoShow', note);
      
      // Audit log
      await createAuditLog({
        userId: null, // System
        actionName: "AUTO_NO_SHOW",
        tableName: "Bookings",
        entityId: booking.BookingID,
        description: "System automatically marked booking as No-show because customer did not check in within 15 minutes after start time."
      });

      const user = await findUserById(booking.UserID);
      if (user) {
        void sendNoShowEmail(user.Email, {
          bookingCode: booking.BookingCode,
          startTime: booking.StartTime,
          bookingDate: booking.BookingDate,
          isAuto: true,
        });
      }

      // Notify Player
      void createNotification({
        userId: booking.UserID,
        title: "Booking bị đánh dấu No-show",
        message: "Booking của bạn đã bị đánh dấu No-show do không check-in sau 15 phút kể từ giờ bắt đầu.",
        notificationType: "Booking"
      }).catch((err) => console.warn("Failed to create auto no-show player notification:", err));

      // Notify Coach if applicable
      if (booking.CoachID) {
        try {
          const pool = await getPool();
          const coachRes = await pool.request().input("CoachID", sql.Int, booking.CoachID).query("SELECT UserID FROM Coaches WHERE CoachID = @CoachID");
          const coachUserId = coachRes.recordset[0]?.UserID;
          
          if (coachUserId) {
            void createNotification({
              userId: coachUserId,
              title: "Booking bị No-show",
              message: "Một booking có bạn phụ trách đã bị đánh dấu No-show do khách không check-in.",
              notificationType: "Booking"
            }).catch((err) => console.warn("Failed to create auto no-show coach notification:", err));
          }
        } catch (err) {
          console.warn("Failed to notify coach on auto no-show:", err);
        }
      }

      autoNoShowCount++;
    }
  }

  return autoNoShowCount;
}

export async function getTodayOperations(dateParam?: string | null): Promise<TodayOperationsData> {
  const targetDate = dateParam || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  
  // Auto mark no-shows before fetching the list
  const autoNoShowCount = await autoMarkNoShowBookings(targetDate);
  
  const bookings = await repoGetTodayOperations(targetDate);
  
  const summary: OperationSummary = {
    totalBookings: bookings.length,
    waitingCheckIn: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  };

  bookings.forEach(b => {
    switch(b.status) {
      case 'Confirmed':
        summary.waitingCheckIn++;
        break;
      case 'CheckedIn':
        summary.checkedIn++;
        break;
      case 'Completed':
        summary.completed++;
        break;
      case 'Cancelled':
      case 'Refunded':
        summary.cancelled++;
        break;
      case 'NoShow':
        summary.noShow++;
        break;
    }
  });

  return {
    summary,
    bookings,
    autoNoShowCount,
  };
}

export async function checkInOperation(bookingId: number, note?: string, actorId?: number) {
  const booking = await repoGetBookingStatus(bookingId);
  if (!booking) throw new Error("Booking not found");
  
  if (booking.Status !== 'Confirmed') {
    throw new Error("Chỉ có thể check-in booking ở trạng thái Đã xác nhận.");
  }

  // Update status to CheckedIn and set CheckInTime
  await repoUpdateBookingStatus(bookingId, 'CheckedIn', note, true);

  const fullBooking = await findBookingById(bookingId);
  
  if (actorId) {
    await createAuditLog({
      userId: actorId,
      actionName: "CHECK_IN",
      tableName: "Bookings",
      entityId: bookingId,
      description: `Confirmed -> CheckedIn${note ? `. Note: ${note}` : ''}`
    });
  }

  if (fullBooking?.UserID) {
    await createNotification({
      userId: fullBooking.UserID,
      title: "Check-in thành công",
      message: `Booking ${booking.BookingCode} đã được check-in thành công. Chúc bạn chơi vui vẻ!`,
      notificationType: "System"
    });
  }

  if (fullBooking?.CoachID) {
    const pool = await getPool();
    const coachRes = await pool.request().input("CoachID", sql.Int, fullBooking.CoachID).query("SELECT UserID FROM Coaches WHERE CoachID = @CoachID");
    const coachUserId = coachRes.recordset[0]?.UserID;
    if (coachUserId) {
      await createNotification({
        userId: coachUserId,
        title: "Học viên đã check-in",
        message: `Học viên của booking ${booking.BookingCode} đã check-in tại sân.`,
        notificationType: "System"
      });
    }
  }

  return {
    bookingId,
    status: 'CheckedIn',
    checkInTime: new Date().toISOString()
  };
}

export async function completeOperation(bookingId: number, actorId?: number) {
  const booking = await repoGetBookingStatus(bookingId);
  if (!booking) throw new Error("Booking not found");
  
  if (booking.Status !== 'CheckedIn') {
    throw new Error("Chỉ có thể hoàn thành booking đang ở trạng thái Check-in.");
  }

  // Update status to Completed
  await repoUpdateBookingStatus(bookingId, 'Completed');

  const fullBooking = await findBookingById(bookingId);

  if (actorId) {
    await createAuditLog({
      userId: actorId,
      actionName: "COMPLETE",
      tableName: "Bookings",
      entityId: bookingId,
      description: "CheckedIn -> Completed"
    });
  }

  if (fullBooking?.UserID) {
    await createNotification({
      userId: fullBooking.UserID,
      title: "Booking hoàn thành",
      message: `Booking ${booking.BookingCode} đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!`,
      notificationType: "System"
    });
  }

  if (fullBooking?.CoachID) {
    const pool = await getPool();
    const coachRes = await pool.request().input("CoachID", sql.Int, fullBooking.CoachID).query("SELECT UserID FROM Coaches WHERE CoachID = @CoachID");
    const coachUserId = coachRes.recordset[0]?.UserID;
    if (coachUserId) {
      await createNotification({
        userId: coachUserId,
        title: "Buổi học hoàn thành",
        message: `Buổi học (Booking ${booking.BookingCode}) đã được đánh dấu hoàn thành.`,
        notificationType: "System"
      });
    }
  }

  return {
    bookingId,
    status: 'Completed'
  };
}

export async function noShowOperation(bookingId: number, note?: string, actorId?: number) {
  const booking = await repoGetBookingStatus(bookingId);
  if (!booking) throw new Error("Booking not found");
  
  if (booking.Status !== 'Confirmed') {
    throw new Error("Chỉ có thể đánh dấu No-show booking ở trạng thái Đã xác nhận.");
  }

  // Update status to NoShow
  await repoUpdateBookingStatus(bookingId, 'NoShow', note);

  const fullBooking = await findBookingById(bookingId);

  if (actorId) {
    await createAuditLog({
      userId: actorId,
      actionName: "NO_SHOW",
      tableName: "Bookings",
      entityId: bookingId,
      description: `Confirmed -> NoShow${note ? `. Reason: ${note}` : ''}`
    });
  }

  if (fullBooking?.UserID) {
    const user = await findUserById(fullBooking.UserID);
    if (user) {
      void sendNoShowEmail(user.Email, {
        bookingCode: booking.BookingCode,
        startTime: booking.StartTime,
        bookingDate: booking.BookingDate,
        isAuto: false,
        reason: note,
      });
    }

    await createNotification({
      userId: fullBooking.UserID,
      title: "Vắng mặt (No-show)",
      message: `Booking ${booking.BookingCode} đã bị đánh dấu vắng mặt. Vui lòng liên hệ nếu có sai sót.`,
      notificationType: "System"
    });
  }

  return {
    bookingId,
    status: 'NoShow'
  };
}
