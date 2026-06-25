// ============================================================
// courts.service.ts — Business Logic Layer
// Gọi các validator từ courts.validation.ts trước khi
// chuyển xuống Repository layer.
// ============================================================

import * as courtRepo from "./courts.repository";
import type { CreateCourtSlotInput } from "./courts.type";
import { validateAndSaveCourtFile, deleteFile } from "../../utils/upload";
import {
  validateCreateCourtFields,
  validateNotPastDate,
  validateNotPastTime,
  validatePrice,
  validateTimeRange,
} from "./courts.validation";

// ─── COURTS ──────────────────────────────────────────────────

export async function getAllCourts(includeInactive = false) {
  return courtRepo.findAllCourts(includeInactive);
}

export async function getCourtById(courtId: number) {
  const court = await courtRepo.findCourtById(courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  return court;
}

export async function getAvailableCourts(
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  if (!bookingDate) {
    throw new Error("bookingDate is required");
  }

  if (startTime || endTime) {
    if (!startTime || !endTime) {
      throw new Error("Cần cung cấp cả startTime và endTime, hoặc không cung cấp cả hai");
    }
    validateTimeRange(startTime, endTime);
  }

  return courtRepo.findAvailableCourts(bookingDate, startTime, endTime);
}

export async function createCourt(
  data: {
    courtCode: string;
    courtName: string;
    courtType: string;
    location?: string;
    description?: string;
    pricePerHour: number;
    courtImage?: string;
    status?: string;
    openTime: string;
    closeTime: string;
  },
  courtFile?: File
) {
  // 1. Kiểm tra trường bắt buộc
  validateCreateCourtFields(data);

  // 2. Kiểm tra giá hợp lệ
  validatePrice(data.pricePerHour, "Giá thuê sân mỗi giờ");

  // 3. Kiểm tra khoảng thời gian mở/đóng cửa
  validateTimeRange(data.openTime, data.closeTime);

  if (!courtFile) {
    return courtRepo.createCourt(data);
  }

  // Create court first to get the ID
  const newCourt = await courtRepo.createCourt(data);
  const courtId = newCourt.CourtID;

  let newImagePath: string | null = null;
  try {
    newImagePath = await validateAndSaveCourtFile(courtFile, courtId);
    
    const updatedData = {
      ...data,
      courtImage: newImagePath,
    };
    const finalCourt = await courtRepo.updateCourt(courtId, updatedData);
    return finalCourt;
  } catch (error) {
    if (newImagePath) {
      deleteFile(newImagePath);
    }
    throw error;
  }
}

export async function updateCourt(
  courtId: number,
  data: {
    courtCode: string;
    courtName: string;
    courtType: string;
    location?: string;
    description?: string;
    pricePerHour: number;
    courtImage?: string;
    status?: string;
    openTime: string;
    closeTime: string;
  },
  courtFile?: File
) {
  // 1. Kiểm tra sân tồn tại
  const court = await courtRepo.findCourtById(courtId);
  if (!court) {
    throw new Error("Court not found");
  }

  // 2. Kiểm tra trường bắt buộc
  validateCreateCourtFields(data);

  // 3. Kiểm tra giá hợp lệ
  validatePrice(data.pricePerHour, "Giá thuê sân mỗi giờ");

  // 4. Kiểm tra khoảng thời gian mở/đóng cửa
  validateTimeRange(data.openTime, data.closeTime);

  let newImagePath: string | null = null;
  const oldImagePath = court.CourtImage;

  try {
    if (courtFile) {
      newImagePath = await validateAndSaveCourtFile(courtFile, courtId);
      data.courtImage = newImagePath;
    } else {
      if (!data.courtImage) {
        data.courtImage = oldImagePath || undefined;
      }
    }

    const result = await courtRepo.updateCourt(courtId, data);
    if (!result) {
      throw new Error("Không thể cập nhật thông tin sân");
    }

    if (newImagePath && oldImagePath && oldImagePath.startsWith("/uploads/courts/")) {
      deleteFile(oldImagePath);
    }

    return result;
  } catch (error) {
    if (newImagePath) {
      deleteFile(newImagePath);
    }
    throw error;
  }
}

export async function deleteCourt(courtId: number) {
  const court = await courtRepo.findCourtById(courtId);
  if (!court) {
    throw new Error("Sân không tồn tại");
  }
  if (court.Status === "Inactive") {
    throw new Error("Sân này đã bị xóa");
  }

  // Soft delete court
  const result = await courtRepo.softDeleteCourt(courtId);
  if (!result) {
    throw new Error("Không thể xóa sân (có thể do lỗi dữ liệu hoặc sân đang được cập nhật). Vui lòng tải lại trang và thử lại.");
  }
  
  return result;
}

// ─── COURT SLOTS ─────────────────────────────────────────────

export async function getCourtSlots(courtId: number, slotDate: string) {
  if (!courtId) {
    throw new Error("courtId is required");
  }

  if (!slotDate) {
    throw new Error("slotDate is required");
  }

  const court = await courtRepo.findCourtById(courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  return courtRepo.findCourtSlots(courtId, slotDate);
}

export async function createCourtSlot(input: CreateCourtSlotInput) {
  // 1. Kiểm tra sân tồn tại và đang hoạt động
  const court = await courtRepo.findCourtById(input.courtId);

  if (!court) {
    throw new Error("Court not found");
  }

  if (court.Status !== "Available") {
    throw new Error("Sân hiện không hoạt động, không thể tạo slot");
  }

  // 2. Chặn ngày trong quá khứ (quy định nghiệm ngặt)
  validateNotPastDate(input.slotDate);

  // 3. Kiểm tra khoảng thời gian
  validateTimeRange(input.startTime, input.endTime);
  
  // 3.5 Chặn giờ quá khứ nếu là hôm nay
  validateNotPastTime(input.slotDate, input.startTime);

  // 4. Kiểm tra giá slot hợp lệ
  validatePrice(input.price, "Giá slot");

  // Kiểm tra trùng slot (UNIQUE KEY UQ_CourtSlot) để cập nhật giá thay vì tạo mới
  const existingSlots = await courtRepo.findCourtSlots(input.courtId, input.slotDate);
  const duplicate = existingSlots.find((s) => {
    if (s.Status === "Cancelled") return false;
    const sStart = s.StartTime.substring(0, 5);
    const sEnd = s.EndTime.substring(0, 5);
    const inputStart = input.startTime.substring(0, 5);
    const inputEnd = input.endTime.substring(0, 5);
    return sStart === inputStart && sEnd === inputEnd;
  });

  if (duplicate) {
    if (duplicate.Status === "Booked" || duplicate.Status === "Holding") {
      throw new Error("Khung giờ này đã có người đặt hoặc giữ chỗ, không thể đổi giá");
    }
    // Cập nhật giá thay vì tạo mới
    const updated = await courtRepo.updateCourtSlotPrice(duplicate.SlotID, input.price);
    if (!updated) {
      throw new Error("Không thể cập nhật giá cho slot đã tồn tại");
    }
    return updated;
  }

  return courtRepo.createCourtSlot({
    courtId: input.courtId,
    slotDate: input.slotDate,
    startTime: input.startTime,
    endTime: input.endTime,
    price: input.price,
  });
}

export async function updateCourtSlotStatus(slotId: number, status: string) {
  const allowed = ["Available", "Blocked", "Maintenance"];
  if (!allowed.includes(status)) {
    throw new Error(
      `Trạng thái không hợp lệ. Chỉ chấp nhận: ${allowed.join(", ")}`
    );
  }

  const slot = await courtRepo.findCourtSlotById(slotId);
  if (!slot) {
    throw new Error("Slot không tồn tại");
  }

  if (slot.Status === "Booked" || slot.Status === "Holding") {
    throw new Error(
      "Không thể thay đổi trạng thái slot đang có người đặt hoặc đang giữ chỗ"
    );
  }

  // Chặn thao tác trên slot của ngày quá khứ
  const slotDateStr =
    slot.SlotDate instanceof Date
      ? slot.SlotDate.toISOString().split("T")[0]
      : String(slot.SlotDate).split("T")[0];

  validateNotPastDate(slotDateStr);

  const result = await courtRepo.updateCourtSlotStatus(slotId, status);
  if (!result) {
    throw new Error("Không thể cập nhật trạng thái slot");
  }
  return result;
}

export async function deleteCourtSlot(slotId: number) {
  const slot = await courtRepo.findCourtSlotById(slotId);
  if (!slot) {
    throw new Error("Slot không tồn tại");
  }
  if (slot.Status === "Booked" || slot.Status === "Holding") {
    throw new Error("Không thể xóa slot đang có người đặt hoặc đang giữ chỗ");
  }

  // Soft delete: đổi Status → 'Cancelled' thay vì DELETE cứng
  const result = await courtRepo.softDeleteCourtSlot(slotId);
  if (!result) {
    throw new Error("Không thể xóa slot này (có thể do lỗi dữ liệu hoặc slot đã bị khóa/có người đặt).");
  }
  return { SlotID: slotId };
}

// ─── UC-62: Sinh slot hàng loạt ──────────────────────────────

/**
 * Tự động sinh toàn bộ slot từ giờ mở đến giờ đóng cửa của sân,
 * theo bước thời gian (durationMinutes). Bỏ qua các slot đã tồn tại.
 */
export async function generateCourtSlots(input: {
  courtId: number;
  slotDate: string;
  durationMinutes: number;
  price: number;
}) {
  // 1. Kiểm tra sân
  const court = await courtRepo.findCourtById(input.courtId);
  if (!court) throw new Error("Court not found");
  if (court.Status !== "Available") {
    throw new Error("Sân hiện không hoạt động, không thể tạo slot");
  }

  // 2. Chặn ngày trong quá khứ
  validateNotPastDate(input.slotDate);

  // 3. Kiểm tra thời lượng hợp lệ
  const validDurations = [30, 60, 90, 120];
  if (!validDurations.includes(input.durationMinutes)) {
    throw new Error("Thời lượng slot phải là 30, 60, 90 hoặc 120 phút");
  }

  // 4. Kiểm tra giá
  validatePrice(input.price, "Giá slot");

  // 5. Sinh danh sách slot từ openTime → closeTime
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toTimeStr = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const openMin  = toMinutes(court.OpenTime);
  const closeMin = toMinutes(court.CloseTime);
  const { durationMinutes } = input;

  const allSlots: { courtId: number; slotDate: string; startTime: string; endTime: string; price: number }[] = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += durationMinutes) {
    allSlots.push({
      courtId:   input.courtId,
      slotDate:  input.slotDate,
      startTime: toTimeStr(start),
      endTime:   toTimeStr(start + durationMinutes),
      price:     input.price,
    });
  }

  if (allSlots.length === 0) {
    throw new Error("Không thể sinh slot: khoảng thời gian hoạt động quá ngắn so với thời lượng đã chọn");
  }

  // 6. Lọc bỏ slot đã tồn tại
  // 6. Lọc bỏ slot đã tồn tại hoặc bị trùng thời gian (overlap)
  const existingSlots = await courtRepo.findCourtSlots(input.courtId, input.slotDate);
  let newSlots = allSlots.filter((newSlot) => {
    // Overlap condition: start1 < end2 AND start2 < end1
    const overlaps = existingSlots.some((existing) => {
      if (existing.Status === "Cancelled") return false;
      return newSlot.startTime < existing.EndTime && existing.StartTime < newSlot.endTime;
    });
    return !overlaps;
  });

  // 6.1 Lọc bỏ slot đã qua giờ (nếu tạo cho hôm nay)
  const nowVN = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  const year = nowVN.getFullYear();
  const month = String(nowVN.getMonth() + 1).padStart(2, "0");
  const day = String(nowVN.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (input.slotDate === todayStr) {
    newSlots = newSlots.filter((s) => {
      try {
        validateNotPastTime(input.slotDate, s.startTime);
        return true;
      } catch {
        return false;
      }
    });
    if (newSlots.length === 0) {
      throw new Error("Tất cả các khung giờ trong ngày hôm nay đã trôi qua. Vui lòng chọn ngày khác.");
    }
  }

  if (newSlots.length === 0) {
    throw new Error("Không có slot nào được tạo (có thể đã tồn tại tất cả các slot trong khung giờ này).");
  }

  // 7. Bulk insert
  const created = await courtRepo.createCourtSlotsMany(newSlots);
  const skipped = allSlots.length - created;

  return { total: allSlots.length, created, skipped };
}