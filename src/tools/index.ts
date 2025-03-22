import { DrizzleProjectStore } from "../storage/drizzle/DrizzleProjectStore.js";
import { DrizzleTaskStore } from "../storage/drizzle/DrizzleTaskStore.js";

// Export project management tools
export { findProjects, getProject } from "./project-tools.js";

// Export requirement management tools

// Export task management tools
export {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listAllTasks,
  listChildTasks,
  listProjectRootTasks,
  listProjectTasks,
  updateTask,
} from "./tasks-tools.js";
// Project management functions are already defined as MCP tools in src/index.ts
// so we're not exporting them from here to avoid duplication

// Initialize stores and services
export const projectStore = new DrizzleProjectStore();
export const taskStore = new DrizzleTaskStore();

// Initialize all stores
async function initialize() {
  await projectStore.initialize();
  await taskStore.initialize();
}

// Initialize on module load
initialize().catch((error) => {
  console.error("Failed to initialize requirement API:", error);
});
