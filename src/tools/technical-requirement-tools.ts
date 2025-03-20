import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import {
  isErrorResponse,
  validateRequirementTypeWithResponse,
  validateTechnicalRequirementStatusWithResponse,
} from "../utils/validation.js";
import { requirementStore, technicalRequirementStore } from "./index.js";

/**
 * Create a technical requirement
 */
export const createTechnicalRequirement = withErrorHandling(
  async (input: {
    projectId: string;
    title: string;
    description: string;
    type: string;
    technicalStack: string;
    status?: string;
    acceptanceCriteria?: { description: string }[];
  }) => {
    const {
      projectId,
      title,
      description,
      type,
      technicalStack,
      status,
      acceptanceCriteria,
    } = input;

    // Validate type
    const typeResult = validateRequirementTypeWithResponse(type);
    if (isErrorResponse(typeResult)) {
      return typeResult;
    }

    // Validate status if provided
    if (status) {
      const statusResult =
        validateTechnicalRequirementStatusWithResponse(status);
      if (isErrorResponse(statusResult)) {
        return statusResult;
      }

      const technicalRequirement =
        await technicalRequirementStore.createTechnicalRequirement({
          projectId,
          title,
          description,
          type: typeResult,
          technicalStack,
          status: statusResult,
          acceptanceCriteria,
        });

      return { technicalRequirement };
    }

    const technicalRequirement =
      await technicalRequirementStore.createTechnicalRequirement({
        projectId,
        title,
        description,
        type: typeResult,
        technicalStack,
        acceptanceCriteria,
      });

    return { technicalRequirement };
  },
  "createTechnicalRequirement"
);

/**
 * Generate a technical requirement from existing requirement
 */
export const generateTechnicalRequirement = withErrorHandling(
  async (input: { requirementId: string }) => {
    const { requirementId } = input;

    // Get the original requirement
    const requirement = await requirementStore.getRequirementById(
      requirementId
    );

    if (!requirement) {
      return createErrorResponse(
        `Requirement with ID ${requirementId} not found`
      );
    }

    // Create a new technical requirement based on the original requirement
    const technicalRequirement =
      await technicalRequirementStore.createTechnicalRequirement({
        projectId: requirement.projectId,
        title: `Technical: ${requirement.title}`,
        description: requirement.description,
        type: requirement.type,
        technicalStack: "",
      });

    if (!technicalRequirement) {
      return createErrorResponse(
        `Failed to generate technical requirement for requirement ${requirementId}`
      );
    }

    return { technicalRequirement };
  },
  "generateTechnicalRequirement"
);

/**
 * Generate technical requirements from discovery responses
 */
export const generateTechnicalRequirementsFromDiscovery = withErrorHandling(
  async (input: { projectId: string; discoveryResponses: string }) => {
    const { projectId, discoveryResponses } = input;

    // This would involve AI processing in a real implementation
    // For now, create a placeholder technical requirement
    const technicalRequirement =
      await technicalRequirementStore.createTechnicalRequirement({
        projectId,
        title: "Generated from discovery",
        description: `Based on discovery: ${discoveryResponses.substring(
          0,
          100
        )}...`,
        type: "technical",
        technicalStack: "Generated stack",
      });

    return { technicalRequirements: [technicalRequirement] };
  },
  "generateTechnicalRequirementsFromDiscovery"
);

/**
 * Generate a technical requirement from description
 */
export const generateDirectTechnicalRequirement = withErrorHandling(
  async (input: { projectId: string; description: string }) => {
    const { projectId, description } = input;

    // This would involve AI processing in a real implementation
    const technicalRequirement =
      await technicalRequirementStore.createTechnicalRequirement({
        projectId,
        title: "Generated from description",
        description,
        type: "technical",
        technicalStack: "Generated stack",
      });

    return { technicalRequirement };
  },
  "generateDirectTechnicalRequirement"
);

/**
 * List all technical requirements for a project
 */
export const listProjectTechnicalRequirements = withErrorHandling(
  async (input: { projectId: string }) => {
    const { projectId } = input;

    const technicalRequirements =
      await technicalRequirementStore.getTechnicalRequirementsByProject(
        projectId
      );

    return { technicalRequirements };
  },
  "listProjectTechnicalRequirements"
);
