import { supabase } from "@/lib/supabase";
import { ProjectRepository } from "@/core/repositories/ProjectRepository";
import { Project } from "@/core/types";

const LOCAL_STORAGE_KEY = "pixelart_projects";

const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    client_id: "c1",
    title: "Kurumsal Web & Mobil Arayüz Tasarımı",
    description: "PixelArt UI/UX ve mobil uygulama görsel tasarımları",
    status: "in_progress",
    budget: 45000,
    currency: "TRY",
    start_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
  },
  {
    id: "p2",
    client_id: "c2",
    title: "E-Ticaret Platformu Yenilemesi",
    description: "Kullanıcı deneyimi odaklı modern e-ticaret arayüzü tasarımı",
    status: "completed",
    budget: 85000,
    currency: "TRY",
    start_date: "2026-03-15",
    end_date: "2026-06-20",
    created_at: "2026-03-10T10:00:00Z",
  },
  {
    id: "p3",
    client_id: "c3",
    title: "SaaS Dashboard Tasarımı",
    description: "Analitik verilerin sunulduğu B2B dashboard",
    status: "completed",
    budget: 60000,
    currency: "TRY",
    start_date: "2026-01-10",
    end_date: "2026-04-05",
    created_at: "2026-01-05T09:30:00Z",
  },
  {
    id: "p4",
    client_id: "c1",
    title: "Marka Kimliği & Logo",
    description: "Yeni oluşum için kurumsal kimlik kılavuzu",
    status: "completed",
    budget: 25000,
    currency: "TRY",
    start_date: "2026-05-01",
    end_date: "2026-05-30",
    created_at: "2026-04-28T14:15:00Z",
  }
];

export class SupabaseProjectRepository implements ProjectRepository {
  private getLocal(): Project[] {
    if (typeof window === "undefined") return MOCK_PROJECTS;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_PROJECTS));
      return MOCK_PROJECTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_PROJECTS;
    }
  }

  private saveLocal(list: Project[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  }

  async getAll(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`*, clients (*)`)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as Project[];
      }
    } catch (e) {
      console.warn("Supabase projects fetch warning:", e);
    }
    return this.getLocal();
  }

  async getById(id: string): Promise<Project | null> {
    const list = await this.getAll();
    return list.find((p) => p.id === id) || null;
  }

  async create(project: Partial<Project>): Promise<Project> {
    const newProject: Project = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      client_id: project.client_id || null,
      title: project.title || "Yeni Proje",
      description: project.description || null,
      status: project.status || "in_progress",
      budget: Number(project.budget || 0),
      currency: project.currency || "TRY",
      start_date: project.start_date || new Date().toISOString().split("T")[0],
      end_date: project.end_date || null,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_id: newProject.client_id,
          title: newProject.title,
          description: newProject.description,
          status: newProject.status,
          budget: newProject.budget,
          currency: newProject.currency,
          start_date: newProject.start_date,
          end_date: newProject.end_date,
        })
        .select(`*, clients (*)`)
        .single();

      if (!error && data) {
        newProject.id = data.id;
      }
    } catch (e) {
      console.warn("Supabase project insert warning:", e);
    }

    const current = this.getLocal();
    const updated = [newProject, ...current];
    this.saveLocal(updated);
    return newProject;
  }

  async update(id: string, project: Partial<Project>): Promise<Project> {
    const current = this.getLocal();
    const index = current.findIndex((p) => p.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...project };
      this.saveLocal(current);
      return current[index];
    }
    throw new Error("Proje bulunamadı");
  }

  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from("projects").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase project delete warning:", e);
    }
    const current = this.getLocal().filter((p) => p.id !== id);
    this.saveLocal(current);
    return true;
  }
}
