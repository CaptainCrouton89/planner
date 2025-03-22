import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { projectOverviews, projects } from "./db/schema.js";
import { db } from "./db/index.js";

export const registerExecutionTools = (server: McpServer) => {
  // Tool: Create a new project
  server.tool(
    "get-next-task",
    "Get the next task to execute",
    {
      projectId: z.string().describe("ID of the project to execute"),
    },
    async ({ projectId }) => {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
        });

        if (!project) {
            return {
                content: [
        
