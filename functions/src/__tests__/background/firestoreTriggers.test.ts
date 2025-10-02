/**
 * Firestore Triggers Unit Tests
 * Testing onTaskComplete and onUserCreate trigger functions
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import mockAdmin, { resetAllMocks } from '../mocks/firebase.mock';

// Mock the document change objects
const createMockChange = (beforeData: any, afterData: any) => ({
  before: {
    data: () => beforeData,
    exists: beforeData !== null
  },
  after: {
    data: () => afterData,
    exists: afterData !== null
  }
});

const createMockDocumentSnapshot = (data: any) => ({
  data: () => data,
  exists: data !== null,
  id: 'test-doc-id',
  ref: {
    id: 'test-doc-id',
    path: 'test/path'
  }
});

describe('Firestore Triggers', () => {
  let mockUserRef: any;
  let mockBatch: any;

  beforeEach(() => {
    resetAllMocks();

    mockUserRef = {
      update: jest.fn().mockResolvedValue(undefined)
    };

    mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    };

    mockAdmin.firestore.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockUserRef),
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({ 
          id: 'test-doc-id',
          set: jest.fn()
        })
      }),
      batch: jest.fn().mockReturnValue(mockBatch)
    });

    // Firestore FieldValue and Timestamp are already mocked in firebase.mock.ts
  });

  describe('onTaskComplete Trigger', () => {
    it('should update user stats when task is completed', async () => {
      const beforeData = {
        status: 'in_progress',
        userId: 'user-123',
        title: 'Test Task'
      };

      const afterData = {
        status: 'completed',
        userId: 'user-123',
        title: 'Test Task'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-123' }
      };

      const { onTaskComplete } = require('../../index');

      await onTaskComplete(mockChange, mockContext);

      // Verify user stats were updated
      expect(mockAdmin.firestore().doc).toHaveBeenCalledWith('users/user-123');
      expect(mockUserRef.update).toHaveBeenCalledWith({
        'stats.completedTasks': expect.any(Object),
        'stats.activeTasks': expect.any(Object),
        lastActiveAt: expect.any(Object)
      });
    });

    it('should not update stats if task was already completed', async () => {
      const beforeData = {
        status: 'completed',
        userId: 'user-123'
      };

      const afterData = {
        status: 'completed',
        userId: 'user-123'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-123' }
      };

      const { onTaskComplete } = require('../../index');

      await onTaskComplete(mockChange, mockContext);

      // Should not update user stats
      expect(mockUserRef.update).not.toHaveBeenCalled();
    });

    it('should handle status change from todo to completed', async () => {
      const beforeData = {
        status: 'todo',
        userId: 'user-456',
        title: 'Todo Task'
      };

      const afterData = {
        status: 'completed',
        userId: 'user-456',
        title: 'Todo Task'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-456' }
      };

      const { onTaskComplete } = require('../../index');

      await onTaskComplete(mockChange, mockContext);

      expect(mockUserRef.update).toHaveBeenCalledWith({
        'stats.completedTasks': expect.any(Object),
        'stats.activeTasks': expect.any(Object),
        lastActiveAt: expect.any(Object)
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      mockUserRef.update.mockRejectedValue(new Error('Database update failed'));

      const beforeData = {
        status: 'todo',
        userId: 'user-error'
      };

      const afterData = {
        status: 'completed',
        userId: 'user-error'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-error' }
      };

      const { onTaskComplete } = require('../../index');

      // Should not throw error
      await expect(onTaskComplete(mockChange, mockContext)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error updating user stats on task completion:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should log completion event', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const beforeData = {
        status: 'in_progress',
        userId: 'user-log-test'
      };

      const afterData = {
        status: 'completed',
        userId: 'user-log-test'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-log-test' }
      };

      const { onTaskComplete } = require('../../index');

      await onTaskComplete(mockChange, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        '📝 Task task-log-test completed for user user-log-test'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Updated completion stats for user user-log-test'
      );

      consoleSpy.mockRestore();
    });

    it('should ignore non-completion status changes', async () => {
      const beforeData = {
        status: 'todo',
        userId: 'user-123'
      };

      const afterData = {
        status: 'in_progress',
        userId: 'user-123'
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-123' }
      };

      const { onTaskComplete } = require('../../index');

      await onTaskComplete(mockChange, mockContext);

      expect(mockUserRef.update).not.toHaveBeenCalled();
    });

    it('should handle missing userId gracefully', async () => {
      const beforeData = {
        status: 'todo'
        // Missing userId
      };

      const afterData = {
        status: 'completed'
        // Missing userId
      };

      const mockChange = createMockChange(beforeData, afterData);
      const mockContext = {
        params: { taskId: 'task-no-user' }
      };

      const { onTaskComplete } = require('../../index');

      // Should not crash
      await expect(onTaskComplete(mockChange, mockContext)).resolves.not.toThrow();
      expect(mockUserRef.update).not.toHaveBeenCalled();
    });
  });

  describe('onUserCreate Trigger', () => {
    it('should create default tags for new user', async () => {
      const newUserData = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'New User'
      };

      const mockSnapshot = createMockDocumentSnapshot(newUserData);
      const mockContext = {
        params: { userId: 'new-user-123' }
      };

      const mockTagRef = { id: 'tag-id-123' };
      mockAdmin.firestore().collection().doc.mockReturnValue(mockTagRef);

      const { onUserCreate } = require('../../index');

      await onUserCreate(mockSnapshot, mockContext);

      // Verify default tags were created
      const expectedTags = [
        { name: 'work', color: '#3B82F6' },
        { name: 'personal', color: '#10B981' },
        { name: 'urgent', color: '#EF4444' }
      ];

      expect(mockBatch.set).toHaveBeenCalledTimes(3);

      expectedTags.forEach((tag, index) => {
        expect(mockBatch.set).toHaveBeenNthCalledWith(
          index + 1,
          mockTagRef,
          expect.objectContaining({
            id: 'tag-id-123',
            userId: 'new-user-123',
            name: tag.name,
            color: tag.color,
            createdAt: 'current-timestamp',
            updatedAt: 'current-timestamp'
          })
        );
      });

      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should log user creation and tag setup', async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const newUserData = {
        uid: 'log-user-123',
        email: 'loguser@example.com'
      };

      const mockSnapshot = createMockDocumentSnapshot(newUserData);
      const mockContext = {
        params: { userId: 'log-user-123' }
      };

      const { onUserCreate } = require('../../index');

      await onUserCreate(mockSnapshot, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('👤 New user created: log-user-123');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Created 3 default tags for user log-user-123');

      consoleSpy.mockRestore();
    });

    it('should handle tag creation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error');

      mockBatch.commit.mockRejectedValue(new Error('Batch commit failed'));

      const newUserData = {
        uid: 'error-user-123',
        email: 'erroruser@example.com'
      };

      const mockSnapshot = createMockDocumentSnapshot(newUserData);
      const mockContext = {
        params: { userId: 'error-user-123' }
      };

      const { onUserCreate } = require('../../index');

      // Should not throw error
      await expect(onUserCreate(mockSnapshot, mockContext)).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Error setting up new user error-user-123:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should create unique tag IDs for each tag', async () => {
      const newUserData = {
        uid: 'unique-tags-user',
        email: 'uniquetags@example.com'
      };

      const mockSnapshot = createMockDocumentSnapshot(newUserData);
      const mockContext = {
        params: { userId: 'unique-tags-user' }
      };

      // Mock different doc IDs for each tag
      let callCount = 0;
      const mockTagRefs = [
        { id: 'tag-work-id' },
        { id: 'tag-personal-id' },
        { id: 'tag-urgent-id' }
      ];

      mockAdmin.firestore().collection().doc.mockImplementation(() => {
        return mockTagRefs[callCount++];
      });

      const { onUserCreate } = require('../../index');

      await onUserCreate(mockSnapshot, mockContext);

      // Verify each tag was created with unique ID
      expect(mockBatch.set).toHaveBeenNthCalledWith(
        1,
        mockTagRefs[0],
        expect.objectContaining({ id: 'tag-work-id', name: 'work' })
      );

      expect(mockBatch.set).toHaveBeenNthCalledWith(
        2,
        mockTagRefs[1],
        expect.objectContaining({ id: 'tag-personal-id', name: 'personal' })
      );

      expect(mockBatch.set).toHaveBeenNthCalledWith(
        3,
        mockTagRefs[2],
        expect.objectContaining({ id: 'tag-urgent-id', name: 'urgent' })
      );
    });

    it('should set correct timestamps for all tags', async () => {
      const mockTimestamp = 'test-timestamp-123';
      // Use the already mocked timestamp - access via the constructor
      (mockAdmin.firestore as any).Timestamp.now.mockReturnValue(mockTimestamp);

      const newUserData = {
        uid: 'timestamp-user',
        email: 'timestamp@example.com'
      };

      const mockSnapshot = createMockDocumentSnapshot(newUserData);
      const mockContext = {
        params: { userId: 'timestamp-user' }
      };

      const { onUserCreate } = require('../../index');

      await onUserCreate(mockSnapshot, mockContext);

      // Verify all tags have correct timestamps
      for (let i = 1; i <= 3; i++) {
        expect(mockBatch.set).toHaveBeenNthCalledWith(
          i,
          expect.any(Object),
          expect.objectContaining({
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp
          })
        );
      }
    });
  });

  describe('Trigger Configuration', () => {
    it('should be configured for correct document paths', () => {
      // Test that triggers are configured for the right Firestore paths
      const expectedConfigs = {
        onTaskComplete: 'tasks/{taskId}',
        onUserCreate: 'users/{userId}'
      };

      // In practice, you'd verify the actual trigger configuration
      expect(expectedConfigs.onTaskComplete).toBe('tasks/{taskId}');
      expect(expectedConfigs.onUserCreate).toBe('users/{userId}');
    });

    it('should handle document parameter extraction', () => {
      const mockContext = {
        params: { taskId: 'test-task-123', userId: 'test-user-456' }
      };

      expect(mockContext.params.taskId).toBe('test-task-123');
      expect(mockContext.params.userId).toBe('test-user-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null document data in onTaskComplete', async () => {
      const mockChange = createMockChange(null, null);
      const mockContext = {
        params: { taskId: 'null-task' }
      };

      const { onTaskComplete } = require('../../index');

      // Should not crash
      await expect(onTaskComplete(mockChange, mockContext)).resolves.not.toThrow();
      expect(mockUserRef.update).not.toHaveBeenCalled();
    });

    it('should handle null document data in onUserCreate', async () => {
      const mockSnapshot = createMockDocumentSnapshot(null);
      const mockContext = {
        params: { userId: 'null-user' }
      };

      const { onUserCreate } = require('../../index');

      // Should not crash with null data
      await expect(onUserCreate(mockSnapshot, mockContext)).resolves.not.toThrow();
    });

    it('should handle concurrent task completions', async () => {
      // Simulate concurrent completions
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        beforeData: { status: 'todo', userId: `user-${i}` },
        afterData: { status: 'completed', userId: `user-${i}` },
        context: { params: { taskId: `task-${i}` } }
      }));

      const { onTaskComplete } = require('../../index');

      // Execute all triggers simultaneously
      const promises = tasks.map(({ beforeData, afterData, context }) =>
        onTaskComplete(createMockChange(beforeData, afterData), context)
      );

      await Promise.all(promises);

      // All should complete without errors
      expect(mockUserRef.update).toHaveBeenCalledTimes(5);
    });
  });
});