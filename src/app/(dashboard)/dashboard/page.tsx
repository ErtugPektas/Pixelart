"use client";

import { useEffect, useState } from "react";
import { SupabaseFinanceRepository } from "@/infrastructure/repositories/SupabaseFinanceRepository";
import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { FinancialSummary, FinanceTransaction, Appointment, Client } from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

const financeRepo = new SupabaseFinanceRepository();
const appointmentRepo = new SupabaseAppointmentRepository();
const clientRepo = new SupabaseClientRepository();

export default function DashboardPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<FinanceTransaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Appointment Modal
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [appDate, setAppDate] = useState(new Date().toISOString().split("T")[0]);
  const [appTime, setAppTime] = useState("14:00");
  const [notes, setNotes] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const sum = await financeRepo.getFinancialSummary();
      const txs = await financeRepo.getTransactions();
      const apps = await appointmentRepo.getAll();
      const cls = await clientRepo.getAll();

      // Only active (non-archived) records on main dashboard
      const activeApps = apps.filter((a) => a.status !== "archived");
      const activeClients = cls.filter((c) => c.status === "active");

      setSummary(sum);
      setRecentTransactions(txs.slice(0, 5));
      setAppointments(activeApps);
      setClients(activeClients);
      if (activeClients.length > 0) setClientId(activeClients[0].id);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetClientId = clientId;

    if (isNewClientMode) {
      if (!newClientName.trim()) {
        alert("Lütfen yeni müşteri adını giriniz.");
        return;
      }
      const createdClient = await clientRepo.create({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
        type: "individual",
        status: "active",
      });
      targetClientId = createdClient.id;
    }

    if (!targetClientId || !serviceTitle) return;

    await appointmentRepo.create({
      client_id: targetClientId,
      service_title: serviceTitle.trim(),
      appointment_date: appDate,
      appointment_time: appTime,
      notes: notes.trim() || null,
      status: "confirmed",
    });

    setIsAppModalOpen(false);
    setIsNewClientMode(false);
    setNewClientName("");
    setNewClientPhone("");
    setServiceTitle("");
    setNotes("");
    await loadAll();
  };

  const handleDeleteAppointment = async (id: string) => {
    if (confirm("Bu randevuyu silmek istediğinize emin misiniz?")) {
      await appointmentRepo.delete(id);
      await loadAll();
    }
  };

  // Calendar Helpers
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayIndex = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Filter appointments for selected date
  const selectedDateApps = appointments.filter(
    (a) => a.appointment_date === selectedDate
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            PixelArt Yönetim Paneli
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Finansal durum, müşteri randevu takvimi ve genel proje metrikleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAppModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Yeni Randevu Oluştur</span>
          </button>
          <Link
            href="/finance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni İşlem Ekle</span>
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gelir
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white">
              {loading ? "..." : formatCurrency(summary?.total_income || 0)}
            </h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              Nakit Akışı Aktif
            </p>
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Gider
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white">
              {loading ? "..." : formatCurrency(summary?.total_expense || 0)}
            </h3>
            <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
              Operasyonel Giderler
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Kar
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3
              className={`text-xl font-bold ${
                (summary?.net_profit || 0) >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {loading ? "..." : formatCurrency(summary?.net_profit || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Brüt Kar / Zarar</p>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bekleyen Alacaklar
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-white">
              {loading ? "..." : formatCurrency(summary?.pending_receivables || 0)}
            </h3>
            <p className="text-[11px] text-amber-400 mt-1">Tahsil Edilecek Fatura</p>
          </div>
        </div>
      </div>

      {/* Şık ve Sade Müşteri Randevu Takvimi Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sleek Mini Calendar */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>Randevu Takvimi</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white px-2">
                {currentMonth.toLocaleString("tr-TR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"].map((day) => (
              <span key={day} className="text-[10px] font-bold text-slate-500 uppercase py-1">
                {day}
              </span>
            ))}

            {Array.from({ length: (firstDayIndex + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const monthStr = String(currentMonth.getMonth() + 1).padStart(2, "0");
              const dayStr = String(dayNum).padStart(2, "0");
              const fullDateStr = `${currentMonth.getFullYear()}-${monthStr}-${dayStr}`;

              const isSelected = selectedDate === fullDateStr;
              const hasApp = appointments.some(
                (a) => a.appointment_date === fullDateStr
              );

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(fullDateStr)}
                  className={`p-2 rounded-xl text-xs font-medium relative transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30"
                      : "text-slate-300 hover:bg-slate-900/80"
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasApp && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? "bg-white" : "bg-indigo-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Appointments List */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Seçili Tarih Randevuları ({formatDate(selectedDate)})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Günün müşteri randevuları ve görüşme notları
              </p>
            </div>

            <button
              onClick={() => {
                setAppDate(selectedDate);
                setIsAppModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Randevu Ekle</span>
            </button>
          </div>

          <div className="space-y-3">
            {selectedDateApps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {app.appointment_time}
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        {app.service_title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{app.clients?.name || "Müşteri Atanmadı"}</span>
                    </p>
                    {app.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">
                        "{app.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {app.status}
                  </span>
                  <button
                    onClick={() => handleDeleteAppointment(app.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {selectedDateApps.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                Bu tarihte planlanmış randevu bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Son Finansal Hareketler
          </h3>
          <Link href="/finance" className="text-xs text-indigo-400 hover:underline font-medium">
            Tümünü Gör
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80">
                <th className="pb-3 font-semibold">Tarih</th>
                <th className="pb-3 font-semibold">Açıklama</th>
                <th className="pb-3 font-semibold">Tür</th>
                <th className="pb-3 font-semibold text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="py-3 text-slate-400">{formatDate(tx.transaction_date)}</td>
                  <td className="py-3 font-medium text-white">
                    {tx.description || "Finans İşlemi"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
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
                  <td
                    className={`py-3 text-right font-bold ${
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Müşteri Randevusu Oluştur</h3>
              <button
                type="button"
                onClick={() => setIsAppModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              {/* Client Mode Switch */}
              <div className="p-1 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsNewClientMode(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isNewClientMode
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Kayıtlı Müşteri Seç
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewClientMode(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    isNewClientMode
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Yeni Müşteri Ekle</span>
                </button>
              </div>

              {!isNewClientMode ? (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Müşteri Seçin *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                    {clients.length === 0 && <option value="">Önce Müşteri Ekleyin</option>}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                  <div>
                    <label className="block text-[11px] text-emerald-400 font-semibold mb-1">
                      Yeni Müşteri Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required={isNewClientMode}
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Örn: Mehmet Öz"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Telefon Numarası</label>
                    <input
                      type="text"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Randevu / Görüşme Başlığı *</label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="Örn: Proje Sunumu ve Arayüz Onayı"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Saat</label>
                  <input
                    type="time"
                    required
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notlar / Detay</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Toplantı gündemi..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Randevuyu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
