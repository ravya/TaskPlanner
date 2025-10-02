/**
 * Firebase Admin SDK Mocks
 * Mock implementations for isolated testing
 */

import { createMockFirestore, createMockDocumentReference, createMockCollectionReference } from '../helpers/testHelpers';

// =============================================================================
// FIRESTORE MOCKS
// =============================================================================

export const mockFirestore = createMockFirestore();

// Mock specific Firestore methods for detailed control
export const mockCollection = jest.fn().mockReturnValue(createMockCollectionReference());
export const mockDoc = jest.fn().mockReturnValue(createMockDocumentReference());

// Batch operations mock
export const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined)
};

// Transaction mock
export const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

// =============================================================================
// AUTH MOCKS
// =============================================================================

export const mockAuth = {
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

export const mockMessaging = {
  send: jest.fn(),
  sendMulticast: jest.fn(),
  sendAll: jest.fn(),
  subscribeToTopic: jest.fn(),
  unsubscribeFromTopic: jest.fn()
};

// =============================================================================
// ADMIN SDK MOCK
// =============================================================================

const mockFirestoreConstructor = jest.fn(() => mockFirestore);
const mockAuthConstructor = jest.fn(() => mockAuth);

// Add static properties to the constructors
(mockFirestoreConstructor as any).Timestamp = {
  now: jest.fn(() => ({
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0
  })),
  fromDate: jest.fn((date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0
  }))
};

(mockFirestoreConstructor as any).FieldValue = {
  increment: jest.fn((value: number) => ({ _methodName: 'increment', _operand: value })),
  arrayUnion: jest.fn((...values: any[]) => ({ _methodName: 'arrayUnion', _elements: values })),
  arrayRemove: jest.fn((...values: any[]) => ({ _methodName: 'arrayRemove', _elements: values })),
  delete: jest.fn(() => ({ _methodName: 'delete' })),
  serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
};

const mockAdmin = {
  firestore: mockFirestoreConstructor,
  auth: mockAuthConstructor,
  messaging: jest.fn(() => mockMessaging),
  initializeApp: jest.fn(),
  apps: [],
};

// =============================================================================
// MOCK SETUP HELPERS
// =============================================================================

/**
 * Reset all mocks to clean state
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
  
  // Reset Firestore mocks
  mockFirestore.collection.mockReturnValue(createMockCollectionReference());
  mockFirestore.doc.mockReturnValue(createMockDocumentReference());
  mockFirestore.batch.mockReturnValue(mockBatch);
  
  // Reset Auth mocks
  mockAuth.verifyIdToken.mockResolvedValue({
    uid: 'test-user-123',
    email: 'test@taskflow.dev',
    email_verified: true
  });
  
  mockAuth.createCustomToken.mockResolvedValue('mock-custom-token');
}

/**
 * Mock successful Firestore operations
 */
export function mockFirestoreSuccess(): void {
  mockFirestore.collection.mockReturnValue({
    doc: mockDoc.mockReturnValue({
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
export function mockFirestoreError(errorCode = 'permission-denied'): void {
  const error = new Error('Mock Firestore error') as any;
  error.code = errorCode;
  
  mockFirestore.collection.mockReturnValue({
    doc: mockDoc.mockReturnValue({
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
export function mockAuthSuccess(uid = 'test-user-123'): void {
  mockAuth.verifyIdToken.mockResolvedValue({
    uid,
    email: 'test@taskflow.dev',
    email_verified: true
  });
}

/**
 * Mock authentication failure
 */
export function mockAuthFailure(errorCode = 'auth/id-token-expired'): void {
  const error = new Error('Mock auth error') as any;
  error.code = errorCode;
  
  mockAuth.verifyIdToken.mockRejectedValue(error);
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

export default mockAdmin;