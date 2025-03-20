import * as requirementsApi from "../api/requirements.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";

/**
 * Create a new project (implementation)
 */
async function createProjectImpl(input: {
  name: string;
  description?: string;
}) {
  const { name, description } = input;
  const project = await requirementsApi.createProject(name, description);
  return { project };
}

/**
 * Create a new project
 */
export const createProject = withErrorHandling(
  createProjectImpl,
  "createProject"
);

/**
 * Update an existing project (implementation)
 */
async function updateProjectImpl(input: {
  id: string;
  name?: string;
  description?: string;
}) {
  const { id, name, description } = input;
  const project = await requirementsApi.updateProject(id, {
    name,
    description,
  });

  if (!project) {
    return createErrorResponse(`Project with ID ${id} not found`);
  }

  return { project };
}

/**
 * Update an existing project
 */
export const updateProject = withErrorHandling(
  updateProjectImpl,
  "updateProject"
);

/**
 * Find projects matching a search term (implementation)
 */
async function findProjectsImpl(input: { searchTerm?: string }) {
  const { searchTerm } = input;
  const projects = await requirementsApi.findProjects(searchTerm);
  return { projects };
}

/**
 * Find projects matching a search term
 */
export const findProjects = withErrorHandling(findProjectsImpl, "findProjects");

/**
 * Get a project by ID (implementation)
 */
async function getProjectImpl(input: { id: string }) {
  const { id } = input;
  const project = await requirementsApi.getProject(id);

  if (!project) {
    return createErrorResponse(`Project with ID ${id} not found`);
  }

  return { project };
}

/**
 * Get a project by ID
 */
export const getProject = withErrorHandling(getProjectImpl, "getProject");
