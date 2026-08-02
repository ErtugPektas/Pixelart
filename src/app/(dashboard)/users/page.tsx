"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, UserRole } from "@/core/types";
import { UserCog, Plus, Trash2, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("standard" as UserRole);

  const loadUsers = async () => {
    setLoading(true);
    
    const [profilesRes, invitesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("invitations").select("*").order("created_at", { ascending: false })
    ]);

    if (profilesRes.data) setUsers(profilesRes.data as User[]);
    if (invitesRes.data) setInvitations(invitesRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await supabase.from("invitations").insert({ email, role });
    
    setEmail("");
    setIsInviteOpen(false);
    loadUsers();
  };

  const handleRevokeInvite = async (id: string) => {
    if (confirm("Bu daveti iptal etmek istediğinize emin misiniz?")) {
      await supabase.from("invitations").delete().eq("id", id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Kullanıcı Yönetimi</h1>
          <p className="text-xs text-slate-400 mt-1">Sistemdeki kullanıcıları görüntüle ve yeni kişiler davet et</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Kullanıcı Davet Et</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-indigo-400" /> Aktif Kullanıcılar
          </h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500">Yükleniyor...</p>
            ) : users.length === 0 ? (
              <p className="text-xs text-slate-500">Kayıtlı kullanıcı bulunamadı.</p>
            ) : (
              users.map(u => (
                <div key={u.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{u.full_name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-400" /> Bekleyen Davetler
          </h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500">Yükleniyor...</p>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-slate-500">Bekleyen davet bulunmuyor.</p>
            ) : (
              invitations.map(inv => (
                <div key={inv.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{inv.email}</p>
                    <p className="text-xs text-slate-400">Tarih: {formatDate(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                      {inv.role}
                    </span>
                    <button onClick={() => handleRevokeInvite(inv.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4">Yeni Kullanıcı Davet Et</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="admin">Yönetici (Admin)</option>
                  <option value="manager">Yönetici Yardımcısı</option>
                  <option value="designer">Tasarımcı</option>
                  <option value="accountant">Muhasebe</option>
                  <option value="standard">Standart</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsInviteOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-800 rounded-xl">İptal</button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl">Davet Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
