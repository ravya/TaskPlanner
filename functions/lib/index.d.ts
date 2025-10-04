/**
 * TaskFlow Cloud Functions Entry Point
 * Exports all HTTP endpoints and background functions
 */
import * as functions from 'firebase-functions';
export declare const api: functions.HttpsFunction;
/**
 * Process notification reminders (runs every 5 minutes)
 * Checks for tasks with upcoming deadlines and sends notifications
 */
export declare const processNotifications: functions.CloudFunction<unknown>;
/**
 * Update overdue tasks (runs every hour)
 * Marks tasks as overdue when they pass their deadline
 */
export declare const updateOverdueTasks: functions.CloudFunction<unknown>;
/**
 * Cleanup old notifications (runs daily at 2 AM)
 * Removes sent notifications older than 30 days
 */
export declare const cleanupNotifications: functions.CloudFunction<unknown>;
/**
 * User statistics update (runs daily at 3 AM)
 * Updates user statistics like streaks, averages, etc.
 */
export declare const updateUserStats: functions.CloudFunction<unknown>;
/**
 * Task completion trigger
 * Updates user stats when a task is marked as complete
 */
export declare const onTaskComplete: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
/**
 * New user setup trigger
 * Initializes user with default tags when account is created
 */
export declare const onUserCreate: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
//# sourceMappingURL=index.d.ts.map