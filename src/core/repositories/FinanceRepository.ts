import {
  FinanceTransaction,
  FinanceAccount,
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
  // Accounts
  getAccounts(): Promise<FinanceAccount[]>;
  createAccount(account: Partial<FinanceAccount>): Promise<FinanceAccount>;
  updateAccountBalance(accountId: string, delta: number): Promise<void>;

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
  processDueRecurringTransactions(): Promise<void>;

  // Financial Analytics & Summary
  getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary>;
}
