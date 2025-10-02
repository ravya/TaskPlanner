/**
 * TaskService Unit Tests
 * Comprehensive testing of task CRUD operations and business logic
 */

// Import Firebase mocks before everything else
import '../mocks/firebase.mock';

import { TaskService } from '../../services/taskService';
import { Task, CreateTaskData, UpdateTaskData, TaskQueryOptions } from '../../types';
import {
  TaskTestDataGenerator,
  createMockDocumentSnapshot,
  createMockQuerySnapshot,
  createMockDocumentReference,
  assertTaskShape,
  assertServiceResult,
  createOverdueDate,
  createFutureDate
} from '../helpers/testHelpers';
import { mockFirestore, resetAllMocks, mockFirestoreSuccess, mockFirestoreError } from '../mocks/firebase.mock';

// Import the actual module to spy on it
jest.mock('firebase-admin');

describe('TaskService', () => {
  let taskService: TaskService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    resetAllMocks();
    taskService = new TaskService();
    mockFirestoreSuccess();
  });

  describe('createTask', () => {
    it('should create a task with valid data', async () => {
      const taskData: CreateTaskData = TaskTestDataGenerator.generateCreateTaskData({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high'
      });

      const mockDocRef = createMockDocumentReference('new-task-id');
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, true);
      expect(result.data).toBeDefined();
      assertTaskShape(result.data);
      expect(result.data!.title).toBe(taskData.title);
      expect(result.data!.description).toBe(taskData.description);
      expect(result.data!.priority).toBe(taskData.priority);
      expect(result.data!.userId).toBe(mockUserId);
      expect(result.data!.status).toBe(taskData.status || 'todo');
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it('should create a task with minimal required data', async () => {
      const taskData: CreateTaskData = {
        title: 'Minimal Task'
      };

      const mockDocRef = createMockDocumentReference();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, true);
      expect(result.data!.title).toBe('Minimal Task');
      expect(result.data!.description).toBe('');
      expect(result.data!.status).toBe('todo');
      expect(result.data!.priority).toBe('medium');
      expect(result.data!.tags).toEqual([]);
      expect(result.data!.dueDate).toBeNull();
    });

    it('should handle due date conversion', async () => {
      const dueDate = createFutureDate();
      const taskData: CreateTaskData = {
        title: 'Task with Due Date',
        dueDate
      };

      const mockDocRef = createMockDocumentReference();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, true);
      expect(result.data!.dueDate).toEqual(dueDate);
    });

    it('should handle Firestore errors gracefully', async () => {
      const taskData: CreateTaskData = { title: 'Test Task' };
      mockFirestoreError('permission-denied');

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const taskData = {} as CreateTaskData;

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserTasks', () => {
    it('should retrieve user tasks without filters', async () => {
      const mockTasks = TaskTestDataGenerator.generateMultipleTasks(3, { userId: mockUserId });
      const mockSnapshot = createMockQuerySnapshot(mockTasks);

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      });

      const result = await taskService.getUserTasks(mockUserId);

      assertServiceResult(result, true);
      expect(result.data).toHaveLength(3);
      result.data!.forEach(task => {
        assertTaskShape(task);
        expect(task.userId).toBe(mockUserId);
      });
    });

    it('should filter tasks by status', async () => {
      const mockTasks = TaskTestDataGenerator.generateMultipleTasks(2, { 
        userId: mockUserId,
        status: 'completed'
      });
      const mockSnapshot = createMockQuerySnapshot(mockTasks);

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const options: TaskQueryOptions = { status: 'completed' };
      const result = await taskService.getUserTasks(mockUserId, options);

      assertServiceResult(result, true);
      expect(mockQuery.where).toHaveBeenCalledWith('userId', '==', mockUserId);
      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'completed');
    });

    it('should filter tasks by priority', async () => {
      const mockTasks = TaskTestDataGenerator.generateMultipleTasks(2, { 
        userId: mockUserId,
        priority: 'high'
      });
      const mockSnapshot = createMockQuerySnapshot(mockTasks);

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const options: TaskQueryOptions = { priority: 'high' };
      const result = await taskService.getUserTasks(mockUserId, options);

      assertServiceResult(result, true);
      expect(mockQuery.where).toHaveBeenCalledWith('priority', '==', 'high');
    });

    it('should return empty array when no tasks found', async () => {
      const mockSnapshot = createMockQuerySnapshot([]);
      
      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      });

      const result = await taskService.getUserTasks(mockUserId);

      assertServiceResult(result, true);
      expect(result.data).toEqual([]);
    });

    it('should handle Firestore query errors', async () => {
      mockFirestoreError('unavailable');

      const result = await taskService.getUserTasks(mockUserId);

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateTask', () => {
    const taskId = 'existing-task-id';

    it('should update task with valid data', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId,
        title: 'Original Title'
      });
      const updateData: UpdateTaskData = { 
        title: 'Updated Title',
        status: 'completed'
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, taskId, updateData);

      assertServiceResult(result, true);
      expect(result.data!.title).toBe('Updated Title');
      expect(result.data!.status).toBe('completed');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId 
      });
      const updateData: UpdateTaskData = { priority: 'high' };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, taskId, updateData);

      assertServiceResult(result, true);
      expect(result.data!.priority).toBe('high');
      // Other fields should remain unchanged
      expect(result.data!.title).toBe(existingTask.title);
    });

    it('should set completedAt when status changes to completed', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId,
        status: 'in_progress',
        completedAt: null
      });
      const updateData: UpdateTaskData = { status: 'completed' };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, taskId, updateData);

      assertServiceResult(result, true);
      expect(result.data!.status).toBe('completed');
      expect(result.data!.completedAt).toBeInstanceOf(Date);
    });

    it('should return error when task not found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(null, false)),
        update: jest.fn()
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, 'non-existent-id', { title: 'New Title' });

      assertServiceResult(result, false);
      expect(result.error).toBe('TASK_NOT_FOUND');
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });

    it('should return error when trying to update another users task', async () => {
      const otherUsersTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: 'other-user-id'
      });

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(otherUsersTask)),
        update: jest.fn()
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, taskId, { title: 'Hacked Title' });

      assertServiceResult(result, false);
      expect(result.error).toBe('TASK_NOT_FOUND');
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });

    it('should handle Firestore update errors', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId 
      });

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        update: jest.fn().mockRejectedValue(new Error('Firestore error'))
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, taskId, { title: 'Updated Title' });

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteTask', () => {
    const taskId = 'task-to-delete';

    it('should delete existing task', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId 
      });

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        delete: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.deleteTask(mockUserId, taskId);

      assertServiceResult(result, true);
      expect(result.data).toEqual({ deleted: true });
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should return error when task not found', async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(null, false)),
        delete: jest.fn()
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.deleteTask(mockUserId, 'non-existent-id');

      assertServiceResult(result, false);
      expect(result.error).toBe('TASK_NOT_FOUND');
      expect(mockDocRef.delete).not.toHaveBeenCalled();
    });

    it('should return error when trying to delete another users task', async () => {
      const otherUsersTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: 'other-user-id'
      });

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(otherUsersTask)),
        delete: jest.fn()
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.deleteTask(mockUserId, taskId);

      assertServiceResult(result, false);
      expect(result.error).toBe('TASK_NOT_FOUND');
      expect(mockDocRef.delete).not.toHaveBeenCalled();
    });

    it('should handle Firestore delete errors', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: taskId, 
        userId: mockUserId 
      });

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        delete: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.deleteTask(mockUserId, taskId);

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty userId', async () => {
      const taskData: CreateTaskData = { title: 'Test Task' };

      const result = await taskService.createTask('', taskData);

      assertServiceResult(result, false);
      expect(result.error).toBeDefined();
    });

    it('should handle null dueDate in update', async () => {
      const existingTask = TaskTestDataGenerator.generateTask({ 
        id: 'test-id', 
        userId: mockUserId,
        dueDate: createFutureDate()
      });
      const updateData: UpdateTaskData = { dueDate: null };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue(createMockDocumentSnapshot(existingTask)),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.updateTask(mockUserId, 'test-id', updateData);

      assertServiceResult(result, true);
      expect(result.data!.dueDate).toBeNull();
    });

    it('should handle very long task titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const taskData: CreateTaskData = { title: longTitle };

      const mockDocRef = createMockDocumentReference();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, true);
      expect(result.data!.title).toBe(longTitle);
    });

    it('should handle special characters in task data', async () => {
      const taskData: CreateTaskData = {
        title: 'Test émoji 🚀 and special chars: @#$%',
        description: 'Description with "quotes" and \n newlines',
        tags: ['tag-with-dash', 'tag_with_underscore', 'émoji🎯']
      };

      const mockDocRef = createMockDocumentReference();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef)
      });

      const result = await taskService.createTask(mockUserId, taskData);

      assertServiceResult(result, true);
      expect(result.data!.title).toBe(taskData.title);
      expect(result.data!.description).toBe(taskData.description);
      expect(result.data!.tags).toEqual(taskData.tags);
    });
  });
});