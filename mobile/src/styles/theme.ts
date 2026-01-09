import { TextStyle, Platform } from 'react-native';

// Minimalistic color palette
export const colors = {
    // Primary
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    primaryDark: '#1D4ED8',

    // Backgrounds
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',

    // Text
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Priority colors
    priorityLow: '#10B981',
    priorityMedium: '#F59E0B',
    priorityHigh: '#EF4444',

    // Mode colors
    modePersonal: '#8B5CF6',
    modeProfessional: '#3B82F6',

    // Misc
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// Font weights that work on all platforms
type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

// Typography sizes - use these directly instead of spreading
export const fontSizes = {
    h1: 28,
    h2: 22,
    h3: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
};

export const lineHeights = {
    h1: 36,
    h2: 28,
    h3: 24,
    body: 24,
    bodySmall: 20,
    caption: 16,
};

// Keep for backwards compatibility but recommend using fontSizes directly
export const typography = {
    h1: {
        fontSize: 28,
        fontWeight: '700' as FontWeight,
        lineHeight: 36,
    },
    h2: {
        fontSize: 22,
        fontWeight: '600' as FontWeight,
        lineHeight: 28,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as FontWeight,
        lineHeight: 24,
    },
    body: {
        fontSize: 16,
        fontWeight: '400' as FontWeight,
        lineHeight: 24,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as FontWeight,
        lineHeight: 20,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as FontWeight,
        lineHeight: 16,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
};
