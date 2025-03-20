import fs from "fs/promises";
import { nanoid } from "nanoid";
import os from "os";
import path from "path";
export class FileTaskStore {
    tasks = new Map();
    filePath;
    dataDir;
    static getDefaultDataDir() {
        if (process.env.MCP_DATA_DIR) {
            return process.env.MCP_DATA_DIR;
        }
        // Similar to /Users/silasrhyneer/AI/requirements
        return path.join(os.homedir(), "AI", "mcp-planner");
    }
    constructor(dataDir = FileTaskStore.getDefaultDataDir(), storageFile = "tasks.json") {
        this.dataDir = dataDir;
        this.filePath = path.join(this.dataDir, storageFile);
    }
    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        }
        catch (error) {
            console.error("Error creating data directory:", error);
            throw error;
        }
    }
    async initializeStorage() {
        try {
            // Check if file exists, create if not
            try {
                await fs.access(this.filePath);
            }
            catch {
                // File doesn't exist, create with empty array
                await fs.writeFile(this.filePath, JSON.stringify([]), "utf-8");
            }
        }
        catch (error) {
            console.error("Error initializing storage:", error);
            throw error;
        }
    }
    async initialize() {
        try {
            // Ensure data directory exists
            await this.ensureDataDir();
            // Initialize storage file if needed
            await this.initializeStorage();
            // Load tasks from storage
            const data = await fs.readFile(this.filePath, "utf-8");
            const taskArray = JSON.parse(data);
            // Filter out any tasks without projectId or add a default projectId
            // This handles existing data that might not have projectId
            this.tasks = new Map(taskArray
                .map((task) => {
                // Convert string dates back to Date objects
                task.createdAt = new Date(task.createdAt);
                task.updatedAt = new Date(task.updatedAt);
                // Ensure all tasks have a projectId (required)
                if (!task.projectId) {
                    console.error(`Task ${task.id} missing projectId, skipping`);
                    return null;
                }
                return [task.id, task];
            })
                .filter(Boolean));
            console.log(`Loaded ${this.tasks.size} tasks from storage`);
        }
        catch (error) {
            // If file doesn't exist or can't be parsed, start with empty tasks
            console.error("Failed to load tasks, starting with empty task list", error);
            this.tasks = new Map();
            await this.save();
        }
    }
    async save() {
        try {
            // Make sure the directory exists before saving
            await this.ensureDataDir();
            const taskArray = Array.from(this.tasks.values());
            await fs.writeFile(this.filePath, JSON.stringify(taskArray, null, 2), "utf-8");
        }
        catch (error) {
            console.error("Failed to save tasks:", error);
        }
    }
    async getAllTasks() {
        return Array.from(this.tasks.values());
    }
    async getTaskById(id) {
        return this.tasks.get(id);
    }
    async getChildTasks(parentId) {
        return Array.from(this.tasks.values()).filter((task) => task.parentId === parentId);
    }
    async getRootTasks() {
        // Return all tasks without a parent, grouped by project
        return Array.from(this.tasks.values()).filter((task) => !task.parentId);
    }
    async createTask(input) {
        const now = new Date();
        const task = {
            id: nanoid(),
            title: input.title,
            description: input.description,
            completed: false,
            parentId: input.parentId,
            projectId: input.projectId, // Required field now
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
    async updateTask(id, input) {
        const task = this.tasks.get(id);
        if (!task)
            return undefined;
        const updatedTask = {
            ...task,
            ...input,
            updatedAt: new Date(),
        };
        this.tasks.set(id, updatedTask);
        await this.save();
        return updatedTask;
    }
    async deleteTask(id) {
        const task = this.tasks.get(id);
        if (!task)
            return false;
        // Remove this task from its parent's childTasks
        if (task.parentId) {
            const parentTask = this.tasks.get(task.parentId);
            if (parentTask) {
                parentTask.childTasks = parentTask.childTasks.filter((childId) => childId !== id);
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
    async completeTask(id) {
        return this.updateTask(id, { completed: true });
    }
    // New method to get tasks by project
    async getTasksByProject(projectId) {
        return Array.from(this.tasks.values()).filter((task) => task.projectId === projectId);
    }
    // Method to get root tasks for a project (tasks without a parent but with projectId)
    async getProjectRootTasks(projectId) {
        return Array.from(this.tasks.values()).filter((task) => !task.parentId && task.projectId === projectId);
    }
}
