import type { AuthResult, Role } from "../../api/types";

export type JwtClaims = Record<string, unknown>;

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const ID_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

export const decodeJwt = (token: string): JwtClaims | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as JwtClaims)
      : null;
  } catch {
    return null;
  }
};

const readString = (claims: JwtClaims, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
};

export const roleFromClaims = (claims: JwtClaims): Role | null => {
  const candidate = claims.role ?? claims[ROLE_CLAIM];
  const role = Array.isArray(candidate) ? candidate[0] : candidate;
  return role === "User" || role === "Admin" ? role : null;
};

export const expiryFromClaims = (claims: JwtClaims): number | null => {
  const expiry = claims.exp;
  return typeof expiry === "number" && Number.isFinite(expiry)
    ? expiry * 1000
    : null;
};

export const userFromClaims = (
  claims: JwtClaims,
  role: Role,
): AuthResult["user"] => {
  const email = readString(claims, ["email", "upn"]) ?? "";
  return {
    id: readString(claims, ["sub", "nameid", ID_CLAIM]) ?? email,
    email,
    fullName: readString(claims, ["fullName", "name", NAME_CLAIM]) ?? email,
    businessName: readString(claims, ["businessName", "business_name"]) ?? "",
    role,
  };
};
