import { supabase } from "@/lib/supabase";
import { InvoiceRepository } from "@/core/repositories/InvoiceRepository";
import { Invoice } from "@/core/types";

const LOCAL_STORAGE_KEY = "pixelart_invoices";

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    invoice_number: "INV-2026-001",
    type: "sales",
    client_id: "c1",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 864000000).toISOString().split("T")[0],
    subtotal: 10000,
    tax_rate: 20,
    tax_amount: 2000,
    total_amount: 12000,
    paid_amount: 0,
    currency: "TRY",
    status: "pending",
    created_at: new Date().toISOString(),
  },
];

export class SupabaseInvoiceRepository implements InvoiceRepository {
  private getLocal(): Invoice[] {
    if (typeof window === "undefined") return MOCK_INVOICES;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_INVOICES));
      return MOCK_INVOICES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_INVOICES;
    }
  }

  private saveLocal(list: Invoice[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  }

  async getAll(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, clients (*), projects (*)`)
        .order("issue_date", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as Invoice[];
      }
    } catch (e) {
      console.warn("Supabase invoices fetch warning:", e);
    }
    return this.getLocal();
  }

  async getById(id: string): Promise<Invoice | null> {
    const list = await this.getAll();
    return list.find((i) => i.id === id) || null;
  }

  async create(invoice: Partial<Invoice>): Promise<Invoice> {
    const subtotal = Number(invoice.subtotal || 0);
    const taxRate = Number(invoice.tax_rate || 20);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const newInvoice: Invoice = {
      id: "inv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      invoice_number: invoice.invoice_number || `INV-${Date.now().toString().slice(-6)}`,
      type: invoice.type || "sales",
      client_id: invoice.client_id || null,
      project_id: invoice.project_id || null,
      issue_date: invoice.issue_date || new Date().toISOString().split("T")[0],
      due_date: invoice.due_date || new Date().toISOString().split("T")[0],
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: Number(invoice.paid_amount || 0),
      currency: invoice.currency || "TRY",
      status: invoice.status || "pending",
      document_url: invoice.document_url || null,
      notes: invoice.notes || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: newInvoice.invoice_number,
          type: newInvoice.type,
          client_id: newInvoice.client_id,
          project_id: newInvoice.project_id,
          issue_date: newInvoice.issue_date,
          due_date: newInvoice.due_date,
          subtotal: newInvoice.subtotal,
          tax_rate: newInvoice.tax_rate,
          tax_amount: newInvoice.tax_amount,
          total_amount: newInvoice.total_amount,
          paid_amount: newInvoice.paid_amount,
          currency: newInvoice.currency,
          status: newInvoice.status,
          document_url: newInvoice.document_url,
          notes: newInvoice.notes,
        })
        .select(`*, clients (*), projects (*)`)
        .single();

      if (!error && data) {
        newInvoice.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase invoice insert warning:", e);
    }

    const current = this.getLocal();
    const updated = [newInvoice, ...current];
    this.saveLocal(updated);
    return newInvoice;
  }

  async updateStatus(
    id: string,
    status: Invoice["status"],
    paidAmount?: number
  ): Promise<Invoice> {
    const current = this.getLocal();
    const index = current.findIndex((i) => i.id === id);
    if (index !== -1) {
      current[index].status = status;
      if (typeof paidAmount === "number") {
        current[index].paid_amount = paidAmount;
      }
      this.saveLocal(current);
      return current[index];
    }
    throw new Error("Fatura bulunamadı");
  }

  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from("invoices").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase invoice delete warning:", e);
    }
    const current = this.getLocal().filter((i) => i.id !== id);
    this.saveLocal(current);
    return true;
  }
}
