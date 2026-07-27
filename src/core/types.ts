export type UserRole = 'admin' | 'manager' | 'designer' | 'accountant' | 'client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type ClientType = 'individual' | 'company';
export type ClientStatus = 'active' | 'archived';

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  company_title?: string | null;
  tax_office?: string | null;
  tax_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  status: ClientStatus;
  created_at: string;
}

export type ProjectStatus = 'lead' | 'in_progress' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  client_id?: string | null;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  budget: number;
  currency: string;
  start_date: string;
  end_date?: string | null;
  created_at: string;
  clients?: Client | null;
}

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'pos';

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export type CategoryType = 'income' | 'expense';

export interface FinanceCategory {
  id: string;
  parent_id?: string | null;
  name: string;
  type: CategoryType;
  description?: string | null;
  created_at: string;
  subcategories?: FinanceCategory[];
}

export type InvoiceType = 'sales' | 'purchase';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  type: InvoiceType;
  client_id?: string | null;
  project_id?: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: string;
  status: InvoiceStatus;
  document_url?: string | null;
  notes?: string | null;
  created_at: string;
  clients?: Client | null;
  projects?: Project | null;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  account_id: string;
  to_account_id?: string | null;
  category_id?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  invoice_id?: string | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  net_amount: number;
  tax_rate: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  transaction_date: string;
  description?: string | null;
  document_url?: string | null;
  created_at: string;
  finance_accounts?: FinanceAccount | null;
  finance_categories?: FinanceCategory | null;
  clients?: Client | null;
  projects?: Project | null;
  invoices?: Invoice | null;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurrenceStatus = 'active' | 'paused' | 'completed';

export interface RecurringTransaction {
  id: string;
  title: string;
  type: TransactionType;
  account_id: string;
  category_id?: string | null;
  client_id?: string | null;
  amount: number;
  currency: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string | null;
  last_processed_date?: string | null;
  next_due_date: string;
  auto_process: boolean;
  status: RecurrenceStatus;
  created_at: string;
  finance_accounts?: FinanceAccount | null;
  finance_categories?: FinanceCategory | null;
  clients?: Client | null;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  client_id: string;
  service_title: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  notes?: string | null;
  status: AppointmentStatus;
  created_at: string;
  clients?: Client | null;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  total_tax_collected: number;
  total_tax_paid: number;
  pending_receivables: number;
  pending_payables: number;
  account_balances: FinanceAccount[];
}
