"use client";

import { useEffect, useState } from "react";
import { SupabaseFinanceRepository } from "@/infrastructure/repositories/SupabaseFinanceRepository";
import { RecurringTransaction, RecurrenceFrequency } from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Repeat, Plus, Play, Edit, Trash2, X } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const financeRepo = new SupabaseFinanceRepository();

export default function RecurringPage() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await financeRepo.getRecurringTransactions();
    setRecurringList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeSync(["finance_recurring", "finance_categories", "clients"], loadData);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle("");
    setType("expense");
    setAmount("");
    setFrequency("monthly");
    setNextDueDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type as "income" | "expense");
    setAmount(String(item.amount));
    setFrequency(item.frequency);
    setNextDueDate(item.next_due_date || new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    if (editingItem) {
      await financeRepo.updateRecurringTransaction(editingItem.id, {
        title,
        type,

        amount: Number(amount),
        frequency,
        next_due_date: nextDueDate || new Date().toISOString().split("T")[0],
      });
    } else {
      await financeRepo.createRecurringTransaction({
        title,
        type,

        amount: Number(amount),
        frequency,
        next_due_date: nextDueDate || new Date().toISOString().split("T")[0],
        auto_process: true,
        status: "active",
      });
    }

    setIsModalOpen(false);
    setEditingItem(null);
    await loadData();
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (confirm(`"${itemTitle}" otomatik ödeme kaydını silmek istediğinize emin misiniz?`)) {
      await financeRepo.deleteRecurringTransaction(id);
      await loadData();
    }
  };

  const handleProcessDue = async () => {
    await financeRepo.processDueRecurringTransactions();
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Tekrarlayan İşlemler & Abonelikler</h1>
          <p className="text-xs text-slate-400 mt-1">
            Otomatik periyodik ödemeler, yazılım lisansları, ofis kirası ve maaş kayıtları
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessDue}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Günü Gelenleri İşle</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Otomatik Ödeme Ekle</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringList.map((item) => (
          <div key={item.id} className="glass-card p-5 rounded-2xl space-y-4 relative group">
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  item.type === "income"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {item.type === "income" ? "Düzenli Gelir" : "Düzenli Gider"}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase mr-1">
                  {item.frequency === "monthly"
                    ? "Aylık"
                    : item.frequency === "weekly"
                    ? "Haftalık"
                    : "Yıllık"}
                </span>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-lg font-extrabold text-indigo-400 mt-1">
                {formatCurrency(item.amount, item.currency)}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Son Ödeme:</span>
                <span className="text-white font-medium">{formatDate(item.last_processed_date || "")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Gelecek Ödeme:</span>
                <span className="text-emerald-400 font-bold">{formatDate(item.next_due_date)}</span>
              </div>
            </div>
          </div>
        ))}

        {recurringList.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl text-slate-500 text-xs">
            Henüz tanımlanmış periyodik işlem bulunmuyor.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingItem ? "Periyodik Ödeme Düzenle" : "Yeni Periyodik Ödeme Tanımla"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">İşlem Adı / Açıklama *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Figma & Adobe Abonelikleri"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">İşlem Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="expense">Düzenli Gider</option>
                    <option value="income">Düzenli Gelir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Periyot</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="monthly">Aylık</option>
                    <option value="weekly">Haftalık</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tutar *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gelecek Ödeme Tarihi</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
