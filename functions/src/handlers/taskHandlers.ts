/**
 * TaskFlow Task Management HTTP Handlers
 * Express routes for task CRUD operations and management
 */

import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { TaskService } from '../services/taskService';
import { TagService } from '../services/tagService';
import { NotificationService } from '../services/notificationService';
import { authenticateUser } from './authHandlers';
import { CreateTaskData, UpdateTaskData, TaskQueryOptions, CreateTagData, UpdateTagData, ERROR_CODES } from '../types';

export const taskHandlers = Router();

// Initialize services
const taskService = new TaskService();
const tagService = new TagService();
const notificationService = new NotificationService();

// Apply authentication middleware to all task routes
taskHandlers.use(authenticateUser);

// =============================================================================
// TASK ROUTES
// =============================================================================

/**
 * GET /tasks
 * Get user tasks with filtering
 */
taskHandlers.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    console.log('📋 Getting tasks for user:', userId);
    
    // Parse basic query parameters
    const options: TaskQueryOptions = {};
    
    if (req.query.status) {
      options.status = req.query.status as any;
    }
    if (req.query.priority) {
      options.priority = req.query.priority as any;
    }
    
    const result = await taskService.getUserTasks(userId, options);
    
    if (!result.success) {
      res.status(500).json(result);
      return;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * POST /tasks
 * Create a new task
 */
taskHandlers.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const taskData: CreateTaskData = req.body;
    
    console.log('📝 Creating task for user:', userId);
    
    // Convert date string to Date if provided
    if (taskData.dueDate) {
      taskData.dueDate = new Date(taskData.dueDate as any);
    }
    
    const result = await taskService.createTask(userId, taskData);
    
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    
    // Schedule notifications if the task has a deadline
    if (result.data!.dueDate) {
      await notificationService.scheduleTaskNotifications(result.data!);
    }
    
    console.log('✅ Task created successfully:', result.data!.id);
    res.status(201).json(result);
    
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * PUT /tasks/:taskId
 * Update a task
 */
taskHandlers.put('/:taskId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const { taskId } = req.params;
    const updateData: UpdateTaskData = req.body;
    
    console.log('✏️ Updating task:', taskId);
    
    // Convert date string to Date if provided
    if (updateData.dueDate !== undefined && updateData.dueDate !== null) {
      updateData.dueDate = new Date(updateData.dueDate as any);
    }
    
    const result = await taskService.updateTask(userId, taskId, updateData);
    
    if (!result.success) {
      const statusCode = result.error === ERROR_CODES.TASK_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json(result);
      return;
    }
    
    // Update notifications if deadline changed
    if (updateData.dueDate !== undefined) {
      await notificationService.cancelTaskNotifications(userId, taskId);
      if (result.data!.dueDate) {
        await notificationService.scheduleTaskNotifications(result.data!);
      }
    }
    
    console.log('✅ Task updated successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * DELETE /tasks/:taskId
 * Delete a task
 */
taskHandlers.delete('/:taskId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const { taskId } = req.params;
    
    console.log('🗑️ Deleting task:', taskId);
    
    const result = await taskService.deleteTask(userId, taskId);
    
    if (!result.success) {
      const statusCode = result.error === ERROR_CODES.TASK_NOT_FOUND ? 404 : 500;
      res.status(statusCode).json(result);
      return;
    }
    
    // Cancel any pending notifications
    await notificationService.cancelTaskNotifications(userId, taskId);
    
    console.log('✅ Task deleted successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

// =============================================================================
// TAG ROUTES
// =============================================================================

/**
 * GET /tasks/tags
 * Get all user tags
 */
taskHandlers.get('/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    
    console.log('🏷️ Getting tags for user:', userId);
    
    const result = await tagService.getUserTags(userId);
    
    if (!result.success) {
      res.status(500).json(result);
      return;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Get tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * POST /tasks/tags
 * Create a new tag
 */
taskHandlers.post('/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const tagData: CreateTagData = req.body;
    
    console.log('🏷️ Creating tag for user:', userId);
    
    const result = await tagService.createTag(userId, tagData);
    
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    
    console.log('✅ Tag created successfully:', result.data!.id);
    res.status(201).json(result);
    
  } catch (error) {
    console.error('❌ Create tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * PUT /tasks/tags/:tagId
 * Update a tag
 */
taskHandlers.put('/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const { tagId } = req.params;
    const updateData: UpdateTagData = req.body;
    
    console.log('✏️ Updating tag:', tagId);
    
    const result = await tagService.updateTag(userId, tagId, updateData);
    
    if (!result.success) {
      const statusCode = result.error === ERROR_CODES.TAG_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json(result);
      return;
    }
    
    console.log('✅ Tag updated successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Update tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * DELETE /tasks/tags/:tagId
 * Delete a tag
 */
taskHandlers.delete('/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const { tagId } = req.params;
    
    console.log('🗑️ Deleting tag:', tagId);
    
    const result = await tagService.deleteTag(userId, tagId);
    
    if (!result.success) {
      const statusCode = result.error === ERROR_CODES.TAG_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json(result);
      return;
    }
    
    console.log('✅ Tag deleted successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Delete tag error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * POST /tasks/notifications/register-token
 * Register device token for push notifications
 */
taskHandlers.post('/notifications/register-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.uid;
    const { token, deviceType } = req.body;
    
    if (!token || !deviceType) {
      res.status(400).json({
        success: false,
        error: 'Token and deviceType are required',
        code: ERROR_CODES.MISSING_REQUIRED_FIELD,
      });
      return;
    }
    
    console.log('📱 Registering device token for user:', userId);
    
    const result = await notificationService.registerDeviceToken(userId, token, deviceType);
    
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    
    console.log('✅ Device token registered successfully');
    res.json(result);
    
  } catch (error) {
    console.error('❌ Register token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }
});

/**
 * Error handling middleware for task routes
 */
taskHandlers.use((error: any, req: Request, res: Response, next: any) => {
  console.error('❌ Task handler error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    error: 'Task service error',
    code: ERROR_CODES.INTERNAL_ERROR,
  });
});