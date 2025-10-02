/**
 * TaskFlow Client SDK Types
 * Simplified versions of database schemas for client use
 */
export interface UserProfile {
    userId: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    createdAt: Date;
    lastActiveAt: Date;
    preferences: UserPreferences;
    stats: UserStats;
    isActive: boolean;
    version: number;
}
export interface UserPreferences {
    theme: 'light' | 'dark';
    notifications: boolean;
    timezone: string;
    defaultNotificationTime: number;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
}
export interface UserStats {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
    currentStreak: number;
    longestStreak: number;
    averageCompletionTime: number;
    totalTimeTracked: number;
}
export interface CreateUserData {
    email: string;
    displayName: string;
    photoURL?: string;
    preferences?: Partial<UserPreferences>;
}
export interface UpdateUserData {
    displayName?: string;
    photoURL?: string;
    preferences?: Partial<UserPreferences>;
    lastActiveAt?: Date;
}
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'active' | 'completed' | 'archived';
export interface Task {
    taskId: string;
    title: string;
    description: string;
    completed: boolean;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
    dueDate: Date | null;
    dueTime: string | null;
    hasDeadline: boolean;
    isOverdue: boolean;
    notificationSettings: {
        enabled: boolean;
        times: number[];
        sentNotifications: string[];
        customMessage?: string;
    };
    timeTracking: {
        estimated?: number;
        actual?: number;
        startedAt?: Date;
        pausedAt?: Date;
        totalPaused?: number;
    };
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    archivedAt: Date | null;
    lastSyncedAt: Date;
    version: number;
    isDeleted: boolean;
    userId: string;
}
export interface CreateTaskData {
    title: string;
    description?: string;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date;
    dueTime?: string;
    notificationSettings?: Partial<{
        enabled: boolean;
        times: number[];
        customMessage: string;
    }>;
    estimatedTime?: number;
}
export interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date | null;
    dueTime?: string | null;
    notificationSettings?: Partial<{
        enabled: boolean;
        times: number[];
        customMessage: string;
    }>;
    completed?: boolean;
    status?: TaskStatus;
}
export interface TaskFilters {
    completed?: boolean;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    hasDeadline?: boolean;
    isOverdue?: boolean;
    dueDateRange?: {
        start: Date;
        end: Date;
    };
}
export interface TaskQueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
    orderDirection?: 'asc' | 'desc';
    filters?: TaskFilters;
}
export interface Tag {
    tagId: string;
    name: string;
    displayName: string;
    description?: string;
    color: string;
    icon?: string;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    userId: string;
    analytics: {
        totalTasksCreated: number;
        totalTasksCompleted: number;
        averageCompletionTime: number;
        lastUsedAt: Date | null;
    };
}
export interface CreateTagData {
    name: string;
    displayName?: string;
    description?: string;
    color?: string;
    icon?: string;
}
export interface UpdateTagData {
    displayName?: string;
    description?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
}
export declare const ERROR_CODES: {
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly TASK_NOT_FOUND: "TASK_NOT_FOUND";
    readonly TAG_NOT_FOUND: "TAG_NOT_FOUND";
    readonly DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE";
    readonly RESOURCE_LIMIT_EXCEEDED: "RESOURCE_LIMIT_EXCEEDED";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const SUCCESS_MESSAGES: {
    readonly USER_CREATED: "User created successfully";
    readonly USER_UPDATED: "User profile updated successfully";
    readonly TASK_CREATED: "Task created successfully";
    readonly TASK_UPDATED: "Task updated successfully";
    readonly TASK_COMPLETED: "Task marked as completed";
    readonly TASK_DELETED: "Task deleted successfully";
    readonly TAG_CREATED: "Tag created successfully";
    readonly TAG_UPDATED: "Tag updated successfully";
    readonly TAG_DELETED: "Tag deleted successfully";
};
//# sourceMappingURL=index.d.ts.map