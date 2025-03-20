import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  generateRequirement,
  generateRequirementsFromDiscovery,
  guidedRequirementDiscovery,
  processDiscoveryResponse,
} from "./tools/discovery-tools.js";
import { getProject } from "./tools/project-tools.js";
import {
  createRequirement,
  deleteRequirement,
  listProjectRequirements,
  updateRequirement,
} from "./tools/requirement-tools.js";

export const registerRequirementTools = (server: McpServer) => {
  server.tool(
    "create-requirement",
    "Create a new requirement",
    {
      projectId: z
        .string()
        .describe("ID of the project this requirement belongs to"),
      title: z.string().min(1).describe("Title of the requirement"),
      description: z
        .string()
        .describe("Detailed description of the requirement"),
      type: z
        .enum(["functional", "technical", "non-functional", "user_story"])
        .describe("Type of requirement"),
      priority: z
        .enum(["low", "medium", "high"])
        .describe("Priority level of the requirement"),
      status: z
        .enum(["draft", "approved", "implemented"])
        .describe("Status of the requirement"),
    },
    async ({ projectId, title, description, type, priority, status }) => {
      // Verify the project exists
      const projectResult = await getProject({ id: projectId });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                projectResult.error ||
                `Project with ID ${projectId} not found.`,
            },
          ],
          isError: true,
        };
      }

      const projectName = projectResult.project?.name || projectId;

      const result = await createRequirement({
        projectId,
        title,
        description,
        type,
        priority,
        status,
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to create requirement",
            },
          ],
          isError: true,
        };
      }

      const reqTitle = result.requirement?.title || title;
      const reqId = result.requirement?.id || "unknown";

      return {
        content: [
          {
            type: "text",
            text: `Created requirement: ${reqTitle} (ID: ${reqId}) in project: ${projectName}`,
          },
        ],
      };
    }
  );

  // Tool: List requirements
  server.tool(
    "list-requirements",
    "List all requirements for a project",
    {
      projectId: z
        .string()
        .describe("ID of the project to list requirements for"),
    },
    async ({ projectId }) => {
      // Check if project exists
      const projectResult = await getProject({ id: projectId });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                projectResult.error ||
                `Project with ID ${projectId} not found.`,
            },
          ],
          isError: true,
        };
      }

      const projectName = projectResult.project?.name || projectId;

      const result = await listProjectRequirements({ projectId });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to list requirements",
            },
          ],
          isError: true,
        };
      }

      const formatRequirement = (req: any) => {
        const priorityMarker =
          req.priority === "high"
            ? "⚠️"
            : req.priority === "medium"
            ? "⚡"
            : "📋";
        return `${priorityMarker} ${req.title} [${req.type}] (ID: ${req.id})`;
      };

      const requirements = result.requirements || [];

      return {
        content: [
          {
            type: "text",
            text:
              requirements.length > 0
                ? `Requirements in project "${projectName}":\n${requirements
                    .map(formatRequirement)
                    .join("\n")}`
                : `No requirements found in project "${projectName}".`,
          },
        ],
      };
    }
  );

  // Tool: Update a requirement
  server.tool(
    "update-requirement",
    "Update a requirement's details",
    {
      id: z.string().describe("ID of the requirement to update"),
      title: z.string().optional().describe("New title for the requirement"),
      description: z
        .string()
        .optional()
        .describe("New description for the requirement"),
      type: z
        .enum(["functional", "technical", "non-functional", "user_story"])
        .optional()
        .describe("New type for the requirement"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority level for the requirement"),
      status: z
        .enum(["draft", "approved", "implemented"])
        .optional()
        .describe("New status for the requirement"),
    },
    async ({ id, title, description, type, priority, status }) => {
      const result = await updateRequirement({
        id,
        title,
        description,
        type,
        priority,
        status,
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || `Requirement with ID ${id} not found.`,
            },
          ],
          isError: true,
        };
      }

      const reqTitle = result.requirement?.title || id;

      return {
        content: [
          {
            type: "text",
            text: `Requirement "${reqTitle}" updated successfully.`,
          },
        ],
      };
    }
  );

  // Tool: Delete a requirement
  server.tool(
    "delete-requirement",
    "Delete a requirement",
    {
      id: z.string().describe("ID of the requirement to delete"),
    },
    async ({ id }) => {
      const result = await deleteRequirement({ id });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || `Requirement with ID ${id} not found.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Requirement deleted successfully.`,
          },
        ],
      };
    }
  );

  // Tool: Generate a requirement
  server.tool(
    "generate-requirement",
    "Generate a requirement using AI",
    {
      projectId: z
        .string()
        .describe("ID of the project this requirement belongs to"),
      description: z
        .string()
        .describe("Description to generate a requirement from"),
    },
    async ({ projectId, description }) => {
      // Verify the project exists
      const projectResult = await getProject({ id: projectId });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                projectResult.error ||
                `Project with ID ${projectId} not found.`,
            },
          ],
          isError: true,
        };
      }

      const result = await generateRequirement({ projectId, description });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to generate requirement",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Generated requirement: ${
              result.requirement?.title || "Unnamed"
            } (ID: ${result.requirement?.id || "unknown"})`,
          },
        ],
      };
    }
  );

  // Tool: Guided requirement discovery
  server.tool(
    "guided-requirement-discovery",
    "Start guided discovery process for requirements",
    {
      projectId: z
        .string()
        .describe("ID of the project to create requirements for"),
      domain: z.string().describe("The domain or context for discovery"),
      stage: z
        .enum([
          "initial",
          "stakeholders",
          "features",
          "constraints",
          "details",
          "review",
        ])
        .describe("Current stage of discovery"),
      previousResponses: z
        .string()
        .optional()
        .describe("Previous responses from the discovery process"),
    },
    async ({ projectId, domain, stage, previousResponses }) => {
      // Verify the project exists
      const projectResult = await getProject({ id: projectId });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                projectResult.error ||
                `Project with ID ${projectId} not found.`,
            },
          ],
          isError: true,
        };
      }

      const result = await guidedRequirementDiscovery({
        projectId,
        domain,
        stage,
        previousResponses,
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to start guided discovery",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text:
              result.response?.questions || "No discovery questions available",
          },
        ],
      };
    }
  );

  // Tool: Process discovery response
  server.tool(
    "process-discovery-response",
    "Process a response from guided discovery",
    {
      projectId: z.string().describe("ID of the project"),
      stage: z
        .enum([
          "initial",
          "stakeholders",
          "features",
          "constraints",
          "details",
          "review",
        ])
        .describe("Current stage of discovery"),
      domain: z.string().describe("The domain or context for discovery"),
      response: z.string().describe("User response to the discovery prompt"),
      previousResponses: z
        .string()
        .optional()
        .describe("Previous responses from the discovery process"),
    },
    async ({ projectId, stage, domain, response, previousResponses }) => {
      const result = await processDiscoveryResponse({
        projectId,
        stage,
        domain,
        response,
        previousResponses,
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: result.error || "Failed to process discovery response",
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: result.response?.suggestions || "No suggestions available",
          },
        ],
      };
    }
  );

  // Tool: Generate requirements from discovery
  server.tool(
    "generate-requirements-from-discovery",
    "Generate requirements based on discovery process",
    {
      projectId: z
        .string()
        .describe("ID of the project to create requirements for"),
      discoveryResponses: z
        .string()
        .describe("Collected responses from the discovery process"),
    },
    async ({ projectId, discoveryResponses }) => {
      // Verify the project exists
      const projectResult = await getProject({ id: projectId });
      if (!projectResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                projectResult.error ||
                `Project with ID ${projectId} not found.`,
            },
          ],
          isError: true,
        };
      }

      const projectName = projectResult.project?.name || projectId;

      const result = await generateRequirementsFromDiscovery({
        projectId,
        discoveryResponses,
      });

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text:
                result.error ||
                "Failed to generate requirements from discovery",
            },
          ],
          isError: true,
        };
      }

      const reqCount = result.requirements?.length || 0;

      return {
        content: [
          {
            type: "text",
            text: `Generated ${reqCount} requirements for project "${projectName}".`,
          },
        ],
      };
    }
  );
};
