import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { useTodayTasks, useAuth, useProjects, useSettings } from '../hooks';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { toggleTaskComplete, bulkToggleComplete, deleteTask, updateTask } from '../services/firebase';
import { Task, TaskMode, TaskLabel, DEFAULT_LABELS } from '../types';

export function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { tasks, loading, refresh } = useTodayTasks(user?.uid);
    const { projects } = useProjects(user?.uid);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>(settings.defaultMode === 'personal' ? 'home' : (settings.defaultMode === 'professional' ? 'work' : 'all'));
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const filteredTasks = tasks.filter((task) => {
        if (modeFilter !== 'all' && task.mode !== modeFilter) return false;
        return true;
    });

    const incompleteTasks = filteredTasks.filter((t) => !t.completed);
    const completedTasks = filteredTasks.filter((t) => t.completed);

    const isMultiSelectMode = selectedIds.size > 0;

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

    const handleTaskPress = useCallback((task: Task) => {
        if (isMultiSelectMode) {
            handleLongPress(task.id);
        } else {
            // Open edit modal
            setEditingTask(task);
        }
    }, [isMultiSelectMode, handleLongPress]);

    const handleToggleComplete = useCallback(async (task: Task) => {
        if (!user) return;
        try {
            await toggleTaskComplete(user.uid, task.id, !task.completed);
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
        }
    }, [user]);

    const handleBulkComplete = useCallback(async () => {
        if (!user || selectedIds.size === 0) return;
        try {
            await bulkToggleComplete(user.uid, Array.from(selectedIds), true);
            setSelectedIds(new Set());
        } catch (error) {
            Alert.alert('Error', 'Failed to complete tasks');
        }
    }, [user, selectedIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleBulkDelete = useCallback(async () => {
        if (!user || selectedIds.size === 0) return;
        Alert.alert(
            'Delete Tasks',
            `Are you sure you want to delete ${selectedIds.size} task(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(
                                Array.from(selectedIds).map(id => deleteTask(user.uid, id))
                            );
                            setSelectedIds(new Set());
                            refresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete tasks');
                        }
                    },
                },
            ]
        );
    }, [user, selectedIds, refresh]);

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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Today</Text>
                    <Text style={styles.date}>{dateString}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{incompleteTasks.length}</Text>
                    <Text style={styles.statLabel}>pending</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{completedTasks.length}</Text>
                    <Text style={styles.statLabel}>done</Text>
                </View>
            </View>

            {/* Mode Filter - Home/Work */}
            <View style={styles.filterRow}>
                {(['all', 'home', 'work'] as const).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.filterChip, modeFilter === mode && styles.filterChipActive]}
                        onPress={() => setModeFilter(mode)}
                    >
                        <Text style={[styles.filterText, modeFilter === mode && styles.filterTextActive]}>
                            {mode === 'all' ? 'All' : mode === 'home' ? 'Home' : 'Work'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Multi-select toolbar - Icons only */}
            {isMultiSelectMode && (
                <View style={styles.toolbar}>
                    <Text style={styles.toolbarText}>{selectedIds.size}</Text>
                    <View style={styles.toolbarActions}>
                        <TouchableOpacity style={styles.toolbarIconBtn} onPress={handleBulkComplete}>
                            <Ionicons name="checkmark" size={20} color={colors.success} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolbarIconBtn} onPress={handleBulkDelete}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolbarIconBtn} onPress={clearSelection}>
                            <Ionicons name="close" size={20} color={colors.textSecondary} />
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
                        onPress={() => handleTaskPress(item)}
                        onLongPress={() => handleLongPress(item.id)}
                        onToggleComplete={() => handleToggleComplete(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState
                        icon="today-outline"
                        title="No tasks for today"
                        subtitle="Tap + Add to create a task"
                    />
                }
            />

            {/* Add Task Modal */}
            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid || null}
                projects={projects}
                defaultMode={settings.defaultMode === 'personal' ? 'home' : 'work'}
            />

            {/* Edit Task Modal */}
            {editingTask && (
                <EditTaskModal
                    visible={!!editingTask}
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    userId={user?.uid || null}
                    projects={projects}
                />
            )}
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
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    greeting: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.textPrimary,
    },
    date: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addButtonText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.lg,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.xs,
    },
    statNumber: {
        fontSize: fontSizes.h2,
        fontWeight: '700' as const,
        color: colors.primary,
    },
    statLabel: {
        fontSize: fontSizes.bodySmall,
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
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    toolbarText: {
        fontSize: fontSizes.h3,
        color: colors.textInverse,
        fontWeight: '700' as const,
        marginLeft: spacing.xs,
    },
    toolbarActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    toolbarIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarIcon: {
        fontSize: 20,
        color: colors.textInverse,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
});


