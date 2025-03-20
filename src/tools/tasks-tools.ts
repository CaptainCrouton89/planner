import * as tasksApi from "../api/tasks.js";
import { TaskInput, UpdateTaskInput } from "../core/Task.js";

/**
 * Create a new task
 */
export async function createTask(input: {
  title: string;
  description?: string;
  parentId?: string;
  projectId: string;
  priority?: string;
}) {
  try {
    const { title, description, parentId, projectId, priority } = input;

    // Validate priority if provided
    let validatedPriority: "low" | "medium" | "high" | undefined;
    if (priority) {
      validatedPriority = validateTaskPriority(priority);
      if (!validatedPriority) {
        return {
          success: false,
          error: `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`,
        };
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

    return {
      success: true,
      task,
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Update an existing task
 */
export async function updateTask(input: {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  position?: number;
  projectId?: string;
}) {
  try {
    const { id, title, description, completed, priority, position, projectId } =
      input;

    // Validate priority if provided
    let validatedPriority: "low" | "medium" | "high" | undefined;
    if (priority) {
      validatedPriority = validateTaskPriority(priority);
      if (!validatedPriority) {
        return {
          success: false,
          error: `Invalid task priority: ${priority}. Valid priorities are: low, medium, high`,
        };
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
    console.error("Error updating task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(input: { id: string }) {
  try {
    const { id } = input;
    const success = await tasksApi.deleteTask(id);

    if (!success) {
      return {
        success: false,
        error: `Task with ID ${id} not found`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get task by ID
 */
export async function getTask(input: { id: string }) {
  try {
    const { id } = input;
    const task = await tasksApi.getTaskById(id);

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
    console.error("Error getting task:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get tasks for a project
 */
export async function listProjectTasks(input: { projectId: string }) {
  try {
    const { projectId } = input;
    const tasks = await tasksApi.getTasksByProject(projectId);

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Error listing project tasks:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

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

// Helper functions for validation

function validateTaskPriority(
  priority: string
): "low" | "medium" | "high" | undefined {
  const validPriorities = ["low", "medium", "high"];

  const normalizedPriority = priority.toLowerCase();
  return validPriorities.includes(normalizedPriority)
    ? (normalizedPriority as "low" | "medium" | "high")
    : undefined;
}
