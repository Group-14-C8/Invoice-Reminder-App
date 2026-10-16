import { describe, expect, it } from "vitest";
import {
  normalizeClient,
  normalizeClients,
  normalizeInvoice,
} from "../api/adapters";
import {
  formatMoney,
  formatMoneyDraft,
  formatMoneyInput,
  parseMoney,
} from "../lib/money";

describe("foundation setup", () => {
  it("normalizes client payloads derived from the ASP.NET DTOs", () => {
    const clients = normalizeClients([
      { id: 1, name: "Bluepine Labs", email: "team@bluepinelabs.com" },
    ]);

    expect(clients).toHaveLength(1);
    expect(clients[0]?.email).toBe("team@bluepinelabs.com");
    expect(
      normalizeClient({
        id: 2,
        Name: "Northwind",
        Email: "hello@northwind.test",
      }).name,
    ).toBe("Northwind");
  });

  it("normalizes invoice payloads derived from code, not a live response", () => {
    const invoice = normalizeInvoice({
      Id: 42,
      InvoiceNumber: "INV-0042",
      ClientId: 1,
      ClientName: "Bluepine Labs",
      IssueDate: "2026-10-01T00:00:00Z",
      DueDate: "2026-10-18T00:00:00Z",
      Status: "Unpaid",
      IsOverdue: true,
      DaysOverdue: 4,
      Total: "240000.00",
      Currency: "NGN",
      Items: [
        {
          Id: 1,
          Description: "Brand refresh",
          Quantity: 2,
          UnitPrice: 120000,
          LineTotal: 240000,
        },
      ],
    });

    expect(invoice.totalAmount).toBe(240000);
    expect(invoice.items[0]?.description).toBe("Brand refresh");
    expect(invoice.status).toBe("Overdue");
    expect(invoice.currency).toBe("NGN");
    expect(invoice.items[0]?.lineTotal).toBe(240000);
    expect(invoice.issueDate).toBe("2026-10-01");
    expect(invoice.dueDate).toBe("2026-10-18");
  });

  it("formats and parses money using the selected locale", () => {
    expect(formatMoney(1500, "USD", "en-US", { compactWhole: true })).toBe(
      "$1,500",
    );
    expect(formatMoney(1500.5, "USD", "de-DE")).toContain("1.500,50");
    expect(parseMoney("1,500.50", "USD", "en-US")).toBe(1500.5);
    expect(parseMoney("1.500,50", "EUR", "de-DE")).toBe(1500.5);
    expect(parseMoney("-12.00", "USD", "en-US")).toBeNull();
    expect(formatMoneyInput(1250, "USD", "en-US")).toBe("1,250");
    expect(formatMoneyDraft("1234.5", "USD", "en-US")).toBe("1,234.5");
    expect(formatMoneyDraft("1.234,5", "USD", "en-US")).toBe("1,234.5");
    expect(formatMoneyDraft("1,234", "KWD", "en-US")).toBe("1,234");
    expect(parseMoney("1,234", "KWD", "en-US")).toBe(1234);
  });
});
