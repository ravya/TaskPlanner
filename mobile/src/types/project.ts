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
    deadline?: string;
    label?: string;
}

export interface ProjectFormData {
    name: string;
    description?: string;
    mode: ProjectMode;
    icon?: string;
    deadline?: string;
    label?: string;
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

// Map old emoji icons to Ionicons (for backward compatibility)
const EMOJI_TO_IONICON: Record<string, string> = {
    '📁': 'folder',
    '🏠': 'home',
    '💼': 'briefcase',
    '🎯': 'flag',
    '📚': 'book',
    '💡': 'bulb',
    '🚀': 'rocket',
    '⭐': 'star',
    '📥': 'archive',
    '📂': 'folder-open',
};

// Get valid Ionicon name from project icon (handles legacy emojis)
export function getProjectIconName(icon?: string): string {
    if (!icon) return 'folder';
    // If it's already an Ionicon name
    if (PROJECT_ICONS.includes(icon)) return icon;
    // If it's a legacy emoji, map it
    if (EMOJI_TO_IONICON[icon]) return EMOJI_TO_IONICON[icon];
    // Fallback
    return 'folder';
}
