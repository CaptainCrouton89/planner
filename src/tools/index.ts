import { RequirementGenerator } from "../core/RequirementGenerator.js";
import { DrizzleProjectStore } from "../storage/drizzle/DrizzleProjectStore.js";
import { DrizzleRequirementStore } from "../storage/drizzle/DrizzleRequirementStore.js";
import { DrizzleTaskStore } from "../storage/drizzle/DrizzleTaskStore.js";
import { DrizzleTechnicalRequirementStore } from "../storage/drizzle/DrizzleTechnicalRequirementStore.js";

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
  generateAllRequirementsFromDiscovery,
  generateRequirement,
  generateRequirementsFromDiscovery,
  guidedRequirementDiscovery,
  processDiscoveryResponse,
} from "./discovery-tools.js";

// Export technical requirement tools
export {
  createTechnicalRequirement,
  generateDirectTechnicalRequirement,
  generateTechnicalRequirement,
  generateTechnicalRequirementsFromDiscovery,
  listProjectTechnicalRequirements,
} from "./technical-requirement-tools.js";

// Project management functions are already defined as MCP tools in src/index.ts
// so we're not exporting them from here to avoid duplication

// Initialize stores and services
export const projectStore = new DrizzleProjectStore();
export const requirementStore = new DrizzleRequirementStore();
export const technicalRequirementStore = new DrizzleTechnicalRequirementStore();
export const requirementGenerator = new RequirementGenerator();
export const taskStore = new DrizzleTaskStore();

// Initialize all stores
async function initialize() {
  await projectStore.initialize();
  await requirementStore.initialize();
  await technicalRequirementStore.initialize();
  await requirementGenerator.initialize();
  await taskStore.initialize();
}

// Initialize on module load
initialize().catch((error) => {
  console.error("Failed to initialize requirement API:", error);
});
