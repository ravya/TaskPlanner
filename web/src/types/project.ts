/**
 * TaskFlow Project Types (Frontend)
 * TypeScript interfaces for project data in the web client
 */

export type ProjectMode = 'personal' | 'professional';

export interface Project {
    id: string;
    name: string;
    description?: string;
    mode: ProjectMode;
    color?: string;
    icon?: string;
    taskCount: number;
    completedTaskCount: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    isArchived: boolean;
    isDeleted: boolean;
    isDefault: boolean;
    position: number;
}

// Project form data for creation
export interface ProjectFormData {
    name: string;
    description?: string;
    mode: ProjectMode;
    color?: string;
    icon?: string;
}

// Project update data
export interface ProjectUpdateData {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    position?: number;
    isArchived?: boolean;
}

// Project filters
export interface ProjectFilters {
    mode?: ProjectMode;
    isArchived?: boolean;
    isDefault?: boolean;
}

// Project query options
export interface ProjectQueryOptions {
    filters?: ProjectFilters;
    orderBy?: 'position' | 'createdAt' | 'name';
    orderDirection?: 'asc' | 'desc';
}

// Project deletion check result
export interface ProjectDeletionCheck {
    canDelete: boolean;
    hasIncompleteTasks: boolean;
    incompleteTaskCount: number;
    totalTaskCount: number;
}

// Project statistics
export interface ProjectStatistics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
}

// Configurable limits
export const PROJECT_LIMITS = {
    MAX_PROJECTS_PER_MODE: 10,
    DEFAULT_PROJECT_NAME: 'Inbox',
    MAX_PROJECT_NAME_LENGTH: 50,
    MAX_PROJECT_DESCRIPTION_LENGTH: 500,
} as const;

// Default project colors
export const PROJECT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // green  
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
] as const;

// Default project icons
export const PROJECT_ICONS = [
    '📁', // folder
    '🏠', // home
    '💼', // briefcase
    '🎯', // target
    '📚', // books
    '💡', // lightbulb
    '🚀', // rocket
    '⭐', // star
    '📥', // inbox (for default)
] as const;
