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
  validateRequirementPriority,
  validateRequirementStatus,
  validateRequirementType,
} from "../utils/validation.js";

/**
 * Create a requirement (implementation)
 */
async function createRequirementImpl(input: {
  projectId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
}) {
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

  return { requirement };
}

/**
 * Create a requirement
 */
export const createRequirement = withErrorHandling(
  createRequirementImpl,
  "createRequirement"
);

/**
 * Update a requirement (implementation)
 */
async function updateRequirementImpl(input: {
  id: string;
  projectId?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
}) {
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
    return createErrorResponse(`Requirement with ID ${id} not found`);
  }

  return { requirement };
}

/**
 * Update a requirement
 */
export const updateRequirement = withErrorHandling(
  updateRequirementImpl,
  "updateRequirement"
);

/**
 * Delete a requirement (implementation)
 */
async function deleteRequirementImpl(input: { id: string }) {
  const { id } = input;
  const success = await requirementsApi.deleteRequirement(id);

  if (!success) {
    return createErrorResponse(`Requirement with ID ${id} not found`);
  }

  return {};
}

/**
 * Delete a requirement
 */
export const deleteRequirement = withErrorHandling(
  deleteRequirementImpl,
  "deleteRequirement"
);

/**
 * List all requirements for a project (implementation)
 */
async function listProjectRequirementsImpl(input: { projectId: string }) {
  const { projectId } = input;
  const requirements = await requirementsApi.listProjectRequirements(projectId);
  return { requirements };
}

/**
 * List all requirements for a project
 */
export const listProjectRequirements = withErrorHandling(
  listProjectRequirementsImpl,
  "listProjectRequirements"
);

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
