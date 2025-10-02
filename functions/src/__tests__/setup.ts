/**
 * Jest Test Setup for TaskFlow Functions
 * Configures Firebase emulators and test environment
 */

import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  initializeApp({
    projectId: 'demo-taskflow-test',
  });
}

// Configure Firestore to use emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Global test configuration
beforeAll(async () => {
  console.log('🧪 Setting up Firebase test environment...');
  
  // Initialize Firestore with emulator settings
  const db = admin.firestore();
  const settings = {
    host: 'localhost:8080',
    ssl: false,
    ignoreUndefinedProperties: true,
  };
  db.settings(settings);
  
  console.log('✅ Firebase emulators configured for testing');
});

beforeEach(async () => {
  // Clear Firestore data before each test
  await clearFirestoreData();
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  // Additional cleanup if needed
});

/**
 * Clear all Firestore data for clean test state
 */
export async function clearFirestoreData(): Promise<void> {
  const db = admin.firestore();
  
  try {
    // Get all collections
    const collections = await db.listCollections();
    
    // Delete all documents in each collection
    const deletePromises = collections.map(async (collection) => {
      const docs = await collection.listDocuments();
      const batchDeletes = docs.map((doc) => doc.delete());
      await Promise.all(batchDeletes);
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Warning: Could not clear Firestore data:', error);
  }
}

/**
 * Create test user with authentication
 */
export async function createTestUser(userData: {
  uid: string;
  email: string;
  displayName?: string;
}): Promise<admin.auth.UserRecord> {
  const auth = admin.auth();
  
  try {
    // Try to get existing user first
    const existingUser = await auth.getUser(userData.uid).catch(() => null);
    if (existingUser) {
      return existingUser;
    }
    
    // Create new user
    const user = await auth.createUser({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName || userData.email.split('@')[0],
      emailVerified: true,
    });
    
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Generate custom auth token for testing
 */
export async function generateTestToken(uid: string): Promise<string> {
  const auth = admin.auth();
  return await auth.createCustomToken(uid);
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export commonly used test constants
export const TEST_CONSTANTS = {
  TEST_USER_ID: 'test-user-123',
  TEST_USER_EMAIL: 'test@taskflow.dev',
  TEST_ADMIN_ID: 'admin-user-123',
  TEST_ADMIN_EMAIL: 'admin@taskflow.dev',
  
  // Sample task data
  SAMPLE_TASK: {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo' as const,
    priority: 'medium' as const,
    tags: ['test'],
    dueDate: null,
  },
  
  // Sample tag data
  SAMPLE_TAG: {
    name: 'test-tag',
    color: '#3B82F6',
  },
};