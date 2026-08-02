import { supabase } from "@/lib/supabase";
import { AppointmentRepository } from "@/core/repositories/AppointmentRepository";
import { Appointment } from "@/core/types";

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from("appointments")
      .select(`*, clients(*)`)
      .order("appointment_date", { ascending: true });
    
    if (error) console.error(error);
    return (data as unknown as Appointment[]) || [];
  }

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from("appointments")
      .select(`*, clients(*)`)
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as Appointment;
  }

  async getUpcoming(days: number): Promise<Appointment[]> {
    const today = new Date().toISOString().split("T")[0];
    const target = new Date();
    target.setDate(target.getDate() + days);
    const targetDate = target.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("appointments")
      .select(`*, clients(*)`)
      .gte("appointment_date", today)
      .lte("appointment_date", targetDate)
      .order("appointment_date", { ascending: true });

    if (error) console.error(error);
    return (data as unknown as Appointment[]) || [];
  }

  async create(appointment: Partial<Appointment>): Promise<Appointment> {
    const newApp = {
      client_id: appointment.client_id,
      service_title: appointment.service_title,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes || 60,
      price: appointment.price || 0,
      notes: appointment.notes || null,
      status: appointment.status || "scheduled",
    };

    const { data, error } = await supabase.from("appointments").insert(newApp).select(`*, clients(*)`).single();
    if (error) throw error;
    return data as unknown as Appointment;
  }

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select(`*, clients(*)`).single();
    if (error) throw error;
    return data as unknown as Appointment;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return false;
    return true;
  }
}
