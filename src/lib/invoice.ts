import { currencyFractionDigits } from "./money";
import type { Invoice, InvoiceItem, InvoiceStatus } from "../api/types";

export const effectiveStatus = (
  invoice: Pick<Invoice, "status" | "dueDate" | "paidDate">,
  now: Date = new Date(),
): InvoiceStatus => {
  if (invoice.status === "Paid") return "Paid";
  if (invoice.status === "Draft") return "Draft";

  const today = toCalendarDate(now);
  if (invoice.dueDate < today) {
    return "Overdue";
  }

  return invoice.status;
};

export const toCalendarDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const invoiceTotal = (
  items: InvoiceItem[],
  currency = "NGN",
): number => {
  const decimals = currencyFractionDigits(currency);
  const factor = 10 ** decimals;
  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  return Math.round(total * factor) / factor;
};

export const nextReminder = (
  invoice: Pick<Invoice, "dueDate" | "status" | "paidDate">,
  now: Date = new Date(),
): { label: string; days: number | null } | null => {
  if (invoice.status === "Paid" || invoice.status === "Draft") {
    return null;
  }

  const due = toDate(invoice.dueDate);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const different = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

  if (different <= -7) {
    return { label: "No next reminder", days: null };
  }

  if (different <= -2) {
    return { label: "Next reminder in 7 days", days: 7 };
  }

  if (different <= 3) {
    return { label: "Due soon", days: different };
  }

  return { label: "Next reminder in 3 days", days: 3 };
};

const toDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
};
