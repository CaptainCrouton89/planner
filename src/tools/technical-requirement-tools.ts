import * as requirementsApi from "../api/requirements.js";
import { RequirementType } from "../core/Requirement.js";
import { TechnicalRequirementStatus } from "../core/TechnicalRequirement.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateRequirementType } from "../utils/validation.js";

// Type representing an error response from createErrorResponse
type ErrorResponseType = ReturnType<typeof createErrorResponse>;

/**
 * Type guard to check if a value is an error response
 */
function isErrorResponse(value: any): value is ErrorResponseType {
  return (
    value &&
    typeof value === "object" &&
    "success" in value &&
    value.success === false
  );
}

/**
 * Create a technical requirement (implementation)
 */
async function createTechnicalRequirementImpl(input: {
  projectId: string;
  title: string;
  description: string;
  type: string;
  technicalStack: string;
  status?: string;
  acceptanceCriteria?: { description: string }[];
}) {
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
    const statusResult = validateTechnicalRequirementStatusWithResponse(status);
    if (isErrorResponse(statusResult)) {
      return statusResult;
    }

    const technicalRequirement =
      await requirementsApi.createTechnicalRequirement({
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

  const technicalRequirement = await requirementsApi.createTechnicalRequirement(
    {
      projectId,
      title,
      description,
      type: typeResult,
      technicalStack,
      acceptanceCriteria,
    }
  );

  return { technicalRequirement };
}

/**
 * Create a technical requirement
 */
export const createTechnicalRequirement = withErrorHandling(
  createTechnicalRequirementImpl,
  "createTechnicalRequirement"
);

/**
 * Generate a technical requirement from existing requirement (implementation)
 */
async function generateTechnicalRequirementImpl(input: {
  requirementId: string;
}) {
  const { requirementId } = input;

  const technicalRequirement =
    await requirementsApi.generateTechnicalRequirement(requirementId);

  if (!technicalRequirement) {
    return createErrorResponse(
      `Failed to generate technical requirement for requirement ${requirementId}`
    );
  }

  return { technicalRequirement };
}

/**
 * Generate a technical requirement from existing requirement
 */
export const generateTechnicalRequirement = withErrorHandling(
  generateTechnicalRequirementImpl,
  "generateTechnicalRequirement"
);

/**
 * Generate technical requirements from discovery responses (implementation)
 */
async function generateTechnicalRequirementsFromDiscoveryImpl(input: {
  projectId: string;
  discoveryResponses: string;
}) {
  const { projectId, discoveryResponses } = input;

  const technicalRequirements =
    await requirementsApi.generateTechnicalRequirementsFromDiscovery(
      projectId,
      discoveryResponses
    );

  return { technicalRequirements };
}

/**
 * Generate technical requirements from discovery responses
 */
export const generateTechnicalRequirementsFromDiscovery = withErrorHandling(
  generateTechnicalRequirementsFromDiscoveryImpl,
  "generateTechnicalRequirementsFromDiscovery"
);

/**
 * Generate a technical requirement from description (implementation)
 */
async function generateDirectTechnicalRequirementImpl(input: {
  projectId: string;
  description: string;
}) {
  const { projectId, description } = input;

  const technicalRequirement =
    await requirementsApi.generateDirectTechnicalRequirement(
      projectId,
      description
    );

  return { technicalRequirement };
}

/**
 * Generate a technical requirement from description
 */
export const generateDirectTechnicalRequirement = withErrorHandling(
  generateDirectTechnicalRequirementImpl,
  "generateDirectTechnicalRequirement"
);

/**
 * List all technical requirements for a project (implementation)
 */
async function listProjectTechnicalRequirementsImpl(input: {
  projectId: string;
}) {
  const { projectId } = input;

  const technicalRequirements =
    await requirementsApi.listProjectTechnicalRequirements(projectId);

  return { technicalRequirements };
}

/**
 * List all technical requirements for a project
 */
export const listProjectTechnicalRequirements = withErrorHandling(
  listProjectTechnicalRequirementsImpl,
  "listProjectTechnicalRequirements"
);

// Helper function for validating requirement type
function validateRequirementTypeWithResponse(
  type: string
): RequirementType | ErrorResponseType {
  const validatedType = validateRequirementType(type);
  if (!validatedType) {
    return createErrorResponse(
      `Invalid requirement type: ${type}. Valid types are: functional, technical, non-functional, user_story`
    );
  }
  return validatedType;
}

// Helper function for validating technical requirement status
function validateTechnicalRequirementStatusWithResponse(
  status: string
): TechnicalRequirementStatus | ErrorResponseType {
  const validStatuses: TechnicalRequirementStatus[] = [
    "unassigned",
    "assigned",
    "in_progress",
    "review",
    "completed",
  ];

  if (!validStatuses.includes(status as TechnicalRequirementStatus)) {
    return createErrorResponse(
      `Invalid technical requirement status: ${status}. Valid statuses are: ${validStatuses.join(
        ", "
      )}`
    );
  }

  return status as TechnicalRequirementStatus;
}
