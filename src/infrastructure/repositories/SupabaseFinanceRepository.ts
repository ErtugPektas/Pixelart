import { supabase } from "@/lib/supabase";
import {
  FinanceTransaction,
  FinanceCategory,
  RecurringTransaction,
  FinancialSummary,
} from "@/core/types";
import { FinanceRepository, TransactionFilter } from "@/core/repositories/FinanceRepository";

export class SupabaseFinanceRepository implements FinanceRepository {
  // CATEGORIES
  async getCategories(): Promise<FinanceCategory[]> {
    const { data, error } = await supabase
      .from("finance_categories")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) console.error(error);
    return (data as FinanceCategory[]) || [];
  }

  async createCategory(category: Partial<FinanceCategory>): Promise<FinanceCategory> {
    const newCat = {
      name: category.name || "Yeni Kategori",
      type: category.type || "expense",
      parent_id: category.parent_id || null,
      description: category.description || null,
    };
    const { data, error } = await supabase.from("finance_categories").insert(newCat).select().single();
    if (error) throw error;
    return data as FinanceCategory;
  }

  // TRANSACTIONS
  async getTransactions(filter?: TransactionFilter): Promise<FinanceTransaction[]> {
    const { data, error } = await supabase
      .from("finance_transactions")
      .select(`
        *,
        finance_categories (*),
        clients (*),
        projects (*),
        invoices (*)
      `)
      .order("transaction_date", { ascending: false });

    if (error) console.error(error);
    return (data as unknown as FinanceTransaction[]) || [];
  }

  async createTransaction(transaction: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
    const amount = Number(transaction.amount || 0);
    const taxRate = Number(transaction.tax_rate || 0);
    const taxAmount = (amount * taxRate) / (100 + taxRate);
    const netAmount = amount - taxAmount;

    const newTx = {
      type: transaction.type || "income",
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
      transaction_date: transaction.transaction_date || new Date().toISOString().split("T")[0],
      description: transaction.description || null,
      document_url: transaction.document_url || null,
    };

    const { data, error } = await supabase.from("finance_transactions").insert(newTx).select().single();
    if (error) throw error;
    return data as unknown as FinanceTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
    const { data, error } = await supabase.from("finance_transactions").update(transaction).eq("id", id).select().single();
    if (error) throw error;
    return data as unknown as FinanceTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const { error } = await supabase.from("finance_transactions").delete().eq("id", id);
    if (error) return false;
    return true;
  }

  // RECURRING
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const { data, error } = await supabase.from("recurring_transactions").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    return (data as RecurringTransaction[]) || [];
  }

  async createRecurringTransaction(recurring: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    const newRec = {
      title: recurring.title || "Tekrarlayan İşlem",
      type: recurring.type || "expense",
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
    };

    const { data, error } = await supabase.from("recurring_transactions").insert(newRec).select().single();
    if (error) throw error;
    return data as RecurringTransaction;
  }

  async updateRecurringTransaction(id: string, recurring: Partial<RecurringTransaction>): Promise<RecurringTransaction> {
    const { data, error } = await supabase.from("recurring_transactions").update(recurring).eq("id", id).select().single();
    if (error) throw error;
    return data as RecurringTransaction;
  }

  async deleteRecurringTransaction(id: string): Promise<boolean> {
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    if (error) return false;
    return true;
  }

  async processDueRecurringTransactions(): Promise<void> {
    return;
  }

  // SUMMARY
  async getFinancialSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
    const { data, error } = await supabase.from("finance_transactions").select("*");
    if (error) {
      console.error(error);
      return { total_income: 0, total_expense: 0, net_profit: 0, total_tax_collected: 0, total_tax_paid: 0, pending_receivables: 0, pending_payables: 0 };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTaxCollected = 0;
    let totalTaxPaid = 0;

    for (const t of data) {
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
      pending_receivables: 0,
      pending_payables: 0,
    };
  }
}
