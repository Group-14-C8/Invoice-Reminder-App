import type { Client, Invoice, InvoiceItem } from "./types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;

const readField = (record: UnknownRecord | undefined, key: string): unknown => {
  if (!record) return undefined;
  const direct = record[key];
  if (direct !== undefined) return direct;
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  return record[pascalKey];
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const toString = (value: unknown, fallback = ""): string =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : fallback;

const toCalendarDate = (value: unknown): string => {
  const date = toString(value);
  return date.length >= 10 ? date.slice(0, 10) : date;
};

const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: T[] }).items;
  }

  return [];
};

export const normalizeClient = (input: unknown): Client => {
  const record = asRecord(input);
  return {
    id: toString(readField(record, "id")),
    name: toString(readField(record, "name")),
    email: toString(readField(record, "email")),
  };
};

export const normalizeInvoiceItem = (input: unknown): InvoiceItem => {
  const record = asRecord(input);
  const id = readField(record, "id");
  const quantity = readField(record, "quantity");
  const unitPrice = readField(record, "unitPrice");
  const lineTotal = readField(record, "lineTotal");

  return {
    id: id ? String(id) : undefined,
    description: toString(readField(record, "description")),
    quantity: Math.max(1, toNumber(quantity, 1)),
    unitPrice: Math.max(0, toNumber(unitPrice)),
    lineTotal: toNumber(lineTotal),
  };
};

export const normalizeInvoice = (input: unknown): Invoice => {
  const record = asRecord(input);
  const rawStatus = toString(readField(record, "status"), "Unpaid");
  const isOverdue = Boolean(readField(record, "isOverdue"));
  const totalAmount = toNumber(
    readField(record, "totalAmount") ?? readField(record, "total"),
    0,
  );
  const currency = readField(record, "currency");

  return {
    id: toString(readField(record, "id")),
    invoiceNumber: toString(readField(record, "invoiceNumber")),
    clientId: toString(readField(record, "clientId"), ""),
    clientName: toString(readField(record, "clientName"), "") || undefined,
    issueDate: toCalendarDate(readField(record, "issueDate")),
    dueDate: toCalendarDate(readField(record, "dueDate")),
    status: rawStatus === "Paid" ? "Paid" : isOverdue ? "Overdue" : "Unpaid",
    isOverdue,
    daysOverdue: toNumber(readField(record, "daysOverdue"), 0),
    totalAmount,
    paidDate: readField(record, "paidDate")
      ? toCalendarDate(readField(record, "paidDate"))
      : (readField(record, "paidDate") as null | undefined),
    currency: currency ? toString(currency, "NGN") : "NGN",
    items: asArray<unknown>(readField(record, "items")).map(
      normalizeInvoiceItem,
    ),
  };
};

export const normalizeClients = (payload: unknown): Client[] =>
  asArray<unknown>(payload).map(normalizeClient);

export const normalizeInvoices = (payload: unknown): Invoice[] =>
  asArray<unknown>(payload).map(normalizeInvoice);
