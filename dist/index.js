import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import "dotenv/config"; // Load environment variables
import { z } from "zod";
import * as requirementsApi from "./api/requirements.js";
import { createProject, createRequirement, deleteRequirement, findProjects, generateRequirement, generateRequirementsFromDiscovery, getProject, guidedRequirementDiscovery, listProjectRequirements, processDiscoveryResponse, updateProject, updateRequirement, } from "./tools/requirements-tools.js";
import { completeTask, createTask, deleteTask, getTask, listChildTasks, listProjectRootTasks, listProjectTasks, updateTask, } from "./tools/tasks-tools.js";
// Create an MCP server
const server = new McpServer({
    name: "Task and Requirement Planner",
    version: "1.0.0",
});
// Tool: Create a new project
server.tool("create-project", "Create a new project", {
    name: z.string().min(1).describe("Name of the project"),
    description: z
        .string()
        .optional()
        .describe("Detailed description of the project"),
}, async ({ name, description }) => {
    const result = await createProject({ name, description });
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
});
// Tool: Update a project
server.tool("update-project", "Update an existing project", {
    id: z.string().describe("ID of the project to update"),
    name: z.string().optional().describe("New name for the project"),
    description: z
        .string()
        .optional()
        .describe("New description for the project"),
}, async ({ id, name, description }) => {
    const result = await updateProject({ id, name, description });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || "Failed to update project",
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Updated project: ${result.project?.name}`,
            },
        ],
    };
});
// Tool: Delete a project
server.tool("delete-project", "Delete a project and all its tasks", {
    id: z.string().describe("ID of the project to delete"),
}, async ({ id }) => {
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
    const taskCount = tasksResult.success && tasksResult.tasks ? tasksResult.tasks.length : 0;
    if (tasksResult.success && tasksResult.tasks) {
        for (const task of tasksResult.tasks) {
            await deleteTask({ id: task.id });
        }
    }
    // Delete the project
    const success = await requirementsApi.deleteProject(id);
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
});
// Tool: List all projects
server.tool("list-projects", "List all projects", {
    searchTerm: z
        .string()
        .optional()
        .describe("Optional search term to filter projects"),
}, async ({ searchTerm }) => {
    const result = await findProjects({ searchTerm });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || "Failed to list projects",
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
                text: projects.length > 0
                    ? `Projects:\n${projects
                        .map((p) => `- ${p.name} (ID: ${p.id})`)
                        .join("\n")}`
                    : "No projects found.",
            },
        ],
    };
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
    projectId: z.string().describe("ID of the project this task belongs to"),
    priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("Priority level of the task"),
}, async ({ title, description, parentId, projectId, priority }) => {
    // Verify the project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
                },
            ],
            isError: true,
        };
    }
    const projectName = projectResult.project?.name || projectId;
    const result = await createTask({
        title,
        description,
        parentId,
        projectId,
        priority,
    });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || "Failed to create task",
                },
            ],
            isError: true,
        };
    }
    const taskTitle = result.task?.title || title;
    const taskId = result.task?.id || "unknown";
    return {
        content: [
            {
                type: "text",
                text: `Created task: ${taskTitle} (ID: ${taskId}) in project: ${projectName}`,
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
    projectId: z.string().describe("ID of the project to list tasks for"),
}, async ({ parentId, projectId }) => {
    // Check if project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
                },
            ],
            isError: true,
        };
    }
    const projectName = projectResult.project?.name || projectId;
    let result;
    if (parentId) {
        // Get child tasks of a parent
        result = await listChildTasks({ parentId });
        if (result.success && result.tasks) {
            // Filter by project ID
            result.tasks = result.tasks.filter((task) => task.projectId === projectId);
        }
    }
    else {
        // Get root tasks for a project
        result = await listProjectRootTasks({ projectId });
    }
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || "Failed to list tasks",
                },
            ],
            isError: true,
        };
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
    const tasks = result.tasks || [];
    return {
        content: [
            {
                type: "text",
                text: tasks.length > 0
                    ? `Tasks in project "${projectName}":\n${tasks
                        .map(formatTask)
                        .join("\n")}`
                    : `No tasks found in project "${projectName}".`,
            },
        ],
    };
});
// Tool: Get task details
server.tool("get-task", "Get detailed information about a task", {
    id: z.string().describe("ID of the task to retrieve"),
}, async ({ id }) => {
    const result = await getTask({ id });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    const task = result.task;
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
    const formatPriority = (priority) => {
        if (!priority)
            return "";
        return priority === "high"
            ? " ⚠️ High priority"
            : priority === "medium"
                ? " ⚡ Medium priority"
                : " 📋 Low priority";
    };
    const childTasksCount = task.childTasks ? task.childTasks.length : 0;
    let project;
    try {
        const projectResult = await getProject({ id: task.projectId });
        if (projectResult.success) {
            project = projectResult.project;
        }
    }
    catch (error) {
        console.error("Error fetching project:", error);
    }
    return {
        content: [
            {
                type: "text",
                text: `Task: ${task.title}${formatPriority(task.priority)}
Status: ${task.completed ? "✓ Completed" : "□ Not completed"}
Project: ${project ? project.name : task.projectId}
${task.description ? `Description: ${task.description}` : ""}
${task.parentId ? `Parent Task: ${task.parentId}` : ""}
${childTasksCount > 0 ? `Subtasks: ${childTasksCount}` : "No subtasks"}
Created: ${task.createdAt?.toLocaleString()}
Last Updated: ${task.updatedAt?.toLocaleString()}
ID: ${task.id}`,
            },
        ],
    };
});
// Tool: Complete a task
server.tool("complete-task", "Mark a task as completed", {
    id: z.string().describe("ID of the task to complete"),
}, async ({ id }) => {
    const result = await completeTask({ id });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    const taskTitle = result.task?.title || id;
    return {
        content: [
            {
                type: "text",
                text: `Task "${taskTitle}" marked as completed.`,
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
    const result = await updateTask({
        id,
        title,
        description,
        priority,
    });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    const taskTitle = result.task?.title || id;
    return {
        content: [
            {
                type: "text",
                text: `Task "${taskTitle}" updated successfully.`,
            },
        ],
    };
});
// Tool: Delete a task
server.tool("delete-task", "Delete a task and its subtasks", {
    id: z.string().describe("ID of the task to delete"),
}, async ({ id }) => {
    const taskResult = await getTask({ id });
    if (!taskResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: taskResult.error || `Task with ID ${id} not found.`,
                },
            ],
            isError: true,
        };
    }
    const taskTitle = taskResult.task?.title || id;
    const result = await deleteTask({ id });
    if (!result.success) {
        return {
            content: [
                {
                    type: "text",
                    text: result.error || `Failed to delete task "${taskTitle}".`,
                },
            ],
            isError: true,
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Deleted task "${taskTitle}" and all its subtasks.`,
            },
        ],
    };
});
// Tool: Break down a task into subtasks
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
    const parentTaskResult = await getTask({ id: parentId });
    if (!parentTaskResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: parentTaskResult.error ||
                        `Parent task with ID ${parentId} not found.`,
                },
            ],
            isError: true,
        };
    }
    const parentTask = parentTaskResult.task;
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
    const createdTasks = [];
    for (const subtask of subtasks) {
        const result = await createTask({
            title: subtask.title,
            description: subtask.description,
            priority: subtask.priority,
            parentId,
            projectId: parentTask.projectId,
        });
        if (result.success && result.task) {
            createdTasks.push(result.task);
        }
    }
    return {
        content: [
            {
                type: "text",
                text: `Created ${createdTasks.length} subtasks for "${parentTask.title}":\n${createdTasks.map((t) => `- ${t.title}`).join("\n")}`,
            },
        ],
    };
});
// Tool: Search for projects
server.tool("search-projects", "Search for projects by name or description", {
    query: z.string().min(1).describe("Search term to find matching projects"),
}, async ({ query }) => {
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
                text: projects.length > 0
                    ? `Found ${projects.length} projects matching "${query}":\n${projects
                        .map((p) => `- ${p.name} (ID: ${p.id})`)
                        .join("\n")}`
                    : `No projects found matching "${query}".`,
            },
        ],
    };
});
// Tool: Create a requirement
server.tool("create-requirement", "Create a new requirement", {
    projectId: z
        .string()
        .describe("ID of the project this requirement belongs to"),
    title: z.string().min(1).describe("Title of the requirement"),
    description: z.string().describe("Detailed description of the requirement"),
    type: z
        .enum(["functional", "technical", "non-functional", "user_story"])
        .describe("Type of requirement"),
    priority: z
        .enum(["low", "medium", "high", "critical"])
        .describe("Priority level of the requirement"),
    tags: z.array(z.string()).optional().describe("Tags for the requirement"),
}, async ({ projectId, title, description, type, priority, tags }) => {
    // Verify the project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
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
        tags,
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
});
// Tool: List requirements
server.tool("list-requirements", "List all requirements for a project", {
    projectId: z
        .string()
        .describe("ID of the project to list requirements for"),
}, async ({ projectId }) => {
    // Check if project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
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
    const formatRequirement = (req) => {
        const priorityMarker = req.priority === "critical"
            ? "🔴"
            : req.priority === "high"
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
                text: requirements.length > 0
                    ? `Requirements in project "${projectName}":\n${requirements
                        .map(formatRequirement)
                        .join("\n")}`
                    : `No requirements found in project "${projectName}".`,
            },
        ],
    };
});
// Tool: Update a requirement
server.tool("update-requirement", "Update a requirement's details", {
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
        .enum(["low", "medium", "high", "critical"])
        .optional()
        .describe("New priority level for the requirement"),
    status: z
        .enum([
        "draft",
        "review",
        "approved",
        "implemented",
        "verified",
        "deferred",
        "rejected",
    ])
        .optional()
        .describe("New status for the requirement"),
    tags: z
        .array(z.string())
        .optional()
        .describe("New tags for the requirement"),
}, async ({ id, title, description, type, priority, status, tags }) => {
    const result = await updateRequirement({
        id,
        title,
        description,
        type,
        priority,
        status,
        tags,
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
});
// Tool: Delete a requirement
server.tool("delete-requirement", "Delete a requirement", {
    id: z.string().describe("ID of the requirement to delete"),
}, async ({ id }) => {
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
});
// Tool: Generate a requirement
server.tool("generate-requirement", "Generate a requirement using AI", {
    projectId: z
        .string()
        .describe("ID of the project this requirement belongs to"),
    description: z
        .string()
        .describe("Description to generate a requirement from"),
}, async ({ projectId, description }) => {
    // Verify the project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
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
                text: `Generated requirement: ${result.requirement?.title || "Unnamed"} (ID: ${result.requirement?.id || "unknown"})`,
            },
        ],
    };
});
// Tool: Guided requirement discovery
server.tool("guided-requirement-discovery", "Start guided discovery process for requirements", {
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
}, async ({ projectId, domain, stage, previousResponses }) => {
    // Verify the project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
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
    // Get the questions from the response
    const questions = result.response?.questions || [];
    const promptText = questions.length > 0
        ? questions.join("\n\n")
        : "No discovery questions available";
    return {
        content: [
            {
                type: "text",
                text: promptText,
            },
        ],
    };
});
// Tool: Process discovery response
server.tool("process-discovery-response", "Process a response from guided discovery", {
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
}, async ({ projectId, stage, domain, response, previousResponses }) => {
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
    // Use the suggestions from the response
    const suggestions = result.response?.suggestions || [];
    const messageText = suggestions.length > 0
        ? suggestions.join("\n\n")
        : "Response processed successfully";
    return {
        content: [
            {
                type: "text",
                text: messageText,
            },
        ],
    };
});
// Tool: Generate requirements from discovery
server.tool("generate-requirements-from-discovery", "Generate requirements based on discovery process", {
    projectId: z
        .string()
        .describe("ID of the project to create requirements for"),
    discoveryResponses: z
        .string()
        .describe("Collected responses from the discovery process"),
}, async ({ projectId, discoveryResponses }) => {
    // Verify the project exists
    const projectResult = await getProject({ id: projectId });
    if (!projectResult.success) {
        return {
            content: [
                {
                    type: "text",
                    text: projectResult.error || `Project with ID ${projectId} not found.`,
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
                    text: result.error || "Failed to generate requirements from discovery",
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
});
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
