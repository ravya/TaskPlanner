"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.createTaskFlowSDK = exports.TaskFlowSDK = exports.SyncManager = exports.TagService = exports.TaskService = exports.AuthService = void 0;
/**
 * TaskFlow Client SDK
 * Main entry point for the TaskFlow client SDK
 */
// Export all types
__exportStar(require("./types"), exports);
// Export client services
var authService_1 = require("./services/authService");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return authService_1.AuthService; } });
var taskService_1 = require("./services/taskService");
Object.defineProperty(exports, "TaskService", { enumerable: true, get: function () { return taskService_1.TaskService; } });
var tagService_1 = require("./services/tagService");
Object.defineProperty(exports, "TagService", { enumerable: true, get: function () { return tagService_1.TagService; } });
var syncManager_1 = require("./services/syncManager");
Object.defineProperty(exports, "SyncManager", { enumerable: true, get: function () { return syncManager_1.SyncManager; } });
// Export SDK configuration
var taskflowSDK_1 = require("./taskflowSDK");
Object.defineProperty(exports, "TaskFlowSDK", { enumerable: true, get: function () { return taskflowSDK_1.TaskFlowSDK; } });
Object.defineProperty(exports, "createTaskFlowSDK", { enumerable: true, get: function () { return taskflowSDK_1.createTaskFlowSDK; } });
/**
 * Default SDK configuration
 */
exports.DEFAULT_CONFIG = {
    apiBaseUrl: 'https://us-central1-taskflow-mvp.cloudfunctions.net/api',
    enableOfflineSync: true,
    enableAnalytics: false,
    logLevel: 'warn',
    syncInterval: 30000, // 30 seconds
    maxRetries: 3,
};
//# sourceMappingURL=index.js.map