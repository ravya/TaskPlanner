// Types
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskLabel = 'urgent' | 'important' | 'errand' | 'later' | 'habit' | 'none';
export type TaskMode = 'home' | 'work';

export const TASK_LIMITS = {
    MAX_TASKS_UNVERIFIED: 20,
} as const;

// Default labels for the app
export const DEFAULT_LABELS: { id: TaskLabel; name: string; color: string }[] = [
    { id: 'urgent', name: 'Urgent', color: '#EF4444' },
    { id: 'important', name: 'Important', color: '#F59E0B' },
    { id: 'errand', name: 'Errand', color: '#3B82F6' },
    { id: 'later', name: 'Later', color: '#9CA3AF' },
    { id: 'habit', name: 'Habit', color: '#10B981' },
    { id: 'none', name: 'No Label', color: '#D1D5DB' },
];

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
    label: TaskLabel; // Keeping for backward compatibility
    labels: TaskLabel[];
    mode: TaskMode;
    tags: string[];
    dueDate: string; // YYYY-MM-DD format
    deadlineDate?: string; // Flag icon (Deadline)
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
    label?: TaskLabel;
    labels?: TaskLabel[];
    mode: TaskMode;
    tags?: string[];
    dueDate?: Date | string;
    deadlineDate?: string;
    startTime?: string;
    isRepeating?: boolean;
    repeatFrequency?: 'daily' | 'weekly' | 'monthly';
    repeatEndDate?: string;
    subtasks?: Subtask[];
    projectId?: string;
}

// Legacy support - map old priority to new label
export type TaskPriority = 'low' | 'medium' | 'high';
export const priorityToLabel = (priority: TaskPriority): TaskLabel => {
    switch (priority) {
        case 'high': return 'urgent';
        case 'medium': return 'important';
        case 'low': return 'later';
        default: return 'none';
    }
};
