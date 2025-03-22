import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "./db/index.js";
import {
  apiEndpoints,
  dataModels,
  projectOverviews,
  projectRequirements,
  screens,
  userStories,
} from "./db/schema.js";
import { deleteTask, listProjectTasks, projectStore } from "./tools/index.js";
import {
  findProjects,
  getProject,
  upsertProject,
} from "./tools/project-tools.js";
import { withErrorHandling } from "./utils/errorHandling.js";

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

  server.tool(
    "build-project-plan",
    "Begin the project planning process",
    {
      projectName: z.string().describe("Name of the project"),
      projectDescription: z.string().describe("Description of the project"),
    },
    async ({ projectName, projectDescription }) => {
      const projectId = await upsertProject({
        name: projectName,
        description: projectDescription,
      });

      return {
        content: [
          {
            type: "text",
            text: `New project created: ${projectId}.

            Now gather requirements for the project. Requirement gathering is complete when the following criteria are met:
            - All capabilities of the app are listed and described in detail
            - The technical requirements are completely fleshed out

          If the project's requirements aren't completely fleshed out, list questions the user needs to answer to gather more information in bullet points. 

          If the project's requirements are completely fleshed out, call the "parse-and-save-requirements" tool with the requirements.`,
          },
        ],
      };
    }
  );

  server.tool(
    "parse-and-save-requirements",
    "Parse and save project requirements from the user",
    {
      projectId: z
        .string()
        .describe("ID of the project to save requirements for"),
      requirements: z.string().describe("Requirements to parse and save"),
    },
    withErrorHandling(async ({ projectId, requirements }) => {
      await db.insert(projectRequirements).values({
        projectId,
        requirement: requirements,
      });

      return {
        content: [
          {
            type: "text",
            text: `Requirements saved.

          If the project's requirements aren't completely fleshed out to the point that you understand the full functionalities of the product, list questions the user needs to answer to gather more information in bullet points. 

          If the project's requirements are completely fleshed out, call the "propose-user-stories-for-project" tool with the project ID.`,
          },
        ],
      };
    })
  );

  server.tool(
    "propose-user-stories-for-project",
    "Propose user stories for project requirements",
    {
      projectId: z
        .string()
        .describe("ID of the project to create user stories for"),
    },
    withErrorHandling(async () => {
      return {
        content: [
          {
            type: "text",
            text: `Propose every user story that can be created from the requirements, up to 20. List them in bullet points and ask the user if they approve of the user stories. 
            
            Once the user stories are approved, call the "approve-user-stories" tool with the user stories. If they provide feedback, propose new user stories until they are approved, and then call the "approve-user-stories" tool with the user stories.
          `,
          },
        ],
      };
    })
  );

  server.tool(
    "approve-user-stories",
    "Approve user stories for project",
    {
      projectId: z
        .string()
        .describe("ID of the project to approve user stories for"),
      proposedUserStories: z
        .array(z.string())
        .describe("Proposed user stories to approve"),
    },
    withErrorHandling(async ({ projectId, proposedUserStories }) => {
      await db.insert(userStories).values(
        proposedUserStories.map((story) => ({
          projectId,
          title: story,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully approved user stories.
            
Now propose a tech stack, auth method, and shared components. Work with the user to refine the tech stack, auth method, and shared components until they are approved. For example: 

Tech stack:
- Frontend: React
- Backend: Node.js
- Database: PostgreSQL on Supabase
- Hosting: Vercel
- Auth: Supabase

Shared components:
- Lesson Section: A long description describing exactly what this shared component is
- Quiz Section: A long description describing exactly what this shared component is
- Note Section: A long description describing exactly what this shared component is

Once the tech stack, auth method, and shared components are approved, call the "approve-tech-stack" tool with the tech stack, auth method, and shared components.
`,
          },
        ],
      };
    })
  );

  server.tool(
    "approve-tech-stack",
    "Approve tech stack for project",
    {
      projectId: z
        .string()
        .describe("ID of the project to approve tech stack for"),
      techStack: z
        .object({
          frontend: z.string(),
          backend: z.string(),
          database: z.string(),
          hosting: z.string(),
          auth: z.string(),
        })
        .describe("Tech stack to approve"),
      sharedComponents: z
        .array(z.object({ name: z.string(), description: z.string() }))
        .describe("Shared components to approve"),
    },
    withErrorHandling(async ({ projectId, techStack, sharedComponents }) => {
      await db.insert(projectOverviews).values({
        projectId,
        techStack,
        sharedComponents,
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully saved tech stack and shared components.

Propose data models for the project. Work with the user to refine the data models until they are approved. Make sure to include every single data model needed for the project. Data models are defined with the following format:

- Name: User
- Description: A user of the app
- Properties:
  - name: property name
  - type: property type
- Relations:
  - hasMany: related model name
  - hasOne: related model name

Once the data models are approved, call the "approve-data-models" tool with the data models. 
`,
          },
        ],
      };
    })
  );

  server.tool(
    "approve-data-models",
    "Approve data models for project",
    {
      projectId: z
        .string()
        .describe("ID of the project to approve data models for"),
      models: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
            properties: z.array(
              z.object({ name: z.string(), type: z.string() })
            ),
            relations: z.array(
              z.object({ name: z.string(), type: z.string() })
            ),
          })
        )
        .describe("Data models to approve"),
    },
    withErrorHandling(async ({ projectId, models }) => {
      await db.insert(dataModels).values(
        models.map((model) => ({
          projectId,
          name: model.name,
          description: model.description,
          properties: model.properties,
          relations: model.relations,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully saved data models.

Propose every single API endpoint needed for the project. Work with the user to refine the API endpoints until they are approved. Once the API endpoints are approved, call the "approve-api-endpoints" tool with the API endpoints. API endpoints are defined with the following format:

- Endpoint: /api/v1/users
- Description: Get all users
- Method: GET
- Parameters: none
- Request format: JSON
- Response format: JSON
`,
          },
        ],
      };
    })
  );

  server.tool(
    "approve-api-endpoints",
    "Approve API endpoints for project",
    {
      projectId: z
        .string()
        .describe("ID of the project to approve API endpoints for"),
      endpoints: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
            method: z.string(),
            path: z.string(),
            parameters: z.array(
              z.object({ name: z.string(), type: z.string() })
            ),
            requestFormat: z.string(),
            responseFormat: z.string(),
          })
        )
        .describe("API endpoints to approve"),
    },
    withErrorHandling(async ({ projectId, endpoints }) => {
      await db.insert(apiEndpoints).values(
        endpoints.map((endpoint) => ({
          projectId,
          endpoint: endpoint.name,
          description: endpoint.description,
          method: endpoint.method,
          parameters: endpoint.parameters,
          requestFormat: endpoint.requestFormat,
          responseFormat: endpoint.responseFormat,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully saved API endpoints. 

Now propose screens for the project, starting with the most important ones. List every single screen needed for the project. Work with the user to refine the screens until they are approved. Once the screens are approved, call the "approve-screens" tool with the screens. Screens are defined with the following format:

- Name: Home
- Path: /
- Description: A very detailed description of the screen. Include all the UI elements, and what they do. Be very specific.

Once the screens are approved, call the "approve-screens" tool with the screens.`,
          },
        ],
      };
    })
  );

  server.tool(
    "approve-screens",
    "Approve screens for project",
    {
      projectId: z
        .string()
        .describe("ID of the project to approve screens for"),
      screensProposed: z
        .array(
          z.object({
            name: z.string(),
            description: z.string(),
            path: z.string(),
          })
        )
        .describe("Screens to approve"),
    },
    withErrorHandling(async ({ projectId, screensProposed }) => {
      await db.insert(screens).values(
        screensProposed.map((screen) => ({
          projectId,
          name: screen.name,
          description: screen.description,
          path: screen.path,
        }))
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully saved screens. The project is complete when the user is satisfied with the screens.`,
          },
        ],
      };
    })
  );
};
