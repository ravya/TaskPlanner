// Types
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskMode = 'personal' | 'professional';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    mode: TaskMode;
    tags: string[];
    startDate: string;
    startTime?: string;
    completed: boolean;
    isRepeating: boolean;
    repeatFrequency?: 'daily' | 'weekly' | 'monthly';
    repeatEndDate?: string;
    subtasks: Subtask[];
    projectId?: string;
    projectName?: string;
    position: number;
    userId: string;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
}

export interface TaskFormData {
    title: string;
    description?: string;
    priority: TaskPriority;
    mode: TaskMode;
    tags: string[];
    startDate: string;
    startTime?: string;
    isRepeating: boolean;
    repeatFrequency?: 'daily' | 'weekly' | 'monthly';
    repeatEndDate?: string;
    subtasks: Subtask[];
    projectId?: string;
}
