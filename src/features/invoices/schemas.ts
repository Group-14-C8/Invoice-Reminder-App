import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(1, "Add what this line is for"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price cannot be negative"),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Pick a client to bill"),
  invoiceNumber: z.string().min(1, "Add an invoice number"),
  issueDate: z.string().min(1, "Pick an issue date"),
  dueDate: z.string().min(1, "Pick a due date"),
  notes: z.string().optional(),
  currency: z.string().min(3, "Pick a currency"),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
