import { desc, eq, ilike, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  AcceptanceCriteriaInput,
  AcceptanceCriteria as AcceptanceCriteriaModel,
  TechnicalRequirementInput,
  TechnicalRequirement as TechnicalRequirementModel,
  UpdateTechnicalRequirementInput,
} from "../../core/TechnicalRequirement.js";
import {
  acceptanceCriteria,
  db,
  NewTechnicalRequirement,
  TechnicalRequirement,
  technicalRequirements,
} from "../../db/index.js";

export class DrizzleTechnicalRequirementStore {
  constructor() {}

  async initialize(): Promise<void> {
    try {
      // Check connection by running a simple query
      await db.select().from(technicalRequirements).limit(1);
    } catch (error) {
      console.error(
        "Error initializing DrizzleTechnicalRequirementStore:",
        error
      );
      throw error;
    }
  }

  async getAllTechnicalRequirements(): Promise<TechnicalRequirementModel[]> {
    try {
      const result = await db
        .select()
        .from(technicalRequirements)
        .orderBy(technicalRequirements.updatedAt);

      return await Promise.all(
        result.map(async (req) => {
          return this.mapToTechnicalRequirementModel(req);
        })
      );
    } catch (error) {
      console.error("Error fetching technical requirements:", error);
      throw error;
    }
  }

  async getTechnicalRequirementById(
    id: string
  ): Promise<TechnicalRequirementModel | undefined> {
    try {
      const result = await db
        .select()
        .from(technicalRequirements)
        .where(eq(technicalRequirements.id, id));

      if (result.length === 0) {
        return undefined;
      }

      return this.mapToTechnicalRequirementModel(result[0]);
    } catch (error) {
      console.error(
        `Error fetching technical requirement with id ${id}:`,
        error
      );
      throw error;
    }
  }

  async createTechnicalRequirement(
    input: TechnicalRequirementInput
  ): Promise<TechnicalRequirementModel> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Generate unique ID (e.g., TR-001)
      const uniqueId = await this.generateUniqueId();

