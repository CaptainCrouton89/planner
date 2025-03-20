import { Project as ProjectModel } from "../core/Project.js";
import {
  createErrorResponse,
  withErrorHandling,
} from "../utils/errorHandling.js";
import { projectStore } from "./index.js";

/**
 * Create a new project
 */
export const createProject = withErrorHandling(
  async ({ name, description }: { name: string; description?: string }) => {
    const project = await projectStore.createProject({ name, description });

    if (!project) {
      return createErrorResponse("Failed to create project");
    }

    return { project };
  },
  "createProject"
);

/**
 * Update an existing project
 */
export const updateProject = withErrorHandling(
  async ({
    id,
    name,
    description,
  }: {
    id: string;
    name?: string;
    description?: string;
  }) => {
    const project = await projectStore.updateProject(id, {
      name,
      description,
    });

    if (!project) {
      return createErrorResponse(`Project with ID ${id} not found`);
    }

    return { project };
  },
  "updateProject"
);

/**
 * Find projects matching a search term
 */
export const findProjects = withErrorHandling(
  async ({ searchTerm }: { searchTerm?: string }) => {
    let projects: ProjectModel[] = [];
    if (!searchTerm) {
      projects = await projectStore.getAllProjects();
    } else {
      projects = await projectStore.searchProjects(searchTerm);
    }
    return { projects };
  },
  "findProjects"
);

/**
 * Get a project by ID
 */
export const getProject = withErrorHandling(async ({ id }: { id: string }) => {
  const project = await projectStore.getProjectById(id);
  if (!project) {
    return createErrorResponse(`Project with ID ${id} not found`);
  }
  return { project };
}, "getProject");
