import {
  FinanceTransaction,
  FinanceCategory,
  RecurringTransaction,
  FinancialSummary,
} from "../types";

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense" | "transfer";
  accountId?: string;
  categoryId?: string;
  clientId?: string;
  projectId?: string;
}

export interface FinanceRepository {

  // Categories
  getCategories(): Promise<FinanceCategory[]>;
  createCategory(category: Partial<FinanceCategory>): Promise<FinanceCategory>;

  // Transactions
  getTransactions(filter?: TransactionFilter): Promise<FinanceTransaction[]>;
  createTransaction(transaction: Partial<FinanceTransaction>): Promise<FinanceTransaction>;
  deleteTransaction(id: string): Promise<boolean>;

  // Recurring
  getRecurringTransactions(): Promise<RecurringTransaction[]>;
  createRecurringTransaction(recurring: Partial<RecurringTransaction>): Promise<RecurringTransaction>;
  updateRecurringTransaction(id: string, recurring: Partial<RecurringTransaction>): Promise<RecurringTransaction>;
  deleteRecurringTransaction(id: string): Promise<boolean>;
  processDueRecurringTransactions(): Promise<void>;

  // Financial Analytics & Summary
  getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary>;
}
