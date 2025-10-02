/**
 * TaskFlow Functions Constants
 * Constants specific to Cloud Functions
 */

// Re-export types constants for convenience
export * from '../types';

// Function-specific constants
export const FUNCTION_CONFIG = {
  REGION: 'us-central1',
  MEMORY: '256MB' as const,
  TIMEOUT: 60, // seconds
  MAX_INSTANCES: 100,
} as const;

// API Response constants
export const API_RESPONSES = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
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
} as const;

// Batch operation limits
export const BATCH_LIMITS = {
  FIRESTORE_WRITE: 500,
  FIRESTORE_READ: 500,
  FCM_MULTICAST: 500,
  NOTIFICATION_PROCESSING: 100,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  USER_PROFILE: 300, // 5 minutes
  TASK_LIST: 60, // 1 minute
  TAG_LIST: 300, // 5 minutes
  STATISTICS: 900, // 15 minutes
} as const;

// Rate limiting
export const RATE_LIMITS = {
  TASKS_PER_MINUTE: 30,
  TAGS_PER_MINUTE: 10,
  NOTIFICATIONS_PER_MINUTE: 5,
} as const;

// Background job intervals (in minutes)
export const JOB_INTERVALS = {
  NOTIFICATION_PROCESSING: 5,
  OVERDUE_TASK_CHECK: 60,
  USER_STATS_UPDATE: 1440, // daily
  CLEANUP_OLD_DATA: 1440, // daily
} as const;

// Notification settings
export const FCM_CONFIG = {
  ANDROID_CHANNEL_ID: 'taskflow_reminders',
  WEB_ICON: '/icons/icon-192x192.png',
  WEB_BADGE: '/icons/badge-72x72.png',
  DEFAULT_SOUND: 'default',
  PRIORITY: 'high' as const,
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

// File size limits (in bytes)
export const FILE_LIMITS = {
  PROFILE_PHOTO: 5 * 1024 * 1024, // 5MB
  ATTACHMENT: 10 * 1024 * 1024, // 10MB
} as const;

// Security settings
export const SECURITY_CONFIG = {
  TOKEN_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 86400 * 30, // 30 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900, // 15 minutes
} as const;

// Analytics and metrics
export const ANALYTICS_CONFIG = {
  SAMPLE_RATE: 0.1, // 10% sampling
  BATCH_SIZE: 100,
  FLUSH_INTERVAL: 10000, // 10 seconds
} as const;

// Data retention policies (in days)
export const DATA_RETENTION = {
  COMPLETED_TASKS: 365, // 1 year
  SENT_NOTIFICATIONS: 30, // 1 month
  ERROR_LOGS: 90, // 3 months
  USER_ACTIVITY: 180, // 6 months
} as const;

// Environment-specific settings
export const ENVIRONMENT = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOPMENT: 'development',
  TEST: 'test',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_TIME_TRACKING: true,
  ENABLE_TAG_SUGGESTIONS: true,
  ENABLE_BULK_OPERATIONS: false, // Coming soon
} as const;

// API versioning
export const API_VERSION = {
  CURRENT: 'v1',
  SUPPORTED: ['v1'] as const,
} as const;

// Content limits
export const CONTENT_LIMITS = {
  TASK_TITLE_MIN: 1,
  TASK_TITLE_MAX: 200,
  TASK_DESCRIPTION_MAX: 2000,
  TAG_NAME_MIN: 1,
  TAG_NAME_MAX: 30,
  SEARCH_QUERY_MIN: 1,
  SEARCH_QUERY_MAX: 100,
} as const;

// Time constants (in milliseconds)
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;