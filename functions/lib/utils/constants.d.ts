/**
 * TaskFlow Functions Constants
 * Constants specific to Cloud Functions
 */
export * from '../types';
export declare const FUNCTION_CONFIG: {
    readonly REGION: "us-central1";
    readonly MEMORY: "256MB";
    readonly TIMEOUT: 60;
    readonly MAX_INSTANCES: 100;
};
export declare const API_RESPONSES: {
    readonly SUCCESS: "success";
    readonly ERROR: "error";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const BATCH_LIMITS: {
    readonly FIRESTORE_WRITE: 500;
    readonly FIRESTORE_READ: 500;
    readonly FCM_MULTICAST: 500;
    readonly NOTIFICATION_PROCESSING: 100;
};
export declare const CACHE_DURATIONS: {
    readonly USER_PROFILE: 300;
    readonly TASK_LIST: 60;
    readonly TAG_LIST: 300;
    readonly STATISTICS: 900;
};
export declare const RATE_LIMITS: {
    readonly TASKS_PER_MINUTE: 30;
    readonly TAGS_PER_MINUTE: 10;
    readonly NOTIFICATIONS_PER_MINUTE: 5;
};
export declare const JOB_INTERVALS: {
    readonly NOTIFICATION_PROCESSING: 5;
    readonly OVERDUE_TASK_CHECK: 60;
    readonly USER_STATS_UPDATE: 1440;
    readonly CLEANUP_OLD_DATA: 1440;
};
export declare const FCM_CONFIG: {
    readonly ANDROID_CHANNEL_ID: "taskflow_reminders";
    readonly WEB_ICON: "/icons/icon-192x192.png";
    readonly WEB_BADGE: "/icons/badge-72x72.png";
    readonly DEFAULT_SOUND: "default";
    readonly PRIORITY: "high";
};
export declare const RETRY_CONFIG: {
    readonly MAX_ATTEMPTS: 3;
    readonly INITIAL_DELAY: 1000;
    readonly MAX_DELAY: 10000;
    readonly BACKOFF_MULTIPLIER: 2;
};
export declare const FILE_LIMITS: {
    readonly PROFILE_PHOTO: number;
    readonly ATTACHMENT: number;
};
export declare const SECURITY_CONFIG: {
    readonly TOKEN_EXPIRY: 3600;
    readonly REFRESH_TOKEN_EXPIRY: number;
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOCKOUT_DURATION: 900;
};
export declare const ANALYTICS_CONFIG: {
    readonly SAMPLE_RATE: 0.1;
    readonly BATCH_SIZE: 100;
    readonly FLUSH_INTERVAL: 10000;
};
export declare const DATA_RETENTION: {
    readonly COMPLETED_TASKS: 365;
    readonly SENT_NOTIFICATIONS: 30;
    readonly ERROR_LOGS: 90;
    readonly USER_ACTIVITY: 180;
};
export declare const ENVIRONMENT: {
    readonly PRODUCTION: "production";
    readonly STAGING: "staging";
    readonly DEVELOPMENT: "development";
    readonly TEST: "test";
};
export declare const FEATURE_FLAGS: {
    readonly ENABLE_ANALYTICS: true;
    readonly ENABLE_PUSH_NOTIFICATIONS: true;
    readonly ENABLE_TIME_TRACKING: true;
    readonly ENABLE_TAG_SUGGESTIONS: true;
    readonly ENABLE_BULK_OPERATIONS: false;
};
export declare const API_VERSION: {
    readonly CURRENT: "v1";
    readonly SUPPORTED: readonly ["v1"];
};
export declare const CONTENT_LIMITS: {
    readonly TASK_TITLE_MIN: 1;
    readonly TASK_TITLE_MAX: 200;
    readonly TASK_DESCRIPTION_MAX: 2000;
    readonly TAG_NAME_MIN: 1;
    readonly TAG_NAME_MAX: 30;
    readonly SEARCH_QUERY_MIN: 1;
    readonly SEARCH_QUERY_MAX: 100;
};
export declare const TIME_MS: {
    readonly SECOND: 1000;
    readonly MINUTE: number;
    readonly HOUR: number;
    readonly DAY: number;
    readonly WEEK: number;
    readonly MONTH: number;
};
//# sourceMappingURL=constants.d.ts.map