/**
 * TaskFlow Client-Side Task Service
 * Handles task operations with offline support
 */
import { Firestore } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';
import { Task, CreateTaskData, UpdateTaskData, TaskQueryOptions, ServiceResult } from '../types';
import { TaskFlowConfig } from '../index';
interface TaskEvents {
    'taskCreated': {
        taskId: string;
    };
    'taskUpdated': {
        taskId: string;
    };
    'taskCompleted': {
        taskId: string;
    };
    'taskDeleted': {
        taskId: string;
    };
    'error': {
        error: string;
        code?: string;
    };
}
export declare class TaskService extends EventEmitter<TaskEvents> {
    private firestore;
    private config;
    constructor(firestore: Firestore, config: TaskFlowConfig);
    /**
     * Create a new task
     */
    createTask(userId: string, taskData: CreateTaskData): Promise<ServiceResult<Task>>;
    /**
     * Get user tasks with filtering
     */
    getUserTasks(userId: string, options?: TaskQueryOptions): Promise<ServiceResult<Task[]>>;
    /**
     * Update a task
     */
    updateTask(userId: string, taskId: string, updateData: UpdateTaskData): Promise<ServiceResult<Task>>;
    /**
     * Delete a task (soft delete)
     */
    deleteTask(userId: string, taskId: string): Promise<ServiceResult<void>>;
    /**
     * Complete a task
     */
    completeTask(userId: string, taskId: string): Promise<ServiceResult<Task>>;
    /**
     * Get a specific task
     */
    getTask(userId: string, taskId: string): Promise<ServiceResult<Task>>;
    /**
     * Update configuration
     */
    updateConfig(config: TaskFlowConfig): void;
    /**
     * Private helper methods
     */
    private log;
}
export {};
//# sourceMappingURL=taskService.d.ts.map