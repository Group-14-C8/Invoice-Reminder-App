const raw = import.meta.env;

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL ?? "",
  appName: raw.VITE_APP_NAME ?? "TaskFlow",
  defaultCurrency: raw.VITE_DEFAULT_CURRENCY ?? "NGN",
  currencyMode: (raw.VITE_CURRENCY_MODE ?? "single") as "single" | "multi",
} as const;
