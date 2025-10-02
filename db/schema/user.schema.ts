/**
 * TaskFlow User Schema
 * Complete TypeScript interfaces for user documents
 */

import { Timestamp } from 'firebase-admin/firestore';

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
  defaultNotificationTime: number; // minutes before deadline
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  currentStreak: number; // consecutive days with completed tasks
  longestStreak: number;
  averageCompletionTime: number; // average hours to complete tasks
  totalTimeTracked: number; // total minutes spent on tasks
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  preferences: UserPreferences;
  stats: UserStats;
  isActive: boolean;
  version: number; // for data migration purposes
}

/**
 * User creation data (what we receive from registration)
 */
export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * User update data (partial updates allowed)
 */
export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
  preferences?: Partial<UserPreferences>;
  lastActiveAt?: Timestamp;
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  notifications: true,
  timezone: 'UTC',
  defaultNotificationTime: 60, // 1 hour before deadline
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
};

/**
 * Default user stats
 */
export const DEFAULT_USER_STATS: UserStats = {
  totalTasks: 0,
  completedTasks: 0,
  activeTasks: 0,
  overdueTasks: 0,
  currentStreak: 0,
  longestStreak: 0,
  averageCompletionTime: 0,
  totalTimeTracked: 0,
};

/**
 * Service response wrapper
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}