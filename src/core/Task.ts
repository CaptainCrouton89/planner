export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  parentId?: string;
  projectId: string;
  childTasks: string[];
  createdAt: Date;
  updatedAt: Date;
  priority?: TaskPriority;
  position?: number;
}

export interface TaskInput {
  title: string;
  description?: string;
  parentId?: string;
  projectId: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TaskPriority;
  position?: number;
  projectId?: string;
}
