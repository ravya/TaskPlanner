"use strict";
/**
 * Jest Test Setup for TaskFlow Functions
 * Configures Firebase emulators and test environment
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
exports.TEST_CONSTANTS = void 0;
exports.clearFirestoreData = clearFirestoreData;
exports.createTestUser = createTestUser;
exports.generateTestToken = generateTestToken;
exports.waitFor = waitFor;
const admin = __importStar(require("firebase-admin"));
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin for testing
if (!admin.apps.length) {
    (0, app_1.initializeApp)({
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
async function clearFirestoreData() {
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
    }
    catch (error) {
        console.warn('Warning: Could not clear Firestore data:', error);
    }
}
/**
 * Create test user with authentication
 */
async function createTestUser(userData) {
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
    }
    catch (error) {
        console.error('Error creating test user:', error);
        throw error;
    }
}
/**
 * Generate custom auth token for testing
 */
async function generateTestToken(uid) {
    const auth = admin.auth();
    return await auth.createCustomToken(uid);
}
/**
 * Wait for async operations to complete
 */
function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Export commonly used test constants
exports.TEST_CONSTANTS = {
    TEST_USER_ID: 'test-user-123',
    TEST_USER_EMAIL: 'test@taskflow.dev',
    TEST_ADMIN_ID: 'admin-user-123',
    TEST_ADMIN_EMAIL: 'admin@taskflow.dev',
    // Sample task data
    SAMPLE_TASK: {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'todo',
        priority: 'medium',
        tags: ['test'],
        dueDate: null,
    },
    // Sample tag data
    SAMPLE_TAG: {
        name: 'test-tag',
        color: '#3B82F6',
    },
};
//# sourceMappingURL=setup.js.map