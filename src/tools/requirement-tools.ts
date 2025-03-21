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
  const typeResult = validateRequirementTypeWithResponse(type);
  if (isErrorResponse(typeResult)) {
    return typeResult;
  }

  // Validate priority
  const priorityResult = validateRequirementPriorityWithResponse(priority);
  if (isErrorResponse(priorityResult)) {
    return priorityResult;
  }

  // Validate status
  const statusResult = validateRequirementStatusWithResponse(status);
  if (isErrorResponse(statusResult)) {
    return statusResult;
  }

  const requirement = await requirementsApi.createRequirement({
    projectId,
    title,
    description,
    type: typeResult,
    priority: priorityResult,
    status: statusResult,
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
    const typeResult = validateRequirementTypeWithResponse(type);
    if (isErrorResponse(typeResult)) {
      return typeResult;
    }
    validatedType = typeResult;
  }

  // Validate priority if provided
  let validatedPriority: RequirementPriority | undefined;
  if (priority) {
    const priorityResult = validateRequirementPriorityWithResponse(priority);
    if (isErrorResponse(priorityResult)) {
      return priorityResult;
    }
    validatedPriority = priorityResult;
  }

  // Validate status if provided
  let validatedStatus: RequirementStatus | undefined;
  if (status) {
    const statusResult = validateRequirementStatusWithResponse(status);
    if (isErrorResponse(statusResult)) {
      return statusResult;
    }
    validatedStatus = statusResult;
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
function validateRequirementTypeWithResponse(
  type: string
): RequirementType | ReturnType<typeof createErrorResponse> {
  const validatedType = validateRequirementType(type);
  if (!validatedType) {
    return createErrorResponse(
      `Invalid requirement type: ${type}. Valid types are: functional, technical, non-functional, user_story`
    );
  }
  return validatedType;
}

function validateRequirementPriorityWithResponse(
  priority: string
): RequirementPriority | ReturnType<typeof createErrorResponse> {
  const validatedPriority = validateRequirementPriority(priority);
  if (!validatedPriority) {
    return createErrorResponse(
      `Invalid requirement priority: ${priority}. Valid priorities are: low, medium, high`
    );
  }
  return validatedPriority;
}

function validateRequirementStatusWithResponse(
  status: string
): RequirementStatus | ReturnType<typeof createErrorResponse> {
  const validatedStatus = validateRequirementStatus(status);
  if (!validatedStatus) {
    return createErrorResponse(
      `Invalid requirement status: ${status}. Valid statuses are: draft, approved, implemented`
    );
  }
  return validatedStatus;
}
