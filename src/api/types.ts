export type Role = "User" | "Admin";
export type InvoiceStatus = "Unpaid" | "Paid" | "Overdue";
export type InvoiceStatusDto = "Unpaid" | "Paid";

export interface AuthResponseDto {
  token: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    businessName: string;
    role: Role;
  };
}

export interface Client {
  id: string;
  name: string;
  email: string;
}

export interface ClientResponseDto {
  id: number;
  name: string;
  email: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface InvoiceItemResponseDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatusDto;
  isOverdue: boolean;
  daysOverdue: number;
  paidDate: string | null;
  currency: string;
  total: number;
  items: InvoiceItemResponseDto[];
}

export interface InvoiceRequestDto {
  clientId: number;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  isOverdue: boolean;
  daysOverdue?: number;
  totalAmount: number;
  paidDate?: string | null;
  currency?: string;
  items: InvoiceItem[];
}

export interface UserSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalOverdue: number;
  currency?: string;
  byCurrency?: {
    currency: string;
    totalUnpaid: number;
    totalPaid: number;
    totalOverdue: number;
  }[];
}
