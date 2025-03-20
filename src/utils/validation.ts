import {
  DiscoveryStage,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
} from "../core/Requirement.js";

export type TaskPriority = "low" | "medium" | "high";

/**
 * Generic validation function for enum-like string values
 *
 * @param value The value to validate
 * @param validValues Array of valid values
 * @returns The normalized valid value or undefined if invalid
 */
export function validateEnumValue<T extends string>(
  value: string,
  validValues: T[]
): T | undefined {
  const normalizedValue = value.toLowerCase() as T;
  return validValues.includes(normalizedValue) ? normalizedValue : undefined;
}

// Pre-defined validators for common types

/**
 * Validates a requirement type
 */
export function validateRequirementType(
  type: string
): RequirementType | undefined {
  const validTypes: RequirementType[] = [
    "functional",
    "technical",
    "non-functional",
    "user_story",
  ];
  return validateEnumValue<RequirementType>(type, validTypes);
}

/**
 * Validates a requirement priority
 */
export function validateRequirementPriority(
  priority: string
): RequirementPriority | undefined {
  const validPriorities: RequirementPriority[] = ["low", "medium", "high"];
  return validateEnumValue<RequirementPriority>(priority, validPriorities);
}

/**
 * Validates a requirement status
 */
export function validateRequirementStatus(
  status: string
): RequirementStatus | undefined {
  const validStatuses: RequirementStatus[] = [
    "draft",
    "approved",
    "implemented",
  ];
  return validateEnumValue<RequirementStatus>(status, validStatuses);
}

/**
 * Validates a discovery stage
 */
export function validateDiscoveryStage(
  stage: string
): DiscoveryStage | undefined {
  const validStages: DiscoveryStage[] = [
    "initial",
    "stakeholders",
    "features",
    "constraints",
    "quality",
    "finalize",
  ];
  return validateEnumValue<DiscoveryStage>(stage, validStages);
}

/**
 * Validates a task priority
 */
export function validateTaskPriority(
  priority: string
): TaskPriority | undefined {
  const validPriorities: TaskPriority[] = ["low", "medium", "high"];
  return validateEnumValue<TaskPriority>(priority, validPriorities);
}
