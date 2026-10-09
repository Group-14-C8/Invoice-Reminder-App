import { render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../features/auth/authContext";
import { RequireAuth, RequireRole } from "../features/auth/guards";
import { decodeJwt, roleFromClaims } from "../features/auth/jwt";

function GuardHarness({
  initialPath = "/overview",
  accessRole = "User",
}: {
  initialPath?: string;
  accessRole?: "User" | "Admin";
}) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider
        value={{
          user: {
            id: "u-1",
            email: "user@example.com",
            fullName: "Example User",
            businessName: "Example Co",
            role: accessRole,
          },
          role: accessRole,
          isAuthenticated: true,
          login: async () => {
            throw new Error("login should not be called in auth guard tests");
          },
          register: async () => {
            throw new Error(
              "register should not be called in auth guard tests",
            );
          },
          logout: () => undefined,
        }}
      >
        <Routes>
          <Route path="/login" element={<Navigate to="/overview" replace />} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole requiredRole="User" />}>
              <Route
                path="/overview"
                element={
                  <main>
                    <h1>User workspace</h1>
                  </main>
                }
              />
            </Route>
            <Route element={<RequireRole requiredRole="Admin" />}>
              <Route
                path="/platform"
                element={
                  <main>
                    <h1>Platform workspace</h1>
                  </main>
                }
              />
            </Route>
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe("Phase 3 authentication", () => {
  it("allows the matching role to access its workspace and redirects mismatched roles", () => {
    const userWorkspace = render(<GuardHarness accessRole="User" />);

    expect(
      screen.getByRole("heading", { name: "User workspace" }),
    ).toBeInTheDocument();
    userWorkspace.unmount();

    const adminWorkspace = render(
      <GuardHarness accessRole="Admin" initialPath="/platform" />,
    );
    expect(
      screen.getByRole("heading", { name: "Platform workspace" }),
    ).toBeInTheDocument();
    adminWorkspace.unmount();

    render(<GuardHarness accessRole="User" initialPath="/platform" />);
    expect(
      screen.getByRole("heading", { name: "User workspace" }),
    ).toBeInTheDocument();
  });

  it("decodes both supported role claim names", () => {
    const directToken = `header.${btoa(JSON.stringify({ role: "User" }))}.sig`;
    const aspNetToken = `header.${btoa(
      JSON.stringify({
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Admin",
      }),
    )}.sig`;

    expect(roleFromClaims(decodeJwt(directToken) ?? {})).toBe("User");
    expect(roleFromClaims(decodeJwt(aspNetToken) ?? {})).toBe("Admin");
  });
});
