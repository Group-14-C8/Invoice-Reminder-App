import { env } from "../../config/env";

export interface UserPreferences {
  defaultCurrency: string;
  language: "en";
  timeZone: string;
}

const STORAGE_KEY = "settle:preferences";

export const defaultPreferences: UserPreferences = {
  defaultCurrency: env.defaultCurrency,
  language: "en",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const readPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPreferences;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null)
      return defaultPreferences;
    const record = parsed as Partial<UserPreferences>;
    return {
      defaultCurrency:
        record.defaultCurrency ?? defaultPreferences.defaultCurrency,
      language: "en",
      timeZone: record.timeZone ?? defaultPreferences.timeZone,
    };
  } catch {
    return defaultPreferences;
  }
};

export const savePreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences remain usable for the current session when storage is unavailable.
  }
};