      const newTechnicalRequirement: NewTechnicalRequirement = {
        id,
        uniqueId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        type: input.type,
        technicalStack: input.technicalStack,
        status: input.status || "unassigned",
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(technicalRequirements).values(newTechnicalRequirement);

      // Create acceptance criteria if provided
      if (input.acceptanceCriteria && input.acceptanceCriteria.length > 0) {
        await this.addAcceptanceCriteria(id, input.acceptanceCriteria);
      }

      return this.getTechnicalRequirementById(
        id
      ) as Promise<TechnicalRequirementModel>;
    } catch (error) {
      console.error("Error creating technical requirement:", error);
      throw error;
    }
  }

  async updateTechnicalRequirement(
    id: string,
    input: UpdateTechnicalRequirementInput
  ): Promise<TechnicalRequirementModel | undefined> {
    try {
      // First check if the technical requirement exists
      const existingRequirement = await this.getTechnicalRequirementById(id);
      if (!existingRequirement) {
        return undefined;
      }

      // Create update object
      const updateData: Partial<TechnicalRequirement> = {
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

      if (input.technicalStack !== undefined) {
        updateData.technicalStack = input.technicalStack;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      // Update the technical requirement
      await db
        .update(technicalRequirements)
        .set(updateData)
        .where(eq(technicalRequirements.id, id));

      // Update acceptance criteria if provided
      if (input.acceptanceCriteria) {
        // Delete existing criteria
        await db
          .delete(acceptanceCriteria)
          .where(eq(acceptanceCriteria.technicalRequirementId, id));

        // Add new criteria
        await this.addAcceptanceCriteria(id, input.acceptanceCriteria);
      }

      // Get the updated technical requirement
      return this.getTechnicalRequirementById(id);
    } catch (error) {
      console.error(
        `Error updating technical requirement with id ${id}:`,
        error
      );
      throw error;
    }
  }

  async deleteTechnicalRequirement(id: string): Promise<boolean> {
    try {
      // First check if the technical requirement exists
      const existingRequirement = await this.getTechnicalRequirementById(id);
      if (!existingRequirement) {
        return false;
      }

      // Acceptance criteria will be deleted by cascading

      // Delete the technical requirement
      await db
        .delete(technicalRequirements)
        .where(eq(technicalRequirements.id, id));

      return true;
    } catch (error) {
      console.error(
        `Error deleting technical requirement with id ${id}:`,
        error
      );
      throw error;
    }
  }

  async getTechnicalRequirementsByProject(
    projectId: string
  ): Promise<TechnicalRequirementModel[]> {
    try {
      const result = await db
        .select()
        .from(technicalRequirements)
        .where(eq(technicalRequirements.projectId, projectId))
        .orderBy(technicalRequirements.updatedAt);

      return Promise.all(
        result.map(async (req) => {
          return this.mapToTechnicalRequirementModel(req);
        })
      );
    } catch (error) {
      console.error(
        `Error fetching technical requirements for project ${projectId}:`,
        error
      );
      throw error;
    }
  }

  async searchTechnicalRequirements(
    query: string
  ): Promise<TechnicalRequirementModel[]> {
    try {
      const searchQuery = `%${query.toLowerCase()}%`;

      const result = await db
        .select()
        .from(technicalRequirements)
        .where(
          or(
            ilike(technicalRequirements.title, searchQuery),
            ilike(technicalRequirements.description, searchQuery),
            ilike(technicalRequirements.technicalStack, searchQuery)
          )
        )
        .orderBy(desc(technicalRequirements.updatedAt));

      return Promise.all(
        result.map(async (req) => {
          return this.mapToTechnicalRequirementModel(req);
        })
      );
    } catch (error) {
      console.error(
        `Error searching technical requirements with query "${query}":`,
        error
      );
      throw error;
    }
  }

  private async getAcceptanceCriteria(
    technicalRequirementId: string
  ): Promise<AcceptanceCriteriaModel[]> {
    try {
      const result = await db
        .select()
        .from(acceptanceCriteria)
        .where(
          eq(acceptanceCriteria.technicalRequirementId, technicalRequirementId)
        );

      return result.map((criteria) => ({
        id: criteria.id,
        description: criteria.description,
        technicalRequirementId: criteria.technicalRequirementId,
      }));
    } catch (error) {
      console.error(
        `Error fetching acceptance criteria for technical requirement ${technicalRequirementId}:`,
        error
      );
      throw error;
    }
  }

  private async addAcceptanceCriteria(
    technicalRequirementId: string,
    criteriaList: AcceptanceCriteriaInput[]
  ): Promise<void> {
    try {
      const criteriaToInsert = criteriaList.map((criteria) => ({
        id: uuidv4(),
        description: criteria.description,
        technicalRequirementId,
      }));

      await db.insert(acceptanceCriteria).values(criteriaToInsert);
    } catch (error) {
      console.error(
        `Error adding acceptance criteria for technical requirement ${technicalRequirementId}:`,
        error
      );
      throw error;
    }
  }

  private async generateUniqueId(): Promise<string> {
    // Get count of existing technical requirements to generate incremental ID
    const count = await db
      .select({ count: technicalRequirements.id })
      .from(technicalRequirements);
    const nextNumber = (count.length > 0 ? count.length : 0) + 1;
    return `TR-${nextNumber.toString().padStart(3, "0")}`;
  }

  private async mapToTechnicalRequirementModel(
    requirement: TechnicalRequirement
  ): Promise<TechnicalRequirementModel> {
    const criteria = await this.getAcceptanceCriteria(requirement.id);

    return {
      id: requirement.id,
      uniqueId: requirement.uniqueId,
      projectId: requirement.projectId,
      title: requirement.title,
      description: requirement.description,
      type: requirement.type,
      technicalStack: requirement.technicalStack,
      status: requirement.status,
      acceptanceCriteria: criteria,
      createdAt: requirement.createdAt || new Date(),
      updatedAt: requirement.updatedAt || new Date(),
    };
  }
}
