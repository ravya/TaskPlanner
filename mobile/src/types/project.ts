// Project types
export type ProjectMode = 'home' | 'work';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
    id: string;
    name: string;
    description?: string;
    mode: ProjectMode;
    icon?: string;
    taskCount: number;
    completedTaskCount: number;
    status: ProjectStatus;
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
    icon?: string;
}

export const PROJECT_ICONS = ['📁', '🏠', '💼', '🎯', '📚', '💡', '🚀', '⭐', '📥'];
