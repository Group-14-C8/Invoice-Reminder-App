import { createBrowserRouter } from "react-router-dom";
import App, { AuthenticatedShell, HomeRedirect } from "./App";
import { ForbiddenPage, NotFoundPage } from "./features/auth/AccessPage";
import {
  RedirectIfAuthed,
  RequireAuth,
  RequireRole,
} from "./features/auth/guards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      {
        path: "login",
        element: <RedirectIfAuthed />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("./features/auth/LoginPage")).LoginPage,
            }),
          },
        ],
      },
      {
        path: "register",
        element: <RedirectIfAuthed />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("./features/auth/RegisterPage"))
                .RegisterPage,
            }),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AuthenticatedShell />,
            children: [
              {
                element: <RequireRole requiredRole="User" />,
                children: [
                  {
                    path: "overview",
                    lazy: async () => ({
                      Component: (
                        await import("./features/dashboard/OverviewPage")
                      ).OverviewPage,
                    }),
                  },
                  {
                    path: "invoices",
                    lazy: async () => ({
                      Component: (
                        await import("./features/invoices/InvoicesPage")
                      ).InvoicesPage,
                    }),
                  },
                  {
                    path: "invoices/new",
                    lazy: async () => ({
                      Component: (
                        await import("./features/invoices/InvoiceCreatePage")
                      ).InvoiceCreatePage,
                    }),
                  },
                  {
                    path: "invoices/:id",
                    lazy: async () => ({
                      Component: (
                        await import("./features/invoices/InvoiceDetailPage")
                      ).InvoiceDetailPage,
                    }),
                  },
                  {
                    path: "clients",
                    lazy: async () => ({
                      Component: (
                        await import("./features/clients/ClientsPage")
                      ).ClientsPage,
                    }),
                  },
                ],
              },
              {
                element: <RequireRole requiredRole="Admin" />,
                children: [
                  {
                    path: "platform",
                    lazy: async () => ({
                      Component: (
                        await import("./features/dashboard/PlatformPage")
                      ).PlatformPage,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "403",
        element: <ForbiddenPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
      ...(import.meta.env.DEV
        ? [
            {
              path: "_kit",
              lazy: async () => ({
                Component: (await import("./components/ui/ComponentKitPage"))
                  .ComponentKitPage,
              }),
            },
          ]
        : []),
    ],
  },
]);
