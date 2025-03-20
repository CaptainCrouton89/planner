/**
 * Type for all responses from tool functions
 */
export type ToolResponse<T = Record<string, any>> = {
  success: boolean;
  error?: string;
} & (T extends void ? Record<string, never> : T);

/**
 * Wraps a function with standardized error handling
 *
 * @param fn The function to wrap with error handling
 * @param functionName Optional name of the function for logging purposes
 * @returns A wrapped function that handles errors consistently
 */
export function withErrorHandling<T, R extends Record<string, any>>(
  fn: (input: T) => Promise<R>,
  functionName?: string
): (input: T) => Promise<ToolResponse<R>> {
  return async (input: T): Promise<ToolResponse<R>> => {
    try {
      const result = await fn(input);
      return {
        success: true,
        ...result,
      } as ToolResponse<R>;
    } catch (error) {
      const errorName = functionName || fn.name || "Unknown function";
      console.error(`Error in ${errorName}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ToolResponse<R>;
    }
  };
}

/**
 * Utility function to create an error response
 *
 * @param message The error message
 * @returns An error response object
 */
export function createErrorResponse(message: string): ToolResponse {
  return {
    success: false,
    error: message,
  };
}

/**
 * Utility function to create a success response
 *
 * @param data The data to include in the response
 * @returns A success response object
 */
export function createSuccessResponse<T extends Record<string, any>>(
  data: T
): ToolResponse<T> {
  return {
    success: true,
    ...data,
  } as ToolResponse<T>;
}
