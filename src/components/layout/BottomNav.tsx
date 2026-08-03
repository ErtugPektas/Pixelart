"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FolderKanban,
  Wallet,
  BarChart3,
  UserCog,
} from "lucide-react";

const mobileNavItems = [
  { name: "Bakış", href: "/dashboard", icon: LayoutDashboard },
  { name: "Müşteri", href: "/clients", icon: Users },
  { name: "Randevu", href: "/appointments", icon: CalendarCheck },
  { name: "Projeler", href: "/projects", icon: FolderKanban },
  { name: "Finans", href: "/finance", icon: Wallet },
  { name: "Ekip", href: "/users", icon: UserCog },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const filteredNavItems = mobileNavItems.filter(item => {
    if (user?.role !== "admin" && (item.href === "/finance" || item.href === "/users")) return false;
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-bottom">
      <div className="flex items-center justify-around">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-indigo-400 font-bold scale-105"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  isActive ? "bg-indigo-600/20" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
