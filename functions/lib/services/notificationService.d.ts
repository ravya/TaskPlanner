/**
 * TaskFlow Notification Service
 * Handles FCM notifications, reminders, and notification scheduling
 */
import * as admin from 'firebase-admin';
import { Task, ServiceResult } from '../types';
export interface NotificationPayload {
    title: string;
    body: string;
    data?: {
        [key: string]: string;
    };
    icon?: string;
    badge?: string;
    sound?: string;
}
export interface ScheduledNotification {
    notificationId: string;
    userId: string;
    taskId: string;
    type: 'deadline_reminder' | 'overdue_alert' | 'completion_reminder';
    scheduledFor: admin.firestore.Timestamp;
    payload: NotificationPayload;
    sent: boolean;
    sentAt?: admin.firestore.Timestamp;
    error?: string;
    retryCount: number;
    createdAt: admin.firestore.Timestamp;
}
export interface FCMDeviceToken {
    userId: string;
    token: string;
    deviceType: 'web' | 'android' | 'ios';
    createdAt: admin.firestore.Timestamp;
    lastUsed: admin.firestore.Timestamp;
    isActive: boolean;
}
export declare class NotificationService {
    private db;
    private messaging;
    constructor();
    /**
     * Register a device token for push notifications
     */
    registerDeviceToken(userId: string, token: string, deviceType: 'web' | 'android' | 'ios'): Promise<ServiceResult<void>>;
    /**
     * Unregister a device token
     */
    unregisterDeviceToken(userId: string, token: string): Promise<ServiceResult<void>>;
    /**
     * Schedule notifications for a task based on its notification settings
     */
    scheduleTaskNotifications(task: Task, reminderMinutes?: number[]): Promise<ServiceResult<void>>;
    /**
     * Cancel all notifications for a task
     */
    cancelTaskNotifications(userId: string, taskId: string): Promise<ServiceResult<void>>;
    /**
     * Process scheduled notifications that are ready to be sent
     */
    processScheduledNotifications(): Promise<{
        success: boolean;
        processedCount: number;
        errors: string[];
    }>;
    /**
     * Send immediate notification to user
     */
    sendImmediateNotification(userId: string, payload: NotificationPayload): Promise<ServiceResult<void>>;
    /**
     * Send notification to multiple FCM tokens
     */
    private sendNotificationToTokens;
    /**
     * Remove invalid device tokens
     */
    private removeInvalidTokens;
    /**
     * Generate reminder message based on task and time
     */
    private generateReminderMessage;
    /**
     * Format reminder time for display
     */
    private formatReminderTime;
    /**
     * Get notification statistics for a user
     */
    getNotificationStats(userId: string): Promise<ServiceResult<any>>;
}
//# sourceMappingURL=notificationService.d.ts.map