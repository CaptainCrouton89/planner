import { createErrorResponse } from "./errorHandling.js";

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

/**
 * Validates a task priority
 */
export function validateTaskPriority(
  priority: string
): TaskPriority | undefined {
  const validPriorities: TaskPriority[] = ["low", "medium", "high"];
  return validateEnumValue<TaskPriority>(priority, validPriorities);
}

// Type representing an error response from createErrorResponse
type ErrorResponseType = ReturnType<typeof createErrorResponse>;

/**
 * Type guard to check if a value is an error response
 */
export function isErrorResponse(value: any): value is ErrorResponseType {
  return (
    value &&
    typeof value === "object" &&
    "success" in value &&
    value.success === false
  );
}
