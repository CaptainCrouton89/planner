import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/index.js";
import {
  Project,
  apiEndpoints,
  dataModels,
  projectOverviews,
  projects,
  screens,
  statusEnum,
  userStories,
} from "./db/schema.js";
import { withErrorHandling } from "./utils/errorHandling.js";

const setStage = async (project: Project, stage: string) => {
  await db
    .update(projects)
    .set({
      stage: stage,
    })
    .where(eq(projects.id, project.id));
};

// cursor rules:
/* 
Whenever you don't know what to do, call the get-next-task tool.
*/

export const registerExecutionTools = (server: McpServer) => {
  server.tool(
    "set-project-overview-status",
    "Set the status of the project overview",
    {
      projectId: z.string().describe("ID of the project to set the status of"),
      status: z
        .string()
        .describe(
          "Status to set the project overview to (open, in progress, completed)"
        ),
    },
    withErrorHandling(async ({ projectId, status }) => {
      await db
        .update(projectOverviews)
        .set({
          status: status as (typeof statusEnum.enumValues)[number],
        })
        .where(eq(projectOverviews.projectId, projectId));

      return {
        content: [
          {
            type: "text",
            text: `Project overview status set to ${status}. Get the next task.`,
          },
        ],
      };
    })
  );

  server.tool(
    "set-data-model-status",
    "Set the status of the data model",
    {
      projectId: z.string().describe("ID of the project to set the status of"),
      modelId: z.string().describe("ID of the data model to set the status of"),
      status: z
        .string()
        .describe(
          "Status to set the data model to (open, in progress, completed)"
        ),
    },
    withErrorHandling(async ({ projectId, modelId, status }) => {
      await db
        .update(dataModels)
        .set({
          status: status as (typeof statusEnum.enumValues)[number],
        })
        .where(
          and(eq(dataModels.projectId, projectId), eq(dataModels.id, modelId))
        );

      return {
        content: [
          {
            type: "text",
            text: `Data model status set to ${status}. Get the next task.`,
          },
        ],
      };
    })
  );

  server.tool(
    "set-api-endpoint-status",
    "Set the status of the api endpoint",
    {
      projectId: z.string().describe("ID of the project to set the status of"),
      endpointId: z
        .string()
        .describe("ID of the api endpoint to set the status of"),
      status: z
        .string()
        .describe(
          "Status to set the api endpoint to (open, in progress, completed)"
        ),
    },
    withErrorHandling(async ({ projectId, endpointId, status }) => {
      await db
        .update(apiEndpoints)
        .set({
          status: status as (typeof statusEnum.enumValues)[number],
        })
        .where(
          and(
            eq(apiEndpoints.projectId, projectId),
            eq(apiEndpoints.id, endpointId)
          )
        );

      return {
        content: [
          {
            type: "text",
            text: `Api endpoint status set to ${status}. Get the next task.`,
          },
        ],
      };
    })
  );

  server.tool(
    "set-screen-status",
    "Set the status of the screen",
    {
      projectId: z.string().describe("ID of the project to set the status of"),
      screenId: z.string().describe("ID of the screen to set the status of"),
      status: z
        .string()
        .describe("Status to set the screen to (open, in progress, completed)"),
    },
    withErrorHandling(async ({ projectId, screenId, status }) => {
      await db
        .update(screens)
        .set({
          status: status as (typeof statusEnum.enumValues)[number],
        })
        .where(and(eq(screens.projectId, projectId), eq(screens.id, screenId)));

      return {
        content: [
          {
            type: "text",
            text: `Screen status set to ${status}. Get the next task.`,
          },
        ],
      };
    })
  );

  server.tool(
    "set-project-status",
    "Set the status of the project",
    {
      projectId: z.string().describe("ID of the project to set the status of"),
      status: z
        .string()
        .describe(
          "Status to set the project to (open, in progress, completed)"
        ),
    },
    withErrorHandling(async ({ projectId, status }) => {
      await db
        .update(projects)
        .set({
          stage: "finished",
        })
        .where(eq(projects.id, projectId));

      return {
        content: [
          {
            type: "text",
            text: "Project is complete",
          },
        ],
      };
    })
  );

  // Tool: Create a new project
  server.tool(
    "get-next-task",
    "Get the next task to execute",
    {
      projectId: z.string().describe("ID of the project to execute"),
    },
    withErrorHandling(async ({ projectId }) => {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) throw "Project not found";

      if (project.stage === "requirements") {
        const projectOverview = await db.query.projectOverviews.findFirst({
          where: eq(projectOverviews.projectId, projectId),
        });

        if (!projectOverview) throw "Project overview not found";

        await setStage(project, "techstack");

        return {
          content: [
            {
              type: "text",
              text: `Set up this project techstack: 
                        
${JSON.stringify(projectOverview.techStack)}

First make a plan using specific details, and then implement the plan. Look up the latest documentation for the techstack, and use official documentation.`,
            },
          ],
        };
      } else if (project.stage === "techstack") {
        const projectOverview = await db.query.projectOverviews.findFirst({
          where: eq(projectOverviews.projectId, projectId),
        });

        if (!projectOverview) throw "Project overview not found";

        await setStage(project, "components");
        await db
          .update(projectOverviews)
          .set({
            status: "in progress",
          })
          .where(eq(projectOverviews.projectId, projectId));

        return {
          content: [
            {
              type: "text",
              text: `Set up the shared components for this project: 
                        
${JSON.stringify(projectOverview.sharedComponents)}

Make a plan to do each component. If a component is difficult, break it down into smaller components. Then make those components.`,
            },
          ],
        };
      } else if (
        project.stage === "components" ||
        project.stage === "dataModels"
      ) {
        await db
          .update(projectOverviews)
          .set({
            status: "completed",
          })
          .where(eq(projectOverviews.projectId, projectId));

        const models = await db.query.dataModels.findMany({
          where: and(
            eq(dataModels.projectId, projectId),
            eq(dataModels.status, "open")
          ),
        });

        if (!models) throw "Models not found";

        if (project.stage === "components")
          await setStage(project, "dataModels");
        if (models.length === 0) {
          await setStage(project, "schemaGeneration");
          return {
            content: [
              {
                type: "text",
                text: "Models are completed, move on to the next step.",
              },
            ],
          };
        }

        await db
          .update(dataModels)
          .set({
            status: "in progress",
          })
          .where(eq(dataModels.id, models[0].id));

        const nextModel = {
          name: models[0].name,
          description: models[0].description,
          status: models[0].status,
          properties: models[0].properties,
          relations: models[0].relations,
        };

        return {
          content: [
            {
              type: "text",
              text: `Make the following model: ${JSON.stringify(
                nextModel
              )}. Then save it as completed when done. Then call the get-next-task tool.`,
            },
          ],
        };
      } else if (project.stage === "schemaGeneration") {
        const models = await db.query.dataModels.findMany({
          where: and(
            eq(dataModels.projectId, projectId),
            eq(dataModels.status, "completed")
          ),
        });

        if (!models) throw "Models not found";

        await setStage(project, "apiEndpoints");

        return {
          content: [
            {
              type: "text",
              text: `Review all the models, and then generate the schema for the database. Write a file to create the tables or schema in the database, and then write a file to to seed the database with mock data. Then call the get-next-task tool.`,
            },
          ],
        };
      } else if (project.stage === "apiEndpoints") {
        const endpoints = await db.query.apiEndpoints.findMany({
          where: and(
            eq(apiEndpoints.projectId, projectId),
            eq(apiEndpoints.status, "open")
          ),
        });

        if (!endpoints) throw "Endpoints not found";

        if (endpoints.length === 0) {
          await setStage(project, "screens");
          return {
            content: [
              {
                type: "text",
                text: "Endpoints are completed, move on to the next step.",
              },
            ],
          };
        }

        const nextEndpoint = endpoints[0];

        await db
          .update(apiEndpoints)
          .set({
            status: "in progress",
          })
          .where(eq(apiEndpoints.id, nextEndpoint.id));

        return {
          content: [
            {
              type: "text",
              text: `Make the following api endpoint: ${JSON.stringify(
                nextEndpoint
              )} and save it as completed when done. Then call the get-next-task tool. Don't mock the data, use the actual data from the database.`,
            },
          ],
        };
      } else if (project.stage === "screens") {
        const uiScreens = await db.query.screens.findMany({
          where: and(
            eq(screens.projectId, projectId),
            eq(screens.status, "open")
          ),
        });

        if (!uiScreens) throw "Screens not found";

        if (uiScreens.length === 0) {
          await setStage(project, "userStories");
          return {
            content: [
              {
                type: "text",
                text: "Screens are completed, move on to the next step.",
              },
            ],
          };
        }

        await db
          .update(screens)
          .set({
            status: "in progress",
          })
          .where(eq(screens.id, uiScreens[0].id));

        const nextScreen = {
          name: uiScreens[0].name,
          description: uiScreens[0].description,
          status: uiScreens[0].status,
        };

        return {
          content: [
            {
              type: "text",
              text: `Make the following screen: 
              
              ${JSON.stringify(nextScreen)}
              
              Then save it as completed when done. Then call the get-next-task tool.`,
            },
          ],
        };
      } else if (project.stage === "userStories") {
        if (!userStories) throw "User stories not found";

        await setStage(project, "userStories");

        return {
          content: [
            {
              type: "text",
              text: `Check each of the following user stories:
                        
${userStories}

If any of them are not satisfied, make them. If all of them are satisfied, set the project status to finished.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: "Project is complete",
          },
        ],
      };
    })
  );
};
