import { supabase } from "@/lib/supabase";
import {
  FinanceRepository,
  TransactionFilter,
} from "@/core/repositories/FinanceRepository";
import {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  RecurringTransaction,
  FinancialSummary,
} from "@/core/types";

const MOCK_ACCOUNTS: FinanceAccount[] = [
  { id: "acc1", name: "Ana Kasa", type: "cash", currency: "TRY", balance: 15000, is_active: true, created_at: new Date().toISOString() },
  { id: "acc2", name: "Ziraat Bankası Ticari", type: "bank", currency: "TRY", balance: 85000, is_active: true, created_at: new Date().toISOString() },
  { id: "acc3", name: "Garanti USD Hesabı", type: "bank", currency: "USD", balance: 4200, is_active: true, created_at: new Date().toISOString() },
];

const MOCK_CATEGORIES: FinanceCategory[] = [
  { id: "cat1", name: "Tasarım & Proje Gelirleri", type: "income", description: "PixelArt özel tasarım", created_at: new Date().toISOString() },
  { id: "cat2", name: "Yazılım Lisansları & Tooling", type: "expense", description: "SaaS araçlar", created_at: new Date().toISOString() },
  { id: "cat3", name: "Operasyonel & Ofis", type: "expense", description: "Ofis kirası & faturalar", created_at: new Date().toISOString() },
];

const MOCK_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: "tx1",
    type: "income",
    account_id: "acc2",
    category_id: "cat1",
    client_id: "c1",
    amount: 15000,
    currency: "TRY",
    exchange_rate: 1,
    net_amount: 12500,
    tax_rate: 20,
    tax_amount: 2500,
    payment_method: "bank_transfer",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "Kurumsal UI/UX Tasarım Ön Ödemesi",
    created_at: new Date().toISOString(),
    finance_accounts: MOCK_ACCOUNTS[1],
  },
];

const MOCK_RECURRING: RecurringTransaction[] = [
  {
    id: "rec1",
    title: "Figma & Adobe Kurumsal Lisans",
    type: "expense",
    account_id: "acc2",
    category_id: "cat2",
    amount: 2400,
    currency: "TRY",
    frequency: "monthly",
    start_date: new Date().toISOString().split("T")[0],
    next_due_date: new Date().toISOString().split("T")[0],
    auto_process: true,
    status: "active",
    created_at: new Date().toISOString(),
  },
];

export class SupabaseFinanceRepository implements FinanceRepository {
  private getLocalAccounts(): FinanceAccount[] {
    if (typeof window === "undefined") return MOCK_ACCOUNTS;
    const stored = localStorage.getItem("pixelart_accounts");
    if (!stored) {
      localStorage.setItem("pixelart_accounts", JSON.stringify(MOCK_ACCOUNTS));
      return MOCK_ACCOUNTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_ACCOUNTS;
    }
  }

  private saveLocalAccounts(list: FinanceAccount[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("pixelart_accounts", JSON.stringify(list));
    }
  }

  private getLocalTransactions(): FinanceTransaction[] {
    if (typeof window === "undefined") return MOCK_TRANSACTIONS;
    const stored = localStorage.getItem("pixelart_transactions");
    if (!stored) {
      localStorage.setItem("pixelart_transactions", JSON.stringify(MOCK_TRANSACTIONS));
      return MOCK_TRANSACTIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_TRANSACTIONS;
    }
  }

  private saveLocalTransactions(list: FinanceTransaction[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("pixelart_transactions", JSON.stringify(list));
    }
  }

