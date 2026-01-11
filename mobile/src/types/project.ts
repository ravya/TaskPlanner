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

// Ionicons names for project icons
export const PROJECT_ICONS = [
    'folder',
    'home',
    'briefcase',
    'flag',
    'book',
    'bulb',
    'rocket',
    'star',
    'archive'
];
