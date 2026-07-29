"use client";

import { useEffect, useState, useMemo } from "react";
import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { Appointment, Client, AppointmentStatus } from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CalendarCheck,
  Plus,
  Search,
  Clock,
  User,
  Bell,
  MessageCircle,
  Edit,
  Trash2,
  X,
  Archive,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Filter,
} from "lucide-react";

const appointmentRepo = new SupabaseAppointmentRepository();
const clientRepo = new SupabaseClientRepository();

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  archived: "Arşivlendi",
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  archived: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "active_all" | "all">("active_all");
  const [viewMode, setViewMode] = useState<"list" | "week">("list");

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Form State - Appointment
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [appDate, setAppDate] = useState(new Date().toISOString().split("T")[0]);
  const [appTime, setAppTime] = useState("14:00");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState<AppointmentStatus>("confirmed");
  const [notes, setNotes] = useState("");

  // Alarm / Notification state
  const [alarmTimeOffset, setAlarmTimeOffset] = useState("15");
  const [alarmSuccess, setAlarmSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const apps = await appointmentRepo.getAll();
      const cls = await clientRepo.getAll();
      setAppointments(apps);
      setClients(cls);
      
      const activeClients = cls.filter(c => c.status === "active");
      if (activeClients.length > 0 && !clientId) setClientId(activeClients[0].id);
    } catch (e) {
      console.error("Error loading appointments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered List - By default hides archived items from main view
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const matchesSearch =
        app.service_title.toLowerCase().includes(search.toLowerCase()) ||
        app.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
        app.clients?.phone?.includes(search);

      if (!matchesSearch) return false;

      if (filterStatus === "active_all") {
        return app.status !== "archived";
      }
      if (filterStatus === "all") {
        return true;
      }
      return app.status === filterStatus;
    });
  }, [appointments, search, filterStatus]);

  // Create Appointment
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetClientId = clientId;

    // Inline New Client Registration
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
      duration_minutes: Number(duration || 60),
      price: Number(price || 0),
      status,
      notes: notes.trim() || null,
    });

    setIsCreateOpen(false);
    resetForm();
    await loadData();
  };

  // Edit Appointment
  const handleOpenEdit = (app: Appointment) => {
    setEditingApp(app);
    setIsNewClientMode(false);
    setClientId(app.client_id || "");
    setServiceTitle(app.service_title || "");
    setAppDate(app.appointment_date || new Date().toISOString().split("T")[0]);
    setAppTime(app.appointment_time || "14:00");
    setDuration(String(app.duration_minutes || 60));
    setPrice(String(app.price || 0));
    setStatus(app.status || "confirmed");
    setNotes(app.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    let targetClientId = clientId;

    if (isNewClientMode) {
      if (!newClientName.trim()) return;
      const createdClient = await clientRepo.create({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || null,
        type: "individual",
        status: "active",
      });
      targetClientId = createdClient.id;
    }

    await appointmentRepo.update(editingApp.id, {
      client_id: targetClientId,
      service_title: serviceTitle.trim(),
      appointment_date: appDate,
      appointment_time: appTime,
      duration_minutes: Number(duration || 60),
      price: Number(price || 0),
      status,
      notes: notes.trim() || null,
    });

    setEditingApp(null);
    resetForm();
    await loadData();
  };

  const handleArchive = async (appId: string) => {
    await appointmentRepo.update(appId, { status: "archived" });
    await loadData();
  };

  const handleQuickStatusChange = async (appId: string, newStatus: AppointmentStatus) => {
    await appointmentRepo.update(appId, { status: newStatus });
    await loadData();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" randevusunu silmek istediğinize emin misiniz?`)) {
      await appointmentRepo.delete(id);
      if (editingApp?.id === id) setEditingApp(null);
      await loadData();
    }
  };

  const resetForm = () => {
    setIsNewClientMode(false);
    setNewClientName("");
    setNewClientPhone("");
    setServiceTitle("");
    setNotes("");
    setPrice("0");
    setDuration("60");
  };

  // Alarm & Notification System
  const triggerAlarmNotification = (appTitle: string, clientName: string, timeStr: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("PixelArt Randevu Hatırlatıcı", {
          body: `⏰ ${clientName} — ${appTitle} (${timeStr})`,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("PixelArt Randevu Hatırlatıcı", {
              body: `⏰ ${clientName} — ${appTitle} (${timeStr})`,
              icon: "/favicon.ico",
            });
          }
        });
      }
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (err) {
      console.log("Audio alert playback error:", err);
    }

    setAlarmSuccess(`"${clientName}" için ${alarmTimeOffset} dakika öncesine hatırlatıcı alarm kuruldu!`);
    setTimeout(() => setAlarmSuccess(""), 4000);
  };

  const getWhatsAppUrl = (phone?: string | null, clientName?: string, dateStr?: string, timeStr?: string) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Merhaba Sayın ${clientName || "Müşterimiz"}, PixelArt stüdyomuzdaki ${dateStr} tarihli, saat ${timeStr} randevunuzu hatırlatmak isteriz.`
    );
    return `https://wa.me/${cleanPhone.startsWith("90") ? cleanPhone : "90" + cleanPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Randevu Yönetimi & Detayları
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            PixelArt randevu detayları, anında yeni müşteri kaydı, alarmlar ve arşiv desteği
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Randevu Oluştur</span>
        </button>
      </div>

      {/* Alarm Success Banner */}
      {alarmSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span>{alarmSuccess}</span>
        </div>
      )}

      {/* Filters & View Controls */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Müşteri veya randevu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value="active_all">Aktif Randevular (Arşiv Haric)</option>
            <option value="pending">Bekliyor</option>
            <option value="confirmed">Onaylandı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
            <option value="archived">📦 Arşivlenmiş Randevular</option>
            <option value="all">Tümü (Arşiv Dahil)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Liste Görünümü
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "week"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Takvim Kartları
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "list" ? (
        <div className="glass-card p-6 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold">Müşteri</th>
                  <th className="pb-3 font-semibold">Görüşme / Konu</th>
                  <th className="pb-3 font-semibold">Tarih & Saat</th>
                  <th className="pb-3 font-semibold">Süre</th>
                  <th className="pb-3 font-semibold">Ücret</th>
                  <th className="pb-3 font-semibold">Durum</th>
                  <th className="pb-3 font-semibold text-center">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5">
                      <div className="font-bold text-white">
                        {app.clients?.name || "Müşteri Atanmadı"}
                      </div>
                      {app.clients?.phone && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.clients.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-slate-200">
                        {app.service_title}
                      </div>
                      {app.notes && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 italic">
                          "{app.notes}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <div className="font-medium">{formatDate(app.appointment_date)}</div>
                      <div className="text-[11px] text-indigo-400 font-mono font-bold">
                        {app.appointment_time}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-400">{app.duration_minutes} dk</td>
                    <td className="py-3.5 font-bold text-emerald-400">
                      {formatCurrency(app.price || 0)}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleQuickStatusChange(app.id, e.target.value as AppointmentStatus)
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase cursor-pointer bg-slate-900 ${
                          STATUS_STYLES[app.status]
                        }`}
                      >
                        <option value="pending">Bekliyor</option>
                        <option value="confirmed">Onaylandı</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                        <option value="archived">Arşive Kaldır</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {app.clients?.phone && (
                          <a
                            href={getWhatsAppUrl(
                              app.clients.phone,
                              app.clients.name,
                              formatDate(app.appointment_date),
                              app.appointment_time
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="WhatsApp Hatırlatma Gönder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Randevuyu Düzenle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleArchive(app.id)}
                          className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Arşive Kaldır"
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(app.id, app.service_title)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Randevuyu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAppointments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      Kayıtlı randevu bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppointments.map((app) => (
            <div key={app.id} className="glass-card p-5 rounded-2xl space-y-4 relative">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    STATUS_STYLES[app.status]
                  }`}
                >
                  {STATUS_LABELS[app.status]}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {formatCurrency(app.price || 0)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{app.service_title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{app.clients?.name || "Müşteri Atanmadı"}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {formatDate(app.appointment_date)} •{" "}
                    <strong className="text-white">{app.appointment_time}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(app)}
                    className="p-1 text-slate-400 hover:text-indigo-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(app.id)}
                    className="p-1 text-purple-400 hover:text-purple-300"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(app.id, app.service_title)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal with Inline New Client Registration */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Randevu Oluştur</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              {/* Client Selection Mode Switcher */}
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
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    isNewClientMode
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Yeni Müşteri Ekle</span>
                </button>
              </div>

              {/* Client Inputs */}
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
                    {clients.length === 0 && <option value="">Önce Müşteri Ekle</option>}
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
                      placeholder="Örn: Ahmet Yılmaz"
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
                <label className="block text-[11px] text-slate-400 mb-1">Randevu Başlığı / Konu *</label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="Örn: Proje Sunumu & Tasarım Değerlendirme"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Saat *</label>
                  <input
                    type="time"
                    required
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tahmini Süre (Dk)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ücret (₺)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Görüşme detayları..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Kaydet ve Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit & Detail & Alarm Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Randevu Düzenle & Alarm</h3>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Alarm Reminder Button Bar */}
            <div className="p-3.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Bell className="w-4 h-4" /> Hatırlatıcı Alarm Ayarla
                </span>
                <select
                  value={alarmTimeOffset}
                  onChange={(e) => setAlarmTimeOffset(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="15">15 Dakika Önce</option>
                  <option value="30">30 Dakika Önce</option>
                  <option value="60">1 Saat Önce</option>
                  <option value="1440">1 Gün Önce</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  triggerAlarmNotification(
                    editingApp.service_title,
                    editingApp.clients?.name || "Müşteri",
                    editingApp.appointment_time
                  )
                }
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Sesli & Bildirimli Alarmı Kur</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Müşteri *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Randevu Başlığı *</label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ücret (₺)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Randevu Statüsü</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="pending">Bekliyor</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal</option>
                    <option value="archived">📦 Arşive Kaldır</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Güncellemeleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