  // ACCOUNTS
  async getAccounts(): Promise<FinanceAccount[]> {
    try {
      const { data, error } = await supabase
        .from("finance_accounts")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as FinanceAccount[];
      }
    } catch (e) {
      console.warn("Supabase accounts fetch warning:", e);
    }
    return this.getLocalAccounts();
  }

  async createAccount(account: Partial<FinanceAccount>): Promise<FinanceAccount> {
    const newAcc: FinanceAccount = {
      id: "acc_" + Date.now(),
      name: account.name || "Yeni Hesap",
      type: account.type || "bank",
      currency: account.currency || "TRY",
      balance: Number(account.balance || 0),
      is_active: account.is_active ?? true,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("finance_accounts")
        .insert({
          name: newAcc.name,
          type: newAcc.type,
          currency: newAcc.currency,
          balance: newAcc.balance,
          is_active: newAcc.is_active,
        })
        .select()
        .single();

      if (!error && data) {
        newAcc.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase create account warning:", e);
    }

    const current = this.getLocalAccounts();
    const updated = [...current, newAcc];
    this.saveLocalAccounts(updated);
    return newAcc;
  }

  async updateAccountBalance(accountId: string, delta: number): Promise<void> {
    const current = this.getLocalAccounts();
    const index = current.findIndex((a) => a.id === accountId);
    if (index !== -1) {
      current[index].balance += delta;
      this.saveLocalAccounts(current);
    }
  }

  // CATEGORIES
  async getCategories(): Promise<FinanceCategory[]> {
    try {
      const { data, error } = await supabase
        .from("finance_categories")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as FinanceCategory[];
      }
    } catch (e) {
      console.warn("Supabase categories warning:", e);
    }
    return MOCK_CATEGORIES;
  }

  async createCategory(category: Partial<FinanceCategory>): Promise<FinanceCategory> {
    const newCat: FinanceCategory = {
      id: "cat_" + Date.now(),
      name: category.name || "Yeni Kategori",
      type: category.type || "expense",
      parent_id: category.parent_id || null,
      description: category.description || null,
      created_at: new Date().toISOString(),
    };
    return newCat;
  }

  // TRANSACTIONS
  async getTransactions(filter?: TransactionFilter): Promise<FinanceTransaction[]> {
    try {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select(`
          *,
          finance_accounts (*),
          finance_categories (*),
          clients (*),
          projects (*),
          invoices (*)
        `)
        .order("transaction_date", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as FinanceTransaction[];
      }
    } catch (e) {
      console.warn("Supabase transactions fetch warning:", e);
    }
    return this.getLocalTransactions();
  }

  async createTransaction(
    transaction: Partial<FinanceTransaction>
  ): Promise<FinanceTransaction> {
    const amount = Number(transaction.amount || 0);
    const taxRate = Number(transaction.tax_rate || 0);
    const taxAmount = (amount * taxRate) / (100 + taxRate);
    const netAmount = amount - taxAmount;

    const newTx: FinanceTransaction = {
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      type: transaction.type || "income",
      account_id: transaction.account_id || "acc1",
      to_account_id: transaction.to_account_id || null,
      category_id: transaction.category_id || null,
      client_id: transaction.client_id || null,
      project_id: transaction.project_id || null,
      invoice_id: transaction.invoice_id || null,
      amount,
      currency: transaction.currency || "TRY",
      exchange_rate: transaction.exchange_rate || 1.0,
      net_amount: netAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      payment_method: transaction.payment_method || "bank_transfer",
      transaction_date:
        transaction.transaction_date || new Date().toISOString().split("T")[0],
      description: transaction.description || null,
      document_url: transaction.document_url || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("finance_transactions")
        .insert({
          type: newTx.type,
          account_id: newTx.account_id,
          to_account_id: newTx.to_account_id,
          category_id: newTx.category_id,
          client_id: newTx.client_id,
          project_id: newTx.project_id,
          invoice_id: newTx.invoice_id,
          amount: newTx.amount,
          currency: newTx.currency,
          exchange_rate: newTx.exchange_rate,
          net_amount: newTx.net_amount,
          tax_rate: newTx.tax_rate,
          tax_amount: newTx.tax_amount,
          payment_method: newTx.payment_method,
          transaction_date: newTx.transaction_date,
          description: newTx.description,
          document_url: newTx.document_url,
        })
        .select(`*, finance_accounts (*)`)
        .single();

      if (!error && data) {
        newTx.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase transaction insert warning:", e);
    }

    if (newTx.type === "income") {
      await this.updateAccountBalance(newTx.account_id, amount);
    } else if (newTx.type === "expense") {
      await this.updateAccountBalance(newTx.account_id, -amount);
    }

    const current = this.getLocalTransactions();
    const updated = [newTx, ...current];
    this.saveLocalTransactions(updated);
    return newTx;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const current = this.getLocalTransactions();
    const tx = current.find((t) => t.id === id);
    if (tx) {
      const amount = Number(tx.amount);
      if (tx.type === "income") {
        await this.updateAccountBalance(tx.account_id, -amount);
      } else if (tx.type === "expense") {
        await this.updateAccountBalance(tx.account_id, amount);
      }
    }
    const updated = current.filter((t) => t.id !== id);
    this.saveLocalTransactions(updated);
    return true;
  }

  // RECURRING TRANSACTIONS
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    return MOCK_RECURRING;
  }

  async createRecurringTransaction(
    recurring: Partial<RecurringTransaction>
  ): Promise<RecurringTransaction> {
    const newRec: RecurringTransaction = {
      id: "rec_" + Date.now(),
      title: recurring.title || "Tekrarlayan İşlem",
      type: recurring.type || "expense",
      account_id: recurring.account_id || "acc1",
      category_id: recurring.category_id || null,
      client_id: recurring.client_id || null,
      amount: Number(recurring.amount || 0),
      currency: recurring.currency || "TRY",
      frequency: recurring.frequency || "monthly",
      start_date: recurring.start_date || new Date().toISOString().split("T")[0],
      end_date: recurring.end_date || null,
      next_due_date: recurring.next_due_date || new Date().toISOString().split("T")[0],
      auto_process: recurring.auto_process ?? true,
      status: recurring.status || "active",
      created_at: new Date().toISOString(),
    };
    MOCK_RECURRING.unshift(newRec);
    return newRec;
  }

  async processDueRecurringTransactions(): Promise<void> {
    return;
  }

  // FINANCIAL SUMMARY & ANALYTICS
  async getFinancialSummary(
    startDate?: string,
    endDate?: string
  ): Promise<FinancialSummary> {
    const txList = this.getLocalTransactions();
    const accounts = this.getLocalAccounts();

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTaxCollected = 0;
    let totalTaxPaid = 0;

    for (const t of txList) {
      const amt = Number(t.amount || 0);
      const tax = Number(t.tax_amount || 0);

      if (t.type === "income") {
        totalIncome += amt;
        totalTaxCollected += tax;
      } else if (t.type === "expense") {
        totalExpense += amt;
        totalTaxPaid += tax;
      }
    }

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_profit: totalIncome - totalExpense,
      total_tax_collected: totalTaxCollected,
      total_tax_paid: totalTaxPaid,
      pending_receivables: 12000,
      pending_payables: 0,
      account_balances: accounts,
    };
  }
}
