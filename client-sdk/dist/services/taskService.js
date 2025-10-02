"use strict";
/**
 * TaskFlow Client-Side Task Service
 * Handles task operations with offline support
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const firestore_1 = require("firebase/firestore");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const types_1 = require("../types");
class TaskService extends eventemitter3_1.default {
    constructor(firestore, config) {
        super();
        this.firestore = firestore;
        this.config = config;
    }
    /**
     * Create a new task
     */
    async createTask(userId, taskData) {
        try {
            this.log('info', 'Creating task for user:', userId);
            // Generate task data
            const now = new Date();
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const task = {
                taskId,
                title: taskData.title,
                description: taskData.description || '',
                completed: false,
                status: 'active',
                priority: taskData.priority || 'medium',
                tags: taskData.tags || [],
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                dueTime: taskData.dueTime || null,
                hasDeadline: !!taskData.dueDate,
                isOverdue: false,
                notificationSettings: {
                    enabled: true,
                    times: [60], // Default 1 hour reminder
                    sentNotifications: [],
                    ...taskData.notificationSettings,
                },
                timeTracking: {
                    estimated: taskData.estimatedTime,
                    actual: undefined,
                    totalPaused: 0,
                },
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                archivedAt: null,
                lastSyncedAt: now,
                version: 1,
                isDeleted: false,
                userId,
            };
            // Save to Firestore
            const taskRef = (0, firestore_1.doc)((0, firestore_1.collection)(this.firestore, `users/${userId}/tasks`), taskId);
            await (0, firestore_1.updateDoc)(taskRef, task);
            this.log('info', 'Task created successfully:', taskId);
            this.emit('taskCreated', { taskId });
            return {
                success: true,
                data: task,
            };
        }
        catch (error) {
            this.log('error', 'Failed to create task:', error);
            this.emit('error', { error: 'Failed to create task', code: types_1.ERROR_CODES.DATABASE_ERROR });
            return {
                success: false,
                error: 'Failed to create task',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Get user tasks with filtering
     */
    async getUserTasks(userId, options = {}) {
        try {
            this.log('info', 'Getting tasks for user:', userId);
            let tasksQuery = (0, firestore_1.query)((0, firestore_1.collection)(this.firestore, `users/${userId}/tasks`), (0, firestore_1.where)('isDeleted', '==', false));
            // Apply filters
            if (options.filters) {
                const filters = options.filters;
                if (filters.completed !== undefined) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('completed', '==', filters.completed));
                }
                if (filters.status) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('status', '==', filters.status));
                }
                if (filters.priority) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('priority', '==', filters.priority));
                }
                if (filters.hasDeadline !== undefined) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('hasDeadline', '==', filters.hasDeadline));
                }
                if (filters.isOverdue !== undefined) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('isOverdue', '==', filters.isOverdue));
                }
                if (filters.tags && filters.tags.length > 0) {
                    tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.where)('tags', 'array-contains-any', filters.tags));
                }
            }
            // Apply ordering
            const orderByField = options.orderBy || 'createdAt';
            const orderDirection = options.orderDirection || 'desc';
            tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.orderBy)(orderByField, orderDirection));
            // Apply limit
            const queryLimit = Math.min(options.limit || 20, 100);
            tasksQuery = (0, firestore_1.query)(tasksQuery, (0, firestore_1.limit)(queryLimit));
            // Execute query
            const snapshot = await (0, firestore_1.getDocs)(tasksQuery);
            const tasks = snapshot.docs.map(doc => doc.data());
            return {
                success: true,
                data: tasks,
            };
        }
        catch (error) {
            this.log('error', 'Failed to get tasks:', error);
            return {
                success: false,
                error: 'Failed to retrieve tasks',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Update a task
     */
    async updateTask(userId, taskId, updateData) {
        try {
            this.log('info', 'Updating task:', taskId);
            const taskRef = (0, firestore_1.doc)(this.firestore, `users/${userId}/tasks`, taskId);
            // Prepare update data
            const updatePayload = {
                ...updateData,
                updatedAt: new Date(),
            };
            // Handle completion status change
            if (updateData.completed !== undefined) {
                if (updateData.completed) {
                    updatePayload.completedAt = new Date();
                    updatePayload.status = 'completed';
                }
                else {
                    updatePayload.completedAt = null;
                    updatePayload.status = 'active';
                }
            }
            // Update in Firestore
            await (0, firestore_1.updateDoc)(taskRef, updatePayload);
            // Get updated task
            const updatedTaskDoc = await (0, firestore_1.getDoc)(taskRef);
            const updatedTask = updatedTaskDoc.data();
            this.log('info', 'Task updated successfully');
            this.emit('taskUpdated', { taskId });
            if (updateData.completed) {
                this.emit('taskCompleted', { taskId });
            }
            return {
                success: true,
                data: updatedTask,
            };
        }
        catch (error) {
            this.log('error', 'Failed to update task:', error);
            this.emit('error', { error: 'Failed to update task', code: types_1.ERROR_CODES.DATABASE_ERROR });
            return {
                success: false,
                error: 'Failed to update task',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Delete a task (soft delete)
     */
    async deleteTask(userId, taskId) {
        try {
            this.log('info', 'Deleting task:', taskId);
            const taskRef = (0, firestore_1.doc)(this.firestore, `users/${userId}/tasks`, taskId);
            // Soft delete by marking as deleted
            await (0, firestore_1.updateDoc)(taskRef, {
                isDeleted: true,
                updatedAt: new Date(),
            });
            this.log('info', 'Task deleted successfully');
            this.emit('taskDeleted', { taskId });
            return {
                success: true,
            };
        }
        catch (error) {
            this.log('error', 'Failed to delete task:', error);
            this.emit('error', { error: 'Failed to delete task', code: types_1.ERROR_CODES.DATABASE_ERROR });
            return {
                success: false,
                error: 'Failed to delete task',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Complete a task
     */
    async completeTask(userId, taskId) {
        return this.updateTask(userId, taskId, { completed: true });
    }
    /**
     * Get a specific task
     */
    async getTask(userId, taskId) {
        try {
            const taskRef = (0, firestore_1.doc)(this.firestore, `users/${userId}/tasks`, taskId);
            const taskDoc = await (0, firestore_1.getDoc)(taskRef);
            if (!taskDoc.exists()) {
                return {
                    success: false,
                    error: 'Task not found',
                    code: types_1.ERROR_CODES.TASK_NOT_FOUND,
                };
            }
            const task = taskDoc.data();
            if (task.isDeleted) {
                return {
                    success: false,
                    error: 'Task not found',
                    code: types_1.ERROR_CODES.TASK_NOT_FOUND,
                };
            }
            return {
                success: true,
                data: task,
            };
        }
        catch (error) {
            this.log('error', 'Failed to get task:', error);
            return {
                success: false,
                error: 'Failed to retrieve task',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = config;
    }
    /**
     * Private helper methods
     */
    log(level, message, ...args) {
        if (this.config.logLevel === 'debug' ||
            (this.config.logLevel === 'info' && level !== 'debug') ||
            (this.config.logLevel === 'warn' && (level === 'warn' || level === 'error')) ||
            (this.config.logLevel === 'error' && level === 'error')) {
            console[level](`[TaskFlow Tasks] ${message}`, ...args);
        }
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=taskService.js.map