"use strict";
/**
 * TaskFlow Functions Constants
 * Constants specific to Cloud Functions
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIME_MS = exports.CONTENT_LIMITS = exports.API_VERSION = exports.FEATURE_FLAGS = exports.ENVIRONMENT = exports.DATA_RETENTION = exports.ANALYTICS_CONFIG = exports.SECURITY_CONFIG = exports.FILE_LIMITS = exports.RETRY_CONFIG = exports.FCM_CONFIG = exports.JOB_INTERVALS = exports.RATE_LIMITS = exports.CACHE_DURATIONS = exports.BATCH_LIMITS = exports.HTTP_STATUS = exports.API_RESPONSES = exports.FUNCTION_CONFIG = void 0;
// Re-export types constants for convenience
__exportStar(require("../types"), exports);
// Function-specific constants
exports.FUNCTION_CONFIG = {
    REGION: 'us-central1',
    MEMORY: '256MB',
    TIMEOUT: 60, // seconds
    MAX_INSTANCES: 100,
};
// API Response constants
exports.API_RESPONSES = {
    SUCCESS: 'success',
    ERROR: 'error',
};
// HTTP Status codes
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
// Batch operation limits
exports.BATCH_LIMITS = {
    FIRESTORE_WRITE: 500,
    FIRESTORE_READ: 500,
    FCM_MULTICAST: 500,
    NOTIFICATION_PROCESSING: 100,
};
// Cache durations (in seconds)
exports.CACHE_DURATIONS = {
    USER_PROFILE: 300, // 5 minutes
    TASK_LIST: 60, // 1 minute
    TAG_LIST: 300, // 5 minutes
    STATISTICS: 900, // 15 minutes
};
// Rate limiting
exports.RATE_LIMITS = {
    TASKS_PER_MINUTE: 30,
    TAGS_PER_MINUTE: 10,
    NOTIFICATIONS_PER_MINUTE: 5,
};
// Background job intervals (in minutes)
exports.JOB_INTERVALS = {
    NOTIFICATION_PROCESSING: 5,
    OVERDUE_TASK_CHECK: 60,
    USER_STATS_UPDATE: 1440, // daily
    CLEANUP_OLD_DATA: 1440, // daily
};
// Notification settings
exports.FCM_CONFIG = {
    ANDROID_CHANNEL_ID: 'taskflow_reminders',
    WEB_ICON: '/icons/icon-192x192.png',
    WEB_BADGE: '/icons/badge-72x72.png',
    DEFAULT_SOUND: 'default',
    PRIORITY: 'high',
};
// Retry configuration
exports.RETRY_CONFIG = {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2,
};
// File size limits (in bytes)
exports.FILE_LIMITS = {
    PROFILE_PHOTO: 5 * 1024 * 1024, // 5MB
    ATTACHMENT: 10 * 1024 * 1024, // 10MB
};
// Security settings
exports.SECURITY_CONFIG = {
    TOKEN_EXPIRY: 3600, // 1 hour
    REFRESH_TOKEN_EXPIRY: 86400 * 30, // 30 days
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15 minutes
};
// Analytics and metrics
exports.ANALYTICS_CONFIG = {
    SAMPLE_RATE: 0.1, // 10% sampling
    BATCH_SIZE: 100,
    FLUSH_INTERVAL: 10000, // 10 seconds
};
// Data retention policies (in days)
exports.DATA_RETENTION = {
    COMPLETED_TASKS: 365, // 1 year
    SENT_NOTIFICATIONS: 30, // 1 month
    ERROR_LOGS: 90, // 3 months
    USER_ACTIVITY: 180, // 6 months
};
// Environment-specific settings
exports.ENVIRONMENT = {
    PRODUCTION: 'production',
    STAGING: 'staging',
    DEVELOPMENT: 'development',
    TEST: 'test',
};
// Feature flags
exports.FEATURE_FLAGS = {
    ENABLE_ANALYTICS: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_TIME_TRACKING: true,
    ENABLE_TAG_SUGGESTIONS: true,
    ENABLE_BULK_OPERATIONS: false, // Coming soon
};
// API versioning
exports.API_VERSION = {
    CURRENT: 'v1',
    SUPPORTED: ['v1'],
};
// Content limits
exports.CONTENT_LIMITS = {
    TASK_TITLE_MIN: 1,
    TASK_TITLE_MAX: 200,
    TASK_DESCRIPTION_MAX: 2000,
    TAG_NAME_MIN: 1,
    TAG_NAME_MAX: 30,
    SEARCH_QUERY_MIN: 1,
    SEARCH_QUERY_MAX: 100,
};
// Time constants (in milliseconds)
exports.TIME_MS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
};
//# sourceMappingURL=constants.js.map