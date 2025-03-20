import { Project, UpdateProjectInput } from "../core/Project.js";
import {
  DiscoveryInput,
  DiscoveryProcessInput,
  DiscoveryResponse,
  Requirement,
  RequirementInput,
  UpdateRequirementInput,
} from "../core/Requirement.js";
import { RequirementGenerator } from "../core/RequirementGenerator.js";
import {
  TechnicalRequirement,
  TechnicalRequirementInput,
  UpdateTechnicalRequirementInput,
} from "../core/TechnicalRequirement.js";
import { DrizzleProjectStore } from "../storage/drizzle/DrizzleProjectStore.js";
import { DrizzleRequirementStore } from "../storage/drizzle/DrizzleRequirementStore.js";
import { DrizzleTechnicalRequirementStore } from "../storage/drizzle/DrizzleTechnicalRequirementStore.js";

// Initialize stores and services
const projectStore = new DrizzleProjectStore();
const requirementStore = new DrizzleRequirementStore();
const technicalRequirementStore = new DrizzleTechnicalRequirementStore();
const requirementGenerator = new RequirementGenerator();

// Initialize all stores
async function initialize() {
  await projectStore.initialize();
  await requirementStore.initialize();
  await technicalRequirementStore.initialize();
  await requirementGenerator.initialize();
}

// Initialize on module load
initialize().catch((error) => {
  console.error("Failed to initialize requirement API:", error);
});

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  return projectStore.createProject({ name, description });
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project | undefined> {
  return projectStore.updateProject(id, input);
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  return projectStore.deleteProject(id);
}

/**
 * Create a new requirement
 */
export async function createRequirement(
  input: RequirementInput
): Promise<Requirement> {
  return requirementStore.createRequirement(input);
}

/**
 * Update an existing requirement
 */
export async function updateRequirement(
  id: string,
  input: UpdateRequirementInput
): Promise<Requirement | undefined> {
  return requirementStore.updateRequirement(id, input);
}

/**
 * Delete a requirement
 */
export async function deleteRequirement(id: string): Promise<boolean> {
  return requirementStore.deleteRequirement(id);
}

/**
 * List all requirements for a project
 */
export async function listProjectRequirements(
  projectId: string
): Promise<Requirement[]> {
  return requirementStore.getRequirementsByProject(projectId);
}

/**
 * Guide the user through structured requirement discovery
 */
export async function guidedRequirementDiscovery(
  input: DiscoveryInput
): Promise<DiscoveryResponse> {
  return requirementGenerator.guidedRequirementDiscovery(input);
}

/**
 * Process the user's response to guided discovery
 */
export async function processDiscoveryResponse(
  input: DiscoveryProcessInput
): Promise<DiscoveryResponse> {
  return requirementGenerator.processDiscoveryResponse(input);
}

/**
 * Generate requirements from discovery responses
 */
export async function generateRequirementsFromDiscovery(
  projectId: string,
  discoveryResponses: string,
  generateTechnical = false
): Promise<Requirement[]> {
  return requirementGenerator.generateRequirementsFromDiscovery(
    projectId,
    discoveryResponses,
    generateTechnical
  );
}

/**
 * Generate a requirement from natural language
 */
export async function generateRequirement(
  projectId: string,
  description: string
): Promise<Requirement> {
  return requirementGenerator.generateRequirement(projectId, description);
}

/**
 * Find projects matching a search term
 */
export async function findProjects(searchTerm?: string): Promise<Project[]> {
  if (!searchTerm) {
    return projectStore.getAllProjects();
  }
  return projectStore.searchProjects(searchTerm);
}

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<Project | undefined> {
  return projectStore.getProjectById(id);
}

/**
 * Create a new technical requirement
 */
export async function createTechnicalRequirement(
  input: TechnicalRequirementInput
): Promise<TechnicalRequirement> {
  return technicalRequirementStore.createTechnicalRequirement(input);
}

/**
 * Update an existing technical requirement
 */
export async function updateTechnicalRequirement(
  id: string,
  input: UpdateTechnicalRequirementInput
): Promise<TechnicalRequirement | undefined> {
  return technicalRequirementStore.updateTechnicalRequirement(id, input);
}

/**
 * Delete a technical requirement
 */
export async function deleteTechnicalRequirement(id: string): Promise<boolean> {
  return technicalRequirementStore.deleteTechnicalRequirement(id);
}

/**
 * List all technical requirements for a project
 */
export async function listProjectTechnicalRequirements(
  projectId: string
): Promise<TechnicalRequirement[]> {
  return technicalRequirementStore.getTechnicalRequirementsByProject(projectId);
}

/**
 * Generate technical requirements from existing requirement
 */
export async function generateTechnicalRequirement(
  requirementId: string
): Promise<TechnicalRequirement | undefined> {
  return requirementGenerator.generateTechnicalRequirement(requirementId);
}

/**
 * Generate technical requirements from discovery responses
 */
export async function generateTechnicalRequirementsFromDiscovery(
  projectId: string,
  discoveryResponses: string
): Promise<TechnicalRequirement[]> {
  return requirementGenerator.generateTechnicalRequirementsFromDiscovery(
    projectId,
    discoveryResponses
  );
}

/**
 * Generate a technical requirement directly from description
 */
export async function generateDirectTechnicalRequirement(
  projectId: string,
  description: string
): Promise<TechnicalRequirement> {
  return requirementGenerator.generateDirectTechnicalRequirement(
    projectId,
    description
  );
}
