/**
 * TaskFlow Task Schema
 * Complete TypeScript interfaces for task documents
 */

import { Timestamp } from 'firebase-admin/firestore';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'active' | 'completed' | 'archived';

export interface NotificationSettings {
  enabled: boolean;
  times: number[]; // minutes before deadline [60, 1440] = 1hr, 1day
  sentNotifications: string[]; // notification IDs that were sent
  customMessage?: string;
}

export interface TaskTime {
  estimated?: number; // estimated minutes to complete
  actual?: number; // actual minutes spent
  startedAt?: Timestamp;
  pausedAt?: Timestamp;
  totalPaused?: number; // total paused time in minutes
}

export interface Task {
  taskId: string;
  title: string;
  description: string;
  completed: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[]; // ["work", "urgent", "personal"]
  
  // Deadline features
  dueDate: Timestamp | null;
  dueTime: string | null; // "14:30" format (24h)
  hasDeadline: boolean;
  isOverdue: boolean;
  
  // Notification features  
  notificationSettings: NotificationSettings;
  
  // Time tracking
  timeTracking: TaskTime;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  archivedAt: Timestamp | null;
  
  // Sync support
  lastSyncedAt: Timestamp;
  version: number;
  isDeleted: boolean;
  
  // User context
  userId: string; // for easier querying
}

/**
 * Task creation data
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Timestamp;
  dueTime?: string;
  notificationSettings?: Partial<NotificationSettings>;
  estimatedTime?: number;
}

/**
 * Task update data
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Timestamp | null;
  dueTime?: string | null;
  notificationSettings?: Partial<NotificationSettings>;
  completed?: boolean;
  status?: TaskStatus;
}

/**
 * Task filter options
 */
export interface TaskFilters {
  completed?: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  hasDeadline?: boolean;
  isOverdue?: boolean;
  dueDateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
}

/**
 * Task query options
 */
export interface TaskQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  orderDirection?: 'asc' | 'desc';
  filters?: TaskFilters;
}

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  times: [60], // 1 hour before
  sentNotifications: [],
};

/**
 * Default time tracking
 */
export const DEFAULT_TIME_TRACKING: TaskTime = {
  estimated: undefined,
  actual: undefined,
  totalPaused: 0,
};

/**
 * Task priority weights for sorting
 */
export const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;