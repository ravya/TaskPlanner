/**
 * Test Helpers for TaskFlow Functions
 * Common utilities and data generators for testing
 */
import { Task, CreateTaskData, UpdateTaskData, CreateTagData } from '../../types';
/**
 * Generate realistic task data for testing
 */
export declare class TaskTestDataGenerator {
    static generateCreateTaskData(overrides?: Partial<CreateTaskData>): CreateTaskData;
    static generateUpdateTaskData(overrides?: Partial<UpdateTaskData>): UpdateTaskData;
    static generateTask(overrides?: Partial<Task>): Task;
    static generateMultipleTasks(count: number, baseOverrides?: Partial<Task>): Task[];
}
/**
 * Generate tag data for testing
 */
export declare class TagTestDataGenerator {
    static generateCreateTagData(overrides?: Partial<CreateTagData>): CreateTagData;
}
/**
 * Mock Firebase document snapshot
 */
export declare function createMockDocumentSnapshot(data: any, exists?: boolean): any;
/**
 * Mock Firebase query snapshot
 */
export declare function createMockQuerySnapshot(docs: any[]): any;
/**
 * Mock Firebase document reference
 */
export declare function createMockDocumentReference(id?: string): any;
/**
 * Mock Firebase collection reference
 */
export declare function createMockCollectionReference(): any;
/**
 * Mock Firestore instance
 */
export declare function createMockFirestore(): any;
/**
 * Mock Express Request object
 */
export declare function createMockRequest(overrides?: any): any;
/**
 * Mock Express Response object
 */
export declare function createMockResponse(): any;
/**
 * Assert task object has required fields
 */
export declare function assertTaskShape(task: any): void;
/**
 * Assert service result has success structure
 */
export declare function assertServiceResult(result: any, shouldSucceed?: boolean): void;
/**
 * Assert HTTP response structure
 */
export declare function assertHttpResponse(mockResponse: any, expectedStatus: number): void;
/**
 * Create date relative to now
 */
export declare function createRelativeDate(daysFromNow: number): Date;
/**
 * Create overdue date
 */
export declare function createOverdueDate(): Date;
/**
 * Create future date
 */
export declare function createFutureDate(): Date;
/**
 * Create mock Firebase error
 */
export declare function createFirebaseError(code: string, message: string): Error;
//# sourceMappingURL=testHelpers.d.ts.map