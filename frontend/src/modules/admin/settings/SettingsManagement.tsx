"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/utils/authStorage";
import { useSettings } from "./hooks/useSettings";
import { GROUP_META } from "./types";
import type { ParsedSetting } from "./types";
import styles from "./SettingsManagement.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type DraftMap = Record<string, string | number | boolean>;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SettingsManagement() {
  const router = useRouter();
  const { grouped, loading, error, saveStatus, fetch, saveGroup,
          seedStatus, seedLoading, seedMessage, fetchSeedStatus, runSeed } = useSettings();
  const [activeGroup, setActiveGroup] = useState<string>("general");
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saveError, setSaveError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetch();
    fetchSeedStatus();
  }, [fetch, fetchSeedStatus]);

  // Redirect on auth error
  useEffect(() => {
    if (error.includes("Token") || error.includes("hết hạn") || error.includes("đăng nhập")) {
      clearAuth();
      router.push("/login");
    }
  }, [error, router]);

  // Set first available group as active once loaded
  useEffect(() => {
    const groups = Object.keys(grouped);
    if (groups.length && !groups.includes(activeGroup)) {
      setActiveGroup(groups[0]);
    }
  }, [grouped]);

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const order = ["general", "booking", "payment", "notification", "ai", "system"];
    return order.indexOf(a) - order.indexOf(b);
  });

  function getDraft(key: string, original: string | number | boolean | null): string | number | boolean {
    return key in drafts ? drafts[key] : (original ?? "");
  }

  function setDraft(key: string, value: string | number | boolean) {
    setDrafts(d => ({ ...d, [key]: value }));
  }

  function hasChanges(settings: ParsedSetting[]): boolean {
    return settings.some(s => s.key in drafts && drafts[s.key] !== s.value);
  }

  function resetGroup(settings: ParsedSetting[]) {
    const keys = settings.map(s => s.key);
    setDrafts(d => {
      const next = { ...d };
      keys.forEach(k => delete next[k]);
      return next;
    });
  }

  async function handleSaveGroup(settings: ParsedSetting[]) {
    setSaveError("");
    const entries = settings
      .filter(s => s.isEditable && s.key in drafts)
      .map(s => ({ key: s.key, value: drafts[s.key] }));

    if (entries.length === 0) return;

    try {
      await saveGroup(entries);
      // Clear saved drafts
      setDrafts(d => {
        const next = { ...d };
        entries.forEach(e => delete next[e.key]);
        return next;
      });
    } catch (e: any) {
      setSaveError(e.message ?? "Lỗi lưu cấu hình");
    }
  }

  const activeSettings = grouped[activeGroup] ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Cài đặt hệ thống</h1>
          <p>Cấu hình toàn bộ hoạt động của PickleClub</p>
        </div>
        {/* Nút seed lại — luôn hiển thị để admin có thể seed lại bất cứ lúc nào */}
        {!loading && seedStatus?.seeded && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className={styles.btnSeedReset}
              onClick={() => runSeed(false)}
              disabled={seedLoading}
              title="Thêm các key mới chưa có vào DB"
            >
              {seedLoading ? "⏳ Đang seed..." : "🌱 Seed Data"}
            </button>
            <button
              className={styles.btnSeed}
              onClick={() => setShowResetConfirm(true)}
              disabled={seedLoading}
              title="Reset tất cả về giá trị mặc định"
            >
              🔄 Reset Default
            </button>
          </div>
        )}
      </div>

      {error && !error.includes("Token") && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {/* ── Seed Banner: hiện khi chưa có data hoặc luôn có thể seed lại ── */}
      {!loading && seedStatus !== null && (
        seedStatus.seeded ? (
          // Đã có data — chỉ hiện nút reset nhỏ trong header
          null
        ) : (
          <div className={styles.seedBanner}>
            <div className={styles.seedBannerLeft}>
              <span className={styles.seedBannerIcon}>⚠️</span>
              <div className={styles.seedBannerText}>
                <h3>Chưa có dữ liệu cấu hình</h3>
                <p>Bảng SystemSettings trống ({seedStatus.count}/{seedStatus.total}). Chạy Seed để tạo các cấu hình mặc định.</p>
              </div>
            </div>
            <div className={styles.seedBannerActions}>
              <button
                className={styles.btnSeed}
                onClick={() => runSeed(false)}
                disabled={seedLoading}
              >
                {seedLoading ? "Đang seed..." : "🌱 Chạy Seed"}
              </button>
            </div>
          </div>
        )
      )}

      {/* Seed success / message */}
      {seedMessage && (
        <div className={styles.seedSuccess}>
          <span className={styles.seedSuccessIcon}>✅</span>
          {seedMessage}
        </div>
      )}

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowResetConfirm(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, maxWidth: 440, width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)", overflow: "hidden",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F3F4F6" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Reset về giá trị mặc định</h2>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                Tất cả <strong>25 cấu hình</strong> sẽ được reset về giá trị mặc định ban đầu.
                Các thay đổi bạn đã lưu trước đó sẽ bị ghi đè.
              </p>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626" }}>
                ⚠️ Hành động này không thể hoàn tác.
              </div>
            </div>
            <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{ background: "#F3F4F6", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" }}
              >Hủy</button>
              <button
                onClick={() => { setShowResetConfirm(false); runSeed(true); }}
                disabled={seedLoading}
                style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: seedLoading ? 0.5 : 1 }}
              >{seedLoading ? "Đang reset..." : "Xác nhận Reset"}</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* Sidebar */}
        <nav className={styles.sidebar}>
          {loading
            ? [1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.navItem}>
                  <div className={styles.skeletonCircle} />
                  <div className={styles.skeletonLine} style={{ width: "70%", height: 12 }} />
                </div>
              ))
            : groupKeys.map(g => {
                const meta = GROUP_META[g] ?? { label: g, icon: "⚙️", color: "#6B7280" };
                const settings = grouped[g] ?? [];
                const changed = hasChanges(settings);
                return (
                  <button
                    key={g}
                    className={`${styles.navItem} ${activeGroup === g ? styles.navItemActive : ""}`}
                    onClick={() => setActiveGroup(g)}
                  >
                    <span className={styles.navIcon}>{meta.icon}</span>
                    <span className={styles.navLabel}>{meta.label}</span>
                    {changed && <span className={styles.navDot} style={{ opacity: 1, background: "#F59E0B" }} />}
                    {!changed && <span className={styles.navDot} />}
                  </button>
                );
              })}
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <SkeletonPanel />
          ) : (
            <GroupPanel
              group={activeGroup}
              settings={activeSettings}
              drafts={drafts}
              getDraft={getDraft}
              setDraft={setDraft}
              onSave={() => handleSaveGroup(activeSettings)}
              onReset={() => resetGroup(activeSettings)}
              hasChanges={hasChanges(activeSettings)}
              saveStatus={saveStatus}
              saveError={saveError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group Panel ─────────────────────────────────────────────────────────────

type GroupPanelProps = {
  group: string;
  settings: ParsedSetting[];
  drafts: DraftMap;
  getDraft: (key: string, original: string | number | boolean | null) => string | number | boolean;
  setDraft: (key: string, value: string | number | boolean) => void;
  onSave: () => void;
  onReset: () => void;
  hasChanges: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string;
};

function GroupPanel({ group, settings, getDraft, setDraft, onSave, onReset, hasChanges, saveStatus, saveError }: GroupPanelProps) {
  const meta = GROUP_META[group] ?? { label: group, icon: "⚙️", color: "#6B7280" };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span className={styles.panelIcon}>{meta.icon}</span>
          <h2>{meta.label}</h2>
        </div>
        <span style={{ fontSize: 13, color: "#9CA3AF" }}>{settings.length} cấu hình</span>
      </div>

      <div className={styles.panelBody}>
        {settings.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
            Không có cấu hình nào
          </div>
        )}
        {settings.map(s => (
          <SettingRow
            key={s.key}
            setting={s}
            currentValue={getDraft(s.key, s.value)}
            onChange={val => setDraft(s.key, val)}
            isDirty={s.key in Object.fromEntries(Object.keys({ ...Object.fromEntries(settings.map(x => [x.key, x])) }).map(k => [k, k])) && getDraft(s.key, s.value) !== s.value}
          />
        ))}
      </div>

      <div className={styles.panelFooter}>
        <div>
          {hasChanges && <span className={styles.unsavedHint}>⚠ Có thay đổi chưa lưu</span>}
          {saveError && <span className={styles.saveError}>✕ {saveError}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {hasChanges && (
            <button className={styles.btnReset} onClick={onReset}>Hoàn tác</button>
          )}
          <button
            className={`${styles.btnSave} ${saveStatus === "saved" ? styles.btnSaved : ""}`}
            onClick={onSave}
            disabled={saveStatus === "saving" || !hasChanges}
          >
            {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã lưu" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────────────────

type SettingRowProps = {
  setting: ParsedSetting;
  currentValue: string | number | boolean;
  onChange: (val: string | number | boolean) => void;
  isDirty: boolean;
};

function SettingRow({ setting, currentValue, onChange, isDirty }: SettingRowProps) {
  const isPassword = setting.key.toLowerCase().includes("key") ||
    setting.key.toLowerCase().includes("secret") ||
    setting.key.toLowerCase().includes("password");

  return (
    <div className={styles.settingRow}>
      <div className={styles.settingInfo}>
        <div className={styles.settingKey}>{setting.key}</div>
        {setting.description && (
          <div className={styles.settingDesc}>{setting.description}</div>
        )}
      </div>
      <div className={styles.settingControl}>
        {!setting.isEditable ? (
          <input className={styles.inputReadonly} value={String(currentValue)} readOnly />
        ) : setting.type === "boolean" ? (
          <BooleanToggle
            value={currentValue as boolean}
            onChange={onChange}
            isDirty={isDirty}
          />
        ) : setting.type === "number" ? (
          <input
            type="number"
            className={`${styles.inputNumber} ${isDirty ? styles.changed : ""}`}
            value={currentValue as number}
            onChange={e => onChange(e.target.valueAsNumber)}
          />
        ) : (
          <input
            type={isPassword ? "password" : "text"}
            className={`${styles.inputText} ${isDirty ? styles.changed : ""}`}
            value={currentValue as string}
            onChange={e => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Boolean Toggle ───────────────────────────────────────────────────────────

function BooleanToggle({
  value,
  onChange,
  isDirty,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  isDirty: boolean;
}) {
  const on = Boolean(value);
  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        className={`${styles.toggleTrack} ${on ? styles.toggleTrackOn : ""}`}
        onClick={() => onChange(!on)}
        aria-checked={on}
        role="switch"
      >
        <span className={`${styles.toggleThumb} ${on ? styles.toggleThumbOn : ""}`} />
      </button>
      <span className={styles.toggleLabel} style={{ color: isDirty ? "#F59E0B" : undefined }}>
        {on ? "Bật" : "Tắt"}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonPanel() {
  return (
    <div className={styles.skeletonPanel}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonLine} style={{ width: 140 }} />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={styles.skeletonRow}>
          <div className={styles.skeletonRowLeft}>
            <div className={styles.skeletonLine} style={{ width: "35%" }} />
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
          </div>
          <div className={styles.skeletonInput} />
        </div>
      ))}
    </div>
  );
}
