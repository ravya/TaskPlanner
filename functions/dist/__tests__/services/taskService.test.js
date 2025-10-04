"use strict";
/**
 * TaskService Unit Tests
 * Comprehensive testing of task CRUD operations and business logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import Firebase mocks before everything else
require("../mocks/firebase.mock");
const taskService_1 = require("../../services/taskService");
const testHelpers_1 = require("../helpers/testHelpers");
const firebase_mock_1 = require("../mocks/firebase.mock");
// Import the actual module to spy on it
jest.mock('firebase-admin');
describe('TaskService', () => {
    let taskService;
    const mockUserId = 'test-user-123';
    beforeEach(() => {
        (0, firebase_mock_1.resetAllMocks)();
        taskService = new taskService_1.TaskService();
        (0, firebase_mock_1.mockFirestoreSuccess)();
    });
    describe('createTask', () => {
        it('should create a task with valid data', async () => {
            const taskData = testHelpers_1.TaskTestDataGenerator.generateCreateTaskData({
                title: 'Test Task',
                description: 'Test Description',
                priority: 'high'
            });
            const mockDocRef = (0, testHelpers_1.createMockDocumentReference)('new-task-id');
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data).toBeDefined();
            (0, testHelpers_1.assertTaskShape)(result.data);
            expect(result.data.title).toBe(taskData.title);
            expect(result.data.description).toBe(taskData.description);
            expect(result.data.priority).toBe(taskData.priority);
            expect(result.data.userId).toBe(mockUserId);
            expect(result.data.status).toBe(taskData.status || 'todo');
            expect(mockDocRef.set).toHaveBeenCalled();
        });
        it('should create a task with minimal required data', async () => {
            const taskData = {
                title: 'Minimal Task'
            };
            const mockDocRef = (0, testHelpers_1.createMockDocumentReference)();
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.title).toBe('Minimal Task');
            expect(result.data.description).toBe('');
            expect(result.data.status).toBe('todo');
            expect(result.data.priority).toBe('medium');
            expect(result.data.tags).toEqual([]);
            expect(result.data.dueDate).toBeNull();
        });
        it('should handle due date conversion', async () => {
            const dueDate = (0, testHelpers_1.createFutureDate)();
            const taskData = {
                title: 'Task with Due Date',
                dueDate
            };
            const mockDocRef = (0, testHelpers_1.createMockDocumentReference)();
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.dueDate).toEqual(dueDate);
        });
        it('should handle Firestore errors gracefully', async () => {
            const taskData = { title: 'Test Task' };
            (0, firebase_mock_1.mockFirestoreError)('permission-denied');
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
        it('should validate required fields', async () => {
            const taskData = {};
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
    });
    describe('getUserTasks', () => {
        it('should retrieve user tasks without filters', async () => {
            const mockTasks = testHelpers_1.TaskTestDataGenerator.generateMultipleTasks(3, { userId: mockUserId });
            const mockSnapshot = (0, testHelpers_1.createMockQuerySnapshot)(mockTasks);
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue(mockSnapshot)
            });
            const result = await taskService.getUserTasks(mockUserId);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data).toHaveLength(3);
            result.data.forEach(task => {
                (0, testHelpers_1.assertTaskShape)(task);
                expect(task.userId).toBe(mockUserId);
            });
        });
        it('should filter tasks by status', async () => {
            const mockTasks = testHelpers_1.TaskTestDataGenerator.generateMultipleTasks(2, {
                userId: mockUserId,
                status: 'completed'
            });
            const mockSnapshot = (0, testHelpers_1.createMockQuerySnapshot)(mockTasks);
            const mockQuery = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue(mockSnapshot)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue(mockQuery);
            const options = { status: 'completed' };
            const result = await taskService.getUserTasks(mockUserId, options);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(mockQuery.where).toHaveBeenCalledWith('userId', '==', mockUserId);
            expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'completed');
        });
        it('should filter tasks by priority', async () => {
            const mockTasks = testHelpers_1.TaskTestDataGenerator.generateMultipleTasks(2, {
                userId: mockUserId,
                priority: 'high'
            });
            const mockSnapshot = (0, testHelpers_1.createMockQuerySnapshot)(mockTasks);
            const mockQuery = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue(mockSnapshot)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue(mockQuery);
            const options = { priority: 'high' };
            const result = await taskService.getUserTasks(mockUserId, options);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(mockQuery.where).toHaveBeenCalledWith('priority', '==', 'high');
        });
        it('should return empty array when no tasks found', async () => {
            const mockSnapshot = (0, testHelpers_1.createMockQuerySnapshot)([]);
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue(mockSnapshot)
            });
            const result = await taskService.getUserTasks(mockUserId);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data).toEqual([]);
        });
        it('should handle Firestore query errors', async () => {
            (0, firebase_mock_1.mockFirestoreError)('unavailable');
            const result = await taskService.getUserTasks(mockUserId);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
    });
    describe('updateTask', () => {
        const taskId = 'existing-task-id';
        it('should update task with valid data', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId,
                title: 'Original Title'
            });
            const updateData = {
                title: 'Updated Title',
                status: 'completed'
            };
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                update: jest.fn().mockResolvedValue(undefined)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, taskId, updateData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.title).toBe('Updated Title');
            expect(result.data.status).toBe('completed');
            expect(mockDocRef.update).toHaveBeenCalled();
        });
        it('should handle partial updates', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId
            });
            const updateData = { priority: 'high' };
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                update: jest.fn().mockResolvedValue(undefined)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, taskId, updateData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.priority).toBe('high');
            // Other fields should remain unchanged
            expect(result.data.title).toBe(existingTask.title);
        });
        it('should set completedAt when status changes to completed', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId,
                status: 'in_progress',
                completedAt: null
            });
            const updateData = { status: 'completed' };
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                update: jest.fn().mockResolvedValue(undefined)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, taskId, updateData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.status).toBe('completed');
            expect(result.data.completedAt).toBeInstanceOf(Date);
        });
        it('should return error when task not found', async () => {
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(null, false)),
                update: jest.fn()
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, 'non-existent-id', { title: 'New Title' });
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBe('TASK_NOT_FOUND');
            expect(mockDocRef.update).not.toHaveBeenCalled();
        });
        it('should return error when trying to update another users task', async () => {
            const otherUsersTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: 'other-user-id'
            });
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(otherUsersTask)),
                update: jest.fn()
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, taskId, { title: 'Hacked Title' });
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBe('TASK_NOT_FOUND');
            expect(mockDocRef.update).not.toHaveBeenCalled();
        });
        it('should handle Firestore update errors', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId
            });
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                update: jest.fn().mockRejectedValue(new Error('Firestore error'))
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, taskId, { title: 'Updated Title' });
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
    });
    describe('deleteTask', () => {
        const taskId = 'task-to-delete';
        it('should delete existing task', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId
            });
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                delete: jest.fn().mockResolvedValue(undefined)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.deleteTask(mockUserId, taskId);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data).toEqual({ deleted: true });
            expect(mockDocRef.delete).toHaveBeenCalled();
        });
        it('should return error when task not found', async () => {
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(null, false)),
                delete: jest.fn()
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.deleteTask(mockUserId, 'non-existent-id');
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBe('TASK_NOT_FOUND');
            expect(mockDocRef.delete).not.toHaveBeenCalled();
        });
        it('should return error when trying to delete another users task', async () => {
            const otherUsersTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: 'other-user-id'
            });
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(otherUsersTask)),
                delete: jest.fn()
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.deleteTask(mockUserId, taskId);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBe('TASK_NOT_FOUND');
            expect(mockDocRef.delete).not.toHaveBeenCalled();
        });
        it('should handle Firestore delete errors', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: taskId,
                userId: mockUserId
            });
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                delete: jest.fn().mockRejectedValue(new Error('Delete failed'))
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.deleteTask(mockUserId, taskId);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
    });
    describe('Edge Cases and Error Handling', () => {
        it('should handle empty userId', async () => {
            const taskData = { title: 'Test Task' };
            const result = await taskService.createTask('', taskData);
            (0, testHelpers_1.assertServiceResult)(result, false);
            expect(result.error).toBeDefined();
        });
        it('should handle null dueDate in update', async () => {
            const existingTask = testHelpers_1.TaskTestDataGenerator.generateTask({
                id: 'test-id',
                userId: mockUserId,
                dueDate: (0, testHelpers_1.createFutureDate)()
            });
            const updateData = { dueDate: null };
            const mockDocRef = {
                get: jest.fn().mockResolvedValue((0, testHelpers_1.createMockDocumentSnapshot)(existingTask)),
                update: jest.fn().mockResolvedValue(undefined)
            };
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.updateTask(mockUserId, 'test-id', updateData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.dueDate).toBeNull();
        });
        it('should handle very long task titles', async () => {
            const longTitle = 'A'.repeat(1000);
            const taskData = { title: longTitle };
            const mockDocRef = (0, testHelpers_1.createMockDocumentReference)();
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.title).toBe(longTitle);
        });
        it('should handle special characters in task data', async () => {
            const taskData = {
                title: 'Test émoji 🚀 and special chars: @#$%',
                description: 'Description with "quotes" and \n newlines',
                tags: ['tag-with-dash', 'tag_with_underscore', 'émoji🎯']
            };
            const mockDocRef = (0, testHelpers_1.createMockDocumentReference)();
            firebase_mock_1.mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue(mockDocRef)
            });
            const result = await taskService.createTask(mockUserId, taskData);
            (0, testHelpers_1.assertServiceResult)(result, true);
            expect(result.data.title).toBe(taskData.title);
            expect(result.data.description).toBe(taskData.description);
            expect(result.data.tags).toEqual(taskData.tags);
        });
    });
});
//# sourceMappingURL=taskService.test.js.map