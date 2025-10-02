/**
 * TaskFlow Tag Schema
 * Complete TypeScript interfaces for tag documents
 */

import { Timestamp } from 'firebase-admin/firestore';

export interface Tag {
  tagId: string;
  name: string; // "work" (lowercase, no spaces)
  displayName: string; // "Work" (user-friendly display)
  description?: string;
  color: string; // HEX color "#3B82F6"
  icon?: string; // emoji or icon name
  usageCount: number; // number of tasks using this tag
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean; // soft delete
  userId: string; // for easier querying
  
  // Tag analytics
  analytics: {
    totalTasksCreated: number;
    totalTasksCompleted: number;
    averageCompletionTime: number; // minutes
    lastUsedAt: Timestamp | null;
  };
}

/**
 * Tag creation data
 */
export interface CreateTagData {
  name: string;
  displayName?: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Tag update data
 */
export interface UpdateTagData {
  displayName?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

/**
 * Tag usage statistics
 */
export interface TagUsageStats {
  tagId: string;
  name: string;
  displayName: string;
  usageCount: number;
  completionRate: number; // percentage of completed tasks
  averageCompletionTime: number;
  trendsData: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

/**
 * Predefined tag colors
 */
export const PREDEFINED_TAG_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
] as const;

/**
 * Common predefined tags
 */
export const COMMON_TAGS = [
  { name: 'work', displayName: 'Work', color: '#3B82F6', icon: '💼' },
  { name: 'personal', displayName: 'Personal', color: '#10B981', icon: '🏠' },
  { name: 'urgent', displayName: 'Urgent', color: '#EF4444', icon: '🚨' },
  { name: 'important', displayName: 'Important', color: '#F59E0B', icon: '⭐' },
  { name: 'health', displayName: 'Health', color: '#EC4899', icon: '💪' },
  { name: 'finance', displayName: 'Finance', color: '#10B981', icon: '💰' },
  { name: 'learning', displayName: 'Learning', color: '#8B5CF6', icon: '📚' },
  { name: 'family', displayName: 'Family', color: '#F97316', icon: '👨‍👩‍👧‍👦' },
] as const;

/**
 * Tag validation rules
 */
export const TAG_VALIDATION = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 30,
  MAX_DISPLAY_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  ALLOWED_NAME_PATTERN: /^[a-z0-9_-]+$/, // lowercase, numbers, underscore, hyphen only
} as const;

/**
 * Default tag analytics
 */
export const DEFAULT_TAG_ANALYTICS = {
  totalTasksCreated: 0,
  totalTasksCompleted: 0,
  averageCompletionTime: 0,
  lastUsedAt: null,
};