import * as tasksApi from "../api/tasks.js";
import { TaskInput, UpdateTaskInput } from "../core/Task.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { validateTaskPriority } from "../utils/validation.js";

/**
 * Create a new task (implementation)
 */
async function createTaskImpl(input: {
  title: string;
  description?: string;
  parentId?: string;
  projectId: string;
  priority?: string;
}) {
  const { title, description, parentId, projectId, priority } = input;

  // Validate priority if provided
  let validatedPriority: "low" | "medium" | "high" | undefined;
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

  const task = await tasksApi.createTask(taskInput);
  return { task };
}

/**
 * Create a new task
 */
export const createTask = withErrorHandling(createTaskImpl, "createTask");

/**
 * Update a task (implementation)
 */
async function updateTaskImpl(input: {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  position?: number;
  projectId?: string;
}) {
  const { id, title, description, completed, priority, position, projectId } =
    input;

  // Validate priority if provided
  let validatedPriority: "low" | "medium" | "high" | undefined;
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

  const task = await tasksApi.updateTask(id, updateInput);

  if (!task) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return { task };
}

/**
 * Update an existing task
 */
export const updateTask = withErrorHandling(updateTaskImpl, "updateTask");

/**
 * Delete a task (implementation)
 */
async function deleteTaskImpl(input: { id: string }) {
  const { id } = input;
  const success = await tasksApi.deleteTask(id);

  if (!success) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return {};
}

/**
 * Delete a task
 */
export const deleteTask = withErrorHandling(deleteTaskImpl, "deleteTask");

/**
 * Get task by ID (implementation)
 */
async function getTaskImpl(input: { id: string }) {
  const { id } = input;
  const task = await tasksApi.getTaskById(id);

  if (!task) {
    return createErrorResponse(`Task with ID ${id} not found`);
  }

  return { task };
}

/**
 * Get task by ID
 */
export const getTask = withErrorHandling(getTaskImpl, "getTask");

/**
 * Get tasks for a project (implementation)
 */
async function listProjectTasksImpl(input: { projectId: string }) {
  const { projectId } = input;
  const tasks = await tasksApi.getTasksByProject(projectId);
  return { tasks };
}

/**
 * Get tasks for a project
 */
export const listProjectTasks = withErrorHandling(
  listProjectTasksImpl,
  "listProjectTasks"
);

/**
 * Get root tasks for a project
 */
export async function listProjectRootTasks(input: { projectId: string }) {
  try {
    const { projectId } = input;
    const tasks = await tasksApi.getProjectRootTasks(projectId);

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Error listing project root tasks:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get child tasks
 */
export async function listChildTasks(input: { parentId: string }) {
  try {
    const { parentId } = input;
    const tasks = await tasksApi.getChildTasks(parentId);

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Error listing child tasks:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Complete a task
 */
export async function completeTask(input: { id: string }) {
  try {
    const { id } = input;
    const task = await tasksApi.completeTask(id);

    if (!task) {
      return {
        success: false,
        error: `Task with ID ${id} not found`,
      };
    }

    return {
      success: true,
      task,
    };
  } catch (error) {
    console.error("Error completing task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * List all tasks
 */
export async function listAllTasks() {
  try {
    const tasks = await tasksApi.getAllTasks();

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Error listing all tasks:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Helper function for task priority validation that returns an error response if invalid
function validateTaskPriorityWithResponse(priority: string) {
  const validatedPriority = validateTaskPriority(priority);
  if (!validatedPriority) {
    return createErrorResponse(
      `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`
    );
  }
  return validatedPriority;
}
