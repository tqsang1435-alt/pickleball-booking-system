export type CourtStatus = "Available" | "Maintenance" | "Inactive";
export type CourtType = "Indoor" | "Outdoor";

export type Court = {
  CourtID: number;
  CourtCode: string;
  CourtName: string;
  CourtType: CourtType;
  Location: string | null;
  Description: string | null;
  PricePerHour: number;
  CourtImage: string | null;
  Status: CourtStatus;
  OpenTime: string;
  CloseTime: string;
};

export type CreateCourtSlotInput = {
  courtId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  price: number;
};