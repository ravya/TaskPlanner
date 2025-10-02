/**
 * TaskFlow Client-Side Task Service
 * Handles task operations with offline support
 */

import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import EventEmitter from 'eventemitter3';

import { Task, CreateTaskData, UpdateTaskData, TaskFilters, TaskQueryOptions, ServiceResult, ERROR_CODES } from '../types';
import { TaskFlowConfig } from '../index';

interface TaskEvents {
  'taskCreated': { taskId: string };
  'taskUpdated': { taskId: string };
  'taskCompleted': { taskId: string };
  'taskDeleted': { taskId: string };
  'error': { error: string; code?: string };
}

export class TaskService extends EventEmitter<TaskEvents> {
  private firestore: Firestore;
  private config: TaskFlowConfig;

  constructor(firestore: Firestore, config: TaskFlowConfig) {
    super();
    this.firestore = firestore;
    this.config = config;
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: CreateTaskData): Promise<ServiceResult<Task>> {
    try {
      this.log('info', 'Creating task for user:', userId);
      
      // Generate task data
      const now = new Date();
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const task: Task = {
        taskId,
        title: taskData.title,
        description: taskData.description || '',
        completed: false,
        status: 'active',
        priority: taskData.priority || 'medium',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate ? new Date(taskData.dueDate as any) as any : null,
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
        createdAt: now as any,
        updatedAt: now as any,
        completedAt: null,
        archivedAt: null,
        lastSyncedAt: now as any,
        version: 1,
        isDeleted: false,
        userId,
      };
      
      // Save to Firestore
      const taskRef = doc(collection(this.firestore, `users/${userId}/tasks`), taskId);
      await updateDoc(taskRef, task as any);
      
      this.log('info', 'Task created successfully:', taskId);
      this.emit('taskCreated', { taskId });
      
      return {
        success: true,
        data: task,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to create task:', error);
      
      this.emit('error', { error: 'Failed to create task', code: ERROR_CODES.DATABASE_ERROR });
      
      return {
        success: false,
        error: 'Failed to create task',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Get user tasks with filtering
   */
  async getUserTasks(userId: string, options: TaskQueryOptions = {}): Promise<ServiceResult<Task[]>> {
    try {
      this.log('info', 'Getting tasks for user:', userId);
      
      let tasksQuery = query(
        collection(this.firestore, `users/${userId}/tasks`),
        where('isDeleted', '==', false)
      );
      
      // Apply filters
      if (options.filters) {
        const filters = options.filters;
        
        if (filters.completed !== undefined) {
          tasksQuery = query(tasksQuery, where('completed', '==', filters.completed));
        }
        
        if (filters.status) {
          tasksQuery = query(tasksQuery, where('status', '==', filters.status));
        }
        
        if (filters.priority) {
          tasksQuery = query(tasksQuery, where('priority', '==', filters.priority));
        }
        
        if (filters.hasDeadline !== undefined) {
          tasksQuery = query(tasksQuery, where('hasDeadline', '==', filters.hasDeadline));
        }
        
        if (filters.isOverdue !== undefined) {
          tasksQuery = query(tasksQuery, where('isOverdue', '==', filters.isOverdue));
        }
        
        if (filters.tags && filters.tags.length > 0) {
          tasksQuery = query(tasksQuery, where('tags', 'array-contains-any', filters.tags));
        }
      }
      
      // Apply ordering
      const orderByField = options.orderBy || 'createdAt';
      const orderDirection = options.orderDirection || 'desc';
      tasksQuery = query(tasksQuery, orderBy(orderByField, orderDirection));
      
      // Apply limit
      const queryLimit = Math.min(options.limit || 20, 100);
      tasksQuery = query(tasksQuery, limit(queryLimit));
      
      // Execute query
      const snapshot = await getDocs(tasksQuery);
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      
      return {
        success: true,
        data: tasks,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to get tasks:', error);
      
      return {
        success: false,
        error: 'Failed to retrieve tasks',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Update a task
   */
  async updateTask(userId: string, taskId: string, updateData: UpdateTaskData): Promise<ServiceResult<Task>> {
    try {
      this.log('info', 'Updating task:', taskId);
      
      const taskRef = doc(this.firestore, `users/${userId}/tasks`, taskId);
      
      // Prepare update data
      const updatePayload: any = {
        ...updateData,
        updatedAt: new Date(),
      };
      
      // Handle completion status change
      if (updateData.completed !== undefined) {
        if (updateData.completed) {
          updatePayload.completedAt = new Date();
          updatePayload.status = 'completed';
        } else {
          updatePayload.completedAt = null;
          updatePayload.status = 'active';
        }
      }
      
      // Update in Firestore
      await updateDoc(taskRef, updatePayload);
      
      // Get updated task
      const updatedTaskDoc = await getDoc(taskRef);
      const updatedTask = updatedTaskDoc.data() as Task;
      
      this.log('info', 'Task updated successfully');
      this.emit('taskUpdated', { taskId });
      
      if (updateData.completed) {
        this.emit('taskCompleted', { taskId });
      }
      
      return {
        success: true,
        data: updatedTask,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to update task:', error);
      
      this.emit('error', { error: 'Failed to update task', code: ERROR_CODES.DATABASE_ERROR });
      
      return {
        success: false,
        error: 'Failed to update task',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(userId: string, taskId: string): Promise<ServiceResult<void>> {
    try {
      this.log('info', 'Deleting task:', taskId);
      
      const taskRef = doc(this.firestore, `users/${userId}/tasks`, taskId);
      
      // Soft delete by marking as deleted
      await updateDoc(taskRef, {
        isDeleted: true,
        updatedAt: new Date(),
      });
      
      this.log('info', 'Task deleted successfully');
      this.emit('taskDeleted', { taskId });
      
      return {
        success: true,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to delete task:', error);
      
      this.emit('error', { error: 'Failed to delete task', code: ERROR_CODES.DATABASE_ERROR });
      
      return {
        success: false,
        error: 'Failed to delete task',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Complete a task
   */
  async completeTask(userId: string, taskId: string): Promise<ServiceResult<Task>> {
    return this.updateTask(userId, taskId, { completed: true });
  }

  /**
   * Get a specific task
   */
  async getTask(userId: string, taskId: string): Promise<ServiceResult<Task>> {
    try {
      const taskRef = doc(this.firestore, `users/${userId}/tasks`, taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        return {
          success: false,
          error: 'Task not found',
          code: ERROR_CODES.TASK_NOT_FOUND,
        };
      }
      
      const task = taskDoc.data() as Task;
      
      if (task.isDeleted) {
        return {
          success: false,
          error: 'Task not found',
          code: ERROR_CODES.TASK_NOT_FOUND,
        };
      }
      
      return {
        success: true,
        data: task,
      };
      
    } catch (error: any) {
      this.log('error', 'Failed to get task:', error);
      
      return {
        success: false,
        error: 'Failed to retrieve task',
        code: ERROR_CODES.DATABASE_ERROR,
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: TaskFlowConfig): void {
    this.config = config;
  }

  /**
   * Private helper methods
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (this.config.logLevel === 'debug' || 
        (this.config.logLevel === 'info' && level !== 'debug') ||
        (this.config.logLevel === 'warn' && (level === 'warn' || level === 'error')) ||
        (this.config.logLevel === 'error' && level === 'error')) {
      console[level](`[TaskFlow Tasks] ${message}`, ...args);
    }
  }
}