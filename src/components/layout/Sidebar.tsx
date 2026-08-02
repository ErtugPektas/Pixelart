"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FolderKanban,
  Wallet,
  Landmark,
  Repeat,
  BarChart3,
  LogOut,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PixelArtLogo } from "@/components/common/PixelArtLogo";

const navItems = [
  { name: "Genel Bakış", href: "/dashboard", icon: LayoutDashboard },
  { name: "Müşteriler", href: "/clients", icon: Users },
  { name: "Randevular", href: "/appointments", icon: CalendarCheck },
  { name: "Projeler", href: "/projects", icon: FolderKanban },
  { name: "Finans Paneli", href: "/finance", icon: Wallet, adminOnly: true },
  { name: "Tekrarlayan Ödemeler", href: "/finance/recurring", icon: Repeat, adminOnly: true },
  { name: "Finansal Raporlar", href: "/reports", icon: BarChart3, adminOnly: true },
  { name: "Kullanıcı Yönetimi", href: "/users", icon: UserCog, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 glass-panel border-r border-slate-800/80 flex-col h-screen sticky top-0 z-30">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center">
        <Link href="/dashboard">
          <PixelArtLogo variant="full" size="md" showSubtitle />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;
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
