export type InvoiceFormValues = {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  currency: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
};
