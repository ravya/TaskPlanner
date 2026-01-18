import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    SectionList,
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
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { useTasks, useAuth, useSettings, useProjects } from '../hooks';
import { TaskCard } from '../components/TaskCard';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { toggleTaskComplete, bulkToggleComplete, deleteTask, updateTask } from '../services/firebase';
import { Task, TaskMode, TaskLabel, DEFAULT_LABELS } from '../types';

export function TasksScreen(props: any) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { projects } = useProjects(user?.uid);
    // Get filter params from navigation
    const route = React.useMemo(() => (props as any)?.route, [props]);
    const filterType = route?.params?.filterType;
    const routeProjectId = route?.params?.projectId;
    const pageTitle = route?.params?.title || 'Tasks';

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>(settings.defaultMode === 'personal' ? 'home' : (settings.defaultMode === 'professional' ? 'work' : 'all'));
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });

    const { tasks, loading, refresh } = useTasks(user?.uid, {
        includeCompleted: statusFilter === 'all' || statusFilter === 'completed',
        realtime: true,
        filterType,
        projectId: routeProjectId,
        mode: modeFilter === 'all' ? undefined : modeFilter
    });

    const filteredTasks = tasks.filter((task) => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (filterType === 'upcoming') {
            const taskDate = (task as any).dueDate || (task as any).startDate;
            return taskDate === selectedDate;
        }
        return true;
    });

    const isMultiSelectMode = selectedIds.size > 0;
    // Explicitly check for mode toggle visibility - it should always be visible except in multi-select
    const showModeToggle = !isMultiSelectMode;

    const groupedTasks = React.useMemo(() => {
        if (filterType === 'upcoming') {
            return [{ title: selectedDate, data: filteredTasks }];
        }

        const groups: { title: string; data: Task[] }[] = [];

        // Add tasks with no project first
        const noProjectTasks = filteredTasks.filter((t: Task) => !t.projectId);
        if (noProjectTasks.length > 0) {
            groups.push({ title: 'No Project', data: noProjectTasks });
        }

        // Group by projects
        projects.forEach((project) => {
            const projectTasks = filteredTasks.filter((t: Task) => t.projectId === project.id);
            if (projectTasks.length > 0) {
                groups.push({ title: project.name, data: projectTasks });
            }
        });

        return groups;
    }, [filteredTasks, projects, filterType]);



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
                <Text style={styles.title}>{pageTitle}</Text>
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
            {showModeToggle && (
                <View style={styles.filterRow}>
                    {(['home', 'all', 'work'] as const).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.filterChip, modeFilter === mode && styles.filterChipActive]}
                            onPress={() => setModeFilter(mode)}
                        >
                            <Text style={[styles.filterText, modeFilter === mode && styles.filterTextActive]}>
                                {mode === 'all' ? 'None' : mode === 'home' ? 'Home Mode' : 'Work Mode'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Status Filter */}
            <View style={styles.statusFilterRow}>
                {(['active', 'completed', 'all'] as const).map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.statusFilterChip, statusFilter === status && styles.statusFilterActive]}
                        onPress={() => setStatusFilter(status)}
                    >
                        <Text style={[styles.statusFilterText, statusFilter === status && styles.statusFilterTextActive]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Upcoming Calendar Header */}
            {filterType === 'upcoming' && (
                <View style={styles.calendarContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroller}>
                        {Array.from({ length: 14 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i + 1); // Starting from tomorrow
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;

                            return (
                                <TouchableOpacity
                                    key={dateStr}
                                    style={[styles.calendarDay, isSelected && styles.calendarDayActive]}
                                    onPress={() => setSelectedDate(dateStr)}
                                >
                                    <Text style={[styles.calendarDayName, isSelected && styles.calendarTextActive]}>
                                        {date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                                    </Text>
                                    <Text style={[styles.calendarDayNumber, isSelected && styles.calendarTextActive]}>
                                        {date.getDate()}
                                    </Text>
                                    <Text style={[styles.calendarMonth, isSelected && styles.calendarTextActive]}>
                                        {date.toLocaleDateString(undefined, { month: 'short' })}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

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
            <SectionList
                sections={groupedTasks}
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
                renderSectionHeader={({ section: { title } }) => {
                    if (filterType === 'upcoming') {
                        return null; // We use the calendar header instead
                    }
                    return title === 'No Project' ? null : (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    filterType === 'upcoming' ? (
                        <View style={styles.emptyCalendar}>
                            <Ionicons name="calendar-outline" size={64} color={colors.border} />
                            <Text style={styles.emptyCalendarTitle}>Empty Calendar</Text>
                            <Text style={styles.emptyCalendarSubtitle}>No tasks for this date</Text>
                        </View>
                    ) : (
                        <EmptyState icon="checkbox-outline" title="No tasks" subtitle="Tap + Add to create a task" />
                    )
                }
            />

            {/* Add Task Modal */}
            <AddTaskModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid || null}
                projects={projects}
                defaultMode={settings.defaultMode === 'personal' ? 'home' : 'work'}
                initialProjectId={routeProjectId}
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
    statusFilterRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    statusFilterChip: {
        flex: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
    },
    statusFilterActive: {
        backgroundColor: colors.primary + '20', // Light primary
        borderWidth: 1,
        borderColor: colors.primary,
    },
    statusFilterText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    statusFilterTextActive: {
        color: colors.primary,
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
    sectionHeader: {
        backgroundColor: colors.background,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        fontSize: fontSizes.bodySmall,
        fontWeight: '700' as const,
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    dateBadge: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateNumber: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: colors.textPrimary,
        lineHeight: 28,
    },
    dayName: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: colors.textTertiary,
        letterSpacing: 1,
    },
    dateInfo: {
        justifyContent: 'center',
    },
    monthName: {
        fontSize: fontSizes.bodySmall,
        fontWeight: '700' as const,
        color: colors.textPrimary,
    },
    yearName: {
        fontSize: 10,
        color: colors.textTertiary,
    },
    headerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
        marginLeft: spacing.sm,
    },
    calendarContainer: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        paddingVertical: spacing.md,
    },
    calendarScroller: {
        paddingHorizontal: spacing.lg,
    },
    calendarDay: {
        width: 60,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        backgroundColor: colors.surfaceSecondary,
    },
    calendarDayActive: {
        backgroundColor: colors.primary,
    },
    calendarDayName: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: colors.textTertiary,
        marginBottom: 4,
    },
    calendarDayNumber: {
        fontSize: 18,
        fontWeight: '800' as const,
        color: colors.textPrimary,
    },
    calendarMonth: {
        fontSize: 10,
        color: colors.textTertiary,
        marginTop: 2,
    },
    calendarTextActive: {
        color: colors.textInverse,
    },
    emptyCalendar: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyCalendarTitle: {
        fontSize: fontSizes.h3,
        fontWeight: '700' as const,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptyCalendarSubtitle: {
        fontSize: fontSizes.bodySmall,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
});
