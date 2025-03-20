import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteTask, listProjectTasks, projectStore } from "./tools/index.js";
import {
  findProjects,
  getProject,
  upsertProject,
} from "./tools/project-tools.js";

export const registerProjectTools = (server: McpServer) => {
  // Tool: Create a new project
  server.tool(
    "create-or-update-project",
    "Create a new project or update an existing project with a new name or description",
    {
      id: z.string().optional().describe("ID of the project to update"),
      name: z.string().min(1).describe("Name of the project"),
      description: z
        .string()
        .optional()
        .describe("Detailed description of the project"),
    },
    async ({ id, name, description }) => {
      const result = await upsertProject({ id, name, description });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to create project",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Created project: ${result.project?.name} (ID: ${result.project?.id})`,
          },
        ],
      };
    }
  );

  // Tool: Delete a project
  server.tool(
    "delete-project",
    "Delete a project and all its tasks",
    {
      id: z.string().describe("ID of the project to delete"),
    },
    async ({ id }) => {
      // First check if the project exists
      const projectResult = await getProject({ id });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text: projectResult.error || `Project with ID ${id} not found.`,
            },
          ],
          isError: true,
        };
      }

      const projectName = projectResult.project?.name || id;

      // Delete all tasks associated with this project
      const tasksResult = await listProjectTasks({ projectId: id });
      const taskCount =
        tasksResult.success && tasksResult.tasks ? tasksResult.tasks.length : 0;

      if (tasksResult.success && tasksResult.tasks) {
        for (const task of tasksResult.tasks) {
          await deleteTask({ id: task.id });
        }
      }

      // Delete the project
      const success = await projectStore.deleteProject(id);

      if (!success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to delete project ${projectName}.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Deleted project "${projectName}" and all its ${taskCount} tasks.`,
          },
        ],
      };
    }
  );

  // Tool: Search for projects
  server.tool(
    "search-projects",
    "Search for projects by name or description",
    {
      query: z
        .string()
        .min(1)
        .describe("Search term to find matching projects"),
    },
    async ({ query }) => {
      const result = await findProjects({ searchTerm: query });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to search projects",
            },
          ],
          isError: true,
        };
      }

      const projects = result.projects || [];

      return {
        content: [
          {
            type: "text",
            text:
              projects.length > 0
                ? `Found ${
                    projects.length
                  } projects matching "${query}":\n${projects
                    .map((p) => `- ${p.name} (ID: ${p.id})`)
                    .join("\n")}`
                : `No projects found matching "${query}".`,
          },
        ],
      };
    }
  );
};
