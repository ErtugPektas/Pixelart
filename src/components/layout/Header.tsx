"use client";

import { useAuth } from "@/lib/auth";
import { Bell, UserCheck } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-20">
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          PixelArt Workspace
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">
            {user?.full_name?.charAt(0) || "P"}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.full_name || "Kullanıcı"}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role || "Admin"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
