import * as requirementsApi from "../api/requirements.js";
import {
  RequirementPriority,
  RequirementStatus,
  RequirementType,
} from "../core/Requirement.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import {
  validateDiscoveryStage,
  validateRequirementPriority,
  validateRequirementStatus,
  validateRequirementType,
} from "../utils/validation.js";

/**
 * Create a new project (implementation)
 */
async function createProjectImpl(input: {
  name: string;
  description?: string;
}) {
  const { name, description } = input;
  const project = await requirementsApi.createProject(name, description);
  return { project };
}

/**
 * Create a new project
 */
export const createProject = withErrorHandling(
  createProjectImpl,
  "createProject"
);

/**
 * Update an existing project (implementation)
 */
async function updateProjectImpl(input: {
  id: string;
  name?: string;
  description?: string;
}) {
  const { id, name, description } = input;
  const project = await requirementsApi.updateProject(id, {
    name,
    description,
  });

  if (!project) {
    return createErrorResponse(`Project with ID ${id} not found`);
  }

  return { project };
}

/**
 * Update an existing project
 */
export const updateProject = withErrorHandling(
  updateProjectImpl,
  "updateProject"
);

/**
 * Create a requirement
 */
export async function createRequirement(input: {
  projectId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
}) {
  try {
    const { projectId, title, description, type, priority, status } = input;

    // Validate type
    const validatedType = validateRequirementTypeWithResponse(type);
    if (typeof validatedType === "object") {
      return validatedType; // Return error response
    }

    // Validate priority
    const validatedPriority = validateRequirementPriorityWithResponse(priority);
    if (typeof validatedPriority === "object") {
      return validatedPriority; // Return error response
    }

    // Validate status
    const validatedStatus = validateRequirementStatusWithResponse(status);
    if (typeof validatedStatus === "object") {
      return validatedStatus; // Return error response
    }
    const requirement = await requirementsApi.createRequirement({
      projectId,
      title,
      description,
      type: validatedType,
      priority: validatedPriority,
      status: validatedStatus,
    });

    return {
      success: true,
      requirement,
    };
  } catch (error) {
    console.error("Error creating requirement:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Update a requirement
 */
export async function updateRequirement(input: {
  id: string;
  projectId?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
}) {
  try {
    const { id, title, description, type, priority, status } = input;

    // Validate type if provided
    let validatedType: RequirementType | undefined;
    if (type) {
      const typeValidation = validateRequirementTypeWithResponse(type);
      if (typeof typeValidation === "object") {
        return typeValidation; // Return error response
      }
      validatedType = typeValidation;
    }

    // Validate priority if provided
    let validatedPriority: RequirementPriority | undefined;
    if (priority) {
      const priorityValidation =
        validateRequirementPriorityWithResponse(priority);
      if (typeof priorityValidation === "object") {
        return priorityValidation; // Return error response
      }
      validatedPriority = priorityValidation;
    }

    // Validate status if provided
    let validatedStatus: RequirementStatus | undefined;
    if (status) {
      const statusValidation = validateRequirementStatusWithResponse(status);
      if (typeof statusValidation === "object") {
        return statusValidation; // Return error response
      }
      validatedStatus = statusValidation;
    }

    const requirement = await requirementsApi.updateRequirement(id, {
      title,
      description,
      type: validatedType,
      priority: validatedPriority,
      status: validatedStatus,
    });

    if (!requirement) {
      return {
        success: false,
        error: `Requirement with ID ${id} not found`,
      };
    }

    return {
      success: true,
      requirement,
    };
  } catch (error) {
    console.error("Error updating requirement:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Delete a requirement
 */
export async function deleteRequirement(input: { id: string }) {
  try {
    const { id } = input;
    const success = await requirementsApi.deleteRequirement(id);

    if (!success) {
      return {
        success: false,
        error: `Requirement with ID ${id} not found`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting requirement:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * List all requirements for a project
 */
export async function listProjectRequirements(input: { projectId: string }) {
  try {
    const { projectId } = input;
    const requirements = await requirementsApi.listProjectRequirements(
      projectId
    );

    return {
      success: true,
      requirements,
    };
  } catch (error) {
    console.error("Error listing project requirements:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Guide the user through structured requirement discovery
 */
export async function guidedRequirementDiscovery(input: {
  projectId: string;
  domain: string;
  stage: string;
  previousResponses?: string;
}) {
  try {
    const { projectId, domain, stage, previousResponses } = input;

    // Validate stage
    const validatedStage = validateDiscoveryStageWithResponse(stage);
    if (typeof validatedStage === "object") {
      return validatedStage; // Return error response
    }

    const response = await requirementsApi.guidedRequirementDiscovery({
      projectId,
      domain,
      stage: validatedStage,
      previousResponses,
    });

    return {
      success: true,
      response,
    };
  } catch (error) {
    console.error("Error in guided requirement discovery:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Process the user's response to guided discovery
 */
export async function processDiscoveryResponse(input: {
  projectId: string;
  stage: string;
  domain: string;
  response: string;
  previousResponses?: string;
}) {
  try {
    const {
      projectId,
      stage,
      domain,
      response: userResponse,
      previousResponses,
    } = input;

    // Validate stage
    const validatedStage = validateDiscoveryStageWithResponse(stage);
    if (typeof validatedStage === "object") {
      return validatedStage; // Return error response
    }

    const result = await requirementsApi.processDiscoveryResponse({
      projectId,
      stage: validatedStage,
      domain,
      response: userResponse,
      previousResponses,
    });

    return {
      success: true,
      response: result,
    };
  } catch (error) {
    console.error("Error processing discovery response:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Generate requirements from discovery responses
 */
export async function generateRequirementsFromDiscovery(input: {
  projectId: string;
  discoveryResponses: string;
}) {
  try {
    const { projectId, discoveryResponses } = input;

    const requirements =
      await requirementsApi.generateRequirementsFromDiscovery(
        projectId,
        discoveryResponses
      );

    return {
      success: true,
      requirements,
    };
  } catch (error) {
    console.error("Error generating requirements from discovery:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Generate a requirement from natural language
 */
export async function generateRequirement(input: {
  projectId: string;
  description: string;
}) {
  try {
    const { projectId, description } = input;

    const requirement = await requirementsApi.generateRequirement(
      projectId,
      description
    );

    return {
      success: true,
      requirement,
    };
  } catch (error) {
    console.error("Error generating requirement:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Find projects matching a search term
 */
export async function findProjects(input: { searchTerm?: string }) {
  try {
    const { searchTerm } = input;
    const projects = await requirementsApi.findProjects(searchTerm);

    return {
      success: true,
      projects,
    };
  } catch (error) {
    console.error("Error finding projects:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get a project by ID
 */
export async function getProject(input: { id: string }) {
  try {
    const { id } = input;
    const project = await requirementsApi.getProject(id);

    if (!project) {
      return {
        success: false,
        error: `Project with ID ${id} not found`,
      };
    }

    return {
      success: true,
      project,
    };
  } catch (error) {
    console.error("Error getting project:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Helper functions for validation with error responses
function validateRequirementTypeWithResponse(type: string) {
  const validatedType = validateRequirementType(type);
  if (!validatedType) {
    return createErrorResponse(
      `Invalid requirement type: ${type}. Valid types are: functional, technical, non-functional, user_story`
    );
  }
  return validatedType;
}

function validateRequirementPriorityWithResponse(priority: string) {
  const validatedPriority = validateRequirementPriority(priority);
  if (!validatedPriority) {
    return createErrorResponse(
      `Invalid requirement priority: ${priority}. Valid priorities are: low, medium, high`
    );
  }
  return validatedPriority;
}

function validateRequirementStatusWithResponse(status: string) {
  const validatedStatus = validateRequirementStatus(status);
  if (!validatedStatus) {
    return createErrorResponse(
      `Invalid requirement status: ${status}. Valid statuses are: draft, approved, implemented`
    );
  }
  return validatedStatus;
}

function validateDiscoveryStageWithResponse(stage: string) {
  const validatedStage = validateDiscoveryStage(stage);
  if (!validatedStage) {
    return createErrorResponse(
      `Invalid discovery stage: ${stage}. Valid stages are: initial, stakeholders, features, constraints, quality, finalize`
    );
  }
  return validatedStage;
}
