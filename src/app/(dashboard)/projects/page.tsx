"use client";

import { useEffect, useState } from "react";
import { SupabaseProjectRepository } from "@/infrastructure/repositories/SupabaseProjectRepository";
import { SupabaseClientRepository } from "@/infrastructure/repositories/SupabaseClientRepository";
import { Project, Client } from "@/core/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FolderKanban, Plus, Calendar, User, Trash2 } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const projectRepo = new SupabaseProjectRepository();
const clientRepo = new SupabaseClientRepository();

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [status, setStatus] = useState<Project["status"]>("in_progress");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const pData = await projectRepo.getAll();
      const cData = await clientRepo.getAll();
      setProjects(pData);
      setClients(cData);
    } catch (e) {
      console.error("Error loading project data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeSync(["projects", "clients"], loadData);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await projectRepo.create({
        title: title.trim(),
        client_id: clientId || null,
        budget: Number(budget || 0),
        currency,
        status,
        description: description.trim() || null,
      });

      setIsModalOpen(false);
      setTitle("");
      setClientId("");
      setBudget("");
      setDescription("");
      await loadData();
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Proje oluşturulurken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projTitle: string) => {
    if (confirm(`"${projTitle}" adlı projeyi silmek istediğinize emin misiniz?`)) {
      await projectRepo.delete(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Proje & Tasarım Portföyü</h1>
          <p className="text-xs text-slate-400 mt-1">
            PixelArt aktif projeleri, bütçe takibi ve iş teslim süreleri
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Proje Oluştur</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => (
          <div key={proj.id} className="glass-card p-5 rounded-2xl space-y-4 relative group">
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  proj.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : proj.status === "in_progress"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {proj.status === "completed"
                  ? "Tamamlandı"
                  : proj.status === "in_progress"
                  ? "Devam Ediyor"
                  : "Aday / Teklif"}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">
                  {formatCurrency(proj.budget, proj.currency)}
                </span>
                <button
                  onClick={() => handleDelete(proj.id, proj.title)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Projeyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{proj.title}</h3>
              {proj.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[120px]">
                  {proj.clients?.name || "Müşteri Atanmadı"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(proj.start_date)}</span>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl text-slate-500 text-xs">
            Henüz oluşturulmuş proje bulunmuyor.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Proje Ekle</h3>
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
                <label className="block text-[11px] text-slate-400 mb-1">Proje Başlığı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="Örn: Mobil Uygulama UI/UX Tasarımı"
                />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Proje Bütçesi</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
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
                <label className="block text-[11px] text-slate-400 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                ></textarea>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
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
