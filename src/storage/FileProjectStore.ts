import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";
import { Project, ProjectInput, UpdateProjectInput } from "../core/Project.js";

export class FileProjectStore {
  private projects: Map<string, Project> = new Map();
  private filePath: string;

  constructor(storageFile: string = "projects.json") {
    this.filePath = path.resolve(process.cwd(), storageFile);
  }

  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const projectArray = JSON.parse(data);
      this.projects = new Map(
        projectArray.map((project: Project) => {
          // Convert string dates back to Date objects
          project.createdAt = new Date(project.createdAt);
          project.updatedAt = new Date(project.updatedAt);
          return [project.id, project];
        })
      );
      console.error(`Loaded ${this.projects.size} projects from storage`);
    } catch (error) {
      // If file doesn't exist or can't be parsed, start with empty projects
      console.error(
        "Failed to load projects, starting with empty project list",
        error
      );
      this.projects = new Map();
      await this.save();
    }
  }

  private async save(): Promise<void> {
    try {
      const projectArray = Array.from(this.projects.values());
      await fs.writeFile(
        this.filePath,
        JSON.stringify(projectArray, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Failed to save projects:", error);
    }
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: nanoid(),
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(project.id, project);
    await this.save();
    return project;
  }

  async updateProject(
    id: string,
    input: UpdateProjectInput
  ): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...input,
      updatedAt: new Date(),
    };

    this.projects.set(id, updatedProject);
    await this.save();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) return false;

    this.projects.delete(id);
    await this.save();
    return true;
  }

  // New method to search projects by name or description
  async searchProjects(query: string): Promise<Project[]> {
    const searchQuery = query.toLowerCase();
    return Array.from(this.projects.values()).filter((project) => {
      const nameMatch = project.name.toLowerCase().includes(searchQuery);
      const descriptionMatch = project.description
        ? project.description.toLowerCase().includes(searchQuery)
        : false;
      return nameMatch || descriptionMatch;
    });
  }
}
