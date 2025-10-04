/**
 * Firebase Admin SDK Mocks
 * Mock implementations for isolated testing
 */
export declare const mockFirestore: any;
export declare const mockCollection: jest.Mock<any, any, any>;
export declare const mockDoc: jest.Mock<any, any, any>;
export declare const mockBatch: {
    set: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
    commit: jest.Mock<any, any, any>;
};
export declare const mockTransaction: {
    get: jest.Mock<any, any, any>;
    set: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    delete: jest.Mock<any, any, any>;
};
export declare const mockAuth: {
    getUser: jest.Mock<any, any, any>;
    createUser: jest.Mock<any, any, any>;
    updateUser: jest.Mock<any, any, any>;
    deleteUser: jest.Mock<any, any, any>;
    createCustomToken: jest.Mock<any, any, any>;
    verifyIdToken: jest.Mock<any, any, any>;
    setCustomUserClaims: jest.Mock<any, any, any>;
};
export declare const mockMessaging: {
    send: jest.Mock<any, any, any>;
    sendMulticast: jest.Mock<any, any, any>;
    sendAll: jest.Mock<any, any, any>;
    subscribeToTopic: jest.Mock<any, any, any>;
    unsubscribeFromTopic: jest.Mock<any, any, any>;
};
declare const mockAdmin: {
    firestore: jest.Mock<any, [], any>;
    auth: jest.Mock<{
        getUser: jest.Mock<any, any, any>;
        createUser: jest.Mock<any, any, any>;
        updateUser: jest.Mock<any, any, any>;
        deleteUser: jest.Mock<any, any, any>;
        createCustomToken: jest.Mock<any, any, any>;
        verifyIdToken: jest.Mock<any, any, any>;
        setCustomUserClaims: jest.Mock<any, any, any>;
    }, [], any>;
    messaging: jest.Mock<{
        send: jest.Mock<any, any, any>;
        sendMulticast: jest.Mock<any, any, any>;
        sendAll: jest.Mock<any, any, any>;
        subscribeToTopic: jest.Mock<any, any, any>;
        unsubscribeFromTopic: jest.Mock<any, any, any>;
    }, [], any>;
    initializeApp: jest.Mock<any, any, any>;
    apps: never[];
};
/**
 * Reset all mocks to clean state
 */
export declare function resetAllMocks(): void;
/**
 * Mock successful Firestore operations
 */
export declare function mockFirestoreSuccess(): void;
/**
 * Mock Firestore errors
 */
export declare function mockFirestoreError(errorCode?: string): void;
/**
 * Mock authentication success
 */
export declare function mockAuthSuccess(uid?: string): void;
/**
 * Mock authentication failure
 */
export declare function mockAuthFailure(errorCode?: string): void;
export default mockAdmin;
//# sourceMappingURL=firebase.mock.d.ts.map