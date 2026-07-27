"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Wallet,
  Landmark,
  FileText,
  Repeat,
  BarChart3,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { name: "Genel Bakış", href: "/dashboard", icon: LayoutDashboard },
  { name: "Müşteriler", href: "/clients", icon: Users },
  { name: "Projeler", href: "/projects", icon: FolderKanban },
  { name: "Finans Paneli", href: "/finance", icon: Wallet },
  { name: "Banka & Kasalar", href: "/finance/accounts", icon: Landmark },
  { name: "Fatura & Fişler", href: "/finance/invoices", icon: FileText },
  { name: "Tekrarlayan Ödemeler", href: "/finance/recurring", icon: Repeat },
  { name: "Finansal Raporlar", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-base">PixelArt</h1>
          <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Finans & Yönetim</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
            <span>Oturumu Kapat</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
