/**
 * TaskFlow Date Utilities
 * Helper functions for date and time operations
 */
import * as admin from 'firebase-admin';
/**
 * Get current timestamp as Firestore Timestamp
 */
export declare function now(): admin.firestore.Timestamp;
/**
 * Convert Date to Firestore Timestamp
 */
export declare function dateToTimestamp(date: Date): admin.firestore.Timestamp;
/**
 * Convert Firestore Timestamp to Date
 */
export declare function timestampToDate(timestamp: admin.firestore.Timestamp): Date;
/**
 * Add minutes to a timestamp
 */
export declare function addMinutes(timestamp: admin.firestore.Timestamp, minutes: number): admin.firestore.Timestamp;
/**
 * Add hours to a timestamp
 */
export declare function addHours(timestamp: admin.firestore.Timestamp, hours: number): admin.firestore.Timestamp;
/**
 * Add days to a timestamp
 */
export declare function addDays(timestamp: admin.firestore.Timestamp, days: number): admin.firestore.Timestamp;
/**
 * Check if a timestamp is in the past
 */
export declare function isInPast(timestamp: admin.firestore.Timestamp): boolean;
/**
 * Check if a timestamp is in the future
 */
export declare function isInFuture(timestamp: admin.firestore.Timestamp): boolean;
/**
 * Get the difference in minutes between two timestamps
 */
export declare function differenceInMinutes(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number;
/**
 * Get the difference in hours between two timestamps
 */
export declare function differenceInHours(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number;
/**
 * Get the difference in days between two timestamps
 */
export declare function differenceInDays(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number;
/**
 * Check if two timestamps are on the same day
 */
export declare function isSameDay(timestamp1: admin.firestore.Timestamp, timestamp2: admin.firestore.Timestamp): boolean;
/**
 * Get start of day for a timestamp
 */
export declare function startOfDay(timestamp: admin.firestore.Timestamp): admin.firestore.Timestamp;
/**
 * Get end of day for a timestamp
 */
export declare function endOfDay(timestamp: admin.firestore.Timestamp): admin.firestore.Timestamp;
/**
 * Format timestamp to readable string
 */
export declare function formatTimestamp(timestamp: admin.firestore.Timestamp, format?: 'date' | 'time' | 'datetime'): string;
/**
 * Parse time string (HH:MM) and combine with date
 */
export declare function combineDateTime(dateTimestamp: admin.firestore.Timestamp, timeString: string): admin.firestore.Timestamp;
/**
 * Get time string from timestamp (HH:MM format)
 */
export declare function extractTime(timestamp: admin.firestore.Timestamp): string;
/**
 * Check if a task is overdue based on due date and time
 */
export declare function isTaskOverdue(dueDate: admin.firestore.Timestamp, dueTime?: string): boolean;
/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 */
export declare function getRelativeTime(timestamp: admin.firestore.Timestamp): string;
/**
 * Get business days between two timestamps (excluding weekends)
 */
export declare function getBusinessDaysBetween(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number;
/**
 * Convert timezone
 */
export declare function convertTimezone(timestamp: admin.firestore.Timestamp, timezone: string): string;
/**
 * Get current week start and end timestamps
 */
export declare function getCurrentWeek(): {
    start: admin.firestore.Timestamp;
    end: admin.firestore.Timestamp;
};
/**
 * Get current month start and end timestamps
 */
export declare function getCurrentMonth(): {
    start: admin.firestore.Timestamp;
    end: admin.firestore.Timestamp;
};
//# sourceMappingURL=dateUtils.d.ts.map