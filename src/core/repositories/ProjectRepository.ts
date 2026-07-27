import { Project } from "../types";

export interface ProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(project: Partial<Project>): Promise<Project>;
  update(id: string, project: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<boolean>;
}
