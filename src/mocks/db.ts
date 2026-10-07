export type MockRole = "User" | "Admin";

export interface MockUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  role: MockRole;
}

export interface MockClient {
  id: string;
  name: string;
  email: string;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  totalAmount: number;
  currency: string;
  notes?: string;
  paidDate?: string | null;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export const users: MockUser[] = [
  {
    id: "u-1",
    email: "tola@tolaadeyemi.design",
    password: "Password123!",
    fullName: "Tola Adeyemi",
    businessName: "Tola Adeyemi Designs",
    role: "User",
  },
  {
    id: "u-2",
    email: "admin@taskflow.app",
    password: "Password123!",
    fullName: "Admin User",
    businessName: "TaskFlow Platform",
    role: "Admin",
  },
];

export const clients: MockClient[] = [
  { id: "c-1", name: "Mama Titi Bakes", email: "hello@mamatitibakes.com" },
  { id: "c-2", name: "Bluepine Labs", email: "team@bluepinelabs.com" },
  { id: "c-3", name: "Harbour & Pine Studio", email: "studio@harbourpine.co" },
];

export const invoices: MockInvoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-0042",
    clientId: "c-2",
    clientName: "Bluepine Labs",
    issueDate: "2026-09-01",
    dueDate: "2026-10-03",
    status: "Overdue",
    totalAmount: 240000,
    currency: "NGN",
    items: [
      { description: "Brand identity refresh", quantity: 1, unitPrice: 240000 },
    ],
    paidDate: null,
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-0043",
    clientId: "c-3",
    clientName: "Harbour & Pine Studio",
    issueDate: "2026-10-01",
    dueDate: "2026-10-18",
    status: "Sent",
    totalAmount: 1500000,
    currency: "NGN",
    items: [{ description: "Website design", quantity: 1, unitPrice: 1500000 }],
    paidDate: null,
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-0044",
    clientId: "c-1",
    clientName: "Mama Titi Bakes",
    issueDate: "2026-09-15",
    dueDate: "2026-10-20",
    status: "Paid",
    totalAmount: 94000,
    currency: "NGN",
    items: [{ description: "Packaging design", quantity: 1, unitPrice: 94000 }],
    paidDate: "2026-10-09",
  },
];

export const resetDb = (): void => {
  clients.splice(
    0,
    clients.length,
    ...[
      { id: "c-1", name: "Mama Titi Bakes", email: "hello@mamatitibakes.com" },
      { id: "c-2", name: "Bluepine Labs", email: "team@bluepinelabs.com" },
      {
        id: "c-3",
        name: "Harbour & Pine Studio",
        email: "studio@harbourpine.co",
      },
    ],
  );

  const seedInvoices: MockInvoice[] = [
    {
      id: "inv-1",
      invoiceNumber: "INV-0042",
      clientId: "c-2",
      clientName: "Bluepine Labs",
      issueDate: "2026-09-01",
      dueDate: "2026-10-03",
      status: "Overdue",
      totalAmount: 240000,
      currency: "NGN",
      items: [
        {
          description: "Brand identity refresh",
          quantity: 1,
          unitPrice: 240000,
        },
      ],
      paidDate: null,
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-0043",
      clientId: "c-3",
      clientName: "Harbour & Pine Studio",
      issueDate: "2026-10-01",
      dueDate: "2026-10-18",
      status: "Sent",
      totalAmount: 1500000,
      currency: "NGN",
      items: [
        { description: "Website design", quantity: 1, unitPrice: 1500000 },
      ],
      paidDate: null,
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-0044",
      clientId: "c-1",
      clientName: "Mama Titi Bakes",
      issueDate: "2026-09-15",
      dueDate: "2026-10-20",
      status: "Paid",
      totalAmount: 94000,
      currency: "NGN",
      items: [
        { description: "Packaging design", quantity: 1, unitPrice: 94000 },
      ],
      paidDate: "2026-10-09",
    },
  ];

  invoices.splice(0, invoices.length, ...seedInvoices);
};
