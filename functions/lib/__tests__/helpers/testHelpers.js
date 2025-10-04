"use strict";
/**
 * Test Helpers for TaskFlow Functions
 * Common utilities and data generators for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagTestDataGenerator = exports.TaskTestDataGenerator = void 0;
exports.createMockDocumentSnapshot = createMockDocumentSnapshot;
exports.createMockQuerySnapshot = createMockQuerySnapshot;
exports.createMockDocumentReference = createMockDocumentReference;
exports.createMockCollectionReference = createMockCollectionReference;
exports.createMockFirestore = createMockFirestore;
exports.createMockRequest = createMockRequest;
exports.createMockResponse = createMockResponse;
exports.assertTaskShape = assertTaskShape;
exports.assertServiceResult = assertServiceResult;
exports.assertHttpResponse = assertHttpResponse;
exports.createRelativeDate = createRelativeDate;
exports.createOverdueDate = createOverdueDate;
exports.createFutureDate = createFutureDate;
exports.createFirebaseError = createFirebaseError;
const faker_1 = require("@faker-js/faker");
// =============================================================================
// DATA GENERATORS
// =============================================================================
/**
 * Generate realistic task data for testing
 */
class TaskTestDataGenerator {
    static generateCreateTaskData(overrides = {}) {
        return {
            title: faker_1.faker.lorem.words(3),
            description: faker_1.faker.lorem.sentence(),
            status: faker_1.faker.helpers.arrayElement(['todo', 'in_progress', 'completed']),
            priority: faker_1.faker.helpers.arrayElement(['low', 'medium', 'high']),
            tags: faker_1.faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 }),
            dueDate: faker_1.faker.datatype.boolean() ? faker_1.faker.date.future() : undefined,
            ...overrides
        };
    }
    static generateUpdateTaskData(overrides = {}) {
        const updates = {};
        if (faker_1.faker.datatype.boolean())
            updates.title = faker_1.faker.lorem.words(3);
        if (faker_1.faker.datatype.boolean())
            updates.description = faker_1.faker.lorem.sentence();
        if (faker_1.faker.datatype.boolean())
            updates.status = faker_1.faker.helpers.arrayElement(['todo', 'in_progress', 'completed']);
        if (faker_1.faker.datatype.boolean())
            updates.priority = faker_1.faker.helpers.arrayElement(['low', 'medium', 'high']);
        if (faker_1.faker.datatype.boolean())
            updates.tags = faker_1.faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 });
        if (faker_1.faker.datatype.boolean())
            updates.dueDate = faker_1.faker.date.future();
        return { ...updates, ...overrides };
    }
    static generateTask(overrides = {}) {
        const now = new Date();
        return {
            id: faker_1.faker.string.uuid(),
            userId: faker_1.faker.string.uuid(),
            title: faker_1.faker.lorem.words(3),
            description: faker_1.faker.lorem.sentence(),
            status: faker_1.faker.helpers.arrayElement(['todo', 'in_progress', 'completed']),
            priority: faker_1.faker.helpers.arrayElement(['low', 'medium', 'high']),
            tags: faker_1.faker.helpers.arrayElements(['work', 'personal', 'urgent'], { min: 0, max: 3 }),
            dueDate: faker_1.faker.datatype.boolean() ? faker_1.faker.date.future() : null,
            createdAt: faker_1.faker.date.past(),
            updatedAt: now,
            completedAt: null,
            ...overrides
        };
    }
    static generateMultipleTasks(count, baseOverrides = {}) {
        return Array.from({ length: count }, () => this.generateTask(baseOverrides));
    }
}
exports.TaskTestDataGenerator = TaskTestDataGenerator;
/**
 * Generate tag data for testing
 */
class TagTestDataGenerator {
    static generateCreateTagData(overrides = {}) {
        return {
            name: faker_1.faker.lorem.word(),
            color: faker_1.faker.internet.color(),
            ...overrides
        };
    }
}
exports.TagTestDataGenerator = TagTestDataGenerator;
// =============================================================================
// FIREBASE HELPERS
// =============================================================================
/**
 * Mock Firebase document snapshot
 */
function createMockDocumentSnapshot(data, exists = true) {
    return {
        exists,
        id: faker_1.faker.string.uuid(),
        ref: {
            id: faker_1.faker.string.uuid(),
            path: `collection/${faker_1.faker.string.uuid()}`
        },
        data: () => exists ? data : undefined,
        get: (field) => exists ? data[field] : undefined
    };
}
/**
 * Mock Firebase query snapshot
 */
function createMockQuerySnapshot(docs) {
    const mockDocs = docs.map(data => createMockDocumentSnapshot(data));
    return {
        empty: docs.length === 0,
        size: docs.length,
        docs: mockDocs,
        forEach: (callback) => mockDocs.forEach(callback)
    };
}
/**
 * Mock Firebase document reference
 */
function createMockDocumentReference(id) {
    const docId = id || faker_1.faker.string.uuid();
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
function createMockCollectionReference() {
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
function createMockFirestore() {
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
function createMockRequest(overrides = {}) {
    return {
        user: { uid: faker_1.faker.string.uuid() },
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
function createMockResponse() {
    const res = {
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
function assertTaskShape(task) {
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
function assertServiceResult(result, shouldSucceed = true) {
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(shouldSucceed);
    if (shouldSucceed) {
        expect(result).toHaveProperty('data');
    }
    else {
        expect(result).toHaveProperty('error');
    }
}
/**
 * Assert HTTP response structure
 */
function assertHttpResponse(mockResponse, expectedStatus) {
    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    expect(mockResponse.json).toHaveBeenCalled();
}
// =============================================================================
// TIME HELPERS
// =============================================================================
/**
 * Create date relative to now
 */
function createRelativeDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
}
/**
 * Create overdue date
 */
function createOverdueDate() {
    return createRelativeDate(-faker_1.faker.number.int({ min: 1, max: 30 }));
}
/**
 * Create future date
 */
function createFutureDate() {
    return createRelativeDate(faker_1.faker.number.int({ min: 1, max: 365 }));
}
// =============================================================================
// ERROR HELPERS
// =============================================================================
/**
 * Create mock Firebase error
 */
function createFirebaseError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}
//# sourceMappingURL=testHelpers.js.map