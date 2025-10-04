"use strict";
/**
 * Firebase Admin SDK Mocks
 * Mock implementations for isolated testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockMessaging = exports.mockAuth = exports.mockTransaction = exports.mockBatch = exports.mockDoc = exports.mockCollection = exports.mockFirestore = void 0;
exports.resetAllMocks = resetAllMocks;
exports.mockFirestoreSuccess = mockFirestoreSuccess;
exports.mockFirestoreError = mockFirestoreError;
exports.mockAuthSuccess = mockAuthSuccess;
exports.mockAuthFailure = mockAuthFailure;
const testHelpers_1 = require("../helpers/testHelpers");
// =============================================================================
// FIRESTORE MOCKS
// =============================================================================
exports.mockFirestore = (0, testHelpers_1.createMockFirestore)();
// Mock specific Firestore methods for detailed control
exports.mockCollection = jest.fn().mockReturnValue((0, testHelpers_1.createMockCollectionReference)());
exports.mockDoc = jest.fn().mockReturnValue((0, testHelpers_1.createMockDocumentReference)());
// Batch operations mock
exports.mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
};
// Transaction mock
exports.mockTransaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};
// =============================================================================
// AUTH MOCKS
// =============================================================================
exports.mockAuth = {
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    createCustomToken: jest.fn(),
    verifyIdToken: jest.fn(),
    setCustomUserClaims: jest.fn()
};
// =============================================================================
// MESSAGING MOCKS
// =============================================================================
exports.mockMessaging = {
    send: jest.fn(),
    sendMulticast: jest.fn(),
    sendAll: jest.fn(),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn()
};
// =============================================================================
// ADMIN SDK MOCK
// =============================================================================
const mockFirestoreConstructor = jest.fn(() => exports.mockFirestore);
const mockAuthConstructor = jest.fn(() => exports.mockAuth);
// Add static properties to the constructors
mockFirestoreConstructor.Timestamp = {
    now: jest.fn(() => ({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
    })),
    fromDate: jest.fn((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0
    }))
};
mockFirestoreConstructor.FieldValue = {
    increment: jest.fn((value) => ({ _methodName: 'increment', _operand: value })),
    arrayUnion: jest.fn((...values) => ({ _methodName: 'arrayUnion', _elements: values })),
    arrayRemove: jest.fn((...values) => ({ _methodName: 'arrayRemove', _elements: values })),
    delete: jest.fn(() => ({ _methodName: 'delete' })),
    serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
};
const mockAdmin = {
    firestore: mockFirestoreConstructor,
    auth: mockAuthConstructor,
    messaging: jest.fn(() => exports.mockMessaging),
    initializeApp: jest.fn(),
    apps: [],
};
// =============================================================================
// MOCK SETUP HELPERS
// =============================================================================
/**
 * Reset all mocks to clean state
 */
function resetAllMocks() {
    jest.clearAllMocks();
    // Reset Firestore mocks
    exports.mockFirestore.collection.mockReturnValue((0, testHelpers_1.createMockCollectionReference)());
    exports.mockFirestore.doc.mockReturnValue((0, testHelpers_1.createMockDocumentReference)());
    exports.mockFirestore.batch.mockReturnValue(exports.mockBatch);
    // Reset Auth mocks
    exports.mockAuth.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@taskflow.dev',
        email_verified: true
    });
    exports.mockAuth.createCustomToken.mockResolvedValue('mock-custom-token');
}
/**
 * Mock successful Firestore operations
 */
function mockFirestoreSuccess() {
    exports.mockFirestore.collection.mockReturnValue({
        doc: exports.mockDoc.mockReturnValue({
            set: jest.fn().mockResolvedValue(undefined),
            get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({ id: 'mock-id', title: 'Mock Task' })
            }),
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined)
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
            empty: false,
            size: 1,
            docs: [{
                    id: 'mock-doc-id',
                    data: () => ({ id: 'mock-doc-id', title: 'Mock Task' }),
                    exists: true
                }]
        })
    });
}
/**
 * Mock Firestore errors
 */
function mockFirestoreError(errorCode = 'permission-denied') {
    const error = new Error('Mock Firestore error');
    error.code = errorCode;
    exports.mockFirestore.collection.mockReturnValue({
        doc: exports.mockDoc.mockReturnValue({
            set: jest.fn().mockRejectedValue(error),
            get: jest.fn().mockRejectedValue(error),
            update: jest.fn().mockRejectedValue(error),
            delete: jest.fn().mockRejectedValue(error)
        }),
        get: jest.fn().mockRejectedValue(error)
    });
}
/**
 * Mock authentication success
 */
function mockAuthSuccess(uid = 'test-user-123') {
    exports.mockAuth.verifyIdToken.mockResolvedValue({
        uid,
        email: 'test@taskflow.dev',
        email_verified: true
    });
}
/**
 * Mock authentication failure
 */
function mockAuthFailure(errorCode = 'auth/id-token-expired') {
    const error = new Error('Mock auth error');
    error.code = errorCode;
    exports.mockAuth.verifyIdToken.mockRejectedValue(error);
}
// =============================================================================
// JEST MODULE MOCKS
// =============================================================================
// Mock the entire firebase-admin module
jest.mock('firebase-admin', () => mockAdmin);
// Mock firebase-functions for testing
jest.mock('firebase-functions', () => ({
    https: {
        onRequest: jest.fn((handler) => handler)
    },
    firestore: {
        document: jest.fn(() => ({
            onCreate: jest.fn(),
            onUpdate: jest.fn(),
            onDelete: jest.fn()
        }))
    },
    pubsub: {
        schedule: jest.fn(() => ({
            timeZone: jest.fn().mockReturnThis(),
            onRun: jest.fn()
        }))
    },
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
exports.default = mockAdmin;
//# sourceMappingURL=firebase.mock.js.map