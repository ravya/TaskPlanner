"use strict";
/**
 * TaskFlow Notification Service
 * Handles FCM notifications, reminders, and notification scheduling
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
exports.NotificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const types_1 = require("../types");
class NotificationService {
    constructor() {
        this.db = admin.firestore();
        this.messaging = admin.messaging();
    }
    /**
     * Register a device token for push notifications
     */
    async registerDeviceToken(userId, token, deviceType) {
        try {
            console.log('📱 Registering device token for user:', userId);
            const now = admin.firestore.Timestamp.now();
            const tokenDoc = {
                userId,
                token,
                deviceType,
                createdAt: now,
                lastUsed: now,
                isActive: true,
            };
            // Use token as document ID to prevent duplicates
            await this.db.doc(`users/${userId}/deviceTokens/${token}`).set(tokenDoc);
            console.log('✅ Device token registered successfully');
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error registering device token:', error);
            return {
                success: false,
                error: 'Failed to register device token',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Unregister a device token
     */
    async unregisterDeviceToken(userId, token) {
        try {
            await this.db.doc(`users/${userId}/deviceTokens/${token}`).update({
                isActive: false,
                lastUsed: admin.firestore.Timestamp.now(),
            });
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error unregistering device token:', error);
            return {
                success: false,
                error: 'Failed to unregister device token',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Schedule notifications for a task based on its notification settings
     */
    async scheduleTaskNotifications(task, reminderMinutes = [1440, 60, 15]) {
        try {
            console.log('⏰ Scheduling notifications for task:', task.id);
            if (!task.dueDate) {
                console.log('📵 No deadline for task:', task.id);
                return { success: true };
            }
            const batch = this.db.batch();
            const now = admin.firestore.Timestamp.now();
            for (const reminderMinute of reminderMinutes) {
                const dueTime = task.dueDate instanceof Date ? task.dueDate : task.dueDate;
                const scheduledTime = new Date(dueTime.getTime() - (reminderMinute * 60 * 1000));
                // Skip if scheduled time is in the past
                if (scheduledTime.getTime() <= Date.now()) {
                    console.log(`⏰ Skipping past notification time for task ${task.id}`);
                    continue;
                }
                const notificationId = `notif_${task.id}_${reminderMinute}min`;
                const notificationRef = this.db.doc(`users/${task.userId}/notifications/${notificationId}`);
                const notification = {
                    notificationId,
                    userId: task.userId,
                    taskId: task.id,
                    type: 'deadline_reminder',
                    scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
                    payload: {
                        title: 'Task Reminder',
                        body: this.generateReminderMessage(task, reminderMinute),
                        data: {
                            taskId: task.id,
                            type: 'deadline_reminder',
                            reminderMinutes: reminderMinute.toString(),
                        },
                        icon: '📋',
                    },
                    sent: false,
                    retryCount: 0,
                    createdAt: now,
                };
                batch.set(notificationRef, notification);
            }
            await batch.commit();
            console.log('✅ Notifications scheduled successfully');
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error scheduling notifications:', error);
            return {
                success: false,
                error: 'Failed to schedule notifications',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
    /**
     * Cancel all notifications for a task
     */
    async cancelTaskNotifications(userId, taskId) {
        try {
            console.log('❌ Cancelling notifications for task:', taskId);
            const notificationsSnapshot = await this.db.collection(`users/${userId}/notifications`)
                .where('taskId', '==', taskId)
                .where('sent', '==', false)
                .get();
            if (notificationsSnapshot.empty) {
                return { success: true };
            }
            const batch = this.db.batch();
            for (const doc of notificationsSnapshot.docs) {
                batch.delete(doc.ref);
            }
            await batch.commit();
            console.log(`✅ Cancelled ${notificationsSnapshot.size} notifications for task ${taskId}`);
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error cancelling task notifications:', error);
            return {
                success: false,
                error: 'Failed to cancel notifications',
                code: types_1.ERROR_CODES.DATABASE_ERROR,
            };
        }
    }
    /**
     * Process scheduled notifications that are ready to be sent
     */
    async processScheduledNotifications() {
        try {
            console.log('🔔 Processing scheduled notifications...');
            const now = admin.firestore.Timestamp.now();
            // Get notifications that are ready to be sent
            const notificationsSnapshot = await this.db.collectionGroup('notifications')
                .where('sent', '==', false)
                .where('scheduledFor', '<=', now)
                .limit(100) // Process up to 100 notifications at once
                .get();
            if (notificationsSnapshot.empty) {
                console.log('📭 No notifications to process');
                return { success: true, processedCount: 0, errors: [] };
            }
            console.log(`📮 Found ${notificationsSnapshot.size} notifications to process`);
            const batch = this.db.batch();
            const errors = [];
            let processedCount = 0;
            for (const doc of notificationsSnapshot.docs) {
                const notification = doc.data();
                try {
                    // Get user device tokens
                    const tokensSnapshot = await this.db.collection(`users/${notification.userId}/deviceTokens`)
                        .where('isActive', '==', true)
                        .get();
                    if (tokensSnapshot.empty) {
                        console.log(`📵 No active tokens for user ${notification.userId}`);
                        // Mark as sent even though no tokens (user may have uninstalled app)
                        batch.update(doc.ref, {
                            sent: true,
                            sentAt: now,
                            error: 'No active device tokens',
                        });
                        continue;
                    }
                    // Send notification to all user devices
                    const tokens = tokensSnapshot.docs.map(tokenDoc => tokenDoc.data().token);
                    const sendResult = await this.sendNotificationToTokens(tokens, notification.payload);
                    if (sendResult.success) {
                        batch.update(doc.ref, {
                            sent: true,
                            sentAt: now,
                        });
                        processedCount++;
                    }
                    else {
                        // Retry logic
                        const newRetryCount = notification.retryCount + 1;
                        if (newRetryCount < 3) {
                            batch.update(doc.ref, {
                                retryCount: newRetryCount,
                                error: sendResult.error,
                                scheduledFor: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // Retry in 5 minutes
                            });
                        }
                        else {
                            batch.update(doc.ref, {
                                sent: true,
                                sentAt: now,
                                error: `Failed after ${newRetryCount} retries: ${sendResult.error}`,
                            });
                        }
                        errors.push(`Notification ${notification.notificationId}: ${sendResult.error}`);
                    }
                }
                catch (notificationError) {
                    console.error(`❌ Error processing notification ${notification.notificationId}:`, notificationError);
                    errors.push(`Notification ${notification.notificationId}: ${notificationError.message}`);
                    // Mark as failed
                    batch.update(doc.ref, {
                        sent: true,
                        sentAt: now,
                        error: notificationError.message,
                    });
                }
            }
            await batch.commit();
            console.log(`✅ Processed ${processedCount} notifications with ${errors.length} errors`);
            return {
                success: true,
                processedCount,
                errors,
            };
        }
        catch (error) {
            console.error('❌ Error processing scheduled notifications:', error);
            return {
                success: false,
                processedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    /**
     * Send immediate notification to user
     */
    async sendImmediateNotification(userId, payload) {
        try {
            console.log('🚀 Sending immediate notification to user:', userId);
            // Get user device tokens
            const tokensSnapshot = await this.db.collection(`users/${userId}/deviceTokens`)
                .where('isActive', '==', true)
                .get();
            if (tokensSnapshot.empty) {
                return {
                    success: false,
                    error: 'No active device tokens for user',
                    code: types_1.ERROR_CODES.INVALID_INPUT,
                };
            }
            const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
            const result = await this.sendNotificationToTokens(tokens, payload);
            return result;
        }
        catch (error) {
            console.error('❌ Error sending immediate notification:', error);
            return {
                success: false,
                error: 'Failed to send notification',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
    /**
     * Send notification to multiple FCM tokens
     */
    async sendNotificationToTokens(tokens, payload) {
        try {
            if (tokens.length === 0) {
                return {
                    success: false,
                    error: 'No tokens provided',
                    code: types_1.ERROR_CODES.INVALID_INPUT,
                };
            }
            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.icon,
                },
                data: payload.data || {},
                tokens,
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'ic_notification',
                        sound: 'default',
                        channelId: 'taskflow_reminders',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body,
                            },
                            badge: parseInt(payload.badge || '0'),
                            sound: 'default',
                        },
                    },
                },
                webpush: {
                    notification: {
                        title: payload.title,
                        body: payload.body,
                        icon: '/icons/icon-192x192.png',
                        badge: '/icons/badge-72x72.png',
                        tag: 'taskflow-reminder',
                        requireInteraction: true,
                    },
                },
            };
            const response = await this.messaging.sendMulticast(message);
            console.log(`📤 Sent to ${response.successCount}/${tokens.length} tokens`);
            // Handle failed tokens (remove invalid ones)
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && resp.error) {
                        console.warn(`❌ Failed to send to token ${idx}: ${resp.error.message}`);
                        if (resp.error.code === 'messaging/registration-token-not-registered' ||
                            resp.error.code === 'messaging/invalid-registration-token') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                });
                // Remove invalid tokens
                await this.removeInvalidTokens(failedTokens);
            }
            // Consider it successful if at least one token received the message
            return {
                success: response.successCount > 0,
                error: response.successCount === 0 ? 'Failed to send to any tokens' : undefined,
            };
        }
        catch (error) {
            console.error('❌ Error sending FCM notification:', error);
            return {
                success: false,
                error: error.message || 'Failed to send notification',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
    /**
     * Remove invalid device tokens
     */
    async removeInvalidTokens(tokens) {
        try {
            if (tokens.length === 0)
                return;
            console.log(`🧹 Removing ${tokens.length} invalid tokens`);
            // Query for these tokens across all users (using collectionGroup)
            const batch = this.db.batch();
            for (const token of tokens) {
                const tokenSnapshot = await this.db.collectionGroup('deviceTokens')
                    .where('token', '==', token)
                    .get();
                for (const doc of tokenSnapshot.docs) {
                    batch.update(doc.ref, { isActive: false });
                }
            }
            await batch.commit();
        }
        catch (error) {
            console.warn('⚠️ Failed to remove invalid tokens:', error);
        }
    }
    /**
     * Generate reminder message based on task and time
     */
    generateReminderMessage(task, reminderMinutes) {
        const timeText = this.formatReminderTime(reminderMinutes);
        if (reminderMinutes < 60) {
            return `"${task.title}" is due in ${timeText}! ⏰`;
        }
        else if (reminderMinutes < 1440) {
            return `"${task.title}" is due in ${timeText} 📅`;
        }
        else {
            return `Don't forget: "${task.title}" is due ${timeText} 📋`;
        }
    }
    /**
     * Format reminder time for display
     */
    formatReminderTime(minutes) {
        if (minutes < 60) {
            return `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }
        else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60);
            return `${hours} hour${hours === 1 ? '' : 's'}`;
        }
        else {
            const days = Math.floor(minutes / 1440);
            return days === 1 ? 'tomorrow' : `in ${days} days`;
        }
    }
    /**
     * Get notification statistics for a user
     */
    async getNotificationStats(userId) {
        try {
            const notificationsSnapshot = await this.db.collection(`users/${userId}/notifications`).get();
            const notifications = notificationsSnapshot.docs.map(doc => doc.data());
            const stats = {
                total: notifications.length,
                sent: notifications.filter(n => n.sent).length,
                pending: notifications.filter(n => !n.sent && n.scheduledFor.toMillis() > Date.now()).length,
                failed: notifications.filter(n => n.sent && n.error).length,
                typeBreakdown: {
                    deadline_reminder: notifications.filter(n => n.type === 'deadline_reminder').length,
                    overdue_alert: notifications.filter(n => n.type === 'overdue_alert').length,
                    completion_reminder: notifications.filter(n => n.type === 'completion_reminder').length,
                },
            };
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            console.error('❌ Error getting notification stats:', error);
            return {
                success: false,
                error: 'Failed to retrieve notification statistics',
                code: types_1.ERROR_CODES.INTERNAL_ERROR,
            };
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map