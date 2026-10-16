import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "../../api/types";
import { useAuth } from "./useAuth";

const pathForRole = (role: Role): string =>
  role === "Admin" ? "/platform" : "/overview";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) return <Outlet />;
  const next = `${location.pathname}${location.search}`;
  return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
}

export function RequireRole({ requiredRole }: { requiredRole: Role }) {
  const { isAuthenticated, role: currentRole } = useAuth();
  if (!isAuthenticated || !currentRole) return <Navigate to="/login" replace />;
  if (currentRole !== requiredRole)
    return <Navigate to={pathForRole(currentRole)} replace />;
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { isAuthenticated, role } = useAuth();
  return isAuthenticated && role ? (
    <Navigate to={pathForRole(role)} replace />
  ) : (
    <Outlet />
  );
}
