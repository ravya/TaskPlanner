import { getToken, onMessage, MessagePayload, isSupported } from 'firebase/messaging';
import { messaging } from './config';

// Custom error type
export class MessagingServiceError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'MessagingServiceError';
  }
}

// Notification payload interface
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Permission status type
export type NotificationPermission = 'default' | 'granted' | 'denied';

class MessagingService {
  private isMessagingSupported = false;
  private currentToken: string | null = null;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if messaging is supported in this browser
   */
  private async checkSupport(): Promise<void> {
    try {
      this.isMessagingSupported = await isSupported();
    } catch (error) {
      console.warn('Firebase Messaging is not supported:', error);
      this.isMessagingSupported = false;
    }
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  getNotificationPermission(): NotificationPermission {
    if (!this.isNotificationSupported()) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      if (!this.isNotificationSupported()) {
        throw new MessagingServiceError('Notifications are not supported in this browser');
      }

      const permission = await Notification.requestPermission();
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw new MessagingServiceError(
        'Failed to request notification permission',
        error as Error
      );
    }
  }

  /**
   * Get Firebase Cloud Messaging token
   */
  async getFCMToken(vapidKey?: string): Promise<string | null> {
    try {
      if (!this.isMessagingSupported || !messaging) {
        console.warn('Firebase Messaging is not supported');
        return null;
      }

      // Check notification permission
      const permission = this.getNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        this.currentToken = currentToken;
        console.log('FCM token obtained:', currentToken.substring(0, 20) + '...');
        return currentToken;
      } else {
        console.log('No FCM registration token available');
        return null;
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      throw new MessagingServiceError('Failed to get FCM token', error as Error);
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Setup foreground message listener
   */
  onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
    try {
      if (!this.isMessagingSupported || !messaging) {
        console.warn('Firebase Messaging is not supported');
        return null;
      }

      return onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload);
        callback(payload);
      });
    } catch (error) {
      console.error('Failed to setup foreground message listener:', error);
      return null;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (!this.isNotificationSupported()) {
        throw new MessagingServiceError('Notifications are not supported');
      }

      const permission = this.getNotificationPermission();
      if (permission !== 'granted') {
        throw new MessagingServiceError('Notification permission not granted');
      }

      // Register service worker if not already registered
      await this.ensureServiceWorkerRegistration();

      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        image: payload.image,
        tag: payload.tag || 'taskflow-notification',
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        data: payload.data || {},
        actions: payload.actions || [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw new MessagingServiceError('Failed to show notification', error as Error);
    }
  }

  /**
   * Handle notification click events
   */
  setupNotificationClickHandler(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          const { action, data } = event.data;
          this.handleNotificationClick(action, data);
        }
      });
    }
  }

  /**
   * Handle different notification click actions
   */
  private handleNotificationClick(action: string, data: any): void {
    switch (action) {
      case 'view':
        if (data?.url) {
          window.open(data.url, '_blank');
        } else if (data?.taskId) {
          // Navigate to task detail
          window.location.href = `/app/tasks/${data.taskId}`;
        } else {
          // Navigate to dashboard
          window.location.href = '/app/dashboard';
        }
        break;
      case 'complete':
        if (data?.taskId) {
          // Dispatch event to complete task
          window.dispatchEvent(
            new CustomEvent('task-complete', {
              detail: { taskId: data.taskId },
            })
          );
        }
        break;
      case 'snooze':
        if (data?.taskId) {
          // Dispatch event to snooze task
          window.dispatchEvent(
            new CustomEvent('task-snooze', {
              detail: { taskId: data.taskId, duration: data.snoozeDuration || 60 },
            })
          );
        }
        break;
      case 'dismiss':
      default:
        // Do nothing for dismiss action
        break;
    }
  }

  /**
   * Ensure service worker is registered
   */
  private async ensureServiceWorkerRegistration(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          await navigator.serviceWorker.register('/sw.js');
        }
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    }
  }

  /**
   * Create task reminder notification
   */
  async showTaskReminder(task: {
    id: string;
    title: string;
    dueDate: Date;
    priority: string;
  }): Promise<void> {
    const isOverdue = task.dueDate < new Date();
    const priorityEmoji = this.getPriorityEmoji(task.priority);
    
    await this.showNotification({
      title: isOverdue ? '⚠️ Task Overdue' : '⏰ Task Reminder',
      body: `${priorityEmoji} ${task.title}`,
      icon: '/icon-192.png',
      tag: `task-${task.id}`,
      requireInteraction: true,
      data: {
        taskId: task.id,
        type: isOverdue ? 'overdue' : 'reminder',
        url: `/app/tasks/${task.id}`,
      },
      actions: [
        {
          action: 'view',
          title: 'View Task',
        },
        {
          action: 'complete',
          title: 'Mark Complete',
        },
        {
          action: 'snooze',
          title: 'Snooze 1hr',
        },
      ],
    });
  }

  /**
   * Create task completion notification
   */
  async showTaskCompleted(taskTitle: string): Promise<void> {
    await this.showNotification({
      title: '✅ Task Completed!',
      body: `Great job completing "${taskTitle}"`,
      icon: '/icon-192.png',
      tag: 'task-completed',
      silent: false,
      data: {
        type: 'completion',
        url: '/app/dashboard',
      },
      actions: [
        {
          action: 'view',
          title: 'View Dashboard',
        },
      ],
    });
  }

  /**
   * Create daily summary notification
   */
  async showDailySummary(summary: {
    completed: number;
    pending: number;
    overdue: number;
  }): Promise<void> {
    const { completed, pending, overdue } = summary;
    let body = '';

    if (completed > 0) {
      body += `✅ ${completed} completed`;
    }
    
    if (pending > 0) {
      body += body ? `, 📋 ${pending} pending` : `📋 ${pending} pending`;
    }
    
    if (overdue > 0) {
      body += body ? `, ⚠️ ${overdue} overdue` : `⚠️ ${overdue} overdue`;
    }

    if (!body) {
      body = 'All caught up! 🎉';
    }

    await this.showNotification({
      title: '📊 Daily Summary',
      body,
      icon: '/icon-192.png',
      tag: 'daily-summary',
      data: {
        type: 'summary',
        url: '/app/dashboard',
      },
      actions: [
        {
          action: 'view',
          title: 'View Dashboard',
        },
      ],
    });
  }

  /**
   * Get emoji for task priority
   */
  private getPriorityEmoji(priority: string): string {
    const priorityEmojis: Record<string, string> = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    };
    return priorityEmojis[priority] || '📋';
  }

  /**
   * Clear all notifications with a specific tag
   */
  async clearNotifications(tag: string): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag });
        notifications.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Clear all TaskFlow notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications();
        notifications.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  /**
   * Test notification functionality
   */
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: '🧪 Test Notification',
      body: 'TaskFlow notifications are working correctly!',
      icon: '/icon-192.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/app/settings',
      },
      actions: [
        {
          action: 'view',
          title: 'View Settings',
        },
      ],
    });
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;