/**
 * TaskFlow Date Utilities
 * Helper functions for date and time operations
 */

import * as admin from 'firebase-admin';

/**
 * Get current timestamp as Firestore Timestamp
 */
export function now(): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.now();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: admin.firestore.Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Add minutes to a timestamp
 */
export function addMinutes(timestamp: admin.firestore.Timestamp, minutes: number): admin.firestore.Timestamp {
  const date = timestamp.toDate();
  date.setMinutes(date.getMinutes() + minutes);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Add hours to a timestamp
 */
export function addHours(timestamp: admin.firestore.Timestamp, hours: number): admin.firestore.Timestamp {
  const date = timestamp.toDate();
  date.setHours(date.getHours() + hours);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Add days to a timestamp
 */
export function addDays(timestamp: admin.firestore.Timestamp, days: number): admin.firestore.Timestamp {
  const date = timestamp.toDate();
  date.setDate(date.getDate() + days);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Check if a timestamp is in the past
 */
export function isInPast(timestamp: admin.firestore.Timestamp): boolean {
  return timestamp.toMillis() < Date.now();
}

/**
 * Check if a timestamp is in the future
 */
export function isInFuture(timestamp: admin.firestore.Timestamp): boolean {
  return timestamp.toMillis() > Date.now();
}

/**
 * Get the difference in minutes between two timestamps
 */
export function differenceInMinutes(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number {
  return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60));
}

/**
 * Get the difference in hours between two timestamps
 */
export function differenceInHours(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number {
  return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60 * 60));
}

/**
 * Get the difference in days between two timestamps
 */
export function differenceInDays(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number {
  return Math.round((end.toMillis() - start.toMillis()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if two timestamps are on the same day
 */
export function isSameDay(timestamp1: admin.firestore.Timestamp, timestamp2: admin.firestore.Timestamp): boolean {
  const date1 = timestamp1.toDate();
  const date2 = timestamp2.toDate();
  
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get start of day for a timestamp
 */
export function startOfDay(timestamp: admin.firestore.Timestamp): admin.firestore.Timestamp {
  const date = timestamp.toDate();
  date.setHours(0, 0, 0, 0);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Get end of day for a timestamp
 */
export function endOfDay(timestamp: admin.firestore.Timestamp): admin.firestore.Timestamp {
  const date = timestamp.toDate();
  date.setHours(23, 59, 59, 999);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: admin.firestore.Timestamp, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  const date = timestamp.toDate();
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'datetime':
      return date.toLocaleString();
    default:
      return date.toLocaleString();
  }
}

/**
 * Parse time string (HH:MM) and combine with date
 */
export function combineDateTime(dateTimestamp: admin.firestore.Timestamp, timeString: string): admin.firestore.Timestamp {
  const date = dateTimestamp.toDate();
  const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
  
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Invalid time format. Expected HH:MM');
  }
  
  date.setHours(hours, minutes, 0, 0);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Get time string from timestamp (HH:MM format)
 */
export function extractTime(timestamp: admin.firestore.Timestamp): string {
  const date = timestamp.toDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if a task is overdue based on due date and time
 */
export function isTaskOverdue(dueDate: admin.firestore.Timestamp, dueTime?: string): boolean {
  const now = admin.firestore.Timestamp.now();
  
  if (!dueTime) {
    // If no specific time, consider overdue at end of the due date
    return endOfDay(dueDate).toMillis() < now.toMillis();
  }
  
  // Combine date and time for precise comparison
  const exactDueTime = combineDateTime(dueDate, dueTime);
  return exactDueTime.toMillis() < now.toMillis();
}

/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(timestamp: admin.firestore.Timestamp): string {
  const now = Date.now();
  const targetTime = timestamp.toMillis();
  const diffMs = targetTime - now;
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  const isPast = diffMs < 0;
  const absDiffMins = Math.abs(diffMins);
  const absDiffHours = Math.abs(diffHours);
  const absDiffDays = Math.abs(diffDays);
  
  if (absDiffMins < 1) {
    return 'now';
  } else if (absDiffMins < 60) {
    return isPast ? `${absDiffMins} minutes ago` : `in ${absDiffMins} minutes`;
  } else if (absDiffHours < 24) {
    return isPast ? `${absDiffHours} hours ago` : `in ${absDiffHours} hours`;
  } else if (absDiffDays === 1) {
    return isPast ? 'yesterday' : 'tomorrow';
  } else {
    return isPast ? `${absDiffDays} days ago` : `in ${absDiffDays} days`;
  }
}

/**
 * Get business days between two timestamps (excluding weekends)
 */
export function getBusinessDaysBetween(start: admin.firestore.Timestamp, end: admin.firestore.Timestamp): number {
  const startDate = start.toDate();
  const endDate = end.toDate();
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Convert timezone
 */
export function convertTimezone(timestamp: admin.firestore.Timestamp, timezone: string): string {
  return timestamp.toDate().toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get current week start and end timestamps
 */
export function getCurrentWeek(): { start: admin.firestore.Timestamp; end: admin.firestore.Timestamp } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek); // Go to Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Go to Saturday
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    start: admin.firestore.Timestamp.fromDate(startOfWeek),
    end: admin.firestore.Timestamp.fromDate(endOfWeek),
  };
}

/**
 * Get current month start and end timestamps
 */
export function getCurrentMonth(): { start: admin.firestore.Timestamp; end: admin.firestore.Timestamp } {
  const now = new Date();
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return {
    start: admin.firestore.Timestamp.fromDate(startOfMonth),
    end: admin.firestore.Timestamp.fromDate(endOfMonth),
  };
}