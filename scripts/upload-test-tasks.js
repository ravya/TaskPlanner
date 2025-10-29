/**
 * Script to upload test tasks to Firebase emulator
 * Run with: node scripts/upload-test-tasks.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');
const { connectAuthEmulator } = require('firebase/auth');

// Firebase config for emulator (must match web/.env.local)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-taskflow",
  storageBucket: "demo-taskflow.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';

// Tasks data
const tasksOct28 = [
  {
    title: 'Upload vishal solr site',
    description: '',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'medium',
    tags: ['work'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Complete all easy google programming questions',
    description: '',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'high',
    tags: ['programming', 'practice'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Start with 1-3 medium google programming questions',
    description: '',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'high',
    tags: ['programming', 'practice'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Practise code review with claude',
    description: '',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'medium',
    tags: ['learning', 'practice'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Research for stocks: Jain recycling',
    description: 'Research about Jain recycling stock',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'medium',
    tags: ['research', 'stocks'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Research for stocks: epack fab',
    description: 'Research about epack fab stock',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'medium',
    tags: ['research', 'stocks'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Laundry (UW)',
    description: '',
    startDate: '2025-10-28',
    status: 'completed',
    priority: 'low',
    tags: ['personal', 'chores'],
    isRepeating: false,
    completed: true
  },
  {
    title: 'Clean up dining table',
    description: '',
    startDate: '2025-10-28',
    status: 'todo',
    priority: 'low',
    tags: ['personal', 'chores'],
    isRepeating: false,
    completed: false
  }
];

const tasksOct29 = [
  {
    title: 'Try to do all medium google programming questions',
    description: '',
    startDate: '2025-10-29',
    status: 'todo',
    priority: 'high',
    tags: ['programming', 'practice'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Carbon credit research',
    description: '',
    startDate: '2025-10-29',
    status: 'todo',
    priority: 'medium',
    tags: ['research'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Part time job',
    description: '',
    startDate: '2025-10-29',
    status: 'todo',
    priority: 'high',
    tags: ['work'],
    isRepeating: false,
    completed: false
  },
  {
    title: 'Laundry (bedsheets)',
    description: '',
    startDate: '2025-10-29',
    status: 'todo',
    priority: 'low',
    tags: ['personal', 'chores'],
    isRepeating: false,
    completed: false
  }
];

async function createOrLoginUser() {
  try {
    console.log('Attempting to sign in as test user...');
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log('✓ Signed in successfully as:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      console.log('Test user not found. Creating new test user...');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        console.log('✓ Test user created successfully:', userCredential.user.email);

        // Create user profile document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          userId: userCredential.user.uid,
          email: TEST_EMAIL,
          displayName: 'Test User',
          photoURL: null,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          preferences: {
            theme: 'light',
            notifications: true,
            timezone: 'America/Los_Angeles',
            defaultNotificationTime: 60,
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h'
          },
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            activeTasks: 0,
            overdueTasks: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageCompletionTime: 0,
            totalTimeTracked: 0
          },
          isActive: true,
          version: 1
        });
        console.log('✓ User profile created in Firestore');

        return userCredential.user;
      } catch (createError) {
        console.error('✗ Failed to create test user:', createError.message);
        throw createError;
      }
    } else {
      console.error('✗ Failed to sign in:', error.message);
      throw error;
    }
  }
}

async function uploadTask(userId, taskData) {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();

  const task = {
    taskId,
    title: taskData.title,
    description: taskData.description,
    completed: taskData.completed,
    status: taskData.completed ? 'completed' : 'active',
    priority: taskData.priority,
    tags: taskData.tags,
    startDate: taskData.startDate, // Keep as string for dashboard filtering
    startTime: null,
    dueDate: taskData.startDate ? new Date(taskData.startDate) : null,
    dueTime: null,
    hasDeadline: !!taskData.startDate,
    isOverdue: false,
    isRepeating: taskData.isRepeating || false,
    notificationSettings: {
      enabled: true,
      times: [60],
      sentNotifications: []
    },
    timeTracking: {
      totalPaused: 0
    },
    createdAt: now,
    updatedAt: now,
    completedAt: taskData.completed ? now : null,
    archivedAt: null,
    lastSyncedAt: now,
    version: 1,
    isDeleted: false,
    userId
  };

  await setDoc(doc(db, 'tasks', taskId), task);
  return taskId;
}

async function main() {
  try {
    console.log('\n📋 TaskPlanner - Test Data Upload Script');
    console.log('=========================================\n');

    // Step 1: Create or login test user
    const user = await createOrLoginUser();
    const userId = user.uid;

    // Step 2: Upload tasks for Oct 28
    console.log('\n📅 Uploading tasks for October 28, 2025...');
    for (const task of tasksOct28) {
      const taskId = await uploadTask(userId, task);
      const status = task.completed ? '✓' : '○';
      console.log(`  ${status} ${task.title}`);
    }
    console.log(`✓ Uploaded ${tasksOct28.length} tasks for Oct 28`);

    // Step 3: Upload tasks for Oct 29
    console.log('\n📅 Uploading tasks for October 29, 2025...');
    for (const task of tasksOct29) {
      const taskId = await uploadTask(userId, task);
      console.log(`  ○ ${task.title}`);
    }
    console.log(`✓ Uploaded ${tasksOct29.length} tasks for Oct 29`);

    console.log('\n✅ All tasks uploaded successfully!');
    console.log('\n🌐 You can now test the app at:');
    console.log('   Website: http://127.0.0.1:3000');
    console.log('   Emulator UI: http://127.0.0.1:4000');
    console.log('\n📧 Test user credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure Firebase emulators are running with: npm start');
    process.exit(1);
  }
}

main();
