import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AuthResponseDto, AuthResult, Role } from "../../api/types";
import { apiRequest } from "../../api/http";
import { endpoints } from "../../api/endpoints";
import { useTranslation } from "react-i18next";
import { notify } from "../../components/ui/notify";
import { AuthContext, type AuthContextValue } from "./authContext";
import { clearSessionToken, getSessionToken, setSessionToken } from "./session";
import {
  decodeJwt,
  expiryFromClaims,
  roleFromClaims,
  userFromClaims,
} from "./jwt";

interface AuthState {
  user: AuthResult["user"];
  role: Role;
  expiresAt: number;
}

const restoreSession = (): AuthState | null => {
  const token = getSessionToken();
  if (!token) return null;

  const claims = decodeJwt(token);
  const role = claims ? roleFromClaims(claims) : null;
  const expiresAt = claims ? expiryFromClaims(claims) : null;
  if (!claims || !role || !expiresAt || expiresAt <= Date.now()) {
    clearSessionToken();
    return null;
  }

  return { user: userFromClaims(claims, role), role, expiresAt };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [auth, setAuth] = useState<AuthState | null>(restoreSession);

  useEffect(() => {
    if (!auth) return;
    const remaining = auth.expiresAt - Date.now();
    if (remaining <= 0) {
      clearSessionToken();
      setAuth(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      clearSessionToken();
      const next = `${location.pathname}${location.search}`;
      navigate(`/login?reason=session-ended&next=${encodeURIComponent(next)}`, {
        replace: true,
      });
      setAuth(null);
      notify.error(t("auth.sessionEnded"));
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [auth, location.pathname, location.search, navigate, t]);

  const acceptAuthResult = (
    result: AuthResult | AuthResponseDto,
  ): AuthResult => {
    const token = result.token;
    if (!token) throw new Error(t("auth.invalidResponse"));

    const claims = decodeJwt(token);
    const role = claims ? roleFromClaims(claims) : null;
    const expiresAt = claims ? expiryFromClaims(claims) : null;
    if (!role || !expiresAt) throw new Error(t("auth.invalidResponse"));

    const normalizedUser =
      "user" in result
        ? { ...result.user, role }
        : {
            id:
              (claims ? (claims.sub as string | undefined) : undefined) ??
              result.email,
            email: result.email,
            fullName:
              (claims ? (claims.fullName as string | undefined) : undefined) ??
              result.email,
            businessName:
              (claims
                ? (claims.businessName as string | undefined)
                : undefined) ?? "",
            role,
          };

    setSessionToken(token);
    setAuth({ user: normalizedUser, role, expiresAt });
    return { token, user: normalizedUser };
  };

  const login: AuthContextValue["login"] = async (credentials) => {
    const result = await apiRequest<AuthResponseDto>(endpoints.auth.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return acceptAuthResult(result);
  };

  const register: AuthContextValue["register"] = async (details) => {
    const result = await apiRequest<AuthResponseDto>(endpoints.auth.register, {
      method: "POST",
      body: JSON.stringify(details),
    });
    return acceptAuthResult(result);
  };

  const logout = (): void => {
    clearSessionToken();
    navigate("/login", { replace: true });
    setAuth(null);
  };

  const value: AuthContextValue = {
    user: auth?.user ?? null,
    role: auth?.role ?? null,
    isAuthenticated: auth !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
