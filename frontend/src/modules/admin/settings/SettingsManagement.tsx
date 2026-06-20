"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/utils/authStorage";
import { useSettings } from "./hooks/useSettings";
import { GROUP_META, GROUP_ORDER } from "./types";
import type { ParsedSetting } from "./types";
import styles from "./SettingsManagement.module.css";

type DraftValue = string | number | boolean;
type DraftMap = Record<string, DraftValue>;

export default function SettingsManagement() {
  const router = useRouter();
  const {
    grouped,
    loading,
    error,
    saveStatus,
    fetch,
    saveGroup,
    seedStatus,
    seedLoading,
    seedMessage,
    fetchSeedStatus,
    runSeed,
  } = useSettings();

  const [activeGroup, setActiveGroup] = useState("general");
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saveError, setSaveError] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void fetch();
    void fetchSeedStatus();
  }, [fetch, fetchSeedStatus]);

  useEffect(() => {
    if (
      error.includes("Token") ||
      error.includes("hết hạn") ||
      error.includes("đăng nhập")
    ) {
      clearAuth();
      router.push("/login");
    }
  }, [error, router]);

  useEffect(() => {
    const groups = Object.keys(grouped);
    if (groups.length && !groups.includes(activeGroup)) {
      setActiveGroup(groups[0]);
    }
  }, [activeGroup, grouped]);

  const groupKeys = useMemo(
    () =>
      Object.keys(grouped).sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a);
        const bi = GROUP_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }),
    [grouped]
  );

  const totalSettings = useMemo(
    () => Object.values(grouped).reduce((sum, items) => sum + items.length, 0),
    [grouped]
  );

  const activeSettings = grouped[activeGroup] ?? [];
  const filteredSettings = activeSettings.filter((setting) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      setting.key.toLowerCase().includes(term) ||
      (setting.description ?? "").toLowerCase().includes(term)
    );
  });

  function getDraft(
    key: string,
    original: string | number | boolean | null
  ): DraftValue {
    return key in drafts ? drafts[key] : original ?? "";
  }

  function setDraft(key: string, value: DraftValue) {
    setDrafts((current) => ({ ...current, [key]: value }));
  }

  function isDirty(setting: ParsedSetting) {
    return setting.key in drafts && drafts[setting.key] !== setting.value;
  }

  function hasChanges(settings: ParsedSetting[]) {
    return settings.some(isDirty);
  }

  function resetGroup(settings: ParsedSetting[]) {
    const keys = settings.map((setting) => setting.key);
    setDrafts((current) => {
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }

  async function handleSaveGroup(settings: ParsedSetting[]) {
    setSaveError("");
    const entries = settings
      .filter((setting) => setting.isEditable && isDirty(setting))
      .map((setting) => ({ key: setting.key, value: drafts[setting.key] }));

    if (entries.length === 0) return;

    try {
      await saveGroup(entries);
      setDrafts((current) => {
        const next = { ...current };
        entries.forEach((entry) => delete next[entry.key]);
        return next;
      });
    } catch (e: any) {
      setSaveError(e.message ?? "Lỗi lưu cấu hình");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>System settings</p>
          <h1>Cài đặt hệ thống</h1>
          <p>Cấu hình toàn bộ hoạt động của PickleClub.</p>
        </div>

        {!loading && seedStatus?.seeded && (
          <div className={styles.headerActions}>
            <button
              className={styles.btnSecondary}
              onClick={() => void runSeed(false)}
              disabled={seedLoading}
              title="Thêm các key mới chưa có vào DB"
            >
              {seedLoading ? "Đang seed..." : "Seed Data"}
            </button>
            <button
              className={styles.btnDangerSoft}
              onClick={() => setShowResetConfirm(true)}
              disabled={seedLoading}
              title="Reset tất cả về giá trị mặc định"
            >
              Reset Default
            </button>
          </div>
        )}
      </header>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Nhóm cấu hình</span>
          <strong>{groupKeys.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Tổng cấu hình</span>
          <strong>{seedStatus?.count ?? totalSettings}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Đang chỉnh sửa</span>
          <strong>{Object.keys(drafts).length}</strong>
        </div>
      </section>

      {error && !error.includes("Token") && (
        <div className={styles.errorBox}>{error}</div>
      )}

      {!loading && seedStatus !== null && !seedStatus.seeded && (
        <div className={styles.seedBanner}>
          <div>
            <h3>Chưa có dữ liệu cấu hình</h3>
            <p>
              Bảng SystemSettings trống ({seedStatus.count}/{seedStatus.total}).
              Chạy Seed để tạo các cấu hình mặc định.
            </p>
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => void runSeed(false)}
            disabled={seedLoading}
          >
            {seedLoading ? "Đang seed..." : "Chạy Seed"}
          </button>
        </div>
      )}

      {seedMessage && <div className={styles.successBox}>{seedMessage}</div>}

      <section className={styles.layout}>
        <nav className={styles.sidebar}>
          {loading
            ? [1, 2, 3, 4, 5].map((item) => (
                <div key={item} className={styles.navSkeleton} />
              ))
            : groupKeys.map((group) => {
                const meta = GROUP_META[group] ?? {
                  label: group,
                  icon: "⚙",
                  color: "#6B7280",
                };
                const settings = grouped[group] ?? [];
                const changed = hasChanges(settings);

                return (
                  <button
                    key={group}
                    className={`${styles.navItem} ${
                      activeGroup === group ? styles.navItemActive : ""
                    }`}
                    onClick={() => setActiveGroup(group)}
                  >
                    <span className={styles.navIcon} style={{ color: meta.color }}>
                      {meta.icon}
                    </span>
                    <span className={styles.navLabel}>{meta.label}</span>
                    <span className={styles.navCount}>{settings.length}</span>
                    {changed && <span className={styles.navDirty} />}
                  </button>
                );
              })}
        </nav>

        <div className={styles.content}>
          {loading ? (
            <SkeletonPanel />
          ) : (
            <GroupPanel
              group={activeGroup}
              settings={filteredSettings}
              allSettings={activeSettings}
              search={search}
              onSearch={setSearch}
              getDraft={getDraft}
              setDraft={setDraft}
              isDirty={isDirty}
              onSave={() => void handleSaveGroup(activeSettings)}
              onReset={() => resetGroup(activeSettings)}
              hasChanges={hasChanges(activeSettings)}
              saveStatus={saveStatus}
              saveError={saveError}
            />
          )}
        </div>
      </section>

      {showResetConfirm && (
        <ResetConfirmModal
          total={seedStatus?.total ?? totalSettings}
          loading={seedLoading}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            setShowResetConfirm(false);
            void runSeed(true);
          }}
        />
      )}
    </main>
  );
}

