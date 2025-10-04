/**
 * Jest Test Setup for TaskFlow Functions
 * Configures Firebase emulators and test environment
 */
import * as admin from 'firebase-admin';
/**
 * Clear all Firestore data for clean test state
 */
export declare function clearFirestoreData(): Promise<void>;
/**
 * Create test user with authentication
 */
export declare function createTestUser(userData: {
    uid: string;
    email: string;
    displayName?: string;
}): Promise<admin.auth.UserRecord>;
/**
 * Generate custom auth token for testing
 */
export declare function generateTestToken(uid: string): Promise<string>;
/**
 * Wait for async operations to complete
 */
export declare function waitFor(ms: number): Promise<void>;
export declare const TEST_CONSTANTS: {
    TEST_USER_ID: string;
    TEST_USER_EMAIL: string;
    TEST_ADMIN_ID: string;
    TEST_ADMIN_EMAIL: string;
    SAMPLE_TASK: {
        title: string;
        description: string;
        status: "todo";
        priority: "medium";
        tags: string[];
        dueDate: null;
    };
    SAMPLE_TAG: {
        name: string;
        color: string;
    };
};
//# sourceMappingURL=setup.d.ts.map