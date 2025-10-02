/**
 * TaskFlow Database Constants
 * Centralized constants for database operations
 */

// Collection and subcollection names
export const COLLECTIONS = {
  USERS: 'users',
  SYSTEM: '_system',
} as const;

export const SUBCOLLECTIONS = {
  TASKS: 'tasks',
  TAGS: 'tags',
  NOTIFICATIONS: 'notifications',
} as const;

// Document field names
export const USER_FIELDS = {
  USER_ID: 'userId',
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PHOTO_URL: 'photoURL',
  CREATED_AT: 'createdAt',
  LAST_ACTIVE_AT: 'lastActiveAt',
  PREFERENCES: 'preferences',
  STATS: 'stats',
  IS_ACTIVE: 'isActive',
  VERSION: 'version',
} as const;

export const TASK_FIELDS = {
  TASK_ID: 'taskId',
  TITLE: 'title',
  DESCRIPTION: 'description',
  COMPLETED: 'completed',
  STATUS: 'status',
  PRIORITY: 'priority',
  TAGS: 'tags',
  DUE_DATE: 'dueDate',
  DUE_TIME: 'dueTime',
  HAS_DEADLINE: 'hasDeadline',
  IS_OVERDUE: 'isOverdue',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  TIME_TRACKING: 'timeTracking',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  COMPLETED_AT: 'completedAt',
  ARCHIVED_AT: 'archivedAt',
  LAST_SYNCED_AT: 'lastSyncedAt',
  VERSION: 'version',
  IS_DELETED: 'isDeleted',
  USER_ID: 'userId',
} as const;

export const TAG_FIELDS = {
  TAG_ID: 'tagId',
  NAME: 'name',
  DISPLAY_NAME: 'displayName',
  DESCRIPTION: 'description',
  COLOR: 'color',
  ICON: 'icon',
  USAGE_COUNT: 'usageCount',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  IS_ACTIVE: 'isActive',
  USER_ID: 'userId',
  ANALYTICS: 'analytics',
} as const;

// Query limits
export const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_TAGS_PER_QUERY: 10,
  MAX_SEARCH_RESULTS: 50,
} as const;

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Notification constants
export const NOTIFICATION_CONSTANTS = {
  DEFAULT_REMINDER_TIMES: [30, 60, 1440], // 30min, 1hr, 1day in minutes
  MAX_NOTIFICATIONS_PER_TASK: 5,
  NOTIFICATION_BATCH_SIZE: 100,
  CLEANUP_THRESHOLD_DAYS: 30,
} as const;

// Validation constants
export const VALIDATION_RULES = {
  TASK_TITLE_MIN_LENGTH: 1,
  TASK_TITLE_MAX_LENGTH: 200,
  TASK_DESCRIPTION_MAX_LENGTH: 2000,
  TAG_NAME_MIN_LENGTH: 1,
  TAG_NAME_MAX_LENGTH: 30,
  TAG_DISPLAY_NAME_MAX_LENGTH: 50,
  TAG_DESCRIPTION_MAX_LENGTH: 200,
  USER_DISPLAY_NAME_MAX_LENGTH: 100,
  MAX_TAGS_PER_TASK: 10,
  MAX_TAGS_PER_USER: 100,
  MAX_TASKS_PER_USER: 10000,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Sync errors
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  OUTDATED_VERSION: 'OUTDATED_VERSION',
  OFFLINE_MODE: 'OFFLINE_MODE',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User profile updated successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_COMPLETED: 'Task marked as completed',
  TASK_DELETED: 'Task deleted successfully',
  TAG_CREATED: 'Tag created successfully',
  TAG_UPDATED: 'Tag updated successfully',
  TAG_DELETED: 'Tag deleted successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
} as const;

// Default values
export const DEFAULT_VALUES = {
  TASK_PRIORITY: 'medium' as const,
  TASK_STATUS: 'active' as const,
  THEME: 'light' as const,
  TIMEZONE: 'UTC',
  DATE_FORMAT: 'MM/DD/YYYY' as const,
  TIME_FORMAT: '12h' as const,
  NOTIFICATION_TIME: 60, // 1 hour before deadline
} as const;

// Database operation timeouts (in milliseconds)
export const TIMEOUTS = {
  WRITE_OPERATION: 10000, // 10 seconds
  READ_OPERATION: 5000,   // 5 seconds
  BATCH_OPERATION: 30000, // 30 seconds
  TRANSACTION_TIMEOUT: 15000, // 15 seconds
} as const;