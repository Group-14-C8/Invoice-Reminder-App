import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Add what this line is for").max(300),
  quantity: z.number().min(1, "Quantity must be at least 1").max(100000),
  unitPrice: z
    .number()
    .min(0.01, "Price must be greater than zero")
    .max(1_000_000_000),
});

export const invoiceSchema = z
  .object({
    clientId: z.string().min(1, "Pick a client to bill"),
    issueDate: z.string().min(1, "Pick an issue date"),
    dueDate: z.string().min(1, "Pick a due date"),
    currency: z.string().length(3, "Currency must be a 3-character code"),
    items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
  })
  .refine((values) => values.dueDate >= values.issueDate, {
    path: ["dueDate"],
    message: "Due date cannot be before the issue date.",
  });

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
