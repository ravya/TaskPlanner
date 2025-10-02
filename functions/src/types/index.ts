/**
 * TaskFlow Functions Types - Simplified
 * All type definitions needed for Cloud Functions
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UpdateUserData {
  displayName?: string;
  photoURL?: string;
}

// =============================================================================
// TASK TYPES
// =============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Date;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: Date | null;
}

export interface TaskQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  orderDirection?: 'asc' | 'desc';
  status?: TaskStatus;
  priority?: TaskPriority;
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const ERROR_CODES = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;