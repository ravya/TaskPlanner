/**
 * TaskFlow Cloud Functions Entry Point
 * Exports all HTTP endpoints and background functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import express from 'express';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Express app with CORS
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Import handlers
import { authHandlers } from './handlers/authHandlers';
import { taskHandlers } from './handlers/taskHandlers';

// Import services for background functions
import { NotificationService } from './services/notificationService';

// =============================================================================
// HTTP FUNCTIONS (API Endpoints)
// =============================================================================

/**
 * Authentication endpoints
 * POST /auth/register - Register new user
 * POST /auth/login - Login user (handled by Firebase Auth)
 * GET /auth/profile - Get user profile
 * PUT /auth/profile - Update user profile
 */
app.use('/auth', authHandlers);

/**
 * Task management endpoints
 * GET /tasks - Get user tasks with filtering
 * POST /tasks - Create new task
 * GET /tasks/:taskId - Get specific task
 * PUT /tasks/:taskId - Update task
 * DELETE /tasks/:taskId - Delete task
 * POST /tasks/:taskId/complete - Mark task as complete
 */
app.use('/tasks', taskHandlers);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'taskflow-functions'
  });
});

// Export the main API function
export const api = functions.https.onRequest(app);

// =============================================================================
// BACKGROUND FUNCTIONS (Scheduled & Triggered)
// =============================================================================

/**
 * Process notification reminders (runs every 5 minutes)
 * Checks for tasks with upcoming deadlines and sends notifications
 */
export const processNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🔔 Processing notification reminders...');
    
    try {
      const notificationService = new NotificationService();
      const result = await notificationService.processScheduledNotifications();
      
      console.log(`✅ Processed ${result.processedCount} notifications`);
      return { success: true, processedCount: result.processedCount };
      
    } catch (error) {
      console.error('❌ Error processing notifications:', error);
      throw error;
    }
  });

/**
 * Update overdue tasks (runs every hour)
 * Marks tasks as overdue when they pass their deadline
 */
export const updateOverdueTasks = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('⏰ Updating overdue tasks...');
    
    try {
      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      
      // Query all active tasks with deadlines that have passed
      const overdueTasksQuery = await db.collection('tasks')
        .where('status', '!=', 'completed')
        .where('dueDate', '<=', now)
        .get();
      
      console.log(`Found ${overdueTasksQuery.docs.length} tasks to mark as overdue`);
      
      // Batch update overdue tasks
      const batch = db.batch();
      let updateCount = 0;
      
      for (const doc of overdueTasksQuery.docs) {
        const taskData = doc.data();
        // Only update if not already marked as overdue
        if (taskData.status !== 'overdue') {
          batch.update(doc.ref, {
            status: 'overdue',
            updatedAt: now,
          });
          updateCount++;
        }
        
        
        // Firestore batch limit is 500 operations
        if (updateCount >= 500) {
          await batch.commit();
          updateCount = 0;
        }
      }
      
      // Commit remaining updates
      if (updateCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Updated ${overdueTasksQuery.docs.length} overdue tasks`);
      return { success: true, updatedCount: overdueTasksQuery.docs.length };
      
    } catch (error) {
      console.error('❌ Error updating overdue tasks:', error);
      throw error;
    }
  });

/**
 * Cleanup old notifications (runs daily at 2 AM)
 * Removes sent notifications older than 30 days
 */
export const cleanupNotifications = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🧹 Cleaning up old notifications...');
    
    try {
      const db = admin.firestore();
      const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      
      // Query old notifications
      const oldNotificationsQuery = await db.collectionGroup('notifications')
        .where('sent', '==', true)
        .where('sentAt', '<=', thirtyDaysAgo)
        .limit(1000) // Process in batches
        .get();
      
      console.log(`Found ${oldNotificationsQuery.docs.length} old notifications to delete`);
      
      // Batch delete old notifications
      const batch = db.batch();
      
      for (const doc of oldNotificationsQuery.docs) {
        batch.delete(doc.ref);
      }
      
      await batch.commit();
      
      console.log(`✅ Deleted ${oldNotificationsQuery.docs.length} old notifications`);
      return { success: true, deletedCount: oldNotificationsQuery.docs.length };
      
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
      throw error;
    }
  });

/**
 * User statistics update (runs daily at 3 AM)
 * Updates user statistics like streaks, averages, etc.
 */
export const updateUserStats = functions.pubsub
  .schedule('0 3 * * *') // Daily at 3 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('📊 Updating user statistics...');
    
    try {
      const db = admin.firestore();
      
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      console.log(`Found ${usersSnapshot.docs.length} users to update`);
      
      const batch = db.batch();
      let updateCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Get user's tasks
        const tasksSnapshot = await db.collection('tasks')
          .where('userId', '==', userId)
          .get();
        
        const tasks = tasksSnapshot.docs.map(doc => doc.data());
        
        // Calculate statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const activeTasks = tasks.filter(t => ['todo', 'in_progress'].includes(t.status)).length;
        const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
        
        // Update user stats
        batch.update(userDoc.ref, {
          'stats.totalTasks': totalTasks,
          'stats.completedTasks': completedTasks,
          'stats.activeTasks': activeTasks,
          'stats.overdueTasks': overdueTasks,
          lastActiveAt: admin.firestore.Timestamp.now(),
        });
        
        updateCount++;
        
        // Commit in batches of 500
        if (updateCount >= 500) {
          await batch.commit();
          updateCount = 0;
        }
      }
      
      // Commit remaining updates
      if (updateCount > 0) {
        await batch.commit();
      }
      
      console.log(`✅ Updated statistics for ${usersSnapshot.docs.length} users`);
      return { success: true, updatedUsersCount: usersSnapshot.docs.length };
      
    } catch (error) {
      console.error('❌ Error updating user statistics:', error);
      throw error;
    }
  });

// =============================================================================
// FIRESTORE TRIGGERS
// =============================================================================

/**
 * Task completion trigger
 * Updates user stats when a task is marked as complete
 */
export const onTaskComplete = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = afterData?.userId;
    
    // Check if task was just completed
    if (beforeData?.status !== 'completed' && afterData?.status === 'completed') {
      console.log(`📝 Task ${context.params.taskId} completed for user ${userId}`);
      
      try {
        const userRef = admin.firestore().doc(`users/${userId}`);
        
        // Update completion stats
        await userRef.update({
          'stats.completedTasks': admin.firestore.FieldValue.increment(1),
          'stats.activeTasks': admin.firestore.FieldValue.increment(-1),
          lastActiveAt: admin.firestore.Timestamp.now(),
        });
        
        console.log(`✅ Updated completion stats for user ${userId}`);
        
      } catch (error) {
        console.error('❌ Error updating user stats on task completion:', error);
      }
    }
  });

/**
 * New user setup trigger
 * Initializes user with default tags when account is created
 */
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    console.log(`👤 New user created: ${userId}`);
    
    try {
      const db = admin.firestore();
      const batch = db.batch();
      
      // Create some default tags for new user
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
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
      
      await batch.commit();
      console.log(`✅ Created ${defaultTags.length} default tags for user ${userId}`);
      
    } catch (error) {
      console.error(`❌ Error setting up new user ${userId}:`, error);
    }
  });