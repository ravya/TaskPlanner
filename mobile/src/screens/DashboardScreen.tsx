import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { useTodayTasks, useAuth } from '../hooks';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { toggleTaskComplete, bulkToggleComplete, updateTaskPositions } from '../services/firebase';
import { Task, TaskMode } from '../types';

export function DashboardScreen() {
    const { user } = useAuth();
    const { tasks, loading, refresh, setTasks } = useTodayTasks(user?.uid);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const filteredTasks = tasks.filter((task) => {
        if (modeFilter !== 'all' && task.mode !== modeFilter) return false;
        return true;
    });

    const incompleteTasks = filteredTasks.filter((t) => !t.completed);
    const completedTasks = filteredTasks.filter((t) => t.completed);

    const isMultiSelectMode = selectedIds.size > 0;

    // Toggle task selection for multi-select
    const handleLongPress = useCallback((taskId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    // Handle task press
    const handleTaskPress = useCallback((taskId: string) => {
        if (isMultiSelectMode) {
            handleLongPress(taskId);
        }
    }, [isMultiSelectMode, handleLongPress]);

    // Toggle single task complete
    const handleToggleComplete = useCallback(async (task: Task) => {
        if (!user) return;
        try {
            await toggleTaskComplete(user.uid, task.id, !task.completed);
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
        }
    }, [user]);

    // Bulk complete selected tasks
    const handleBulkComplete = useCallback(async () => {
        if (!user || selectedIds.size === 0) return;
        try {
            await bulkToggleComplete(user.uid, Array.from(selectedIds), true);
            setSelectedIds(new Set());
        } catch (error) {
            Alert.alert('Error', 'Failed to complete tasks');
        }
    }, [user, selectedIds]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    if (loading && tasks.length === 0) {
        return <LoadingState message="Loading today's tasks..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Today</Text>
                    <Text style={styles.date}>{dateString}</Text>
                </View>
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                        {incompleteTasks.length} pending
                    </Text>
                </View>
            </View>

            {/* Mode Filter */}
            <View style={styles.filterRow}>
                {(['all', 'personal', 'professional'] as const).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.filterChip, modeFilter === mode && styles.filterChipActive]}
                        onPress={() => setModeFilter(mode)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                modeFilter === mode && styles.filterTextActive,
                            ]}
                        >
                            {mode === 'all' ? 'All' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Multi-select toolbar */}
            {isMultiSelectMode && (
                <View style={styles.toolbar}>
                    <Text style={styles.toolbarText}>{selectedIds.size} selected</Text>
                    <View style={styles.toolbarActions}>
                        <TouchableOpacity style={styles.toolbarButton} onPress={handleBulkComplete}>
                            <Text style={styles.toolbarButtonText}>✓ Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolbarButtonSecondary} onPress={clearSelection}>
                            <Text style={styles.toolbarButtonTextSecondary}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Task List */}
            <FlatList
                data={[...incompleteTasks, ...completedTasks]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TaskCard
                        task={item}
                        selected={selectedIds.has(item.id)}
                        onPress={() => handleTaskPress(item.id)}
                        onLongPress={() => handleLongPress(item.id)}
                        onToggleComplete={() => handleToggleComplete(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="🎯"
                        title="No tasks for today"
                        subtitle="Add a task to get started"
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    greeting: {
        ...typography.h1,
        color: colors.textPrimary,
    },
    date: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    statsRow: {
        alignItems: 'flex-end',
    },
    statText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceSecondary,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        ...typography.bodySmall,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.textInverse,
        fontWeight: '600',
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    toolbarText: {
        ...typography.body,
        color: colors.textInverse,
        fontWeight: '600',
    },
    toolbarActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    toolbarButton: {
        backgroundColor: colors.textInverse,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    toolbarButtonText: {
        ...typography.bodySmall,
        color: colors.primary,
        fontWeight: '600',
    },
    toolbarButtonSecondary: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    toolbarButtonTextSecondary: {
        ...typography.bodySmall,
        color: colors.textInverse,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
});
