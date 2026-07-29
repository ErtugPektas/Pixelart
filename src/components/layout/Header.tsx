"use client";

import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { PixelArtLogo } from "@/components/common/PixelArtLogo";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 md:h-16 border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-20">
      {/* Mobile Brand Header */}
      <div className="flex items-center gap-2.5">
        <div className="md:hidden">
          <PixelArtLogo variant="full" size="sm" />
        </div>
        <div className="hidden md:block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            PixelArt <span className="text-[#65D22A]">Workspace</span>
          </h2>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#65D22A]/15 border border-[#65D22A]/30 flex items-center justify-center text-[#65D22A] text-xs font-bold shadow-[0_0_10px_rgba(101,210,42,0.15)]">
            {user?.full_name?.charAt(0) || "P"}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white">{user?.full_name || "Kullanıcı"}</p>
            <p className="text-[10px] text-[#65D22A] font-medium uppercase tracking-wider">{user?.role || "Admin"}</p>
          </div>

          <button
            onClick={logout}
            className="md:hidden p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
            title="Oturumu Kapat"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
