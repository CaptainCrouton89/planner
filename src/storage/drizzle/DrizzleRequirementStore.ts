import { desc, eq, ilike, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  RequirementInput,
  Requirement as RequirementModel,
  RequirementPriority,
  UpdateRequirementInput,
} from "../../core/Requirement.js";
import {
  db,
  NewRequirement,
  Requirement,
  requirements,
} from "../../db/index.js";

export class DrizzleRequirementStore {
  constructor() {}

  async initialize(): Promise<void> {
    try {
      // Check connection by running a simple query
      await db.select().from(requirements).limit(1);
    } catch (error) {
      console.error("Error initializing DrizzleRequirementStore:", error);
      throw error;
    }
  }

  async getAllRequirements(): Promise<RequirementModel[]> {
    try {
      const result = await db
        .select()
        .from(requirements)
        .orderBy(desc(requirements.updatedAt));
      return result.map(this.mapToRequirementModel);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      throw error;
    }
  }

  async getRequirementById(id: string): Promise<RequirementModel | undefined> {
    try {
      const result = await db
        .select()
        .from(requirements)
        .where(eq(requirements.id, id));

      if (result.length === 0) {
        return undefined;
      }

      return this.mapToRequirementModel(result[0]);
    } catch (error) {
      console.error(`Error fetching requirement with id ${id}:`, error);
      throw error;
    }
  }

  async createRequirement(input: RequirementInput): Promise<RequirementModel> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Map the priority to the enum values in the database
      // If it's "critical", we'll use "high" as the DB doesn't have "critical"
      const dbPriority =
        input.priority === "critical" ? "high" : input.priority;

      const newRequirement: NewRequirement = {
        id,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: dbPriority,
        status: "draft", // Default status
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(requirements).values(newRequirement);

      return {
        id,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        type: input.type,
        priority: input.priority,
        status: "draft",
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("Error creating requirement:", error);
      throw error;
    }
  }

  async updateRequirement(
    id: string,
    input: UpdateRequirementInput
  ): Promise<RequirementModel | undefined> {
    try {
      // First check if the requirement exists
      const existingRequirement = await this.getRequirementById(id);
      if (!existingRequirement) {
        return undefined;
      }

      // Create update object
      const updateData: Partial<Requirement> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) {
        updateData.title = input.title;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.type !== undefined) {
        updateData.type = input.type;
      }

      if (input.priority !== undefined) {
        // Map the priority to the enum values in the database
        // If it's "critical", we'll use "high" as the DB doesn't have "critical"
        updateData.priority =
          input.priority === "critical" ? "high" : input.priority;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.tags !== undefined) {
        updateData.tags = input.tags;
      }

      // Update the requirement
      await db
        .update(requirements)
        .set(updateData)
        .where(eq(requirements.id, id));

      // Get the updated requirement
      return this.getRequirementById(id);
    } catch (error) {
      console.error(`Error updating requirement with id ${id}:`, error);
      throw error;
    }
  }

  async deleteRequirement(id: string): Promise<boolean> {
    try {
      // First check if the requirement exists
      const existingRequirement = await this.getRequirementById(id);
      if (!existingRequirement) {
        return false;
      }

      // Delete the requirement
      await db.delete(requirements).where(eq(requirements.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting requirement with id ${id}:`, error);
      throw error;
    }
  }

  async getRequirementsByProject(
    projectId: string
  ): Promise<RequirementModel[]> {
    try {
      const result = await db
        .select()
        .from(requirements)
        .where(eq(requirements.projectId, projectId))
        .orderBy(desc(requirements.updatedAt));

      return result.map(this.mapToRequirementModel);
    } catch (error) {
      console.error(
        `Error fetching requirements for project ${projectId}:`,
        error
      );
      throw error;
    }
  }

  async searchRequirements(query: string): Promise<RequirementModel[]> {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;

      const result = await db
        .select()
        .from(requirements)
        .where(
          or(
            ilike(requirements.title, searchQuery),
            ilike(requirements.description, searchQuery)
          )
        )
        .orderBy(desc(requirements.updatedAt));

      return result.map(this.mapToRequirementModel);
    } catch (error) {
      console.error(
        `Error searching requirements with query "${query}":`,
        error
      );
      throw error;
    }
  }

  private mapToRequirementModel(requirement: Requirement): RequirementModel {
    return {
      id: requirement.id,
      projectId: requirement.projectId,
      title: requirement.title,
      description: requirement.description,
      type: requirement.type,
      priority: this.mapDbPriorityToModel(requirement.priority),
      status: requirement.status,
      tags: requirement.tags || [],
      createdAt: requirement.createdAt || new Date(),
      updatedAt: requirement.updatedAt || new Date(),
    };
  }

  // Convert database priority to model priority (adding "critical" support)
  private mapDbPriorityToModel(
    priority: "low" | "medium" | "high" | null
  ): RequirementPriority {
    if (priority === null) {
      return "medium"; // Default priority
    }
    return priority as RequirementPriority;
  }
}
