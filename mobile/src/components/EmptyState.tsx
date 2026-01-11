import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes } from '../styles/theme';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
}

export function EmptyState({ icon = 'document-text-outline', title, subtitle }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={48} color={colors.textTertiary} style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.subtitle}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    icon: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.h3,
        fontWeight: '600' as const,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
