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
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useAuth, useSettings, useProjects } from '../hooks';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { createTask, toggleTaskComplete, bulkToggleComplete, deleteTask, updateTask } from '../services/firebase';
import { Task, TaskMode, TaskLabel, DEFAULT_LABELS } from '../types';

export function TasksScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { projects } = useProjects(user?.uid);
    const { tasks, loading, refresh } = useTasks(user?.uid, { includeCompleted: true, realtime: true });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = tasks.filter((task) => {
        if (modeFilter !== 'all' && task.mode !== modeFilter) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

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

    const handleBulkDelete = useCallback(async () => {
        if (!user || selectedIds.size === 0) return;
        try {
            for (const id of selectedIds) {
                await deleteTask(user.uid, id);
            }
            setSelectedIds(new Set());
        } catch (error) {
            Alert.alert('Error', 'Failed to delete tasks');
        }
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
                            <Ionicons name="checkmark" size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toolbarIconBtn, styles.toolbarIconBtnDanger]} onPress={handleBulkDelete}>
                            <Ionicons name="trash-outline" size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolbarIconBtn} onPress={clearSelection}>
                            <Ionicons name="close" size={20} color={colors.textInverse} />
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
                        onPress={() => handleTaskPress(item)}
                        onLongPress={() => handleLongPress(item.id)}
                        onToggleComplete={() => handleToggleComplete(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState icon="checkbox-outline" title="No tasks" subtitle="Tap + Add to create a task" />
                }
            />

            {/* Add Task Modal */}
            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid}
                projects={projects}
                defaultMode={settings.defaultMode === 'personal' ? 'home' : 'work'}
            />

            {/* Edit Task Modal */}
            {editingTask && (
                <EditTaskModal
                    visible={!!editingTask}
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    userId={user?.uid}
                />
            )}
        </View>
    );
}

