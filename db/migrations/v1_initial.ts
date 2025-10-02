/**
 * TaskFlow Initial Database Setup Migration
 * Sets up initial database structure and seed data
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { COMMON_TAGS } from '../schema/tag.schema';
import { DEFAULT_USER_PREFERENCES, DEFAULT_USER_STATS } from '../schema/user.schema';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

/**
 * Create initial database structure
 */
export async function runInitialMigration(): Promise<void> {
  console.log('🚀 Starting TaskFlow database migration v1...');
  
  try {
    // Create system metadata document
    await createSystemMetadata();
    
    // Create sample data for development
    if (process.env.NODE_ENV === 'development') {
      await createDevelopmentSeedData();
    }
    
    console.log('✅ Migration v1 completed successfully');
    
  } catch (error) {
    console.error('❌ Migration v1 failed:', error);
    throw error;
  }
}

/**
 * Create system metadata for tracking migrations
 */
async function createSystemMetadata(): Promise<void> {
  const systemRef = db.doc('_system/metadata');
  
  await systemRef.set({
    version: '1.0.0',
    migrationVersion: 1,
    createdAt: Timestamp.now(),
    lastUpdatedAt: Timestamp.now(),
    features: [
      'user-management',
      'task-crud',
      'tag-system', 
      'notifications',
      'offline-sync'
    ],
    statistics: {
      totalUsers: 0,
      totalTasks: 0,
      totalTags: 0,
      activeUsers: 0
    }
  });
  
  console.log('📋 System metadata created');
}

/**
 * Create development seed data
 */
async function createDevelopmentSeedData(): Promise<void> {
  console.log('🌱 Creating development seed data...');
  
  // Create test user
  const testUserId = 'test-user-123';
  const userRef = db.doc(`users/${testUserId}`);
  
  await userRef.set({
    userId: testUserId,
    email: 'test@taskflow.dev',
    displayName: 'Test User',
    photoURL: null,
    createdAt: Timestamp.now(),
    lastActiveAt: Timestamp.now(),
    preferences: {
      ...DEFAULT_USER_PREFERENCES,
      notifications: true,
      defaultNotificationTime: 30, // 30 minutes
    },
    stats: {
      ...DEFAULT_USER_STATS,
      totalTasks: 5,
      completedTasks: 2,
      activeTasks: 3,
      currentStreak: 3,
    },
    isActive: true,
    version: 1,
  });
  
  // Create common tags for test user
  for (const tag of COMMON_TAGS) {
    const tagRef = userRef.collection('tags').doc(`${tag.name}-tag`);
    await tagRef.set({
      tagId: `${tag.name}-tag`,
      name: tag.name,
      displayName: tag.displayName,
      color: tag.color,
      icon: tag.icon,
      usageCount: Math.floor(Math.random() * 5) + 1,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: true,
      userId: testUserId,
      analytics: {
        totalTasksCreated: Math.floor(Math.random() * 10) + 1,
        totalTasksCompleted: Math.floor(Math.random() * 5) + 1,
        averageCompletionTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        lastUsedAt: Timestamp.now(),
      },
    });
  }
  
  // Create sample tasks
  const sampleTasks = [
    {
      title: 'Complete project proposal',
      description: 'Finish the quarterly project proposal document',
      priority: 'high',
      tags: ['work', 'important'],
      dueDate: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
      dueTime: '17:00',
    },
    {
      title: 'Schedule dental appointment', 
      description: 'Call Dr. Smith office to schedule regular checkup',
      priority: 'medium',
      tags: ['personal', 'health'],
      dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 1 week from now
      dueTime: '09:00',
    },
    {
      title: 'Review monthly budget',
      description: 'Go through all expenses and update budget spreadsheet',
      priority: 'medium',
      tags: ['personal', 'finance'],
      dueDate: null,
      dueTime: null,
    },
    {
      title: 'Learn TypeScript generics',
      description: 'Complete the advanced TypeScript course module on generics',
      priority: 'low',
      tags: ['learning'],
      dueDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks from now
      dueTime: null,
    },
    {
      title: 'Plan weekend family trip',
      description: 'Research destinations and book accommodations for family vacation',
      priority: 'low',
      tags: ['family', 'personal'],
      dueDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
      dueTime: '20:00',
    },
  ];
  
  for (let i = 0; i < sampleTasks.length; i++) {
    const task = sampleTasks[i];
    const taskRef = userRef.collection('tasks').doc(`task-${i + 1}`);
    
    await taskRef.set({
      taskId: `task-${i + 1}`,
      title: task.title,
      description: task.description,
      completed: i < 2, // First 2 tasks are completed
      status: i < 2 ? 'completed' : 'active',
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      hasDeadline: task.dueDate !== null,
      isOverdue: false,
      notificationSettings: {
        enabled: true,
        times: [30, 60], // 30 minutes and 1 hour before
        sentNotifications: [],
      },
      timeTracking: {
        estimated: Math.floor(Math.random() * 120) + 30,
        actual: i < 2 ? Math.floor(Math.random() * 90) + 15 : undefined,
        totalPaused: 0,
      },
      createdAt: Timestamp.fromDate(new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000)), // Staggered creation dates
      updatedAt: Timestamp.now(),
      completedAt: i < 2 ? Timestamp.now() : null,
      archivedAt: null,
      lastSyncedAt: Timestamp.now(),
      version: 1,
      isDeleted: false,
      userId: testUserId,
    });
  }
  
  console.log('✅ Development seed data created successfully');
}

/**
 * Run migration if called directly
 */
if (require.main === module) {
  runInitialMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}