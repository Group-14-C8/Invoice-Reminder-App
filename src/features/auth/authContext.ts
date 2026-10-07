import { createContext } from "react";
import type { AuthResult, Role } from "../../api/types";

export interface AuthContextValue {
  user: AuthResult["user"] | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  register: (details: {
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
