/**
 * TaskHandlers Unit Tests
 * Testing HTTP endpoints for task management API
 */

import request from 'supertest';
import express from 'express';

// Create mock service implementations before importing handlers
const mockTaskService = {
  createTask: jest.fn(),
  getUserTasks: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn()
};

const mockTagService = {
  getUserTags: jest.fn(),
  createTag: jest.fn(),
  updateTag: jest.fn(),
  deleteTag: jest.fn()
};

const mockNotificationService = {
  scheduleTaskNotifications: jest.fn(),
  cancelTaskNotifications: jest.fn(),
  registerDeviceToken: jest.fn(),
  processScheduledNotifications: jest.fn()
};

// Mock the service classes to return our mock objects
jest.mock('../../services/taskService', () => ({
  TaskService: jest.fn().mockImplementation(() => mockTaskService)
}));

jest.mock('../../services/tagService', () => ({
  TagService: jest.fn().mockImplementation(() => mockTagService)
}));

jest.mock('../../services/notificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => mockNotificationService)
}));

// Mock authentication handler
jest.mock('../../handlers/authHandlers', () => ({
  authenticateUser: jest.fn()
}));

// Now import handlers after mocks are set up
import { taskHandlers } from '../../handlers/taskHandlers';
import { TaskService } from '../../services/taskService';
import { TagService } from '../../services/tagService';
import { NotificationService } from '../../services/notificationService';
import {
  TaskTestDataGenerator,
  TagTestDataGenerator,
  createMockRequest,
  createMockResponse,
  assertHttpResponse
} from '../helpers/testHelpers';
import { mockAuth, resetAllMocks } from '../mocks/firebase.mock';

