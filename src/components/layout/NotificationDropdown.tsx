"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  Wallet,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  X,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import { SupabaseAppointmentRepository } from "@/infrastructure/repositories/SupabaseAppointmentRepository";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "appointment" | "finance" | "project" | "system";
  timestamp: string;
  read: boolean;
  link?: string;
}

const appointmentRepo = new SupabaseAppointmentRepository();

const initialNotifications: NotificationItem[] = [];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "appointment" | "finance">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load real data
  useEffect(() => {
    async function fetchRealNotifications() {
      try {
        const apps = await appointmentRepo.getAll();

        const newNotifs: NotificationItem[] = [];

        // Upcoming/Pending appointments
        apps.filter((a) => a.status === "pending" || a.status === "confirmed").forEach((app) => {
          newNotifs.push({
            id: `app-${app.id}`,
            title: "Randevu Hatırlatması",
            message: `${app.appointment_date} ${app.appointment_time} tarihinde ${app.clients?.name || 'Müşteri'} ile randevunuz var.`,
            type: "appointment",
            timestamp: app.appointment_date,
            read: false,
            link: "/appointments",
          });
        });

        // Merge with localStorage read states
        const saved = localStorage.getItem("pixelart_notifications_read");
        const readIds: string[] = saved ? JSON.parse(saved) : [];
        
        const merged = newNotifs.map((n) => ({
          ...n,
          read: readIds.includes(n.id)
        }));

        setNotifications(merged);
      } catch (e) {
        console.error("Error fetching notifications:", e);
      }
    }

    fetchRealNotifications();
  }, []);

  // Save read states to localStorage
  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    try {
      const readIds = updated.filter((n) => n.read).map((n) => n.id);
      localStorage.setItem("pixelart_notifications_read", JSON.stringify(readIds));
    } catch (e) {
      console.error(e);
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "appointment") return n.type === "appointment";
    if (filter === "finance") return n.type === "finance";
    return true;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case "finance":
        return <Wallet className="w-4 h-4 text-amber-400" />;
      case "project":
        return <FolderKanban className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-[#65D22A]/40 transition-all relative cursor-pointer group"
        title="Bildirimler"
      >
        <Bell className={`w-4 h-4 transition-transform group-hover:scale-110 ${unreadCount > 0 ? "text-slate-200" : ""}`} />

        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#65D22A] rounded-full animate-ping opacity-75"></span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#65D22A] rounded-full shadow-[0_0_8px_#65D22A]"></span>
          </>
        )}
      </button>

      {/* Notifications Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Bildirimler</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#65D22A]/20 text-[#65D22A] border border-[#65D22A]/30 rounded-full">
                  {unreadCount} yeni
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={soundEnabled ? "Sesli Bildirim Açık" : "Sesli Bildirim Kapalı"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#65D22A]" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 text-slate-400 hover:text-[#65D22A] rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-900/30 border-b border-slate-800/50 text-[11px] overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === "all" ? "bg-[#65D22A]/20 text-[#65D22A] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === "unread" ? "bg-[#65D22A]/20 text-[#65D22A] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Okunmamış ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("appointment")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === "appointment" ? "bg-[#65D22A]/20 text-[#65D22A] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Randevu
            </button>
            <button
              onClick={() => setFilter("finance")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filter === "finance" ? "bg-[#65D22A]/20 text-[#65D22A] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Finans
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                Bildirim bulunmuyor.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-900/80 transition-colors cursor-pointer group relative ${
                    !notif.read ? "bg-slate-900/40" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold ${!notif.read ? "text-white" : "text-slate-300"}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions on hover / status */}
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    {!notif.read && (
                      <span
                        onClick={(e) => markAsRead(notif.id, e)}
                        className="w-2 h-2 rounded-full bg-[#65D22A] shadow-[0_0_6px_#65D22A] cursor-pointer"
                        title="Okundu İşaretle"
                      />
                    )}
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px]">
              <button
                onClick={markAllAsRead}
                className="text-slate-400 hover:text-[#65D22A] font-medium transition-colors"
              >
                Tümünü Okundu Say
              </button>
              <button
                onClick={clearAll}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                Tümünü Temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
