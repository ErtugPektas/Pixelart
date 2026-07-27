import { Appointment } from "../types";

export interface AppointmentRepository {
  getAll(): Promise<Appointment[]>;
  getById(id: string): Promise<Appointment | null>;
  create(appointment: Partial<Appointment>): Promise<Appointment>;
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<boolean>;
}
