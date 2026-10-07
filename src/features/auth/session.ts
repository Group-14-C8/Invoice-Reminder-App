const TOKEN_KEY = "settle:token";

export const getSessionToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setSessionToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The active session remains usable in memory when storage is unavailable.
  }
};

export const clearSessionToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Clearing in-memory auth still works when storage is unavailable.
  }
};

// localStorage is readable by injected scripts; replace this module if the API moves to HTTP-only cookies.
