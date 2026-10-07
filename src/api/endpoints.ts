export const endpoints = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
  },
  clients: {
    list: '/api/clients',
    create: '/api/clients',
    update: (id: string | number) => `/api/clients/${id}`,
    remove: (id: string | number) => `/api/clients/${id}`,
  },
  invoices: {
    list: '/api/invoices',
    create: '/api/invoices',
    detail: (id: string | number) => `/api/invoices/${id}`,
    update: (id: string | number) => `/api/invoices/${id}`,
    remove: (id: string | number) => `/api/invoices/${id}`,
    markPaid: (id: string | number) => `/api/invoices/${id}/mark-paid`,
    send: (id: string | number) => `/api/invoices/${id}/send`,
  },
  dashboard: '/api/dashboard',
  admin: {
    summary: '/api/admin/summary',
  },
  health: '/health',
} as const;
