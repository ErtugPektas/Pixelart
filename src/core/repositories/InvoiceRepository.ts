import { Invoice } from "../types";

export interface InvoiceRepository {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  create(invoice: Partial<Invoice>): Promise<Invoice>;
  updateStatus(id: string, status: Invoice["status"], paidAmount?: number): Promise<Invoice>;
  delete(id: string): Promise<boolean>;
}
