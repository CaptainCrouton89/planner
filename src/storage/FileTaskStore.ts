import fs from "fs/promises";
import { nanoid } from "nanoid";
import path from "path";
import { Task, TaskInput, UpdateTaskInput } from "../core/Task.js";

export class FileTaskStore {
  private tasks: Map<string, Task> = new Map();
  private filePath: string;

  constructor(storageFile: string = "tasks.json") {
    this.filePath = path.resolve(process.cwd(), storageFile);
  }

  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const taskArray = JSON.parse(data);
      this.tasks = new Map(
        taskArray.map((task: Task) => {
          // Convert string dates back to Date objects
          task.createdAt = new Date(task.createdAt);
          task.updatedAt = new Date(task.updatedAt);
          return [task.id, task];
        })
      );
      console.error(`Loaded ${this.tasks.size} tasks from storage`);
    } catch (error) {
      // If file doesn't exist or can't be parsed, start with empty tasks
      console.error(
        "Failed to load tasks, starting with empty task list",
        error
      );
      this.tasks = new Map();
      await this.save();
    }
  }

  private async save(): Promise<void> {
    try {
      const taskArray = Array.from(this.tasks.values());
      await fs.writeFile(
        this.filePath,
        JSON.stringify(taskArray, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getChildTasks(parentId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.parentId === parentId
    );
  }

  async getRootTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((task) => !task.parentId);
  }

  async createTask(input: TaskInput): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: nanoid(),
      title: input.title,
      description: input.description,
      completed: false,
      parentId: input.parentId,
      childTasks: [],
      createdAt: now,
      updatedAt: now,
      priority: input.priority,
    };

    // If this task has a parent, add it to the parent's childTasks
    if (input.parentId) {
      const parentTask = this.tasks.get(input.parentId);
      if (parentTask) {
        parentTask.childTasks.push(task.id);
        this.tasks.set(parentTask.id, parentTask);
      }
    }

    this.tasks.set(task.id, task);
    await this.save();
    return task;
  }

  async updateTask(
    id: string,
    input: UpdateTaskInput
  ): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...input,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    await this.save();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    // Remove this task from its parent's childTasks
    if (task.parentId) {
      const parentTask = this.tasks.get(task.parentId);
      if (parentTask) {
        parentTask.childTasks = parentTask.childTasks.filter(
          (childId) => childId !== id
        );
        this.tasks.set(parentTask.id, parentTask);
      }
    }

    // Recursively delete all child tasks
    for (const childId of task.childTasks) {
      await this.deleteTask(childId);
    }

    this.tasks.delete(id);
    await this.save();
    return true;
  }

  async completeTask(id: string): Promise<Task | undefined> {
    return this.updateTask(id, { completed: true });
  }
}
