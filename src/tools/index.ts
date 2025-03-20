// Export requirement management tools
export {
  createRequirement,
  deleteRequirement,
  listProjectRequirements,
  updateRequirement,
} from "./requirements-tools.js";

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

// Export guided discovery tools
export {
  generateRequirementsFromDiscovery,
  guidedRequirementDiscovery,
  processDiscoveryResponse,
} from "./requirements-tools.js";

// Export AI-assisted generation tools
export { generateRequirement } from "./requirements-tools.js";

// Project management functions are already defined as MCP tools in src/index.ts
// so we're not exporting them from here to avoid duplication
