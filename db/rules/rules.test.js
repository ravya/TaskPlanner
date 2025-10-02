/**
 * Firestore Security Rules Tests
 * Tests user access control and data validation
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'taskflow-test',
    firestore: {
      rules: fs.readFileSync('db/rules/firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('User Document Access', () => {
  test('authenticated user can read their own profile', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const aliceDoc = alice.firestore().doc('users/alice');
    
    await assertSucceeds(aliceDoc.get());
  });

  test('user cannot read another user profile', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const bobDoc = alice.firestore().doc('users/bob');
    
    await assertFails(bobDoc.get());
  });

  test('unauthenticated user cannot read any profile', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    const userDoc = unauthed.firestore().doc('users/alice');
    
    await assertFails(userDoc.get());
  });

  test('user can create their own profile with valid data', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@test.com' });
    const aliceDoc = alice.firestore().doc('users/alice');
    
    await assertSucceeds(aliceDoc.set({
      userId: 'alice',
      email: 'alice@test.com',
      displayName: 'Alice',
      createdAt: new Date(),
      preferences: { theme: 'light' },
      stats: { totalTasks: 0 }
    }));
  });

  test('user cannot create profile with wrong userId', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@test.com' });
    const aliceDoc = alice.firestore().doc('users/alice');
    
    await assertFails(aliceDoc.set({
      userId: 'bob', // Wrong userId
      email: 'alice@test.com',
      displayName: 'Alice',
      createdAt: new Date()
    }));
  });
});

describe('Task Subcollection Access', () => {
  test('user can create task in their own collection', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const taskDoc = alice.firestore().doc('users/alice/tasks/task1');
    
    await assertSucceeds(taskDoc.set({
      taskId: 'task1',
      title: 'Test Task',
      userId: 'alice',
      completed: false,
      createdAt: new Date()
    }));
  });

  test('user cannot create task in another user collection', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const taskDoc = alice.firestore().doc('users/bob/tasks/task1');
    
    await assertFails(taskDoc.set({
      taskId: 'task1',
      title: 'Test Task',
      userId: 'alice',
      completed: false,
      createdAt: new Date()
    }));
  });

  test('user cannot create task with invalid data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const taskDoc = alice.firestore().doc('users/alice/tasks/task1');
    
    // Missing required fields
    await assertFails(taskDoc.set({
      title: 'Test Task'
    }));
    
    // Title too long
    await assertFails(taskDoc.set({
      taskId: 'task1',
      title: 'a'.repeat(201), // > 200 chars
      userId: 'alice',
      createdAt: new Date()
    }));
  });
});

describe('Tag Subcollection Access', () => {
  test('user can create tag with valid data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const tagDoc = alice.firestore().doc('users/alice/tags/tag1');
    
    await assertSucceeds(tagDoc.set({
      tagId: 'tag1',
      name: 'work',
      displayName: 'Work',
      userId: 'alice',
      createdAt: new Date(),
      color: '#3B82F6',
      usageCount: 0
    }));
  });

  test('user cannot create tag with invalid name', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const tagDoc = alice.firestore().doc('users/alice/tags/tag1');
    
    // Name too long
    await assertFails(tagDoc.set({
      tagId: 'tag1',
      name: 'a'.repeat(31), // > 30 chars
      displayName: 'Work',
      userId: 'alice',
      createdAt: new Date()
    }));
  });
});

describe('Cross-Collection Access', () => {
  test('user cannot access root collections', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const rootDoc = alice.firestore().doc('root/document');
    
    await assertFails(rootDoc.get());
    await assertFails(rootDoc.set({ data: 'test' }));
  });
});