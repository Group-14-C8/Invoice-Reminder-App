import type { Client, Invoice, InvoiceItem } from "./types";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;

const readField = (record: UnknownRecord | undefined, key: string): unknown =>
  record?.[key] ?? record?.[key[0]!.toUpperCase() + key.slice(1)];

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
    id: toString(readField(record, "id"), "client-id"),
    name: toString(readField(record, "name"), "Client"),
    email: toString(readField(record, "email"), "client@example.com"),
  };
};

export const normalizeInvoiceItem = (input: unknown): InvoiceItem => {
  const record = asRecord(input);
  const id = readField(record, "id");
  return {
    id: id ? String(id) : undefined,
    description: toString(readField(record, "description"), "Service"),
    quantity: Math.max(1, toNumber(readField(record, "quantity"), 1)),
    unitPrice: Math.max(0, toNumber(readField(record, "unitPrice"), 0)),
  };
};

export const normalizeInvoice = (input: unknown): Invoice => {
  const record = asRecord(input);
  const clientName = readField(record, "clientName");
  const notes = readField(record, "notes");
  const currency = readField(record, "currency");

  return {
    id: toString(readField(record, "id"), "inv-0001"),
    invoiceNumber: toString(readField(record, "invoiceNumber"), "INV-0001"),
    clientId: toString(readField(record, "clientId"), ""),
    clientName: clientName ? toString(clientName, "") : undefined,
    issueDate: toString(
      readField(record, "issueDate"),
      new Date().toISOString().slice(0, 10),
    ),
    dueDate: toString(
      readField(record, "dueDate"),
      new Date().toISOString().slice(0, 10),
    ),
    status: (readField(record, "status") as Invoice["status"]) ?? "Draft",
    totalAmount: toNumber(readField(record, "totalAmount"), 0),
    notes: notes ? toString(notes, "") : undefined,
    paidDate: readField(record, "paidDate") as string | null | undefined,
    currency: currency ? toString(currency, "NGN") : "NGN",
    items: asArray<unknown>(readField(record, "items")).map(
      normalizeInvoiceItem,
    ),
    reminders: readField(record, "reminders") as Invoice["reminders"],
  };
};

export const normalizeClients = (payload: unknown): Client[] =>
  asArray<unknown>(payload).map(normalizeClient);

export const normalizeInvoices = (payload: unknown): Invoice[] =>
  asArray<unknown>(payload).map(normalizeInvoice);
