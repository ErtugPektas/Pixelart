"use client";

import { useEffect, useState, useMemo } from "react";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";
import { SupabaseProjectRepository } from "@/infrastructure/repositories/SupabaseProjectRepository";
import { Client, ClientStatus, Appointment, Project } from "@/core/types";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Plus,
  Building,
  UserCheck,
  Search,
  Mail,
  Phone,
  Trash2,
  Edit,
  Archive,
  MessageCircle,
  CalendarCheck,
  FolderKanban,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const clientRepo = new SupabaseClientRepository();
const appointmentRepo = new SupabaseAppointmentRepository();
const projectRepo = new SupabaseProjectRepository();

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"active" | "archived" | "all">("active");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"individual" | "company">("company");
  const [companyTitle, setCompanyTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [status, setStatus] = useState<ClientStatus>("active");

  const loadData = async () => {
    setLoading(true);
    try {
      const cls = await clientRepo.getAll();
      const apps = await appointmentRepo.getAll();
      const prjs = await projectRepo.getAll();
      setClients(cls);
      setAppointments(apps);
      setProjects(prjs);
    } catch (e) {
      console.error("Error loading clients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setName("");
    setType("company");
    setCompanyTitle("");
    setEmail("");
    setPhone("");
    setTaxOffice("");
    setTaxNumber("");
    setStatus("active");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setName(client.name);
    setType(client.type);
    setCompanyTitle(client.company_title || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setTaxOffice(client.tax_office || "");
    setTaxNumber(client.tax_number || "");
    setStatus(client.status || "active");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingClient) {
        await clientRepo.update(editingClient.id, {
          name: name.trim(),
          type,
          company_title: companyTitle.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          tax_office: taxOffice.trim() || null,
          tax_number: taxNumber.trim() || null,
          status,
        });
      } else {
        await clientRepo.create({
          name: name.trim(),
          type,
          company_title: companyTitle.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          tax_office: taxOffice.trim() || null,
          tax_number: taxNumber.trim() || null,
          status,
        });
      }

      setIsModalOpen(false);
      setEditingClient(null);
      await loadData();
    } catch (err) {
      console.error("Müşteri kaydedilirken hata:", err);
      alert("İşlem yapılırken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus: ClientStatus = client.status === "active" ? "archived" : "active";
    await clientRepo.update(client.id, { status: newStatus });
    if (selectedClientDetail?.id === client.id) {
      setSelectedClientDetail({ ...client, status: newStatus });
    }
    await loadData();
  };

  const handleDelete = async (id: string, clientName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`"${clientName}" adlı müşteriyi silmek istediğinize emin misiniz?`)) {
      await clientRepo.delete(id);
      if (selectedClientDetail?.id === id) setSelectedClientDetail(null);
      await loadData();
    }
  };

  // Filter clients by search and status (defaults to active ONLY)
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.company_title?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search);

      if (!matchesSearch) return false;

      if (filterStatus === "active") return c.status === "active";
      if (filterStatus === "archived") return c.status === "archived";
      return true;
    });
  }, [clients, search, filterStatus]);

  // Client Details helper
  const clientAppointments = useMemo(() => {
    if (!selectedClientDetail) return [];
    return appointments.filter((a) => a.client_id === selectedClientDetail.id);
  }, [selectedClientDetail, appointments]);

  const clientProjects = useMemo(() => {
    if (!selectedClientDetail) return [];
    return projects.filter((p) => p.client_id === selectedClientDetail.id);
  }, [selectedClientDetail, projects]);

  const getWhatsAppUrl = (phone?: string | null, clientName?: string) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Merhaba Sayın ${clientName || "Müşterimiz"}, PixelArt stüdyomuzdan bilgilendirmek istedik.`
    );
    return `https://wa.me/${cleanPhone.startsWith("90") ? cleanPhone : "90" + cleanPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Müşteri & Cari Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">
            PixelArt müşterileri, detaylı cariler, randevu geçmişi ve arşiv yönetimi
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Müşteri / Cari Ekle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Müşteri adı, unvan veya telefon ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="w-full md:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer font-semibold"
        >
          <option value="active">Aktif Müşteriler (Varsayılan)</option>
          <option value="archived">📦 Arşivlenmiş Müşteriler</option>
          <option value="all">Tüm Müşteriler (Arşiv Dahil)</option>
        </select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClientDetail(client)}
            className="glass-card p-5 rounded-2xl space-y-4 relative group cursor-pointer hover:border-indigo-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {client.type === "company" ? <Building className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {client.name}
                  </h3>
                  <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                    client.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}>
                    {client.status === "active" ? "Aktif" : "📦 Arşivde"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Edit */}
                <button
                  onClick={(e) => handleOpenEdit(client, e)}
                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  title="Düzenle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Archive Toggle */}
                <button
                  onClick={(e) => handleToggleArchive(client, e)}
                  className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                  title={client.status === "active" ? "Arşive Kaldır" : "Aktife Al"}
                >
                  <Archive className="w-4 h-4" />
                </button>
                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(client.id, client.name, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {client.company_title && (
              <p className="text-xs text-slate-300 font-medium line-clamp-1">
                {client.company_title}
              </p>
            )}

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
              <span>Detaylı Profili İncele</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl text-slate-500 text-xs">
            Kayıtlı müşteri bulunamadı.
          </div>
        )}
      </div>

      {/* Detailed Customer Profile Modal */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                  {selectedClientDetail.type === "company" ? <Building className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedClientDetail.name}</h3>
                  {selectedClientDetail.company_title && (
                    <p className="text-xs text-slate-400">{selectedClientDetail.company_title}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedClientDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedClientDetail.phone && (
                <a
                  href={getWhatsAppUrl(selectedClientDetail.phone, selectedClientDetail.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp ile İletişim</span>
                </a>
              )}

              <button
                onClick={() => handleOpenEdit(selectedClientDetail)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Bilgileri Düzenle</span>
              </button>

              <button
                onClick={() => handleToggleArchive(selectedClientDetail)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>{selectedClientDetail.status === "active" ? "Arşive Kaldır" : "Aktife Al"}</span>
              </button>

              <button
                onClick={() => handleDelete(selectedClientDetail.id, selectedClientDetail.name)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Müşteriyi Sil</span>
              </button>
            </div>

            {/* Information Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">İletişim & Cari Bilgileri</span>
                <div className="text-slate-300 space-y-1.5 pt-1">
                  <div><strong className="text-slate-400">Telefon:</strong> {selectedClientDetail.phone || "Belirtilmedi"}</div>
                  <div><strong className="text-slate-400">E-Posta:</strong> {selectedClientDetail.email || "Belirtilmedi"}</div>
                  <div><strong className="text-slate-400">Adres:</strong> {selectedClientDetail.address || "Belirtilmedi"}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Vergi & Durum Bilgileri</span>
                <div className="text-slate-300 space-y-1.5 pt-1">
                  <div><strong className="text-slate-400">Vergi Dairesi:</strong> {selectedClientDetail.tax_office || "Belirtilmedi"}</div>
                  <div><strong className="text-slate-400">Vergi / TCKN No:</strong> {selectedClientDetail.tax_number || "Belirtilmedi"}</div>
                  <div>
                    <strong className="text-slate-400">Durum:</strong>{" "}
                    <span className={`font-bold ${selectedClientDetail.status === "active" ? "text-emerald-400" : "text-purple-400"}`}>
                      {selectedClientDetail.status === "active" ? "Aktif Cari" : "📦 Arşivde"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Appointments Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-400" />
                <span>Müşteriye Ait Randevular ({clientAppointments.length})</span>
              </h4>

              <div className="space-y-2">
                {clientAppointments.map((app) => (
                  <div key={app.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{app.service_title}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(app.appointment_date)} • {app.appointment_time}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {app.status}
                    </span>
                  </div>
                ))}
                {clientAppointments.length === 0 && (
                  <div className="p-4 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl">
                    Bu müşteriye tanımlı randevu kaydı bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingClient ? "Müşteri Bilgilerini Düzenle" : "Yeni Müşteri Ekle"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Müşteri Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="company">Kurumsal Firma</option>
                    <option value="individual">Bireysel Müşteri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Durum</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClientStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="active">Aktif Müşteri</option>
                    <option value="archived">📦 Arşivlenmiş</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ad Soyad / Firma Adı *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500"
                  placeholder="Örn: Akıncı Tasarım A.Ş."
                />
              </div>

              {type === "company" && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Resmi Şirket Unvanı</label>
                  <input
                    type="text"
                    value={companyTitle}
                    onChange={(e) => setCompanyTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">E-Posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="ornek@firma.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Vergi / TCKN No</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Bilgileri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
