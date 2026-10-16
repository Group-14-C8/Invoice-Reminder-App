import { env } from "../config/env";
import { endpoints } from "./endpoints";
import { clearSessionToken, getSessionToken } from "../features/auth/session";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export class ValidationError extends HttpError {
  readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, status = 400) {
    super(status, "Validation failed");
    this.errors = errors;
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(
    message = "Can't reach the server. Check your connection and retry.",
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

const buildUrl = (path: string): string => {
  const base = env.apiBaseUrl.trim();
  if (!base) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export async function apiRequest<T>(
  input: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const signal = init.signal ?? controller.signal;

  try {
    const token = getSessionToken();
    const headers = new Headers(init.headers ?? {});
    if (
      !headers.has("Content-Type") &&
      !(init.body instanceof FormData) &&
      init.body !== undefined
    ) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(buildUrl(input), {
      ...init,
      headers,
      signal,
    });

    if (response.status === 401) {
      const payload = (await response.json().catch(() => null)) as {
        message?: unknown;
        detail?: unknown;
        title?: unknown;
      } | null;
      const detail =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.detail === "string"
            ? payload.detail
            : typeof payload?.title === "string"
              ? payload.title
              : "";
      if (token && input !== endpoints.auth.login) {
        clearSessionToken();
        const next = window.location.pathname + window.location.search;
        const query = new URLSearchParams({
          next,
          reason: "session-ended",
        });
        window.location.assign(`/login?${query.toString()}`);
        throw new HttpError(401, "");
      }
      throw new HttpError(401, detail);
    }

    if (response.status === 403) {
      window.location.assign("/403");
      throw new HttpError(403, "You do not have access to this page.");
    }

    if (response.status === 400 || response.status === 422) {
      const payload = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const errors = payload.errors;
      if (errors && typeof errors === "object" && !Array.isArray(errors)) {
        throw new ValidationError(
          errors as Record<string, string[]>,
          response.status,
        );
      }
      const message =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.detail === "string"
            ? payload.detail
            : "The request was invalid.";
      throw new HttpError(response.status, message);
    }

    if (response.status >= 500) {
      throw new HttpError(
        response.status,
        "The server hit a problem. Try again in a moment.",
      );
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: unknown;
        detail?: unknown;
        title?: unknown;
      } | null;
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.detail === "string"
            ? payload.detail
            : typeof payload?.title === "string"
              ? payload.title
              : "";
      throw new HttpError(response.status, message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return response.headers.get("Content-Type")?.includes("json")
      ? (JSON.parse(text) as T)
      : (text as T);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new NetworkError("Request was cancelled.");
    }

    if (error instanceof TypeError) {
      throw new NetworkError(
        "Can't reach the server. Check your connection and retry.",
      );
    }

    throw error;
  }
}

export const defineTimeout = (durationMs: number): AbortSignal => {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), durationMs);
  return controller.signal;
};
