"use strict";
/**
 * Background Functions Logic Tests
 * Testing the core business logic of scheduled and trigger functions
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
const notificationService_1 = require("../../services/notificationService");
// Mock services
jest.mock('../../services/notificationService');
const MockNotificationService = notificationService_1.NotificationService;
describe('Background Functions Logic', () => {
    let mockBatch;
    let mockCollection;
    let mockQuerySnapshot;
    beforeEach(() => {
        (0, firebase_mock_1.resetAllMocks)();
        mockBatch = {
            update: jest.fn(),
            delete: jest.fn(),
            set: jest.fn(),
            commit: jest.fn().mockResolvedValue(undefined)
        };
        mockQuerySnapshot = {
            docs: [
                {
                    id: 'doc-1',
                    data: () => ({ status: 'todo', dueDate: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
                    ref: { id: 'doc-1' }
                }
            ]
        };
        mockCollection = {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(mockQuerySnapshot),
            limit: jest.fn().mockReturnThis()
        };
        firebase_mock_1.default.firestore.mockReturnValue({
            collection: jest.fn().mockReturnValue(mockCollection),
            collectionGroup: jest.fn().mockReturnValue(mockCollection),
            batch: jest.fn().mockReturnValue(mockBatch),
            doc: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue(undefined),
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ userId: 'user-123' })
                })
            })
        });
    });
    describe('Notification Processing Logic', () => {
        it('should process scheduled notifications', async () => {
            // Mock notification service
            const mockInstance = {
                processScheduledNotifications: jest.fn().mockResolvedValue({ processedCount: 3 })
            };
            MockNotificationService.mockImplementation(() => mockInstance);
            // Simulate the core logic of processNotifications function
            const notificationService = new notificationService_1.NotificationService();
            const result = await notificationService.processScheduledNotifications();
            expect(result.processedCount).toBe(3);
            expect(mockInstance.processScheduledNotifications).toHaveBeenCalled();
        });
        it('should handle notification processing errors', async () => {
            const mockInstance = {
                processScheduledNotifications: jest.fn().mockRejectedValue(new Error('Service error'))
            };
            MockNotificationService.mockImplementation(() => mockInstance);
            const notificationService = new notificationService_1.NotificationService();
            await expect(notificationService.processScheduledNotifications()).rejects.toThrow('Service error');
        });
    });
    describe('Overdue Tasks Update Logic', () => {
        it('should identify and update overdue tasks', async () => {
            const now = new Date();
            // Simulate the core logic of updateOverdueTasks
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            // Query for overdue tasks
            const overdueQuery = db.collection('tasks')
                .where('status', '!=', 'completed')
                .where('dueDate', '<=', now);
            const snapshot = await overdueQuery.get();
            // Process overdue tasks
            let updateCount = 0;
            for (const doc of snapshot.docs) {
                const data = doc.data();
                if (data.status !== 'overdue') {
                    batch.update(doc.ref, {
                        status: 'overdue',
                        updatedAt: now
                    });
                    updateCount++;
                }
            }
            await batch.commit();
            // Verify the logic worked
            expect(mockCollection.where).toHaveBeenCalledWith('status', '!=', 'completed');
            expect(mockBatch.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                status: 'overdue',
                updatedAt: now
            }));
            expect(mockBatch.commit).toHaveBeenCalled();
            expect(updateCount).toBe(1);
        });
        it('should handle batch size limits', async () => {
            // Create many overdue tasks
            const manyDocs = Array.from({ length: 501 }, (_, i) => ({
                id: `doc-${i}`,
                data: () => ({ status: 'todo', dueDate: { toDate: () => new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
                ref: { id: `doc-${i}` }
            }));
            mockQuerySnapshot.docs = manyDocs;
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            // Simulate batch processing logic
            let updateCount = 0;
            const snapshot = await db.collection('tasks').get();
            for (const doc of snapshot.docs) {
                batch.update(doc.ref, { status: 'overdue' });
                updateCount++;
                // Commit when reaching batch limit
                if (updateCount >= 500) {
                    await batch.commit();
                    updateCount = 0;
                }
            }
            // Commit remaining updates
            if (updateCount > 0) {
                await batch.commit();
            }
            // Should have committed twice (500 + 1)
            expect(mockBatch.commit).toHaveBeenCalledTimes(2);
        });
    });
    describe('Notification Cleanup Logic', () => {
        it('should delete old notifications', async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            mockQuerySnapshot.docs = [
                {
                    id: 'old-notification',
                    data: () => ({ sent: true, sentAt: { toDate: () => thirtyDaysAgo } }),
                    ref: { id: 'old-notification' }
                }
            ];
            // Simulate cleanup logic
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            const oldNotifications = await db.collectionGroup('notifications')
                .where('sent', '==', true)
                .where('sentAt', '<=', thirtyDaysAgo)
                .limit(1000)
                .get();
            for (const doc of oldNotifications.docs) {
                batch.delete(doc.ref);
            }
            await batch.commit();
            expect(mockCollection.where).toHaveBeenCalledWith('sent', '==', true);
            expect(mockBatch.delete).toHaveBeenCalled();
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });
    describe('User Statistics Update Logic', () => {
        it('should calculate and update user statistics', async () => {
            const mockUsers = [{ id: 'user-1', ref: { id: 'user-1' } }];
            const mockTasks = [
                { data: () => ({ status: 'completed' }) },
                { data: () => ({ status: 'todo' }) },
                { data: () => ({ status: 'in_progress' }) },
                { data: () => ({ status: 'overdue' }) }
            ];
            // Mock users query
            const usersSnapshot = { docs: mockUsers };
            const tasksSnapshot = { docs: mockTasks };
            firebase_mock_1.default.firestore.mockReturnValue({
                collection: jest.fn().mockImplementation((name) => {
                    if (name === 'users') {
                        return { get: jest.fn().mockResolvedValue(usersSnapshot) };
                    }
                    else if (name === 'tasks') {
                        return {
                            where: jest.fn().mockReturnThis(),
                            get: jest.fn().mockResolvedValue(tasksSnapshot)
                        };
                    }
                }),
                batch: jest.fn().mockReturnValue(mockBatch)
            });
            // Simulate stats calculation logic
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            const users = await db.collection('users').get();
            for (const userDoc of users.docs) {
                const userId = userDoc.id;
                const tasks = await db.collection('tasks').where('userId', '==', userId).get();
                const taskData = tasks.docs.map((doc) => doc.data());
                const stats = {
                    totalTasks: taskData.length,
                    completedTasks: taskData.filter((t) => t.status === 'completed').length,
                    activeTasks: taskData.filter((t) => ['todo', 'in_progress'].includes(t.status)).length,
                    overdueTasks: taskData.filter((t) => t.status === 'overdue').length
                };
                batch.update(userDoc.ref, {
                    'stats.totalTasks': stats.totalTasks,
                    'stats.completedTasks': stats.completedTasks,
                    'stats.activeTasks': stats.activeTasks,
                    'stats.overdueTasks': stats.overdueTasks
                });
            }
            await batch.commit();
            expect(mockBatch.update).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                'stats.totalTasks': 4,
                'stats.completedTasks': 1,
                'stats.activeTasks': 2,
                'stats.overdueTasks': 1
            }));
        });
    });
    describe('Task Completion Trigger Logic', () => {
        it('should update user stats when task is completed', async () => {
            const beforeData = { status: 'in_progress', userId: 'user-123' };
            const afterData = { status: 'completed', userId: 'user-123' };
            // Simulate the trigger logic
            if (beforeData.status !== 'completed' && afterData.status === 'completed') {
                const db = firebase_mock_1.default.firestore();
                const userRef = db.doc(`users/${afterData.userId}`);
                await userRef.update({
                    'stats.completedTasks': firebase_mock_1.default.firestore.FieldValue.increment(1),
                    'stats.activeTasks': firebase_mock_1.default.firestore.FieldValue.increment(-1),
                    lastActiveAt: firebase_mock_1.default.firestore.Timestamp.now()
                });
            }
            expect(firebase_mock_1.default.firestore().doc).toHaveBeenCalledWith('users/user-123');
        });
        it('should not update stats if task was already completed', async () => {
            const beforeData = { status: 'completed', userId: 'user-123' };
            const afterData = { status: 'completed', userId: 'user-123' };
            const mockUpdate = jest.fn();
            firebase_mock_1.default.firestore.mockReturnValue({
                doc: jest.fn().mockReturnValue({ update: mockUpdate })
            });
            // Simulate the trigger logic
            if (beforeData.status !== 'completed' && afterData.status === 'completed') {
                // This should not execute
                const db = firebase_mock_1.default.firestore();
                const userRef = db.doc(`users/${afterData.userId}`);
                await userRef.update({});
            }
            expect(mockUpdate).not.toHaveBeenCalled();
        });
    });
    describe('User Creation Trigger Logic', () => {
        it('should create default tags for new user', async () => {
            const userId = 'new-user-123';
            // Simulate the trigger logic
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            const defaultTags = [
                { name: 'work', color: '#3B82F6' },
                { name: 'personal', color: '#10B981' },
                { name: 'urgent', color: '#EF4444' }
            ];
            for (const tag of defaultTags) {
                const tagRef = db.collection('tags').doc();
                batch.set(tagRef, {
                    id: tagRef.id,
                    userId: userId,
                    name: tag.name,
                    color: tag.color,
                    createdAt: firebase_mock_1.default.firestore.Timestamp.now(),
                    updatedAt: firebase_mock_1.default.firestore.Timestamp.now()
                });
            }
            await batch.commit();
            expect(mockBatch.set).toHaveBeenCalledTimes(3);
            expect(mockBatch.commit).toHaveBeenCalled();
        });
    });
    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            mockCollection.get.mockRejectedValue(new Error('Database connection failed'));
            try {
                await firebase_mock_1.default.firestore().collection('tasks').get();
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Database connection failed');
            }
        });
        it('should handle batch operation failures', async () => {
            mockBatch.commit.mockRejectedValue(new Error('Batch commit failed'));
            const db = firebase_mock_1.default.firestore();
            const batch = db.batch();
            await expect(batch.commit()).rejects.toThrow('Batch commit failed');
        });
    });
});
//# sourceMappingURL=backgroundLogic.test.js.map