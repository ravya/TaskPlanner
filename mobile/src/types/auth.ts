// Auth types
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified?: boolean;
}

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface UserSettings {
    startOfWeek: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    defaultMode: 'personal' | 'professional';
    notifications: {
        enabled: boolean;
        reminderTime: string; // HH:mm format
    };
    sound: {
        taskComplete: boolean;
        notifications: boolean;
    };
}

export const DEFAULT_SETTINGS: UserSettings = {
    startOfWeek: 'monday',
    defaultMode: 'personal',
    notifications: {
        enabled: true,
        reminderTime: '09:00',
    },
    sound: {
        taskComplete: true,
        notifications: true,
    },
};
