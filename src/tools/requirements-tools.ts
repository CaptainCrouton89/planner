import * as requirementsApi from "../api/requirements.js";
import {
  DiscoveryStage,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
} from "../core/Requirement.js";

/**
 * Create a new project
 */
export async function createProject(input: {
  name: string;
  description?: string;
}) {
  try {
    const { name, description } = input;
    const project = await requirementsApi.createProject(name, description);
    return {
      success: true,
      project,
    };
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(input: {
  id: string;
  name?: string;
  description?: string;
}) {
  try {
    const { id, name, description } = input;
    const project = await requirementsApi.updateProject(id, {
      name,
      description,
    });

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
    console.error("Error updating project:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create a requirement
 */
export async function createRequirement(input: {
  projectId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  tags?: string[];
}) {
  try {
    const { projectId, title, description, type, priority, tags } = input;

    // Validate type
    const validatedType = validateRequirementType(type);
    if (!validatedType) {
      return {
        success: false,
        error: `Invalid requirement type: ${type}. Valid types are: functional, technical, non-functional, user_story`,
      };
    }

    // Validate priority
    const validatedPriority = validateRequirementPriority(priority);
    if (!validatedPriority) {
      return {
        success: false,
        error: `Invalid requirement priority: ${priority}. Valid priorities are: low, medium, high, critical`,
      };
    }

    const requirement = await requirementsApi.createRequirement({
      projectId,
      title,
      description,
      type: validatedType,
      priority: validatedPriority,
      tags,
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
  tags?: string[];
}) {
  try {
    const { id, title, description, type, priority, status, tags } = input;

    // Validate type if provided
    let validatedType: RequirementType | undefined;
    if (type) {
      validatedType = validateRequirementType(type);
      if (!validatedType) {
        return {
          success: false,
          error: `Invalid requirement type: ${type}. Valid types are: functional, technical, non-functional, user_story`,
        };
      }
    }

    // Validate priority if provided
    let validatedPriority: RequirementPriority | undefined;
    if (priority) {
      validatedPriority = validateRequirementPriority(priority);
      if (!validatedPriority) {
        return {
          success: false,
          error: `Invalid requirement priority: ${priority}. Valid priorities are: low, medium, high, critical`,
        };
      }
    }

    // Validate status if provided
    let validatedStatus: RequirementStatus | undefined;
    if (status) {
      validatedStatus = validateRequirementStatus(status);
      if (!validatedStatus) {
        return {
          success: false,
          error: `Invalid requirement status: ${status}. Valid statuses are: draft, proposed, approved, rejected, implemented, verified`,
        };
      }
    }

    const requirement = await requirementsApi.updateRequirement(id, {
      title,
      description,
      type: validatedType,
      priority: validatedPriority,
      status: validatedStatus,
      tags,
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
    const validatedStage = validateDiscoveryStage(stage);
    if (!validatedStage) {
      return {
        success: false,
        error: `Invalid discovery stage: ${stage}. Valid stages are: initial, stakeholders, features, constraints, quality, finalize`,
      };
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
    const validatedStage = validateDiscoveryStage(stage);
    if (!validatedStage) {
      return {
        success: false,
        error: `Invalid discovery stage: ${stage}. Valid stages are: initial, stakeholders, features, constraints, quality, finalize`,
      };
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

// Helper functions for validation

function validateRequirementType(type: string): RequirementType | undefined {
  const validTypes: RequirementType[] = [
    "functional",
    "technical",
    "non-functional",
    "user_story",
  ];

  const normalizedType = type.toLowerCase() as RequirementType;
  return validTypes.includes(normalizedType) ? normalizedType : undefined;
}

function validateRequirementPriority(
  priority: string
): RequirementPriority | undefined {
  const validPriorities: RequirementPriority[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

  const normalizedPriority = priority.toLowerCase() as RequirementPriority;
  return validPriorities.includes(normalizedPriority)
    ? normalizedPriority
    : undefined;
}

function validateRequirementStatus(
  status: string
): RequirementStatus | undefined {
  const validStatuses: RequirementStatus[] = [
    "draft",
    "proposed",
    "approved",
    "rejected",
    "implemented",
    "verified",
  ];

  const normalizedStatus = status.toLowerCase() as RequirementStatus;
  return validStatuses.includes(normalizedStatus)
    ? normalizedStatus
    : undefined;
}

function validateDiscoveryStage(stage: string): DiscoveryStage | undefined {
  const validStages: DiscoveryStage[] = [
    "initial",
    "stakeholders",
    "features",
    "constraints",
    "quality",
    "finalize",
  ];

  const normalizedStage = stage.toLowerCase() as DiscoveryStage;
  return validStages.includes(normalizedStage) ? normalizedStage : undefined;
}
