"use client";

import { useEffect, useState } from "react";
import { SupabaseFinanceRepository } from "@/infrastructure/repositories/SupabaseFinanceRepository";
import { FinanceAccount, AccountType } from "@/core/types";
import { formatCurrency } from "@/lib/utils";
import { Landmark, Plus, CreditCard, Wallet, Building2 } from "lucide-react";

const financeRepo = new SupabaseFinanceRepository();

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [currency, setCurrency] = useState("TRY");
  const [balance, setBalance] = useState("0");

  const loadAccounts = async () => {
    setLoading(true);
    const data = await financeRepo.getAccounts();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await financeRepo.createAccount({
      name,
      type,
      currency,
      balance: Number(balance || 0),
    });

    setIsModalOpen(false);
    setName("");
    setBalance("0");
    loadAccounts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Banka & Kasa Hesapları</h1>
          <p className="text-xs text-slate-400 mt-1">
            PixelArt banka hesapları, nakit kasalar ve POS bakiyeleri
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hesap Tanımla</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass-card p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                {acc.type === "bank" ? (
                  <Landmark className="w-5 h-5" />
                ) : acc.type === "credit_card" ? (
                  <CreditCard className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                {acc.type}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{acc.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{acc.currency} Hesabı</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Güncel Bakiye</span>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </div>
          </div>
        ))}

        {accounts.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl text-slate-500 text-xs">
            Henüz tanımlanmış hesap bulunmuyor.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Yeni Hesap Ekle</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Hesap Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="Örn: Garanti Ana Ticari"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Hesap Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="bank">Banka Hesabı</option>
                    <option value="cash">Nakit Kasa</option>
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="pos">POS Cihazı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Para Birimi</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Başlangıç Bakiyesi</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
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
