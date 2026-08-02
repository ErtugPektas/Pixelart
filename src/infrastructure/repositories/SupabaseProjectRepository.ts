import { supabase } from "@/lib/supabase";
import { ProjectRepository } from "@/core/repositories/ProjectRepository";
import { Project } from "@/core/types";

export class SupabaseProjectRepository implements ProjectRepository {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, clients(*)`)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    return (data as unknown as Project[]) || [];
  }

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, clients(*)`)
      .eq("id", id)
      .single();

    if (error) return null;
    return data as unknown as Project;
  }

  async getByClientId(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, clients(*)`)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    return (data as unknown as Project[]) || [];
  }

  async create(project: Partial<Project>): Promise<Project> {
    const newProject = {
      client_id: project.client_id,
      title: project.title,
      description: project.description || null,
      status: project.status || "not_started",
      budget: project.budget || null,
      currency: project.currency || "TRY",
      start_date: project.start_date || null,
      end_date: project.end_date || null,
    };

    const { data, error } = await supabase.from("projects").insert(newProject).select(`*, clients(*)`).single();
    if (error) throw error;
    return data as unknown as Project;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select(`*, clients(*)`).single();
    if (error) throw error;
    return data as unknown as Project;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return false;
    return true;
  }
}
