import { supabase } from "@/lib/supabase";
import { ClientRepository } from "@/core/repositories/ClientRepository";
import { Client } from "@/core/types";

const LOCAL_STORAGE_KEY = "pixelart_clients";

const MOCK_CLIENTS: Client[] = [
  {
    id: "c1",
    type: "company",
    name: "Akıncı Tasarım A.Ş.",
    company_title: "Akıncı Tasarım Mimarlık ve Görsel Yapım San. Tic. A.Ş.",
    tax_office: "Kadıköy",
    tax_number: "1234567890",
    email: "iletisim@akincitasarim.com",
    phone: "+90 216 555 0199",
    address: "Kadıköy, İstanbul",
    notes: "VIP Müşteri",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "c2",
    type: "individual",
    name: "Burak Yılmaz",
    email: "burak@gmail.com",
    phone: "+90 532 111 2233",
    status: "active",
    created_at: new Date().toISOString(),
  },
];

export class SupabaseClientRepository implements ClientRepository {
  private getLocal(): Client[] {
    if (typeof window === "undefined") return MOCK_CLIENTS;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_CLIENTS));
      return MOCK_CLIENTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_CLIENTS;
    }
  }

  private saveLocal(list: Client[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  }

  async getAll(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Client[];
      }
    } catch (e) {
      console.warn("Supabase fetch failed, fallback to local storage:", e);
    }
    return this.getLocal();
  }

  async getById(id: string): Promise<Client | null> {
    const list = await this.getAll();
    return list.find((c) => c.id === id) || null;
  }

  async create(client: Partial<Client>): Promise<Client> {
    const newClient: Client = {
      id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      type: client.type || "individual",
      name: client.name || "Yeni Müşteri",
      company_title: client.company_title || null,
      tax_office: client.tax_office || null,
      tax_number: client.tax_number || null,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null,
      notes: client.notes || null,
      status: client.status || "active",
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          type: newClient.type,
          name: newClient.name,
          company_title: newClient.company_title,
          tax_office: newClient.tax_office,
          tax_number: newClient.tax_number,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
          notes: newClient.notes,
          status: newClient.status,
        })
        .select()
        .single();

      if (!error && data) {
        newClient.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase insert warning, fallback to local storage:", e);
    }

    const current = this.getLocal();
    const updated = [newClient, ...current];
    this.saveLocal(updated);
    return newClient;
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const current = this.getLocal();
    const index = current.findIndex((c) => c.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...client };
      this.saveLocal(current);
      return current[index];
    }
    throw new Error("Müşteri bulunamadı");
  }

  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from("clients").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase delete warning:", e);
    }
    const current = this.getLocal().filter((c) => c.id !== id);
    this.saveLocal(current);
    return true;
  }
}
