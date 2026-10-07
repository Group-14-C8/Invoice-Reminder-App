import { Outlet, Navigate } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useAuth } from "./features/auth/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function AuthenticatedShell() {
  const { user, role, logout } = useAuth();
  if (!user || !role) return <Navigate to="/login" replace />;
  return <AppShell role={role} user={user} onLogout={logout} />;
}

export function HomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />;
  return <Navigate to={role === "Admin" ? "/platform" : "/overview"} replace />;
}