// Add Task Modal
function AddTaskModal({
    visible,
    onClose,
    userId,
    projects,
    defaultMode = 'home',
}: {
    visible: boolean;
    onClose: () => void;
    userId?: string;
    projects: any[];
    defaultMode?: TaskMode;
}) {
    const [title, setTitle] = useState('');
    const [mode, setMode] = useState<TaskMode>(defaultMode);
    const [label, setLabel] = useState<TaskLabel>('none');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userId || !title.trim()) return;

        try {
            setLoading(true);
            await createTask(userId, {
                title: title.trim(),
                mode,
                label,
                dueDate: new Date(),
                projectId: selectedProjectId || undefined,
            });
            setTitle('');
            setLabel('none');
            setSelectedProjectId(null);
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setLabel('none');
        setSelectedProjectId(null);
        onClose();
    };

    const selectedLabel = DEFAULT_LABELS.find((l) => l.id === label);
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={modalStyles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={modalStyles.backdrop} onPress={handleClose} />
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <Text style={modalStyles.title}>New Task</Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="What needs to be done?"
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    {/* Icon toolbar */}
                    <View style={modalStyles.iconToolbar}>
                        <TouchableOpacity
                            style={modalStyles.toolbarItem}
                            onPress={() => setShowLabelPicker(!showLabelPicker)}
                        >
                            <Ionicons name="pricetag-outline" size={22} color={label !== 'none' ? selectedLabel?.color : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={modalStyles.toolbarItem}
                            onPress={() => setShowProjectPicker(!showProjectPicker)}
                        >
                            <Ionicons name="folder-outline" size={22} color={selectedProjectId ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.toolbarItem}>
                            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.toolbarItem}>
                            <Ionicons name="checkbox-outline" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Label picker */}
                    {showLabelPicker && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.labelPicker}>
                            {DEFAULT_LABELS.map((l) => (
                                <TouchableOpacity
                                    key={l.id}
                                    style={[
                                        modalStyles.labelChip,
                                        { borderColor: l.color },
                                        label === l.id && { backgroundColor: l.color + '20' },
                                    ]}
                                    onPress={() => {
                                        setLabel(l.id);
                                        setShowLabelPicker(false);
                                    }}
                                >
                                    <View style={[modalStyles.labelColorDot, { backgroundColor: l.color }]} />
                                    <Text style={modalStyles.labelText}>{l.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Project picker */}
                    {showProjectPicker && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.labelPicker}>
                            <TouchableOpacity
                                style={[
                                    modalStyles.labelChip,
                                    { borderColor: colors.border },
                                    !selectedProjectId && { backgroundColor: colors.surfaceSecondary },
                                ]}
                                onPress={() => {
                                    setSelectedProjectId(null);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Text style={modalStyles.labelText}>No Project</Text>
                            </TouchableOpacity>
                            {projects.filter(p => !p.isArchived).map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        modalStyles.labelChip,
                                        { borderColor: colors.primary },
                                        selectedProjectId === p.id && { backgroundColor: colors.primaryLight + '30' },
                                    ]}
                                    onPress={() => {
                                        setSelectedProjectId(p.id);
                                        setShowProjectPicker(false);
                                    }}
                                >
                                    <Text style={modalStyles.labelText}>{p.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <View style={modalStyles.row}>
                        <View style={modalStyles.modeToggle}>
                            <TouchableOpacity
                                style={[modalStyles.modeButton, mode === 'home' && modalStyles.modeButtonActive]}
                                onPress={() => setMode('home')}
                            >
                                <Text style={[modalStyles.modeText, mode === 'home' && modalStyles.modeTextActive]}>Home</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.modeButton, mode === 'work' && modalStyles.modeButtonActive]}
                                onPress={() => setMode('work')}
                            >
                                <Text style={[modalStyles.modeText, mode === 'work' && modalStyles.modeTextActive]}>Work</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[modalStyles.submitButton, (!title.trim() || loading) && modalStyles.submitDisabled]}
                            onPress={handleSubmit}
                            disabled={!title.trim() || loading}
                        >
                            <Text style={modalStyles.submitText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Edit Task Modal
function EditTaskModal({
    visible,
    task,
    onClose,
    userId,
}: {
    visible: boolean;
    task: Task;
    onClose: () => void;
    userId?: string;
}) {
    const [title, setTitle] = useState(task.title);
    const [mode, setMode] = useState<TaskMode>(task.mode);
    const [label, setLabel] = useState<TaskLabel>((task as any).label || 'none');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!userId || !title.trim()) return;

        try {
            setLoading(true);
            await updateTask(userId, task.id, {
                title: title.trim(),
                mode,
                label,
            } as any);
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!userId) return;
        Alert.alert('Delete Task', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteTask(userId, task.id);
                    onClose();
                },
            },
        ]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={modalStyles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={modalStyles.backdrop} onPress={onClose} />
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <View style={modalStyles.editHeader}>
                        <Text style={modalStyles.title}>Edit Task</Text>
                        <TouchableOpacity onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={24} color={colors.error} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={modalStyles.input}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    <Text style={modalStyles.sectionLabel}>Label</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.labelPicker}>
                        {DEFAULT_LABELS.map((l) => (
                            <TouchableOpacity
                                key={l.id}
                                style={[
                                    modalStyles.labelChip,
                                    { borderColor: l.color },
                                    label === l.id && { backgroundColor: l.color + '20' },
                                ]}
                                onPress={() => setLabel(l.id)}
                            >
                                <View style={[modalStyles.labelColorDot, { backgroundColor: l.color }]} />
                                <Text style={modalStyles.labelText}>{l.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={modalStyles.sectionLabel}>Mode</Text>
                    <View style={modalStyles.modeToggle}>
                        <TouchableOpacity
                            style={[modalStyles.modeButton, mode === 'home' && modalStyles.modeButtonActive]}
                            onPress={() => setMode('home')}
                        >
                            <Text style={[modalStyles.modeText, mode === 'home' && modalStyles.modeTextActive]}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.modeButton, mode === 'work' && modalStyles.modeButtonActive]}
                            onPress={() => setMode('work')}
                        >
                            <Text style={[modalStyles.modeText, mode === 'work' && modalStyles.modeTextActive]}>Work</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.submitButton, loading && modalStyles.submitDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={modalStyles.submitText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
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
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.textPrimary,
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
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    searchInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSizes.body,
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
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    toolbarText: {
        fontSize: fontSizes.h3,
        color: colors.textInverse,
        fontWeight: '700' as const,
    },
    toolbarActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    toolbarIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarIconBtnDanger: {
        backgroundColor: colors.error,
    },
    toolbarIcon: {
        fontSize: 16,
        color: colors.textInverse,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
        backgroundColor: colors.overlay,
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
        maxHeight: '75%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSizes.h3,
        fontWeight: '600' as const,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    deleteBtn: {
        fontSize: 24,
        marginBottom: spacing.md,
    },
    input: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconToolbar: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        gap: spacing.lg,
    },
    toolbarItem: {
        position: 'relative',
    },
    toolbarIconText: {
        fontSize: 24,
    },
    labelDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    labelPicker: {
        marginBottom: spacing.md,
    },
    labelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        marginRight: spacing.sm,
        gap: spacing.xs,
    },
    labelColorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    labelText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
    },
    sectionLabel: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        padding: 2,
    },
    modeButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    modeButtonActive: {
        backgroundColor: colors.surface,
    },
    modeText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    modeTextActive: {
        color: colors.textPrimary,
        fontWeight: '500' as const,
    },
    submitButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    submitDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: fontSizes.body,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
    },
    cancelButtonText: {
        fontSize: fontSizes.body,
        color: colors.textSecondary,
    },
});
