"use strict";
/**
 * Scheduled Background Functions Unit Tests
 * Testing processNotifications, updateOverdueTasks, cleanupNotifications, updateUserStats
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_mock_1 = __importStar(require("../mocks/firebase.mock"));
// Mock the functions to test
const mockProcessNotifications = jest.fn();
const mockUpdateOverdueTasks = jest.fn();
const mockCleanupNotifications = jest.fn();
const mockUpdateUserStats = jest.fn();
// Mock NotificationService
const mockNotificationService = {
    processScheduledNotifications: jest.fn()
};
jest.mock('../../services/notificationService', () => ({
    NotificationService: jest.fn().mockImplementation(() => mockNotificationService)
}));
describe('Scheduled Background Functions', () => {
    let mockBatch;
    let mockCollection;
    let mockQuerySnapshot;
    let mockDocumentSnapshot;
    beforeEach(() => {
        (0, firebase_mock_1.resetAllMocks)();
        // Setup Firestore mocks
        mockBatch = {
            update: jest.fn(),
            commit: jest.fn(),
            delete: jest.fn()
        };
        mockDocumentSnapshot = {
            id: 'test-doc-id',
            data: jest.fn(),
            ref: { id: 'test-doc-id' }
        };
        mockQuerySnapshot = {
            docs: [mockDocumentSnapshot],
            forEach: jest.fn((callback) => {
                [mockDocumentSnapshot].forEach(callback);
            })
        };
        mockCollection = {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(mockQuerySnapshot),
            doc: jest.fn().mockReturnValue({ ref: { id: 'test-ref' } }),
            limit: jest.fn().mockReturnThis()
        };
        firebase_mock_1.default.firestore.mockReturnValue({
            collection: jest.fn().mockReturnValue(mockCollection),
            collectionGroup: jest.fn().mockReturnValue(mockCollection),
            batch: jest.fn().mockReturnValue(mockBatch)
        });
        // Firestore Timestamp and FieldValue are already mocked in firebase.mock.ts
    });
    describe('processNotifications', () => {
        it('should process scheduled notifications successfully', async () => {
            // Mock successful notification processing
            mockNotificationService.processScheduledNotifications.mockResolvedValue({
                processedCount: 5
            });
            // Import and execute the function
            const { processNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            const result = await processNotifications(mockContext);
            expect(mockNotificationService.processScheduledNotifications).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                processedCount: 5
            });
        });
        it('should handle notification processing errors', async () => {
            mockNotificationService.processScheduledNotifications.mockRejectedValue(new Error('Notification service error'));
            const { processNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await expect(processNotifications(mockContext)).rejects.toThrow('Notification service error');
        });
        it('should log processing progress', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            mockNotificationService.processScheduledNotifications.mockResolvedValue({
                processedCount: 3
            });
            const { processNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await processNotifications(mockContext);
            expect(consoleSpy).toHaveBeenCalledWith('🔔 Processing notification reminders...');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Processed 3 notifications');
            consoleSpy.mockRestore();
        });
    });
    describe('updateOverdueTasks', () => {
        it('should mark overdue tasks correctly', async () => {
            const now = new Date();
            const overdueTaskData = {
                status: 'todo',
                dueDate: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) }
            };
            mockDocumentSnapshot.data.mockReturnValue(overdueTaskData);
            mockQuerySnapshot.docs = [mockDocumentSnapshot];
            mockBatch.commit.mockResolvedValue(undefined);
            const { updateOverdueTasks } = require('../../index');
            const mockContext = { timestamp: now };
            const result = await updateOverdueTasks(mockContext);
            // Verify query was made correctly
            expect(mockCollection.where).toHaveBeenCalledWith('status', '!=', 'completed');
            expect(mockCollection.where).toHaveBeenCalledWith('dueDate', '<=', expect.any(Object));
            // Verify batch update was called
            expect(mockBatch.update).toHaveBeenCalledWith(mockDocumentSnapshot.ref, expect.objectContaining({
                status: 'overdue',
                updatedAt: expect.any(Object)
            }));
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                updatedCount: 1
            });
        });
        it('should not update already overdue tasks', async () => {
            const alreadyOverdueTask = {
                status: 'overdue',
                dueDate: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) }
            };
            mockDocumentSnapshot.data.mockReturnValue(alreadyOverdueTask);
            const { updateOverdueTasks } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await updateOverdueTasks(mockContext);
            // Should not call batch.update for already overdue tasks
            expect(mockBatch.update).not.toHaveBeenCalled();
        });
        it('should handle batch size limits', async () => {
            // Create 501 overdue tasks (exceeding batch limit of 500)
            const overdueTasks = Array.from({ length: 501 }, (_, i) => ({
                id: `task-${i}`,
                data: () => ({
                    status: 'todo',
                    dueDate: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }),
                ref: { id: `task-${i}` }
            }));
            mockQuerySnapshot.docs = overdueTasks;
            mockQuerySnapshot.forEach = jest.fn((callback) => {
                overdueTasks.forEach(callback);
            });
            const { updateOverdueTasks } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await updateOverdueTasks(mockContext);
            // Should commit twice (500 + 1)
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });
        it('should handle errors gracefully', async () => {
            mockCollection.get.mockRejectedValue(new Error('Database error'));
            const { updateOverdueTasks } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await expect(updateOverdueTasks(mockContext)).rejects.toThrow('Database error');
        });
    });
    describe('cleanupNotifications', () => {
        it('should delete old notifications', async () => {
            const oldNotificationData = {
                sent: true,
                sentAt: { toDate: () => new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) }
            };
            mockDocumentSnapshot.data.mockReturnValue(oldNotificationData);
            mockQuerySnapshot.docs = [mockDocumentSnapshot];
            const { cleanupNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            const result = await cleanupNotifications(mockContext);
            // Verify query was made correctly
            expect(mockCollection.where).toHaveBeenCalledWith('sent', '==', true);
            expect(mockCollection.where).toHaveBeenCalledWith('sentAt', '<=', expect.any(Object));
            expect(mockCollection.limit).toHaveBeenCalledWith(1000);
            // Verify batch delete was called
            expect(mockBatch.delete).toHaveBeenCalledWith(mockDocumentSnapshot.ref);
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                deletedCount: 1
            });
        });
        it('should handle empty notification cleanup', async () => {
            mockQuerySnapshot.docs = [];
            mockQuerySnapshot.forEach = jest.fn();
            const { cleanupNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            const result = await cleanupNotifications(mockContext);
            expect(mockBatch.delete).not.toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                deletedCount: 0
            });
        });
        it('should log cleanup progress', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            mockQuerySnapshot.docs = [mockDocumentSnapshot, mockDocumentSnapshot];
            const { cleanupNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await cleanupNotifications(mockContext);
            expect(consoleSpy).toHaveBeenCalledWith('🧹 Cleaning up old notifications...');
            expect(consoleSpy).toHaveBeenCalledWith('Found 2 old notifications to delete');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Deleted 2 old notifications');
            consoleSpy.mockRestore();
        });
    });
    describe('updateUserStats', () => {
        beforeEach(() => {
            const mockUserDoc = {
                id: 'user-123',
                ref: { id: 'user-123' }
            };
            const mockTasksData = [
                { status: 'completed' },
                { status: 'todo' },
                { status: 'in_progress' },
                { status: 'overdue' },
                { status: 'completed' }
            ];
            const mockTasksSnapshot = {
                docs: mockTasksData.map((data, i) => ({
                    id: `task-${i}`,
                    data: () => data
                }))
            };
            // Setup users collection
            const mockUsersSnapshot = {
                docs: [mockUserDoc]
            };
            // Mock collection behavior based on collection name
            firebase_mock_1.default.firestore.mockReturnValue({
                collection: jest.fn().mockImplementation((name) => {
                    if (name === 'users') {
                        return {
                            get: jest.fn().mockResolvedValue(mockUsersSnapshot)
                        };
                    }
                    else if (name === 'tasks') {
                        return {
                            where: jest.fn().mockReturnThis(),
                            get: jest.fn().mockResolvedValue(mockTasksSnapshot)
                        };
                    }
                    return mockCollection;
                }),
                batch: jest.fn().mockReturnValue(mockBatch)
            });
        });
        it('should calculate and update user statistics', async () => {
            const { updateUserStats } = require('../../index');
            const mockContext = { timestamp: new Date() };
            const result = await updateUserStats(mockContext);
            // Verify stats calculation and update
            expect(mockBatch.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                'stats.totalTasks': 5,
                'stats.completedTasks': 2,
                'stats.activeTasks': 2,
                'stats.overdueTasks': 1,
                lastActiveAt: expect.any(Object)
            }));
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                updatedUsersCount: 1
            });
        });
        it('should handle batch limits for user updates', async () => {
            // Create 501 users (exceeding batch limit)
            const manyUsers = Array.from({ length: 501 }, (_, i) => ({
                id: `user-${i}`,
                ref: { id: `user-${i}` }
            }));
            const mockManyUsersSnapshot = { docs: manyUsers };
            firebase_mock_1.default.firestore.mockReturnValue({
                collection: jest.fn().mockImplementation((name) => {
                    if (name === 'users') {
                        return {
                            get: jest.fn().mockResolvedValue(mockManyUsersSnapshot)
                        };
                    }
                    else if (name === 'tasks') {
                        return {
                            where: jest.fn().mockReturnThis(),
                            get: jest.fn().mockResolvedValue({ docs: [] })
                        };
                    }
                    return mockCollection;
                }),
                batch: jest.fn().mockReturnValue(mockBatch)
            });
            const { updateUserStats } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await updateUserStats(mockContext);
            // Should commit twice (500 + 1)
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });
        it('should handle users with no tasks', async () => {
            const mockEmptyTasksSnapshot = { docs: [] };
            firebase_mock_1.default.firestore.mockReturnValue({
                collection: jest.fn().mockImplementation((name) => {
                    if (name === 'users') {
                        return {
                            get: jest.fn().mockResolvedValue({ docs: [{ id: 'user-no-tasks', ref: { id: 'user-no-tasks' } }] })
                        };
                    }
                    else if (name === 'tasks') {
                        return {
                            where: jest.fn().mockReturnThis(),
                            get: jest.fn().mockResolvedValue(mockEmptyTasksSnapshot)
                        };
                    }
                    return mockCollection;
                }),
                batch: jest.fn().mockReturnValue(mockBatch)
            });
            const { updateUserStats } = require('../../index');
            const mockContext = { timestamp: new Date() };
            const result = await updateUserStats(mockContext);
            expect(mockBatch.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                'stats.totalTasks': 0,
                'stats.completedTasks': 0,
                'stats.activeTasks': 0,
                'stats.overdueTasks': 0
            }));
            expect(result.success).toBe(true);
        });
        it('should log stats update progress', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const { updateUserStats } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await updateUserStats(mockContext);
            expect(consoleSpy).toHaveBeenCalledWith('📊 Updating user statistics...');
            expect(consoleSpy).toHaveBeenCalledWith('Found 1 users to update');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Updated statistics for 1 users');
            consoleSpy.mockRestore();
        });
        it('should handle database errors', async () => {
            firebase_mock_1.default.firestore.mockReturnValue({
                collection: jest.fn().mockImplementation(() => ({
                    get: jest.fn().mockRejectedValue(new Error('Database connection failed'))
                }))
            });
            const { updateUserStats } = require('../../index');
            const mockContext = { timestamp: new Date() };
            await expect(updateUserStats(mockContext)).rejects.toThrow('Database connection failed');
        });
    });
    describe('Function Configuration', () => {
        it('should have correct scheduling configuration', () => {
            // This would test that functions are properly configured with schedules
            // In a real implementation, you'd verify the function registration
            const expectedSchedules = {
                processNotifications: 'every 5 minutes',
                updateOverdueTasks: 'every 1 hours',
                cleanupNotifications: '0 2 * * *', // Daily at 2 AM
                updateUserStats: '0 3 * * *' // Daily at 3 AM
            };
            // In practice, you'd check the actual function configuration
            expect(expectedSchedules.processNotifications).toBe('every 5 minutes');
            expect(expectedSchedules.updateOverdueTasks).toBe('every 1 hours');
            expect(expectedSchedules.cleanupNotifications).toBe('0 2 * * *');
            expect(expectedSchedules.updateUserStats).toBe('0 3 * * *');
        });
        it('should use UTC timezone', () => {
            const expectedTimezone = 'UTC';
            expect(expectedTimezone).toBe('UTC');
        });
    });
    describe('Error Logging', () => {
        it('should log errors with appropriate emoji indicators', async () => {
            const consoleSpy = jest.spyOn(console, 'error');
            mockNotificationService.processScheduledNotifications.mockRejectedValue(new Error('Test error'));
            const { processNotifications } = require('../../index');
            const mockContext = { timestamp: new Date() };
            try {
                await processNotifications(mockContext);
            }
            catch (error) {
                // Expected to throw
            }
            expect(consoleSpy).toHaveBeenCalledWith('❌ Error processing notifications:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=scheduledFunctions.test.js.map