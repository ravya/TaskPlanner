import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { useTasks, useAuth, useProjects } from '../hooks';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { createTask, toggleTaskComplete, bulkToggleComplete, deleteTask } from '../services/firebase';
import { Task, TaskMode, TaskPriority, TaskFormData } from '../types';

export function TasksScreen() {
    const { user } = useAuth();
    const { tasks, loading, refresh } = useTasks(user?.uid, { includeCompleted: true, realtime: true });
    const { projects } = useProjects(user?.uid);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        if (modeFilter !== 'all' && task.mode !== modeFilter) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const isMultiSelectMode = selectedIds.size > 0;

    // Toggle task selection
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

    const handleTaskPress = useCallback((taskId: string) => {
        if (isMultiSelectMode) {
            handleLongPress(taskId);
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
                        for (const id of selectedIds) {
                            await deleteTask(user.uid, id);
                        }
                        setSelectedIds(new Set());
                    },
                },
            ]
        );
    }, [user, selectedIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    if (loading && tasks.length === 0) {
        return <LoadingState message="Loading tasks..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tasks</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Mode Filter */}
            <View style={styles.filterRow}>
                {(['all', 'personal', 'professional'] as const).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.filterChip, modeFilter === mode && styles.filterChipActive]}
                        onPress={() => setModeFilter(mode)}
                    >
                        <Text style={[styles.filterText, modeFilter === mode && styles.filterTextActive]}>
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
                        <TouchableOpacity style={styles.toolbarButtonDanger} onPress={handleBulkDelete}>
                            <Text style={styles.toolbarButtonText}>🗑 Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={clearSelection}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Task List */}
            <FlatList
                data={filteredTasks}
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState icon="📋" title="No tasks" subtitle="Create your first task" />
                }
            />

            {/* Add Task Modal */}
            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid}
                projects={projects}
            />
        </View>
    );
}

// Simple Add Task Modal
function AddTaskModal({
    visible,
    onClose,
    userId,
    projects,
}: {
    visible: boolean;
    onClose: () => void;
    userId?: string;
    projects: any[];
}) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [mode, setMode] = useState<TaskMode>('personal');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userId || !title.trim()) return;

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            await createTask(userId, {
                title: title.trim(),
                priority,
                mode,
                tags: [],
                startDate: today,
                isRepeating: false,
                subtasks: [],
            });
            setTitle('');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>New Task</Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Task title"
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    {/* Priority */}
                    <Text style={modalStyles.label}>Priority</Text>
                    <View style={modalStyles.optionRow}>
                        {(['low', 'medium', 'high'] as const).map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[modalStyles.optionChip, priority === p && modalStyles.optionChipActive]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[modalStyles.optionText, priority === p && modalStyles.optionTextActive]}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Mode */}
                    <Text style={modalStyles.label}>Mode</Text>
                    <View style={modalStyles.optionRow}>
                        {(['personal', 'professional'] as const).map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[modalStyles.optionChip, mode === m && modalStyles.optionChipActive]}
                                onPress={() => setMode(m)}
                            >
                                <Text style={[modalStyles.optionText, mode === m && modalStyles.optionTextActive]}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.submitButton, (!title.trim() || loading) && modalStyles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={!title.trim() || loading}
                        >
                            <Text style={modalStyles.submitButtonText}>{loading ? 'Adding...' : 'Add Task'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    title: { ...typography.h1, color: colors.textPrimary },
    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addButtonText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
    searchContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    searchInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.body,
        color: colors.textPrimary,
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
    filterChipActive: { backgroundColor: colors.primary },
    filterText: { ...typography.bodySmall, color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse, fontWeight: '600' },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    toolbarText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
    toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    toolbarButton: {
        backgroundColor: colors.textInverse,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    toolbarButtonDanger: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    toolbarButtonText: { ...typography.bodySmall, fontWeight: '600' },
    cancelText: { ...typography.bodySmall, color: colors.textInverse },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
    input: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
    optionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    optionChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
    },
    optionChipActive: { backgroundColor: colors.primary },
    optionText: { ...typography.bodySmall, color: colors.textSecondary },
    optionTextActive: { color: colors.textInverse, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
    },
    cancelButtonText: { ...typography.body, color: colors.textSecondary },
    submitButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    submitButtonText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
    buttonDisabled: { opacity: 0.5 },
});
