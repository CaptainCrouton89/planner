import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config"; // Load environment variables
import { registerExecutionTools } from "./execution.js";
import { registerProjectTools } from "./project.js";
import { registerTaskTools } from "./task.js";
// Create an MCP server
const server = new McpServer({
    name: "Task and Requirement Planner",
    version: "1.0.0",
}, {
    instructions: "Use these tools to help the user plan their tasks and requirements for large programming projects.",
});
registerProjectTools(server);
registerTaskTools(server);
registerExecutionTools(server);
// Initialize storage and start the server
async function startServer() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Task and Requirement Planner MCP Server running on stdio...");
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
