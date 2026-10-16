export const endpoints = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    me: "/api/auth/me",
  },
  clients: {
    list: "/api/clients",
    create: "/api/clients",
    detail: (id: string | number) => `/api/clients/${id}`,
    update: (id: string | number) => `/api/clients/${id}`,
    remove: (id: string | number) => `/api/clients/${id}`,
  },
  invoices: {
    list: "/api/invoices",
    create: "/api/invoices",
    detail: (id: string | number) => `/api/invoices/${id}`,
    remove: (id: string | number) => `/api/invoices/${id}`,
    markPaid: (id: string | number) => `/api/invoices/${id}/mark-paid`,
  },
  health: "/health",
} as const;
