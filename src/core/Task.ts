export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  parentId?: string;
  childTasks: string[];
  createdAt: Date;
  updatedAt: Date;
  priority?: "low" | "medium" | "high";
  position?: number;
}

export interface TaskInput {
  title: string;
  description?: string;
  parentId?: string;
  priority?: "low" | "medium" | "high";
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  position?: number;
}
