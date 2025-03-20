import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  TaskInput,
  Task as TaskModel,
  UpdateTaskInput,
} from "../../core/Task.js";
import { db, NewTask, Task, tasks } from "../../db/index.js";

export class DrizzleTaskStore {
  constructor() {}

  async initialize(): Promise<void> {
    try {
      // Check connection by running a simple query
      await db.select().from(tasks).limit(1);
    } catch (error) {
      console.error("Error initializing DrizzleTaskStore:", error);
      throw error;
    }
  }

  async getAllTasks(): Promise<TaskModel[]> {
    try {
      const result = await db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.updatedAt));
      const taskModels = await this.mapTasksWithChildren(result);
      return taskModels;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<TaskModel | undefined> {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id));

      if (result.length === 0) {
        return undefined;
      }

      const taskModels = await this.mapTasksWithChildren([result[0]]);
      return taskModels[0];
    } catch (error) {
      console.error(`Error fetching task with id ${id}:`, error);
      throw error;
    }
  }

  async getChildTasks(parentId: string): Promise<TaskModel[]> {
    try {
      const result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.parentId, parentId))
        .orderBy(tasks.position, tasks.createdAt);

      const taskModels = await this.mapTasksWithChildren(result);
      return taskModels;
    } catch (error) {
      console.error(
        `Error fetching child tasks for parent ${parentId}:`,
        error
      );
      throw error;
    }
  }

  async getRootTasks(): Promise<TaskModel[]> {
    try {
      const result = await db
        .select()
        .from(tasks)
        .where(isNull(tasks.parentId))
        .orderBy(tasks.projectId, tasks.position, tasks.createdAt);

      const taskModels = await this.mapTasksWithChildren(result);
      return taskModels;
    } catch (error) {
      console.error("Error fetching root tasks:", error);
      throw error;
    }
  }

  async createTask(input: TaskInput): Promise<TaskModel> {
    try {
      const id = uuidv4();
      const now = new Date();

      const newTask: NewTask = {
        id,
        title: input.title,
        description: input.description || null,
        completed: false,
        parentId: input.parentId || null,
        projectId: input.projectId,
        createdAt: now,
        updatedAt: now,
        priority: input.priority || null,
        position: null, // Default position
      };

      await db.insert(tasks).values(newTask);

      // Return the newly created task
      const taskModel: TaskModel = {
        id,
        title: input.title,
        description: input.description,
        completed: false,
        parentId: input.parentId,
        projectId: input.projectId,
        childTasks: [],
        createdAt: now,
        updatedAt: now,
        priority: input.priority,
      };

      return taskModel;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async updateTask(
    id: string,
    input: UpdateTaskInput
  ): Promise<TaskModel | undefined> {
    try {
      // First check if the task exists
      const existingTask = await this.getTaskById(id);
      if (!existingTask) {
        return undefined;
      }

      // Create update object
      const updateData: Partial<Task> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) {
        updateData.title = input.title;
      }

      if (input.description !== undefined) {
        updateData.description = input.description;
      }

      if (input.completed !== undefined) {
        updateData.completed = input.completed;
      }

      if (input.priority !== undefined) {
        updateData.priority = input.priority;
      }

      if (input.position !== undefined) {
        updateData.position = input.position;
      }

      if (input.projectId !== undefined) {
        updateData.projectId = input.projectId;
      }

      // Update the task
      await db.update(tasks).set(updateData).where(eq(tasks.id, id));

      // Get the updated task
      return this.getTaskById(id);
    } catch (error) {
      console.error(`Error updating task with id ${id}:`, error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      // First check if the task exists
      const existingTask = await this.getTaskById(id);
      if (!existingTask) {
        return false;
      }

      // Get all child tasks
      const childTasks = await this.getChildTasks(id);

      // Delete child tasks recursively
      for (const childTask of childTasks) {
        await this.deleteTask(childTask.id);
      }

      // Delete the task
      await db.delete(tasks).where(eq(tasks.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting task with id ${id}:`, error);
      throw error;
    }
  }

  async completeTask(id: string): Promise<TaskModel | undefined> {
    return this.updateTask(id, { completed: true });
  }

  async getTasksByProject(projectId: string): Promise<TaskModel[]> {
    try {
      const result = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(tasks.position, tasks.createdAt);

      const taskModels = await this.mapTasksWithChildren(result);
      return taskModels;
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      throw error;
    }
  }

  async getProjectRootTasks(projectId: string): Promise<TaskModel[]> {
    try {
      const result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.projectId, projectId), isNull(tasks.parentId)))
        .orderBy(tasks.position, tasks.createdAt);

      const taskModels = await this.mapTasksWithChildren(result);
      return taskModels;
    } catch (error) {
      console.error(
        `Error fetching root tasks for project ${projectId}:`,
        error
      );
      throw error;
    }
  }

  // Helper method to fetch and map child tasks
  private async mapTasksWithChildren(tasksList: Task[]): Promise<TaskModel[]> {
    // Create a map of parent IDs to their children
    const childMap: Record<string, string[]> = {};

    // Get all tasks that have a parent from this list
    if (tasksList.length > 0) {
      const parentIds = tasksList.map((task) => task.id).filter(Boolean);

      if (parentIds.length > 0) {
        const childTasks = await db
          .select()
          .from(tasks)
          .where(sql`${tasks.parentId} IN (${parentIds.join(",")})`);

        // Group children by parent ID
        for (const child of childTasks) {
          if (child.parentId) {
            if (!childMap[child.parentId]) {
              childMap[child.parentId] = [];
            }
            childMap[child.parentId].push(child.id);
          }
        }
      }
    }

    // Map tasks to TaskModel
    return tasksList.map((task) =>
      this.mapToTaskModel(task, childMap[task.id] || [])
    );
  }

  private mapToTaskModel(task: Task, childTasks: string[] = []): TaskModel {
    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      completed: task.completed,
      parentId: task.parentId || undefined,
      projectId: task.projectId,
      childTasks,
      createdAt: task.createdAt || new Date(),
      updatedAt: task.updatedAt || new Date(),
      priority: task.priority || undefined,
      position: task.position || undefined,
    };
  }
}
