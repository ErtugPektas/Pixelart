"use client";

import { useEffect, useState } from "react";
import { SupabaseFinanceRepository } from "@/infrastructure/repositories/SupabaseFinanceRepository";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { SupabaseProjectRepository } from "@/infrastructure/repositories/SupabaseProjectRepository";
import {
  FinanceTransaction,
  FinanceAccount,
  FinanceCategory,
  Client,
  Project,
  TransactionType,
  PaymentMethod,
} from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, FileText } from "lucide-react";

const financeRepo = new SupabaseFinanceRepository();
const clientRepo = new SupabaseClientRepository();
const projectRepo = new SupabaseProjectRepository();

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [type, setType] = useState<TransactionType>("income");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState("20");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [description, setDescription] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const loadAll = async () => {
    setLoading(true);
    const txs = await financeRepo.getTransactions();
    const accs = await financeRepo.getAccounts();
    const cats = await financeRepo.getCategories();
    const cls = await clientRepo.getAll();
    const prjs = await projectRepo.getAll();

    setTransactions(txs);
    setAccounts(accs);
    setCategories(cats);
    setClients(cls);
    setProjects(prjs);

    if (accs.length > 0) setAccountId(accs[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    await financeRepo.createTransaction({
      type,
      account_id: accountId,
      to_account_id: type === "transfer" ? toAccountId || null : null,
      category_id: categoryId || null,
      client_id: clientId || null,
      project_id: projectId || null,
      amount: Number(amount),
      tax_rate: Number(taxRate || 0),
      payment_method: paymentMethod,
      description: description || null,
      document_url: documentUrl || null,
    });

    setIsModalOpen(false);
    setAmount("");
    setDescription("");
    setDocumentUrl("");
    loadAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu işlemi silmek istediğinize emin misiniz?")) {
      await financeRepo.deleteTransaction(id);
      loadAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Finansal İşlemler</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gelir, gider ve kasa/banka transfer hareketleri
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Finansal İşlem</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Tarih</th>
                <th className="pb-3 font-semibold">Tür</th>
                <th className="pb-3 font-semibold">Açıklama</th>
                <th className="pb-3 font-semibold">Hesap</th>
                <th className="pb-3 font-semibold">Müşteri / Proje</th>
                <th className="pb-3 font-semibold">KDV (%)</th>
                <th className="pb-3 font-semibold text-right">Tutar</th>
                <th className="pb-3 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 text-slate-400">{formatDate(tx.transaction_date)}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.type === "income"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : tx.type === "expense"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {tx.type === "income" ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Gelir
                        </>
                      ) : tx.type === "expense" ? (
                        <>
                          <ArrowDownRight className="w-3 h-3" /> Gider
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" /> Transfer
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3.5 font-medium text-white">
                    {tx.description || "Finansal İşlem"}
                  </td>
                  <td className="py-3.5 text-slate-400">{tx.finance_accounts?.name || "-"}</td>
                  <td className="py-3.5 text-slate-400">
                    {tx.clients?.name || tx.projects?.title || "-"}
                  </td>
                  <td className="py-3.5 text-slate-400">%{tx.tax_rate}</td>
                  <td
                    className={`py-3.5 text-right font-bold ${
                      tx.type === "income"
                        ? "text-emerald-400"
                        : tx.type === "expense"
                        ? "text-rose-400"
                        : "text-indigo-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Kayıtlı finansal işlem bulunamadı.
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
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Yeni Finansal İşlem Ekle</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    type === "income"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  Gelir
                </button>
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    type === "expense"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  Gider
                </button>
                <button
                  type="button"
                  onClick={() => setType("transfer")}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    type === "transfer"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  Transfer
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Hesap *</label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency}) — Bakiye: {formatCurrency(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {type === "transfer" && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Hedef Hesap *</label>
                  <select
                    required
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Hedef Hesap Seçin --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tutar *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">KDV Oranı (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="0">%0 (KDV Muaf)</option>
                    <option value="10">%10 KDV</option>
                    <option value="20">%20 KDV (Genel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">-- Kategori Seçin --</option>
                    {categories
                      .filter((c) => c.type === (type === "transfer" ? "expense" : type))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">İlişkili Müşteri</label>
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
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="İşlem detay veya notu..."
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
