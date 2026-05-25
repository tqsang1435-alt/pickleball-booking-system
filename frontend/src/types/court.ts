export type Court = {
  CourtID: number;
  CourtCode: string;
  CourtName: string;
  CourtType: "Indoor" | "Outdoor" | string;
  Location: string;
  Description: string | null;
  PricePerHour: number;
  CourtImage: string | null;
  Status: "Available" | "Maintenance" | "Blocked" | "Inactive" | string;
  OpenTime: string;
  CloseTime: string;
  CreatedAt?: string;
  UpdatedAt?: string | null;
};
