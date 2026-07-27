import { Client } from "../types";

export interface ClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(client: Partial<Client>): Promise<Client>;
  update(id: string, client: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<boolean>;
}
