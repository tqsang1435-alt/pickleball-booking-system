import * as settingsRepo from "./settings.repository";
import type { SettingRow } from "./settings.repository";

export type ParsedSetting = {
  key: string;
  value: string | number | boolean | null;
  rawValue: string | null;
  type: string;
  description: string | null;
  group: string;
  isEditable: boolean;
  updatedAt: string;
};

export type GroupedSettings = {
  [group: string]: ParsedSetting[];
};

function parseValue(raw: string | null, type: string): string | number | boolean | null {
  if (raw === null || raw === undefined) return null;
  if (type === "number")  return Number(raw);
  if (type === "boolean") return raw === "true";
  return raw;
}

function serializeValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object")  return JSON.stringify(value);
  return String(value ?? "");
}

function toParsedsetting(row: SettingRow): ParsedSetting {
  return {
    key:        row.SettingKey,
    value:      parseValue(row.SettingValue, row.ValueType),
    rawValue:   row.SettingValue,
    type:       row.ValueType,
    description: row.Description,
    group:      row.GroupName,
    isEditable: Boolean(row.IsEditable),
    updatedAt:  row.UpdatedAt,
  };
}

export async function getAllGrouped(): Promise<GroupedSettings> {
  const rows = await settingsRepo.findAllSettings();
  const grouped: GroupedSettings = {};
  for (const row of rows) {
    const g = row.GroupName || "general";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(toParsedsetting(row));
  }
  return grouped;
}

export async function updateSetting(key: string, value: unknown, actorId: number): Promise<ParsedSetting> {
  const existing = await settingsRepo.findSettingByKey(key);
  if (!existing) throw new Error("SETTING_NOT_FOUND");
  if (!existing.IsEditable) throw new Error("SETTING_NOT_EDITABLE");

  const serialized = serializeValue(value);
  const updated = await settingsRepo.updateSettingByKey(key, serialized);
  return toParsedsetting(updated);
}

export async function updateBatch(
  entries: { key: string; value: unknown }[],
  actorId: number
): Promise<void> {
  for (const e of entries) {
    const existing = await settingsRepo.findSettingByKey(e.key);
    if (!existing || !existing.IsEditable) continue;
  }
  await settingsRepo.updateManySettings(
    entries.map(e => ({ key: e.key, value: serializeValue(e.value) }))
  );
}
