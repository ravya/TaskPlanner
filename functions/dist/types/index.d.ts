/**
 * TaskFlow Functions Types - Simplified
 * All type definitions needed for Cloud Functions
 */
export interface UserProfile {
    userId: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserData {
    email: string;
    displayName: string;
    photoURL?: string;
}
export interface UpdateUserData {
    displayName?: string;
    photoURL?: string;
}
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
    id: string;
    userId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    tags: string[];
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
}
export interface CreateTaskData {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date;
}
export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date | null;
}
export interface TaskQueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
    orderDirection?: 'asc' | 'desc';
    status?: TaskStatus;
    priority?: TaskPriority;
}
export interface Tag {
    id: string;
    userId: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTagData {
    name: string;
    color?: string;
}
export interface UpdateTagData {
    name?: string;
    color?: string;
}
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
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
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
};
//# sourceMappingURL=index.d.ts.map