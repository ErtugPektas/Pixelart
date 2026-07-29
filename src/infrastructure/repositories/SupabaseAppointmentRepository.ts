import { supabase } from "@/lib/supabase";
import { AppointmentRepository } from "@/core/repositories/AppointmentRepository";
import { Appointment } from "@/core/types";

const LOCAL_STORAGE_KEY = "pixelart_appointments";

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "app1",
    client_id: "c1",
    service_title: "Arayüz Tasarım Değerlendirme & Sunum",
    appointment_date: new Date().toISOString().split("T")[0],
    appointment_time: "14:00",
    duration_minutes: 60,
    price: 3500,
    notes: "Proje konsept taslağı ve renk paleti sunumu",
    status: "confirmed",
    created_at: new Date().toISOString(),
    clients: {
      id: "c1",
      name: "Akıncı Tasarım A.Ş.",
      type: "company",
      status: "active",
      created_at: new Date().toISOString(),
    },
  },
];

export class SupabaseAppointmentRepository implements AppointmentRepository {
  private getLocal(): Appointment[] {
    if (typeof window === "undefined") return MOCK_APPOINTMENTS;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_APPOINTMENTS));
      return MOCK_APPOINTMENTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_APPOINTMENTS;
    }
  }

  private saveLocal(list: Appointment[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  }

  async getAll(): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, clients (*)`)
        .order("appointment_date", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as unknown as Appointment[];
      }
    } catch (e) {
      console.warn("Supabase appointments fetch warning:", e);
    }
    return this.getLocal();
  }

  async getById(id: string): Promise<Appointment | null> {
    const list = await this.getAll();
    return list.find((a) => a.id === id) || null;
  }

  async create(appointment: Partial<Appointment>): Promise<Appointment> {
    const newAppointment: Appointment = {
      id: "app_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      client_id: appointment.client_id || "",
      service_title: appointment.service_title || "Toplantı / Görüşme",
      appointment_date:
        appointment.appointment_date || new Date().toISOString().split("T")[0],
      appointment_time: appointment.appointment_time || "10:00",
      duration_minutes: appointment.duration_minutes || 60,
      price: Number(appointment.price || 0),
      notes: appointment.notes || null,
      status: appointment.status || "confirmed",
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          client_id: newAppointment.client_id,
          service_title: newAppointment.service_title,
          appointment_date: newAppointment.appointment_date,
          appointment_time: newAppointment.appointment_time,
          duration_minutes: newAppointment.duration_minutes,
          price: newAppointment.price,
          notes: newAppointment.notes,
          status: newAppointment.status,
        })
        .select(`*, clients (*)`)
        .single();

      if (!error && data) {
        newAppointment.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase appointment insert warning:", e);
    }

    const current = this.getLocal();
    const updated = [newAppointment, ...current];
    this.saveLocal(updated);
    return newAppointment;
  }

  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const current = this.getLocal();
    const index = current.findIndex((a) => a.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...appointment };
      try {
        await supabase
          .from("appointments")
          .update(appointment)
          .eq("id", id);
      } catch (e) {
        console.warn("Supabase appointment update warning:", e);
      }
      this.saveLocal(current);
      return current[index];
    }
    throw new Error("Randevu bulunamadı");
  }

  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from("appointments").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase appointment delete warning:", e);
    }
    const current = this.getLocal().filter((a) => a.id !== id);
    this.saveLocal(current);
    return true;
  }
}
