import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProject } from "./tools/project-tools.js";
import {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listChildTasks,
  listProjectRootTasks,
  updateTask,
} from "./tools/tasks-tools.js";

const formatTask = (task: any) => {
  const status = task.completed ? "✓" : "□";
  const priorityMarker =
    task.priority === "high" ? "⚠️" : task.priority === "medium" ? "⚡" : "";
  return `${status} ${task.title} ${priorityMarker} (ID: ${task.id})`;
};

const formatPriority = (priority?: string) => {
  if (!priority) return "";
  return priority === "high"
    ? " ⚠️ High priority"
    : priority === "medium"
    ? " ⚡ Medium priority"
    : " 📋 Low priority";
};

export const registerTaskTools = (server: McpServer) => {
  server.tool(
    "create-task",
    "Create a new task or subtask",
    {
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
    },
    async ({ title, description, parentId, projectId, priority }) => {
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
    }
  );

  // Tool: List all tasks
  server.tool(
    "list-tasks",
    "List all tasks or subtasks",
    {
      parentId: z
        .string()
        .optional()
        .describe("ID of the parent task to list subtasks for"),
      projectId: z.string().describe("ID of the project to list tasks for"),
    },
    async ({ parentId, projectId }) => {
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

      let result;
      if (parentId) {
        // Get child tasks of a parent
        result = await listChildTasks({ parentId });
        if (result.success && result.tasks) {
          // Filter by project ID
          result.tasks = result.tasks.filter(
            (task) => task.projectId === projectId
          );
        }
      } else {
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

      const tasks = result.tasks || [];

      return {
        content: [
          {
            type: "text",
            text:
              tasks.length > 0
                ? `Tasks in project "${projectName}":\n${tasks
                    .map(formatTask)
                    .join("\n")}`
                : `No tasks found in project "${projectName}".`,
          },
        ],
      };
    }
  );

  // Tool: Get task details
  server.tool(
    "get-task",
    "Get detailed information about a task",
    {
      id: z.string().describe("ID of the task to retrieve"),
    },
    async ({ id }) => {
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

      const childTasksCount = task.childTasks ? task.childTasks.length : 0;

      let project;
      try {
        const projectResult = await getProject({ id: task.projectId });
        if (projectResult.success) {
          project = projectResult.project;
        }
      } catch (error) {
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
    }
  );

  // Tool: Complete a task
  server.tool(
    "complete-task",
    "Mark a task as completed",
    {
      id: z.string().describe("ID of the task to complete"),
    },
    async ({ id }) => {
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
    }
  );

  // Tool: Update a task
  server.tool(
    "update-task",
    "Update a task's details",
    {
      id: z.string().describe("ID of the task to update"),
      title: z.string().optional().describe("New title for the task"),
      description: z
        .string()
        .optional()
        .describe("New description for the task"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority level for the task"),
    },
    async ({ id, title, description, priority }) => {
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
    }
  );

  // Tool: Delete a task
  server.tool(
    "delete-task",
    "Delete a task and its subtasks",
    {
      id: z.string().describe("ID of the task to delete"),
    },
    async ({ id }) => {
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
    }
  );

  // Tool: Break down a task into subtasks
  server.tool(
    "break-down-task",
    "Break down a complex task into multiple subtasks",
    {
      parentId: z.string().describe("ID of the parent task to break down"),
      subtasks: z
        .array(
          z.object({
            title: z.string().describe("Title of the subtask"),
            description: z
              .string()
              .optional()
              .describe("Description of the subtask"),
            priority: z
              .enum(["low", "medium", "high"])
              .optional()
              .describe("Priority of the subtask"),
          })
        )
        .min(1)
        .describe("List of subtasks to create"),
    },
    async ({ parentId, subtasks }) => {
      const parentTaskResult = await getTask({ id: parentId });

      if (!parentTaskResult.success) {
        return {
          content: [
            {
              type: "text",
              text:
                parentTaskResult.error ||
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
            text: `Created ${createdTasks.length} subtasks for "${
              parentTask.title
            }":\n${createdTasks.map((t) => `- ${t.title}`).join("\n")}`,
          },
        ],
      };
    }
  );
};
