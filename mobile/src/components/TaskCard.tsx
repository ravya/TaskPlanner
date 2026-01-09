import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task, DEFAULT_LABELS, TaskLabel } from '../types';
import { colors, spacing, borderRadius, fontSizes } from '../styles/theme';

interface TaskCardProps {
    task: Task;
    selected?: boolean;
    onPress?: () => void;
    onLongPress?: () => void;
    onToggleComplete?: () => void;
}

export function TaskCard({
    task,
    selected = false,
    onPress,
    onLongPress,
    onToggleComplete,
}: TaskCardProps) {
    // Get label info (with fallback for legacy priority)
    const taskLabel = (task as any).label || 'none';
    const labelInfo = DEFAULT_LABELS.find((l) => l.id === taskLabel) || DEFAULT_LABELS[5]; // Default to 'none'

    const subtaskCount = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                selected && styles.selected,
                task.completed && styles.completed,
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            {/* Checkbox */}
            <TouchableOpacity
                style={[styles.checkbox, task.completed && styles.checkboxChecked]}
                onPress={onToggleComplete}
            >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text
                        style={[styles.title, task.completed && styles.titleCompleted]}
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>
                </View>

                {/* Meta info */}
                <View style={styles.meta}>
                    {/* Label badge */}
                    {taskLabel !== 'none' && (
                        <View style={[styles.labelBadge, { backgroundColor: labelInfo.color + '20' }]}>
                            <View style={[styles.labelDot, { backgroundColor: labelInfo.color }]} />
                            <Text style={[styles.labelText, { color: labelInfo.color }]}>
                                {labelInfo.name}
                            </Text>
                        </View>
                    )}

                    {task.startTime && (
                        <Text style={styles.metaText}>{task.startTime}</Text>
                    )}
                    {subtaskCount > 0 && (
                        <View style={styles.subtaskBadge}>
                            <Text style={styles.subtaskText}>
                                {completedSubtasks}/{subtaskCount}
                            </Text>
                        </View>
                    )}
                    {task.projectName && (
                        <Text style={styles.projectTag} numberOfLines={1}>
                            {task.projectName}
                        </Text>
                    )}
                </View>
            </View>

            {/* Mode indicator */}
            <View
                style={[
                    styles.modeIndicator,
                    { backgroundColor: task.mode === 'home' ? colors.modePersonal : colors.modeProfessional },
                ]}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    selected: {
        backgroundColor: colors.primaryLight + '30',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    completed: {
        opacity: 0.6,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    checkboxChecked: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    checkmark: {
        color: colors.textInverse,
        fontSize: 14,
        fontWeight: '700' as const,
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
        flex: 1,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textTertiary,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 4,
    },
    labelDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    labelText: {
        fontSize: fontSizes.caption,
        fontWeight: '500' as const,
    },
    metaText: {
        fontSize: fontSizes.caption,
        color: colors.textTertiary,
    },
    subtaskBadge: {
        backgroundColor: colors.surfaceSecondary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    subtaskText: {
        fontSize: fontSizes.caption,
        color: colors.textSecondary,
    },
    projectTag: {
        fontSize: fontSizes.caption,
        color: colors.primary,
        maxWidth: 80,
    },
    modeIndicator: {
        width: 3,
        height: 24,
        borderRadius: 2,
        marginLeft: spacing.sm,
    },
});
