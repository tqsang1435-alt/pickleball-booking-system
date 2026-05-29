// ============================================================
// courts.dto.ts — Data Transfer Objects cho Courts module
// Định nghĩa shape dữ liệu đầu vào cho từng operation
// ============================================================

export type CreateCourtDto = {
  courtCode: string;
  courtName: string;
  courtType: "Indoor" | "Outdoor";
  location?: string;
  description?: string;
  pricePerHour: number;
  courtImage?: string;
  status?: "Available" | "Maintenance" | "Inactive";
  openTime: string;  // format: "HH:mm"
  closeTime: string; // format: "HH:mm"
};

export type UpdateCourtDto = Partial<CreateCourtDto> & {
  courtCode: string;
  courtName: string;
  courtType: "Indoor" | "Outdoor";
  pricePerHour: number;
  openTime: string;
  closeTime: string;
};

export type CreateCourtSlotDto = {
  courtId: number;
  slotDate: string; // format: "YYYY-MM-DD"
  startTime: string; // format: "HH:mm"
  endTime: string;   // format: "HH:mm"
  price: number;
};

export type UpdateCourtSlotStatusDto = {
  status: "Available" | "Blocked" | "Maintenance";
};