describe('TaskHandlers', () => {
  let app: express.Application;

  const testUserId = 'test-user-123';

  beforeEach(() => {
    resetAllMocks();
    
    // Setup authentication mock
    const { authenticateUser } = require('../../handlers/authHandlers');
    authenticateUser.mockImplementation((req: any, res: any, next: any) => {
      req.user = { uid: testUserId };
      next();
    });
    
    // Configure TaskService mock responses
    mockTaskService.createTask.mockResolvedValue({
      success: true,
      data: TaskTestDataGenerator.generateTask({ id: 'new-task-id', userId: testUserId })
    });
    
    mockTaskService.getUserTasks.mockResolvedValue({
      success: true,
      data: TaskTestDataGenerator.generateMultipleTasks(3, { userId: testUserId })
    });
    
    mockTaskService.updateTask.mockResolvedValue({
      success: true,
      data: TaskTestDataGenerator.generateTask({ id: 'updated-task-id', userId: testUserId })
    });
    
    mockTaskService.deleteTask.mockResolvedValue({
      success: true,
      data: undefined
    });

    // Configure TagService mock responses
    mockTagService.getUserTags.mockResolvedValue({
      success: true,
      data: [{
        id: 'tag-1',
        name: 'work',
        color: '#blue',
        userId: testUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    });
    
    mockTagService.createTag.mockResolvedValue({
      success: true,
      data: {
        id: 'new-tag-id',
        userId: testUserId,
        name: 'test-tag',
        color: '#FF0000',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    mockTagService.updateTag.mockResolvedValue({
      success: true,
      data: {
        id: 'tag-id',
        userId: testUserId,
        name: 'updated-tag',
        color: '#00FF00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    mockTagService.deleteTag.mockResolvedValue({
      success: true,
      data: undefined
    });

    // Configure NotificationService mock responses
    mockNotificationService.scheduleTaskNotifications.mockResolvedValue({
      success: true,
      data: undefined
    });
    
    mockNotificationService.cancelTaskNotifications.mockResolvedValue({
      success: true,
      data: undefined
    });
    
    mockNotificationService.registerDeviceToken.mockResolvedValue({
      success: true,
      data: undefined
    });
    
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/tasks', taskHandlers);
  });

  describe('Authentication Middleware', () => {
    it('should require authentication for all task routes', async () => {
      // Mock authentication failure
      const { authenticateUser } = require('../../handlers/authHandlers');
      authenticateUser.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app).get('/tasks');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /tasks', () => {
    it('should get user tasks successfully', async () => {
      const response = await request(app).get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(mockTaskService.getUserTasks).toHaveBeenCalledWith(testUserId, {});
    });

    it('should pass query parameters as filters', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ status: 'completed', priority: 'high' });

      expect(response.status).toBe(200);
      expect(mockTaskService.getUserTasks).toHaveBeenCalledWith(testUserId, {
        status: 'completed',
        priority: 'high'
      });
    });

    it('should handle service errors gracefully', async () => {
      mockTaskService.getUserTasks.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const response = await request(app).get('/tasks');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle service exceptions', async () => {
      mockTaskService.getUserTasks.mockRejectedValue(new Error('Service crashed'));

      const response = await request(app).get('/tasks');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /tasks', () => {
    it('should create a task successfully', async () => {
      const taskData = TaskTestDataGenerator.generateCreateTaskData({
        title: 'New Test Task',
        priority: 'high'
      });

      const response = await request(app)
        .post('/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(mockTaskService.createTask).toHaveBeenCalledWith(testUserId, taskData);
    });

    it('should convert date strings to Date objects', async () => {
      const taskData = {
        title: 'Task with Due Date',
        dueDate: '2024-12-31T10:00:00Z'
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      
      const callArgs = mockTaskService.createTask.mock.calls[0];
      expect(callArgs[1].dueDate).toBeInstanceOf(Date);
      expect(callArgs[1].dueDate!.toISOString()).toBe('2024-12-31T10:00:00.000Z');
    });

    it('should schedule notifications for tasks with due dates', async () => {
      const taskWithDueDate = TaskTestDataGenerator.generateTask({
        dueDate: new Date('2024-12-31T10:00:00Z')
      });
      
      mockTaskService.createTask.mockResolvedValue({
        success: true,
        data: taskWithDueDate
      });

      const taskData = {
        title: 'Task with Due Date',
        dueDate: '2024-12-31T10:00:00Z'
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(mockNotificationService.scheduleTaskNotifications).toHaveBeenCalledWith(taskWithDueDate);
    });

    it('should not schedule notifications for tasks without due dates', async () => {
      const taskWithoutDueDate = TaskTestDataGenerator.generateTask({ dueDate: null });
      
      mockTaskService.createTask.mockResolvedValue({
        success: true,
        data: taskWithoutDueDate
      });

      const taskData = { title: 'Task without Due Date' };

      const response = await request(app)
        .post('/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(mockNotificationService.scheduleTaskNotifications).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockTaskService.createTask.mockResolvedValue({
        success: false,
        error: 'Missing required field: title'
      });

      const response = await request(app)
        .post('/tasks')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle service exceptions during creation', async () => {
      mockTaskService.createTask.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /tasks/:taskId', () => {
    const taskId = 'task-to-update';

    it('should update a task successfully', async () => {
      const updateData = { title: 'Updated Task Title', status: 'completed' };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(testUserId, taskId, updateData);
    });

    it('should convert date strings in updates', async () => {
      const updateData = {
        title: 'Updated Task',
        dueDate: '2024-12-31T10:00:00Z'
      };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      
      const callArgs = mockTaskService.updateTask.mock.calls[0];
      expect(callArgs[2].dueDate).toBeInstanceOf(Date);
    });

    it('should handle null due date updates', async () => {
      const updateData = {
        title: 'Updated Task',
        dueDate: null
      };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      
      const callArgs = mockTaskService.updateTask.mock.calls[0];
      expect(callArgs[2].dueDate).toBeNull();
    });

    it('should update notifications when deadline changes', async () => {
      const updatedTask = TaskTestDataGenerator.generateTask({
        id: taskId,
        dueDate: new Date('2024-12-31T10:00:00Z')
      });
      
      mockTaskService.updateTask.mockResolvedValue({
        success: true,
        data: updatedTask
      });

      const updateData = { dueDate: '2024-12-31T10:00:00Z' };

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(mockNotificationService.cancelTaskNotifications).toHaveBeenCalledWith(testUserId, taskId);
      expect(mockNotificationService.scheduleTaskNotifications).toHaveBeenCalledWith(updatedTask);
    });

    it('should handle task not found error', async () => {
      mockTaskService.updateTask.mockResolvedValue({
        success: false,
        error: 'TASK_NOT_FOUND'
      });

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle other validation errors', async () => {
      mockTaskService.updateTask.mockResolvedValue({
        success: false,
        error: 'Invalid status value'
      });

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service exceptions during update', async () => {
      mockTaskService.updateTask.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put(`/tasks/${taskId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('DELETE /tasks/:taskId', () => {
    const taskId = 'task-to-delete';

    it('should delete a task successfully', async () => {
      const response = await request(app).delete(`/tasks/${taskId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(testUserId, taskId);
      expect(mockNotificationService.cancelTaskNotifications).toHaveBeenCalledWith(testUserId, taskId);
    });

    it('should handle task not found error', async () => {
      mockTaskService.deleteTask.mockResolvedValue({
        success: false,
        error: 'TASK_NOT_FOUND'
      });

      const response = await request(app).delete(`/tasks/${taskId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle service exceptions during deletion', async () => {
      mockTaskService.deleteTask.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app).delete(`/tasks/${taskId}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Tag Routes', () => {
    describe('GET /tasks/tags', () => {
      it('should get user tags successfully', async () => {
        const response = await request(app).get('/tasks/tags');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(mockTagService.getUserTags).toHaveBeenCalledWith(testUserId);
      });

      it('should handle service errors', async () => {
        mockTagService.getUserTags.mockResolvedValue({
          success: false,
          error: 'Database error'
        });

        const response = await request(app).get('/tasks/tags');

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /tasks/tags', () => {
      it('should create a tag successfully', async () => {
        const tagData = TagTestDataGenerator.generateCreateTagData({
          name: 'new-tag',
          color: '#FF0000'
        });

        mockTagService.createTag.mockResolvedValue({
          success: true,
          data: {
            id: 'new-tag-id',
            userId: testUserId,
            name: tagData.name,
            color: tagData.color || '#FF0000',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await request(app)
          .post('/tasks/tags')
          .send(tagData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mockTagService.createTag).toHaveBeenCalledWith(testUserId, tagData);
      });

      it('should handle tag creation errors', async () => {
        mockTagService.createTag.mockResolvedValue({
          success: false,
          error: 'Tag name already exists'
        });

        const response = await request(app)
          .post('/tasks/tags')
          .send({ name: 'existing-tag' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Notification Routes', () => {
    describe('POST /tasks/notifications/register-token', () => {
      it('should register device token successfully', async () => {
        mockNotificationService.registerDeviceToken.mockResolvedValue({
          success: true,
          data: undefined
        });

        const tokenData = {
          token: 'device-token-123',
          deviceType: 'ios'
        };

        const response = await request(app)
          .post('/tasks/notifications/register-token')
          .send(tokenData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockNotificationService.registerDeviceToken).toHaveBeenCalledWith(
          testUserId, 
          'device-token-123', 
          'ios'
        );
      });

      it('should require token and deviceType', async () => {
        const response = await request(app)
          .post('/tasks/notifications/register-token')
          .send({ token: 'token-only' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Token and deviceType are required');
      });

      it('should handle registration errors', async () => {
        mockNotificationService.registerDeviceToken.mockResolvedValue({
          success: false,
          error: 'Invalid token'
        });

        const tokenData = {
          token: 'invalid-token',
          deviceType: 'android'
        };

        const response = await request(app)
          .post('/tasks/notifications/register-token')
          .send(tokenData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Error Handling Middleware', () => {
    it('should catch and handle middleware errors', async () => {
      // Mock the service method to throw an error
      mockTaskService.getUserTasks.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app).get('/tasks');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});