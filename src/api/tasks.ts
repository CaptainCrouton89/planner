import { TaskInput, Task as TaskModel, UpdateTaskInput } from "../core/Task.js";
import { DrizzleTaskStore } from "../storage/drizzle/DrizzleTaskStore.js";

// Initialize the store
const taskStore = new DrizzleTaskStore();

// Initialize the store
async function initialize() {
  await taskStore.initialize();
}

// Initialize on module load
initialize().catch((error) => {
  console.error("Failed to initialize task API:", error);
});

/**
 * Create a new task
 */
export async function createTask(input: TaskInput): Promise<TaskModel> {
  return taskStore.createTask(input);
}

/**
 * Update an existing task
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<TaskModel | undefined> {
  return taskStore.updateTask(id, input);
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<boolean> {
  return taskStore.deleteTask(id);
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<TaskModel | undefined> {
  return taskStore.getTaskById(id);
}

/**
 * Get tasks by project
 */
export async function getTasksByProject(
  projectId: string
): Promise<TaskModel[]> {
  return taskStore.getTasksByProject(projectId);
}

/**
 * Get child tasks
 */
export async function getChildTasks(parentId: string): Promise<TaskModel[]> {
  return taskStore.getChildTasks(parentId);
}

/**
 * Get root tasks for a project
 */
export async function getProjectRootTasks(
  projectId: string
): Promise<TaskModel[]> {
  return taskStore.getProjectRootTasks(projectId);
}

/**
 * Complete a task
 */
export async function completeTask(id: string): Promise<TaskModel | undefined> {
  return taskStore.completeTask(id);
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<TaskModel[]> {
  return taskStore.getAllTasks();
}

/**
 * Get root tasks (across all projects)
 */
export async function getRootTasks(): Promise<TaskModel[]> {
  return taskStore.getRootTasks();
}
