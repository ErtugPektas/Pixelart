"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Send, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

export function GlobalNotesWidget() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (full_name)
        `)
        .order("created_at", { ascending: true });

      if (data) {
        setNotes(data as unknown as Note[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useRealtimeSync(["notes"], loadNotes);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    try {
      await supabase.from("notes").insert({
        content: newNote.trim(),
        user_id: user.id
      });
      setNewNote("");
      // loadNotes will be triggered by realtime sync
    } catch (e) {
      console.error("Not eklenemedi:", e);
    }
  };

  return (
    <div className="glass-card flex flex-col h-[400px] rounded-3xl overflow-hidden border border-slate-800/60 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="p-4 border-b border-slate-800/60 bg-slate-900/50 flex items-center gap-2 z-10">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold text-white tracking-wide">Ekip Notları & Sohbet</h2>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 z-10 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {loading ? (
          <p className="text-xs text-slate-500 text-center py-4">Yükleniyor...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Henüz not eklenmemiş. İlk notu sen yaz!</p>
        ) : (
          notes.map((note) => {
            const isMe = note.user_id === user?.id;
            return (
              <div key={note.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-slate-400 mb-1 px-1">
                  {note.profiles?.full_name || "Bilinmeyen"} • {formatDate(note.created_at)}
                </span>
                <div 
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    isMe 
                      ? "bg-indigo-600 text-white rounded-tr-sm" 
                      : "bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-sm"
                  }`}
                >
                  {note.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-slate-900/80 border-t border-slate-800/60 z-10">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Bir not yazın..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
