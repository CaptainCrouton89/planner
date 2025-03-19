import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FileTaskStore } from "./storage/FileTaskStore.js";
// Initialize the task store
const taskStore = new FileTaskStore();
// Create an MCP server
const server = new McpServer({
    name: "Task Planner",
    version: "1.0.0",
});
// Tool: Create a new task
server.tool("create-task", "Create a new task or subtask", {
    title: z.string().min(1).describe("Title of the task"),
    description: z
        .string()
        .optional()
        .describe("Detailed description of the task"),
    parentId: z
        .string()
        .optional()
        .describe("ID of the parent task if this is a subtask"),
    priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("Priority level of the task"),
}, async ({ title, description, parentId, priority }) => {
    const task = await taskStore.createTask({
        title,
        description,
        parentId,
        priority,
    });
    return {
        content: [
            {
                type: "text",
                text: `Created task: ${task.title} (ID: ${task.id})`,
            },
        ],
    };
});
// Tool: List all tasks
server.tool("list-tasks", "List all tasks or subtasks", {
    parentId: z
        .string()
        .optional()
        .describe("ID of the parent task to list subtasks for"),
}, async ({ parentId }) => {
    let tasks;
    if (parentId) {
        tasks = await taskStore.getChildTasks(parentId);
    }
    else {
        tasks = await taskStore.getRootTasks();
    }
    const formatTask = (task) => {
        const status = task.completed ? "✓" : "□";
        const priorityMarker = task.priority === "high"
            ? "⚠️"
            : task.priority === "medium"
                ? "⚡"
                : "";
        return `${status} ${task.title} ${priorityMarker} (ID: ${task.id})`;
    };
    return {
        content: [
            {
                type: "text",
                text: tasks.length > 0
                    ? `Tasks:\n${tasks.map(formatTask).join("\n")}`
                    : "No tasks found.",
            },
        ],
    };
});
// Tool: Get task details
server.tool("get-task", "Get detailed information about a task", {
    id: z.string().describe("ID of the task to retrieve"),
}, async ({ id }) => {
    const task = await taskStore.getTaskById(id);
    if (!task) {
        return {
            content: [
                {
                    type: "text",
                    text: `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    const childTasks = await taskStore.getChildTasks(id);
    const childTasksInfo = childTasks.length > 0
        ? `\nSubtasks:\n${childTasks
            .map((t) => `- ${t.completed ? "✓" : "□"} ${t.title} (ID: ${t.id})`)
            .join("\n")}`
        : "\nNo subtasks.";
    const info = [
        `# ${task.title}`,
        `ID: ${task.id}`,
        `Status: ${task.completed ? "Completed" : "Pending"}`,
        `Priority: ${task.priority || "Normal"}`,
        `Created: ${task.createdAt.toLocaleString()}`,
        `Updated: ${task.updatedAt.toLocaleString()}`,
        task.description ? `\nDescription:\n${task.description}` : "",
        childTasksInfo,
    ].join("\n");
    return {
        content: [
            {
                type: "text",
                text: info,
            },
        ],
    };
});
// Tool: Complete a task
server.tool("complete-task", "Mark a task as completed", {
    id: z.string().describe("ID of the task to complete"),
}, async ({ id }) => {
    const updatedTask = await taskStore.completeTask(id);
    if (!updatedTask) {
        return {
            content: [
                {
                    type: "text",
                    text: `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Marked task "${updatedTask.title}" as complete.`,
            },
        ],
    };
});
// Tool: Update a task
server.tool("update-task", "Update a task's details", {
    id: z.string().describe("ID of the task to update"),
    title: z.string().optional().describe("New title for the task"),
    description: z.string().optional().describe("New description for the task"),
    priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority level for the task"),
}, async ({ id, title, description, priority }) => {
    const updatedTask = await taskStore.updateTask(id, {
        title,
        description,
        priority,
    });
    if (!updatedTask) {
        return {
            content: [
                {
                    type: "text",
                    text: `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Updated task "${updatedTask.title}" (ID: ${updatedTask.id}).`,
            },
        ],
    };
});
// Tool: Delete a task
server.tool("delete-task", "Delete a task and its subtasks", {
    id: z.string().describe("ID of the task to delete"),
}, async ({ id }) => {
    const success = await taskStore.deleteTask(id);
    if (!success) {
        return {
            content: [
                {
                    type: "text",
                    text: `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Deleted task and its subtasks.`,
            },
        ],
    };
});
// Tool: Break down a task
server.tool("break-down-task", "Break down a complex task into multiple subtasks", {
    parentId: z.string().describe("ID of the parent task to break down"),
    subtasks: z
        .array(z.object({
        title: z.string().describe("Title of the subtask"),
        description: z
            .string()
            .optional()
            .describe("Description of the subtask"),
        priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .describe("Priority of the subtask"),
    }))
        .min(1)
        .describe("List of subtasks to create"),
}, async ({ parentId, subtasks }) => {
    const parentTask = await taskStore.getTaskById(parentId);
    if (!parentTask) {
        return {
            content: [
                {
                    type: "text",
                    text: `Parent task with ID ${parentId} not found.`,
                },
            ],
            isError: true,
        };
    }
    const createdSubtasks = [];
    for (const subtask of subtasks) {
        const created = await taskStore.createTask({
            ...subtask,
            parentId: parentTask.id,
        });
        createdSubtasks.push(created);
    }
    return {
        content: [
            {
                type: "text",
                text: `Created ${createdSubtasks.length} subtasks for "${parentTask.title}":\n` +
                    createdSubtasks
                        .map((task) => `- ${task.title} (ID: ${task.id})`)
                        .join("\n"),
            },
        ],
    };
});
// Initialize storage and start the server
async function startServer() {
    try {
        await taskStore.initialize();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Task Planner MCP Server running on stdio...");
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