type GroupPanelProps = {
  group: string;
  settings: ParsedSetting[];
  allSettings: ParsedSetting[];
  search: string;
  onSearch: (value: string) => void;
  getDraft: (
    key: string,
    original: string | number | boolean | null
  ) => DraftValue;
  setDraft: (key: string, value: DraftValue) => void;
  isDirty: (setting: ParsedSetting) => boolean;
  onSave: () => void;
  onReset: () => void;
  hasChanges: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string;
};

function GroupPanel({
  group,
  settings,
  allSettings,
  search,
  onSearch,
  getDraft,
  setDraft,
  isDirty,
  onSave,
  onReset,
  hasChanges,
  saveStatus,
  saveError,
}: GroupPanelProps) {
  const meta = GROUP_META[group] ?? { label: group, icon: "⚙", color: "#6B7280" };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span className={styles.panelIcon} style={{ color: meta.color }}>
            {meta.icon}
          </span>
          <div>
            <h2>{meta.label}</h2>
            <p>{allSettings.length} cấu hình trong nhóm này</p>
          </div>
        </div>
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Tìm theo key hoặc mô tả..."
        />
      </div>

      <div className={styles.panelBody}>
        {settings.length === 0 ? (
          <div className={styles.emptyState}>Không tìm thấy cấu hình phù hợp.</div>
        ) : (
          settings.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              currentValue={getDraft(setting.key, setting.value)}
              onChange={(value) => setDraft(setting.key, value)}
              isDirty={isDirty(setting)}
            />
          ))
        )}
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.footerStatus}>
          {hasChanges && <span className={styles.unsavedHint}>Có thay đổi chưa lưu</span>}
          {saveError && <span className={styles.saveError}>{saveError}</span>}
        </div>
        <div className={styles.footerActions}>
          {hasChanges && (
            <button className={styles.btnGhost} onClick={onReset}>
              Hoàn tác
            </button>
          )}
          <button
            className={`${styles.btnPrimary} ${
              saveStatus === "saved" ? styles.btnSaved : ""
            }`}
            onClick={onSave}
            disabled={saveStatus === "saving" || !hasChanges}
          >
            {saveStatus === "saving"
              ? "Đang lưu..."
              : saveStatus === "saved"
                ? "Đã lưu"
                : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

type SettingRowProps = {
  setting: ParsedSetting;
  currentValue: DraftValue;
  onChange: (value: DraftValue) => void;
  isDirty: boolean;
};

function SettingRow({
  setting,
  currentValue,
  onChange,
  isDirty,
}: SettingRowProps) {
  const isPassword =
    setting.key.toLowerCase().includes("key") ||
    setting.key.toLowerCase().includes("secret") ||
    setting.key.toLowerCase().includes("password");

  return (
    <div className={`${styles.settingRow} ${isDirty ? styles.settingDirty : ""}`}>
      <div className={styles.settingInfo}>
        <div className={styles.settingKey}>{setting.key}</div>
        {setting.description && (
          <div className={styles.settingDesc}>{setting.description}</div>
        )}
        {setting.updatedAt && (
          <div className={styles.settingMeta}>
            Cập nhật: {new Date(setting.updatedAt).toLocaleString("vi-VN")}
          </div>
        )}
      </div>

      <div className={styles.settingControl}>
        {!setting.isEditable ? (
          <input className={styles.inputReadonly} value={String(currentValue)} readOnly />
        ) : setting.type === "boolean" ? (
          <BooleanToggle value={Boolean(currentValue)} onChange={onChange} isDirty={isDirty} />
        ) : setting.type === "number" ? (
          <input
            type="number"
            className={`${styles.inputNumber} ${isDirty ? styles.changed : ""}`}
            value={Number.isFinite(Number(currentValue)) ? Number(currentValue) : ""}
            onChange={(event) => {
              const value = event.target.value;
              onChange(value === "" ? "" : Number(value));
            }}
          />
        ) : setting.type === "json" ? (
          <textarea
            className={`${styles.inputTextarea} ${isDirty ? styles.changed : ""}`}
            value={String(currentValue)}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
          />
        ) : (
          <input
            type={isPassword ? "password" : "text"}
            className={`${styles.inputText} ${isDirty ? styles.changed : ""}`}
            value={String(currentValue)}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </div>
  );
}

function BooleanToggle({
  value,
  onChange,
  isDirty,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  isDirty: boolean;
}) {
  return (
    <div className={styles.toggleWrapper}>
      <button
        type="button"
        className={`${styles.toggleTrack} ${value ? styles.toggleTrackOn : ""}`}
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
      >
        <span className={`${styles.toggleThumb} ${value ? styles.toggleThumbOn : ""}`} />
      </button>
      <span className={`${styles.toggleLabel} ${isDirty ? styles.toggleDirty : ""}`}>
        {value ? "Bật" : "Tắt"}
      </span>
    </div>
  );
}

function ResetConfirmModal({
  total,
  loading,
  onCancel,
  onConfirm,
}: {
  total: number;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Reset về giá trị mặc định</h2>
        </div>
        <div className={styles.modalBody}>
          <p>
            Tất cả <strong>{total} cấu hình</strong> sẽ được reset về giá trị mặc định
            ban đầu. Các thay đổi đã lưu trước đó sẽ bị ghi đè.
          </p>
          <div className={styles.warningBox}>Hành động này không thể hoàn tác.</div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onCancel}>
            Hủy
          </button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? "Đang reset..." : "Xác nhận Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className={styles.skeletonPanel}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonCircle} />
        <div className={styles.skeletonLineLarge} />
      </div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className={styles.skeletonRow}>
          <div className={styles.skeletonRowLeft}>
            <div className={styles.skeletonLineSmall} />
            <div className={styles.skeletonLineLarge} />
          </div>
          <div className={styles.skeletonInput} />
        </div>
      ))}
    </div>
  );
}
