import { getPool, sql } from "@/database/connection";

export type SettingRow = {
  SettingKey: string;
  SettingValue: string | null;
  ValueType: "string" | "number" | "boolean" | "json";
  Description: string | null;
  GroupName: string;
  IsEditable: boolean;
  UpdatedAt: string;
};

// ─── Seed default settings vào DB nếu chưa có ────────────────────────────────
const DEFAULT_SETTINGS: Omit<SettingRow, "UpdatedAt">[] = [
  // General
  { SettingKey: "site_name",            SettingValue: "PickleClub",           ValueType: "string",  Description: "Tên hệ thống",                        GroupName: "general",      IsEditable: true },
  { SettingKey: "site_logo_url",        SettingValue: "/images/logo.png",     ValueType: "string",  Description: "URL logo hệ thống",                   GroupName: "general",      IsEditable: true },
  { SettingKey: "contact_email",        SettingValue: "admin@pickleclub.vn",  ValueType: "string",  Description: "Email liên hệ",                       GroupName: "general",      IsEditable: true },
  { SettingKey: "contact_phone",        SettingValue: "0901234567",           ValueType: "string",  Description: "Số điện thoại liên hệ",               GroupName: "general",      IsEditable: true },
  { SettingKey: "timezone",             SettingValue: "Asia/Ho_Chi_Minh",     ValueType: "string",  Description: "Timezone mặc định",                   GroupName: "general",      IsEditable: true },
  { SettingKey: "maintenance_mode",     SettingValue: "false",                ValueType: "boolean", Description: "Bật chế độ bảo trì",                  GroupName: "general",      IsEditable: true },
  // Booking
  { SettingKey: "booking_hold_minutes", SettingValue: "15",                   ValueType: "number",  Description: "Thời gian giữ slot (phút)",            GroupName: "booking",      IsEditable: true },
  { SettingKey: "cancel_before_hours",  SettingValue: "2",                    ValueType: "number",  Description: "Hủy booking trước bao nhiêu giờ",     GroupName: "booking",      IsEditable: true },
  { SettingKey: "max_booking_per_day",  SettingValue: "3",                    ValueType: "number",  Description: "Số booking tối đa mỗi ngày/user",     GroupName: "booking",      IsEditable: true },
  { SettingKey: "min_advance_hours",    SettingValue: "1",                    ValueType: "number",  Description: "Đặt sân trước tối thiểu (giờ)",       GroupName: "booking",      IsEditable: true },
  { SettingKey: "allow_guest_booking",  SettingValue: "false",                ValueType: "boolean", Description: "Cho phép Guest đặt sân",               GroupName: "booking",      IsEditable: true },
  // Payment
  { SettingKey: "momo_enabled",         SettingValue: "true",                 ValueType: "boolean", Description: "Bật thanh toán MoMo",                 GroupName: "payment",      IsEditable: true },
  { SettingKey: "vnpay_enabled",        SettingValue: "true",                 ValueType: "boolean", Description: "Bật thanh toán VNPay",                GroupName: "payment",      IsEditable: true },
  { SettingKey: "platform_fee_percent", SettingValue: "5",                    ValueType: "number",  Description: "Phí nền tảng (%)",                    GroupName: "payment",      IsEditable: true },
  { SettingKey: "min_deposit_percent",  SettingValue: "30",                   ValueType: "number",  Description: "% đặt cọc tối thiểu",                 GroupName: "payment",      IsEditable: true },
  // Notification
  { SettingKey: "email_notify_enabled", SettingValue: "true",                 ValueType: "boolean", Description: "Bật thông báo email",                 GroupName: "notification", IsEditable: true },
  { SettingKey: "push_notify_enabled",  SettingValue: "false",                ValueType: "boolean", Description: "Bật push notification",               GroupName: "notification", IsEditable: true },
  { SettingKey: "notify_booking_confirm",SettingValue: "true",                ValueType: "boolean", Description: "Gửi email khi booking được xác nhận", GroupName: "notification", IsEditable: true },
  { SettingKey: "notify_booking_cancel",SettingValue: "true",                 ValueType: "boolean", Description: "Gửi email khi booking bị hủy",        GroupName: "notification", IsEditable: true },
  // AI
  { SettingKey: "ai_service_url",       SettingValue: "http://localhost:8000", ValueType: "string", Description: "URL AI service",                      GroupName: "ai",           IsEditable: true },
  { SettingKey: "ai_enabled",           SettingValue: "true",                 ValueType: "boolean", Description: "Bật tính năng AI recommendation",     GroupName: "ai",           IsEditable: true },
  { SettingKey: "ai_score_threshold",   SettingValue: "0.7",                  ValueType: "number",  Description: "Ngưỡng điểm AI (0-1)",                GroupName: "ai",           IsEditable: true },
  { SettingKey: "ai_api_key",           SettingValue: "",                     ValueType: "string",  Description: "API Key cho AI service",              GroupName: "ai",           IsEditable: true },
  // System
  { SettingKey: "log_level",            SettingValue: "info",                 ValueType: "string",  Description: "Mức độ logging (debug/info/warn/error)", GroupName: "system",     IsEditable: true },
  { SettingKey: "cache_ttl_seconds",    SettingValue: "300",                  ValueType: "number",  Description: "TTL cache (giây)",                    GroupName: "system",       IsEditable: true },
  { SettingKey: "max_upload_mb",        SettingValue: "10",                   ValueType: "number",  Description: "Dung lượng file upload tối đa (MB)",  GroupName: "system",       IsEditable: true },
];

