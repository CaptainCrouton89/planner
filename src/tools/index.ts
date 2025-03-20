// Export project management tools
export {
  createProject,
  findProjects,
  getProject,
  updateProject,
} from "./project-tools.js";

// Export requirement management tools
export {
  createRequirement,
  deleteRequirement,
  listProjectRequirements,
  updateRequirement,
} from "./requirement-tools.js";

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
  generateRequirement,
  generateRequirementsFromDiscovery,
  guidedRequirementDiscovery,
  processDiscoveryResponse,
} from "./discovery-tools.js";

// Project management functions are already defined as MCP tools in src/index.ts
// so we're not exporting them from here to avoid duplication
