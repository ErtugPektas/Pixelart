"use client";

import { useEffect, useState } from "react";
import { SupabaseInvoiceRepository } from "@/infrastructure/repositories/SupabaseInvoiceRepository";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { SupabaseProjectRepository } from "@/infrastructure/repositories/SupabaseProjectRepository";
import { Invoice, Client, Project, InvoiceStatus } from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, XCircle, ExternalLink } from "lucide-react";

const invoiceRepo = new SupabaseInvoiceRepository();
const clientRepo = new SupabaseClientRepository();
const projectRepo = new SupabaseProjectRepository();

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [type, setType] = useState<"sales" | "purchase">("sales");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxRate, setTaxRate] = useState("20");
  const [dueDate, setDueDate] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const loadData = async () => {
    setLoading(true);
    const invs = await invoiceRepo.getAll();
    const cls = await clientRepo.getAll();
    const prjs = await projectRepo.getAll();

    setInvoices(invs);
    setClients(cls);
    setProjects(prjs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtotal) return;

    await invoiceRepo.create({
      invoice_number: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      type,
      client_id: clientId || null,
      project_id: projectId || null,
      subtotal: Number(subtotal),
      tax_rate: Number(taxRate),
      due_date: dueDate || new Date().toISOString().split("T")[0],
      document_url: documentUrl || null,
      status: "pending",
    });

    setIsModalOpen(false);
    setInvoiceNumber("");
    setSubtotal("");
    setDocumentUrl("");
    loadData();
  };

  const handleStatusChange = async (id: string, newStatus: InvoiceStatus) => {
    const inv = invoices.find((i) => i.id === id);
    const paidAmt = newStatus === "paid" ? inv?.total_amount : undefined;
    await invoiceRepo.updateStatus(id, newStatus, paidAmt);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Fatura & Belge Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">
            Satış ve alış faturaları, KDV detayları, fatura durumları ve belge takibi
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Fatura Oluştur</span>
        </button>
      </div>

      {/* Invoices List */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Fatura No</th>
                <th className="pb-3 font-semibold">Tür</th>
                <th className="pb-3 font-semibold">Müşteri / Cari</th>
                <th className="pb-3 font-semibold">Vade Tarihi</th>
                <th className="pb-3 font-semibold">Net / KDV</th>
                <th className="pb-3 font-semibold text-right">Toplam Brüt</th>
                <th className="pb-3 font-semibold">Durum</th>
                <th className="pb-3 font-semibold text-center">Belge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 font-mono font-semibold text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.type === "sales"
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {inv.type === "sales" ? "Satış Faturası" : "Alış Faturası"}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-300">
                    {inv.clients?.name || inv.projects?.title || "-"}
                  </td>
                  <td className="py-3.5 text-slate-400">{formatDate(inv.due_date)}</td>
                  <td className="py-3.5 text-slate-400">
                    {formatCurrency(inv.subtotal, inv.currency)} / %{inv.tax_rate} KDV
                  </td>
                  <td className="py-3.5 text-right font-bold text-white">
                    {formatCurrency(inv.total_amount, inv.currency)}
                  </td>
                  <td className="py-3.5">
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                      className={`bg-slate-900 border rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer ${
                        inv.status === "paid"
                          ? "border-emerald-500/40 text-emerald-400"
                          : inv.status === "pending"
                          ? "border-amber-500/40 text-amber-400"
                          : "border-slate-800 text-slate-400"
                      }`}
                    >
                      <option value="pending">Ödeme Bekliyor</option>
                      <option value="paid">Ödendi</option>
                      <option value="partially_paid">Kısmi Ödeme</option>
                      <option value="overdue">Gecikti</option>
                      <option value="cancelled">İptal Edildi</option>
                    </select>
                  </td>
                  <td className="py-3.5 text-center">
                    {inv.document_url ? (
                      <a
                        href={inv.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Fatura
                      </a>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Henüz fatura veya belge kaydı bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Yeni Fatura Ekle</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fatura Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="sales">Satış Faturası (Gelir)</option>
                    <option value="purchase">Alış Faturası (Gider)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fatura No</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Müşteri / Cari</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Net Tutar *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">KDV Oranı (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="0">%0 KDV</option>
                    <option value="10">%10 KDV</option>
                    <option value="20">%20 KDV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Son Ödeme (Vade) Tarihi</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Fatura Belge URL / PDF Bağlantısı</label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
