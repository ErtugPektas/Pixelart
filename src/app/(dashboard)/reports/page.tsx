"use client";

import { useEffect, useState } from "react";
import { SupabaseFinanceRepository } from "@/infrastructure/repositories/SupabaseFinanceRepository";
import { FinancialSummary } from "@/core/types";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, Landmark, PieChart, ShieldCheck, Download } from "lucide-react";

const financeRepo = new SupabaseFinanceRepository();

export default function ReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      const data = await financeRepo.getFinancialSummary();
      setSummary(data);
      setLoading(false);
    }
    loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Finansal Raporlar & Analitik</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kar-Zarar (P&L) tablosu, KDV vergi durumu ve nakit akış analizi
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* P&L Statement */}
        <div className="glass-card p-6 rounded-2xl space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Kar - Zarar Özeti (Profit & Loss)</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300">Toplam Brüt Gelir</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(summary?.total_income || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-300">Toplam Operasyonel Gider</span>
              <span className="text-sm font-bold text-rose-400">
                {formatCurrency(summary?.total_expense || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/30">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Net Çalışma Karı</span>
              <span
                className={`text-base font-extrabold ${
                  (summary?.net_profit || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(summary?.net_profit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>KDV & Vergi Özeti</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Hesaplanan KDV (Tahsil Edilen)</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">
                {formatCurrency(summary?.total_tax_collected || 0)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">İndirilecek KDV (Ödenen)</span>
              <span className="text-sm font-bold text-rose-400 mt-1 block">
                {formatCurrency(summary?.total_tax_paid || 0)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Net Ödenecek / Devreden KDV</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {formatCurrency(
                  (summary?.total_tax_collected || 0) - (summary?.total_tax_paid || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
