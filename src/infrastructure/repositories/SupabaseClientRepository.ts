import { supabase } from "@/lib/supabase";
import { ClientRepository } from "@/core/repositories/ClientRepository";
import { Client } from "@/core/types";

export class SupabaseClientRepository implements ClientRepository {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) console.error(error);
    return (data as Client[]) || [];
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) return null;
    return data as Client;
  }

  async create(client: Partial<Client>): Promise<Client> {
    const newClient = {
      type: client.type || "individual",
      name: client.name,
      company_title: client.company_title || null,
      tax_office: client.tax_office || null,
      tax_number: client.tax_number || null,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null,
      notes: client.notes || null,
      status: client.status || "active",
    };

    const { data, error } = await supabase.from("clients").insert(newClient).select().single();
    if (error) throw error;
    return data as Client;
  }

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data as Client;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return false;
    return true;
  }
}
