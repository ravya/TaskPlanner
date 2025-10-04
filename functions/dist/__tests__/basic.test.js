"use strict";
/**
 * Basic Test Suite
 * Simple working tests to verify Jest and Firebase setup
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
// Import the mock setup
require("./mocks/firebase.mock");
describe('Basic Test Suite', () => {
    test('should pass basic arithmetic test', () => {
        expect(1 + 1).toBe(2);
        expect('hello'.toUpperCase()).toBe('HELLO');
    });
    test('should have Jest globals available', () => {
        expect(expect).toBeDefined();
        expect(describe).toBeDefined();
        expect(test).toBeDefined();
        expect(beforeEach).toBeDefined();
        expect(afterEach).toBeDefined();
    });
    test('should mock firebase-admin module', () => {
        const admin = require('firebase-admin');
        expect(admin).toBeDefined();
        expect(admin.firestore).toBeDefined();
        expect(admin.auth).toBeDefined();
        expect(admin.initializeApp).toBeDefined();
    });
    test('should have firebase-admin mocks working', () => {
        const admin = require('firebase-admin');
        // Test firestore mock
        const db = admin.firestore();
        expect(db).toBeDefined();
        expect(typeof db.collection).toBe('function');
        // Test auth mock  
        const auth = admin.auth();
        expect(auth).toBeDefined();
        expect(typeof auth.verifyIdToken).toBe('function');
    });
    test('should have Faker available for test data', async () => {
        const { faker } = await Promise.resolve().then(() => __importStar(require('@faker-js/faker')));
        expect(faker).toBeDefined();
        expect(typeof faker.lorem.word).toBe('function');
        expect(typeof faker.internet.email).toBe('function');
        // Generate some test data to verify it works
        const email = faker.internet.email();
        const word = faker.lorem.word();
        expect(typeof email).toBe('string');
        expect(email.includes('@')).toBe(true);
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
    });
    test('should handle async operations', async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const start = Date.now();
        await delay(10);
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(10);
    });
    test('should have supertest available', async () => {
        const request = await Promise.resolve().then(() => __importStar(require('supertest')));
        expect(request.default).toBeDefined();
        expect(typeof request.default).toBe('function');
    });
});
//# sourceMappingURL=basic.test.js.map