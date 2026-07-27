"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/core/types";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

const MOCK_USERS: (User & { password: string })[] = [
  { id: "u1", full_name: "PixelArt Yönetici", role: "admin", email: "admin@pixelart.com", password: "admin123", created_at: new Date().toISOString() },
  { id: "u2", full_name: "Finans Sorumlusu", role: "accountant", email: "finans@pixelart.com", password: "pixel123", created_at: new Date().toISOString() },
  { id: "u3", full_name: "Kıdemli Tasarımcı", role: "designer", email: "tasarim@pixelart.com", password: "pixel123", created_at: new Date().toISOString() },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pixelart_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Auth storage read error:", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return false;
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem("pixelart_user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pixelart_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
