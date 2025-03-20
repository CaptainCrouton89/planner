import { TaskInput, TaskPriority, UpdateTaskInput } from "../core/Task.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateTaskPriority } from "../utils/validation.js";
import { taskStore } from "./index.js";

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

// Helper function for task priority validation that returns an error response if invalid
function validateTaskPriorityWithResponse(
  priority: string
): TaskPriority | ErrorResponseType {
  const validatedPriority = validateTaskPriority(priority);
  if (!validatedPriority) {
    return createErrorResponse(
      `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`
    );
  }
  return validatedPriority;
}

/**
 * Create a new task
 */
export const createTask = withErrorHandling(
  async (input: {
    title: string;
    description?: string;
    parentId?: string;
    projectId: string;
    priority?: string;
  }) => {
    const { title, description, parentId, projectId, priority } = input;

    // Validate priority if provided
    let validatedPriority: TaskPriority | undefined;
    if (priority) {
      validatedPriority = validateTaskPriority(priority);
      if (!validatedPriority) {
        return createErrorResponse(
          `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`
        );
      }
    }

    const taskInput: TaskInput = {
      title,
      description,
      parentId,
      projectId,
      priority: validatedPriority,
    };

    const task = await taskStore.createTask(taskInput);
    return { task };
  },
  "createTask"
);

/**
 * Update an existing task
 */
export const updateTask = withErrorHandling(
  async (input: {
    id: string;
    title?: string;
    description?: string;
    completed?: boolean;
    priority?: string;
    position?: number;
    projectId?: string;
  }) => {
    const { id, title, description, completed, priority, position, projectId } =
      input;

    // Validate priority if provided
    let validatedPriority: TaskPriority | undefined;
    if (priority) {
      validatedPriority = validateTaskPriority(priority);
      if (!validatedPriority) {
        return createErrorResponse(
          `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`
        );
      }
    }

    const updateInput: UpdateTaskInput = {
      title,
      description,
      completed,
      priority: validatedPriority,
      position,
      projectId,
    };

    const task = await taskStore.updateTask(id, updateInput);

    if (!task) {
      return createErrorResponse(`Task with ID ${id} not found`);
    }

    return { task };
  },
  "updateTask"
);

/**
 * Delete a task
 */
export const deleteTask = withErrorHandling(async (input: { id: string }) => {
  const { id } = input;
  const success = await taskStore.deleteTask(id);

  if (!success) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return {};
}, "deleteTask");

/**
 * Get task by ID
 */
export const getTask = withErrorHandling(async (input: { id: string }) => {
  const { id } = input;
  const task = await taskStore.getTaskById(id);

  if (!task) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return { task };
}, "getTask");

/**
 * Get tasks for a project
 */
export const listProjectTasks = withErrorHandling(
  async (input: { projectId: string }) => {
    const { projectId } = input;
    const tasks = await taskStore.getTasksByProject(projectId);
    return { tasks };
  },
  "listProjectTasks"
);

/**
 * Get root tasks for a project
 */
export const listProjectRootTasks = withErrorHandling(
  async (input: { projectId: string }) => {
    const { projectId } = input;
    const tasks = await taskStore.getProjectRootTasks(projectId);
    return { tasks };
  },
  "listProjectRootTasks"
);

/**
 * Get child tasks
 */
export const listChildTasks = withErrorHandling(
  async (input: { parentId: string }) => {
    const { parentId } = input;
    const tasks = await taskStore.getChildTasks(parentId);
    return { tasks };
  },
  "listChildTasks"
);

/**
 * Complete a task
 */
export const completeTask = withErrorHandling(async (input: { id: string }) => {
  const { id } = input;
  const task = await taskStore.completeTask(id);

  if (!task) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return { task };
}, "completeTask");

/**
 * List all tasks
 */
export const listAllTasks = withErrorHandling(async () => {
  const tasks = await taskStore.getAllTasks();
  return { tasks };
}, "listAllTasks");
