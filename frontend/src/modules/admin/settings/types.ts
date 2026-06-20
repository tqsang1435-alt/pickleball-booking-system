export type SettingType = "string" | "number" | "boolean" | "json";

export type ParsedSetting = {
  key: string;
  value: string | number | boolean | null;
  rawValue: string | null;
  type: SettingType;
  description: string | null;
  group: string;
  isEditable: boolean;
  updatedAt: string;
};

export type GroupedSettings = {
  [group: string]: ParsedSetting[];
};

export const GROUP_ORDER = [
  "general",
  "booking",
  "payment",
  "notification",
  "ai",
  "system",
];

export const GROUP_META: Record<string, { label: string; icon: string; color: string }> = {
  general: { label: "Thông tin chung", icon: "⚙", color: "#6366F1" },
  booking: { label: "Chính sách Booking", icon: "📅", color: "#0EA5E9" },
  payment: { label: "Thanh toán", icon: "💳", color: "#10B981" },
  notification: { label: "Thông báo", icon: "🔔", color: "#F59E0B" },
  ai: { label: "AI & Analytics", icon: "AI", color: "#8B5CF6" },
  system: { label: "Hệ thống", icon: "🔧", color: "#EF4444" },
};