export async function ensureSettingsTable() {
  const pool = await getPool();

  // Tạo bảng nếu chưa tồn tại
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.tables WHERE name = 'SystemSettings'
    )
    BEGIN
      CREATE TABLE SystemSettings (
        SettingKey   NVARCHAR(100) NOT NULL PRIMARY KEY,
        SettingValue NVARCHAR(MAX) NULL,
        ValueType    NVARCHAR(20)  NOT NULL DEFAULT 'string',
        Description  NVARCHAR(500) NULL,
        GroupName    NVARCHAR(50)  NOT NULL DEFAULT 'general',
        IsEditable   BIT           NOT NULL DEFAULT 1,
        UpdatedAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
      )
    END
  `);

  // Seed defaults (chỉ insert những key chưa tồn tại)
  for (const s of DEFAULT_SETTINGS) {
    await pool.request()
      .input("Key",   sql.NVarChar, s.SettingKey)
      .input("Val",   sql.NVarChar, s.SettingValue)
      .input("Type",  sql.NVarChar, s.ValueType)
      .input("Desc",  sql.NVarChar, s.Description)
      .input("Group", sql.NVarChar, s.GroupName)
      .input("Edit",  sql.Bit,      s.IsEditable ? 1 : 0)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = @Key)
          INSERT INTO SystemSettings (SettingKey, SettingValue, ValueType, Description, GroupName, IsEditable)
          VALUES (@Key, @Val, @Type, @Desc, @Group, @Edit)
      `);
  }
}

export async function countSettings(): Promise<number> {
  const pool = await getPool();
  try {
    const result = await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemSettings')
        SELECT COUNT(*) AS Total FROM SystemSettings
      ELSE
        SELECT 0 AS Total
    `);
    return result.recordset[0].Total as number;
  } catch {
    return 0;
  }
}

export async function seedAllSettings(): Promise<{ inserted: number; skipped: number }> {
  await ensureSettingsTable();
  const pool = await getPool();
  let inserted = 0;
  let skipped = 0;

  for (const s of DEFAULT_SETTINGS) {
    const exists = await pool.request()
      .input("Key", sql.NVarChar, s.SettingKey)
      .query(`SELECT 1 AS Exists FROM SystemSettings WHERE SettingKey = @Key`);

    if (exists.recordset.length > 0) {
      skipped++;
    } else {
      await pool.request()
        .input("Key",   sql.NVarChar, s.SettingKey)
        .input("Val",   sql.NVarChar, s.SettingValue)
        .input("Type",  sql.NVarChar, s.ValueType)
        .input("Desc",  sql.NVarChar, s.Description)
        .input("Group", sql.NVarChar, s.GroupName)
        .input("Edit",  sql.Bit,      s.IsEditable ? 1 : 0)
        .query(`
          INSERT INTO SystemSettings (SettingKey, SettingValue, ValueType, Description, GroupName, IsEditable)
          VALUES (@Key, @Val, @Type, @Desc, @Group, @Edit)
        `);
      inserted++;
    }
  }

  return { inserted, skipped };
}

export async function reseedAllSettings(): Promise<{ total: number }> {
  await ensureSettingsTable();
  const pool = await getPool();

  // Reset tất cả về default value (không xóa key user tự thêm)
  for (const s of DEFAULT_SETTINGS) {
    await pool.request()
      .input("Key", sql.NVarChar, s.SettingKey)
      .input("Val", sql.NVarChar, s.SettingValue)
      .query(`
        IF EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = @Key)
          UPDATE SystemSettings SET SettingValue = @Val, UpdatedAt = GETUTCDATE() WHERE SettingKey = @Key
        ELSE
          INSERT INTO SystemSettings (SettingKey, SettingValue, ValueType, Description, GroupName, IsEditable)
          VALUES (@Key, @Val,
            '${s.ValueType}',
            '${(s.Description ?? "").replace(/'/g, "''")}',
            '${s.GroupName}',
            ${s.IsEditable ? 1 : 0})
      `);
  }

  return { total: DEFAULT_SETTINGS.length };
}

export async function findAllSettings(): Promise<SettingRow[]> {
  await ensureSettingsTable();
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT SettingKey, SettingValue, ValueType, Description, GroupName, IsEditable, UpdatedAt
    FROM SystemSettings
    ORDER BY GroupName ASC, SettingKey ASC
  `);
  return result.recordset;
}

export async function findSettingByKey(key: string): Promise<SettingRow | undefined> {
  const pool = await getPool();
  const result = await pool.request()
    .input("Key", sql.NVarChar, key)
    .query(`SELECT * FROM SystemSettings WHERE SettingKey = @Key`);
  return result.recordset[0];
}

export async function updateSettingByKey(key: string, value: string): Promise<SettingRow> {
  const pool = await getPool();
  const result = await pool.request()
    .input("Key",       sql.NVarChar,  key)
    .input("Val",       sql.NVarChar,  value)
    .query(`
      UPDATE SystemSettings
      SET SettingValue = @Val, UpdatedAt = GETUTCDATE()
      OUTPUT INSERTED.*
      WHERE SettingKey = @Key AND IsEditable = 1
    `);
  return result.recordset[0];
}

export async function updateManySettings(entries: { key: string; value: string }[]): Promise<void> {
  const pool = await getPool();
  for (const e of entries) {
    await pool.request()
      .input("Key", sql.NVarChar, e.key)
      .input("Val", sql.NVarChar, e.value)
      .query(`
        UPDATE SystemSettings
        SET SettingValue = @Val, UpdatedAt = GETUTCDATE()
        WHERE SettingKey = @Key AND IsEditable = 1
      `);
  }
}
