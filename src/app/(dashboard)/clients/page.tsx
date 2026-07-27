"use client";

import { useEffect, useState } from "react";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { Client } from "@/core/types";
import { Users, Plus, Building, UserCheck, Search, Mail, Phone, Trash2 } from "lucide-react";

const clientRepo = new SupabaseClientRepository();

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"individual" | "company">("company");
  const [companyTitle, setCompanyTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientRepo.getAll();
      setClients(data);
    } catch (e) {
      console.error("Error loading clients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await clientRepo.create({
        name: name.trim(),
        type,
        company_title: companyTitle.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        tax_office: taxOffice.trim() || null,
        tax_number: taxNumber.trim() || null,
      });

      setIsModalOpen(false);
      setName("");
      setCompanyTitle("");
      setEmail("");
      setPhone("");
      setTaxOffice("");
      setTaxNumber("");
      await loadClients();
    } catch (err) {
      console.error("Müşteri eklenirken hata oluştu:", err);
      alert("Müşteri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, clientName: string) => {
    if (confirm(`"${clientName}" adlı müşteriyi silmek istediğinize emin misiniz?`)) {
      await clientRepo.delete(id);
      await loadClients();
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Müşteri & Cari Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">
            PixelArt kurumsal müşterileri, cari kayıtları ve vergi bilgileri
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Müşteri / Cari Ekle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Müşteri adı, unvan veya e-posta ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="glass-card p-5 rounded-2xl space-y-4 relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {client.type === "company" ? <Building className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{client.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {client.type === "company" ? "Kurumsal Müşteri" : "Bireysel Müşteri"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(client.id, client.name)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Müşteriyi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
              {client.tax_number && (
                <div className="text-[11px] text-slate-500">
                  VN: {client.tax_office || "Belirtilmedi"} / No: {client.tax_number}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl text-slate-500 text-xs">
            Kayıtlı müşteri bulunamadı.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Müşteri Ekle</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
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
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet ve Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
