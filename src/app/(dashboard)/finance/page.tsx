"use client";

import { useEffect, useState, useMemo } from "react";
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
  FinancialSummary,
} from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Search,
  Landmark,
  CreditCard,
} from "lucide-react";

const financeRepo = new SupabaseFinanceRepository();
const clientRepo = new SupabaseClientRepository();
const projectRepo = new SupabaseProjectRepository();

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Nakit Kasa",
  card: "Kredi Kartı / POS",
  bank_transfer: "Banka Havalesi / EFT",
  other: "Diğer",
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");

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

  const loadAll = async () => {
    setLoading(true);
    try {
      const txs = await financeRepo.getTransactions();
      const accs = await financeRepo.getAccounts();
      const cats = await financeRepo.getCategories();
      const cls = await clientRepo.getAll();
      const prjs = await projectRepo.getAll();
      const sum = await financeRepo.getFinancialSummary();

      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setClients(cls);
      setProjects(prjs);
      setSummary(sum);

      if (accs.length > 0 && !accountId) setAccountId(accs[0].id);
    } catch (e) {
      console.error("Finance data load error:", e);
    } finally {
      setLoading(false);
    }
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
      description: description.trim() || null,
    });

    setIsModalOpen(false);
    setAmount("");
    setDescription("");
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu finansal işlemi silmek istediğinize emin misiniz?")) {
      await financeRepo.deleteTransaction(id);
      await loadAll();
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        (tx.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.clients?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (tx.finance_accounts?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesType = filterType === "all" || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Finans Paneli</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gelir, gider, kasa bakiyeleri ve finansal işlem hareketleri
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setType("income");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Gelir Ekle</span>
          </button>
          <button
            onClick={() => {
              setType("expense");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Gider Ekle</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gelir
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-emerald-400">
              {formatCurrency(summary?.total_income || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gider
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-rose-400">
              {formatCurrency(summary?.total_expense || 0)}
            </h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Bakiye
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl font-bold ${(summary?.net_profit || 0) >= 0 ? "text-indigo-400" : "text-rose-400"}`}>
              {formatCurrency(summary?.net_profit || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Açıklama, müşteri veya hesap ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(["all", "income", "expense", "transfer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer ${
                filterType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "all" ? "Tümü" : t === "income" ? "Gelir" : t === "expense" ? "Gider" : "Transfer"}
            </button>
          ))}
        </div>
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
                <th className="pb-3 font-semibold">Ödeme Yöntemi</th>
                <th className="pb-3 font-semibold">Müşteri / Proje</th>
                <th className="pb-3 font-semibold text-right">Tutar</th>
                <th className="pb-3 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTransactions.map((tx) => (
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
                      {tx.type === "income" ? "Gelir" : tx.type === "expense" ? "Gider" : "Transfer"}
                    </span>
                  </td>
                  <td className="py-3.5 font-medium text-white">
                    {tx.description || "Finansal İşlem"}
                  </td>
                  <td className="py-3.5 text-slate-400">{tx.finance_accounts?.name || "Ana Hesap"}</td>
                  <td className="py-3.5 text-slate-400">
                    {PAYMENT_LABELS[tx.payment_method] || "Banka Transferi"}
                  </td>
                  <td className="py-3.5 text-slate-400">
                    {tx.clients?.name || tx.projects?.title || "-"}
                  </td>
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
                      title="İşlemi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && !loading && (
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Finansal İşlem Kaydet</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

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
                  <label className="block text-[11px] text-slate-400 mb-1">Hedef Kasa/Hesap *</label>
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
                  <label className="block text-[11px] text-slate-400 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="bank_transfer">Banka Havalesi / EFT</option>
                    <option value="cash">Nakit</option>
                    <option value="card">Kredi Kartı / POS</option>
                    <option value="other">Diğer</option>
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
                  placeholder="İşlem detayı..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Kaydet ve İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
