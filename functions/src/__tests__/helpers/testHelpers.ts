/**
 * Test Helpers for TaskFlow Functions
 * Common utilities and data generators for testing
 */

import * as admin from 'firebase-admin';
import { faker } from '@faker-js/faker';
import { Task, CreateTaskData, UpdateTaskData, CreateTagData } from '../../types';

// =============================================================================
// DATA GENERATORS
// =============================================================================

/**
 * Generate realistic task data for testing
 */
export class TaskTestDataGenerator {
  static generateCreateTaskData(overrides: Partial<CreateTaskData> = {}): CreateTaskData {
    return {
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['todo', 'in_progress', 'completed'] as const),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high'] as const),
      tags: faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 }),
      dueDate: faker.datatype.boolean() ? faker.date.future() : undefined,
      ...overrides
    };
  }

  static generateUpdateTaskData(overrides: Partial<UpdateTaskData> = {}): UpdateTaskData {
    const updates: UpdateTaskData = {};
    
    if (faker.datatype.boolean()) updates.title = faker.lorem.words(3);
    if (faker.datatype.boolean()) updates.description = faker.lorem.sentence();
    if (faker.datatype.boolean()) updates.status = faker.helpers.arrayElement(['todo', 'in_progress', 'completed'] as const);
    if (faker.datatype.boolean()) updates.priority = faker.helpers.arrayElement(['low', 'medium', 'high'] as const);
    if (faker.datatype.boolean()) updates.tags = faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 });
    if (faker.datatype.boolean()) updates.dueDate = faker.date.future();

    return { ...updates, ...overrides };
  }

  static generateTask(overrides: Partial<Task> = {}): Task {
    const now = new Date();
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['todo', 'in_progress', 'completed'] as const),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high'] as const),
      tags: faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 }),
      dueDate: faker.datatype.boolean() ? faker.date.future() : null,
      createdAt: faker.date.past(),
      updatedAt: now,
      completedAt: null,
      ...overrides
    };
  }

  static generateMultipleTasks(count: number, baseOverrides: Partial<Task> = {}): Task[] {
    return Array.from({ length: count }, () => this.generateTask(baseOverrides));
  }
}

/**
 * Generate tag data for testing
 */
export class TagTestDataGenerator {
  static generateCreateTagData(overrides: Partial<CreateTagData> = {}): CreateTagData {
    return {
      name: faker.lorem.word(),
      color: faker.internet.color(),
      ...overrides
    };
  }
}

// =============================================================================
// FIREBASE HELPERS
// =============================================================================

/**
 * Mock Firebase document snapshot
 */
export function createMockDocumentSnapshot(data: any, exists = true): any {
  return {
    exists,
    id: faker.string.uuid(),
    ref: {
      id: faker.string.uuid(),
      path: `collection/${faker.string.uuid()}`
    },
    data: () => exists ? data : undefined,
    get: (field: string) => exists ? data[field] : undefined
  };
}

/**
 * Mock Firebase query snapshot
 */
export function createMockQuerySnapshot(docs: any[]): any {
  const mockDocs = docs.map(data => createMockDocumentSnapshot(data));
  
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: mockDocs,
    forEach: (callback: (doc: any) => void) => mockDocs.forEach(callback)
  };
}

/**
 * Mock Firebase document reference
 */
export function createMockDocumentReference(id?: string): any {
  const docId = id || faker.string.uuid();
  
  return {
    id: docId,
    path: `collection/${docId}`,
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(createMockDocumentSnapshot({}))
  };
}

/**
 * Mock Firebase collection reference  
 */
export function createMockCollectionReference(): any {
  return {
    doc: jest.fn().mockReturnValue(createMockDocumentReference()),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(createMockQuerySnapshot([])),
    add: jest.fn().mockResolvedValue(createMockDocumentReference())
  };
}

/**
 * Mock Firestore instance
 */
export function createMockFirestore(): any {
  return {
    collection: jest.fn().mockReturnValue(createMockCollectionReference()),
    doc: jest.fn().mockReturnValue(createMockDocumentReference()),
    batch: jest.fn().mockReturnValue({
      set: jest.fn(),
      update: jest.fn(), 
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    }),
    runTransaction: jest.fn().mockImplementation((fn) => fn({
      get: jest.fn().mockResolvedValue(createMockDocumentSnapshot({})),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  };
}

// =============================================================================
// HTTP HELPERS  
// =============================================================================

/**
 * Mock Express Request object
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    user: { uid: faker.string.uuid() },
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides
  };
}

/**
 * Mock Express Response object
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    locals: {}
  };
  
  return res;
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Assert task object has required fields
 */
export function assertTaskShape(task: any): void {
  expect(task).toHaveProperty('id');
  expect(task).toHaveProperty('userId');
  expect(task).toHaveProperty('title');
  expect(task).toHaveProperty('description');
  expect(task).toHaveProperty('status');
  expect(task).toHaveProperty('priority');
  expect(task).toHaveProperty('tags');
  expect(task).toHaveProperty('createdAt');
  expect(task).toHaveProperty('updatedAt');
}

/**
 * Assert service result has success structure
 */
export function assertServiceResult(result: any, shouldSucceed = true): void {
  expect(result).toHaveProperty('success');
  expect(result.success).toBe(shouldSucceed);
  
  if (shouldSucceed) {
    expect(result).toHaveProperty('data');
  } else {
    expect(result).toHaveProperty('error');
  }
}

/**
 * Assert HTTP response structure
 */
export function assertHttpResponse(mockResponse: any, expectedStatus: number): void {
  expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
  expect(mockResponse.json).toHaveBeenCalled();
}

// =============================================================================
// TIME HELPERS
// =============================================================================

/**
 * Create date relative to now
 */
export function createRelativeDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Create overdue date
 */
export function createOverdueDate(): Date {
  return createRelativeDate(-faker.number.int({ min: 1, max: 30 }));
}

/**
 * Create future date
 */
export function createFutureDate(): Date {
  return createRelativeDate(faker.number.int({ min: 1, max: 365 }));
}

// =============================================================================
// ERROR HELPERS
// =============================================================================

/**
 * Create mock Firebase error
 */
export function createFirebaseError(code: string, message: string): Error {
  const error = new Error(message) as any;
  error.code = code;
  return error;
}