// Global app settings — persisted to localStorage

const STORAGE_KEY = "app_settings_v1";

export type TournamentMode = "qualifier" | "double_elim";

export interface AppSettings {
  muted: boolean;
  volume: number; // 0–100
  tournamentMode: TournamentMode;
}

const DEFAULTS: AppSettings = {
  muted: false,
  volume: 80,
  tournamentMode: "double_elim",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function patchSettings(patch: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const next = { ...current, ...patch };
  saveSettings(next);
  return next;
}
