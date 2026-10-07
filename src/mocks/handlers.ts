import { http, HttpResponse } from "msw";
import { clients, invoices, users } from "./db";

const toBase64 = (value: Record<string, unknown>): string =>
  btoa(JSON.stringify(value));

const makeToken = (user: (typeof users)[number]): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    businessName: user.businessName,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  return `eyJhbGciOiJub25lIn0.${toBase64(payload)}.signature`;
};

const userForEmail = (email: string) =>
  users.find((user) => user.email === email);

export const handlers = [
  http.get("/health", () => HttpResponse.json({ ok: true })),

  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const match = userForEmail(email ?? "");

    if (!match || match.password !== password) {
      return HttpResponse.json(
        {
          title: "Unauthorized",
          detail: "Email or password is incorrect. Check both and try again.",
        },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      token: makeToken(match),
      user: {
        id: match.id,
        email: match.email,
        fullName: match.fullName,
        businessName: match.businessName,
        role: match.role,
      },
    });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
      businessName?: string;
    };
    const email = body.email ?? "";
    const password = body.password ?? "";
    const fullName = body.fullName ?? "New user";
    const businessName = body.businessName ?? "Business";

    if (!email || !password || password.length < 8) {
      return HttpResponse.json(
        {
          title: "Validation failed",
          errors: {
            email: ["Use a valid email"],
            password: ["Use at least 8 characters"],
          },
        },
        { status: 422 },
      );
    }

    const existing = userForEmail(email);
    if (existing) {
      return HttpResponse.json(
        { title: "Conflict", detail: "Account already exists." },
        { status: 409 },
      );
    }

    const user = {
      id: `user-${Date.now()}`,
      email,
      password,
      fullName,
      businessName,
      role: "User" as const,
    };

    users.push(user);
    return HttpResponse.json({
      token: makeToken(user),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        role: user.role,
      },
    });
  }),

  http.get("/api/clients", () => HttpResponse.json(clients)),
  http.post("/api/clients", async ({ request }) => {
    const payload = (await request.json()) as { name?: string; email?: string };
    const client = {
      id: `c-${Date.now()}`,
      name: payload.name ?? "New client",
      email: payload.email ?? "new@example.com",
    };
    clients.push(client);
    return HttpResponse.json(client, { status: 201 });
  }),
  http.put("/api/clients/:id", async ({ params, request }) => {
    const id = String(params.id);
    const payload = (await request.json()) as { name?: string; email?: string };
    const match = clients.find((client) => client.id === id);
    if (!match) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    match.name = payload.name ?? match.name;
    match.email = payload.email ?? match.email;
    return HttpResponse.json(match);
  }),
  http.delete("/api/clients/:id", ({ params }) => {
    const id = String(params.id);
    const index = clients.findIndex((client) => client.id === id);
    if (index === -1) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    clients.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/invoices", () => HttpResponse.json(invoices)),
  http.post("/api/invoices", async ({ request }) => {
    const payload = (await request.json()) as {
      invoiceNumber?: string;
      clientId?: string;
      totalAmount?: number;
      status?: string;
    };
    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: payload.invoiceNumber ?? "INV-0099",
      clientId: payload.clientId ?? clients[0]?.id ?? "c-1",
      clientName:
        clients.find((client) => client.id === payload.clientId)?.name ??
        "New client",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: (payload.status ?? "Draft") as
        "Draft" | "Sent" | "Paid" | "Overdue",
      totalAmount: payload.totalAmount ?? 0,
      currency: "NGN",
      items: [],
      paidDate: null,
    };
    invoices.push(invoice);
    return HttpResponse.json(invoice, { status: 201 });
  }),
  http.get("/api/invoices/:id", ({ params }) => {
    const invoice = invoices.find((entry) => entry.id === String(params.id));
    return invoice
      ? HttpResponse.json(invoice)
      : HttpResponse.json({ title: "Not found" }, { status: 404 });
  }),
  http.put("/api/invoices/:id", async ({ params, request }) => {
    const invoice = invoices.find((entry) => entry.id === String(params.id));
    if (!invoice) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    const payload = (await request.json()) as Partial<typeof invoice>;
    Object.assign(invoice, payload);
    return HttpResponse.json(invoice);
  }),
  http.delete("/api/invoices/:id", ({ params }) => {
    const index = invoices.findIndex((entry) => entry.id === String(params.id));
    if (index === -1) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    invoices.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post("/api/invoices/:id/mark-paid", ({ params }) => {
    const invoice = invoices.find((entry) => entry.id === String(params.id));
    if (!invoice) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    invoice.status = "Paid";
    invoice.paidDate = new Date().toISOString().slice(0, 10);
    return HttpResponse.json(invoice);
  }),
  http.post("/api/invoices/:id/send", ({ params }) => {
    const invoice = invoices.find((entry) => entry.id === String(params.id));
    if (!invoice) {
      return HttpResponse.json({ title: "Not found" }, { status: 404 });
    }
    invoice.status = "Sent";
    return HttpResponse.json({
      status: "sent",
      id: invoice.id,
      email:
        clients.find((client) => client.id === invoice.clientId)?.email ??
        "client@example.com",
    });
  }),

  http.get("/api/dashboard", () =>
    HttpResponse.json({
      totalUnpaid: 240000,
      totalPaid: 94000,
      totalOverdue: 240000,
      currency: "NGN",
    }),
  ),

  http.get("/api/admin/summary", () =>
    HttpResponse.json({
      totalOverdue: 240000,
      userCount: 2,
      invoicesByStatus: { Draft: 1, Sent: 1, Paid: 1, Overdue: 1 },
    }),
  ),
];
