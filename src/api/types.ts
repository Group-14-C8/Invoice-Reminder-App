export type Role = 'User' | 'Admin';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface AuthResult {
  token: string;
  user: { id: string; email: string; fullName: string; businessName: string; role: Role };
}

export interface Client {
  id: string;
  name: string;
  email: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  notes?: string;
  paidDate?: string | null;
  currency?: string;
  items: InvoiceItem[];
  reminders?: { sentAt: string; type: 'BeforeDue' | 'Overdue'; success: boolean }[];
}

export interface UserSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalOverdue: number;
  currency?: string;
  byCurrency?: { currency: string; totalUnpaid: number; totalPaid: number; totalOverdue: number }[];
}

export interface AdminSummary {
  totalOverdue: number;
  userCount: number;
  overdueByCurrency?: { currency: string; amount: number }[];
  invoicesByStatus: Record<InvoiceStatus, number>;
  topOverdueUsers?: { userId: string; fullName: string; businessName?: string; overdueAmount: number; currency?: string }[];
}
