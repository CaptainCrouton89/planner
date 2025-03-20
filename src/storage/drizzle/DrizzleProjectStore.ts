import { desc, eq, ilike, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  ProjectInput,
  Project as ProjectModel,
  UpdateProjectInput,
} from "../../core/Project.js";
import { db, NewProject, Project, projects } from "../../db/index.js";

export class DrizzleProjectStore {
  constructor() {}

  async initialize(): Promise<void> {
    try {
      // Check connection by running a simple query
      await db.select().from(projects).limit(1);
    } catch (error) {
      console.error("Error initializing DrizzleProjectStore:", error);
      throw error;
    }
  }

  async getAllProjects(): Promise<ProjectModel[]> {
    try {
      const result = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.updatedAt));
      return result.map(this.mapToProjectModel);
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  async getProjectById(id: string): Promise<ProjectModel | undefined> {
    try {
      const result = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id));

      if (result.length === 0) {
        return undefined;
      }

      return this.mapToProjectModel(result[0]);
    } catch (error) {
      console.error(`Error fetching project with id ${id}:`, error);
      throw error;
    }
  }

  async createProject(input: ProjectInput): Promise<ProjectModel> {
    try {
      const id = uuidv4();
      const now = new Date();

      const newProject: NewProject = {
        id,
        name: input.name,
        description: input.description || null,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(projects).values(newProject);

      return {
        id,
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  async updateProject(
    id: string,
    input: UpdateProjectInput
  ): Promise<ProjectModel | undefined> {
    try {
      // First check if the project exists
      const existingProject = await this.getProjectById(id);
      if (!existingProject) {
        return undefined;
      }

      // Create update object
      const updateData: Partial<Project> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      // Update the project
      await db.update(projects).set(updateData).where(eq(projects.id, id));

      // Get the updated project
      return this.getProjectById(id);
    } catch (error) {
      console.error(`Error updating project with id ${id}:`, error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    try {
      // First check if the project exists
      const existingProject = await this.getProjectById(id);
      if (!existingProject) {
        return false;
      }

      // Delete the project
      await db.delete(projects).where(eq(projects.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting project with id ${id}:`, error);
      throw error;
    }
  }

  async searchProjects(query: string): Promise<ProjectModel[]> {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;

      const result = await db
        .select()
        .from(projects)
        .where(
          or(
            ilike(projects.name, searchQuery),
            ilike(projects.description || "", searchQuery)
          )
        )
        .orderBy(desc(projects.updatedAt));

      return result.map(this.mapToProjectModel);
    } catch (error) {
      console.error(`Error searching projects with query "${query}":`, error);
      throw error;
    }
  }

  private mapToProjectModel(project: Project): ProjectModel {
    return {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      createdAt: project.createdAt || new Date(),
      updatedAt: project.updatedAt || new Date(),
    };
  }
}
