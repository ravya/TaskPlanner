// Project types
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

export interface ProjectFormData {
    name: string;
    description?: string;
    mode: ProjectMode;
    color?: string;
    icon?: string;
}

export const PROJECT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
];

export const PROJECT_ICONS = ['📁', '🏠', '💼', '🎯', '📚', '💡', '🚀', '⭐', '📥'];
