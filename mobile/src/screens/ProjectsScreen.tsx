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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProjects, useAuth } from '../hooks';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { createProject, deleteProject, updateProject } from '../services/firebase';
import { Project, ProjectMode, PROJECT_ICONS, getProjectIconName, TaskLabel, DEFAULT_LABELS } from '../types';

export function ProjectsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { projects, loading, refresh } = useProjects(user?.uid);
    const [modeFilter, setModeFilter] = useState<ProjectMode | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const filteredProjects = projects.filter((p) => {
        if (modeFilter !== 'all' && p.mode !== modeFilter) return false;
        if (p.isArchived) return false; // Hide archived by default
        return true;
    });

    const handleArchiveProject = useCallback(async (project: Project) => {
        if (!user) return;
        Alert.alert(
            'Archive Project',
            `Archive "${project.name}"? You can restore it later.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Archive',
                    onPress: async () => {
                        await updateProject(user.uid, project.id, { isArchived: true });
                    },
                },
            ]
        );
    }, [user]);

    const handleDeleteProject = useCallback((project: Project) => {
        if (!user) return;
        Alert.alert(
            'Delete Project',
            `Delete "${project.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteProject(user.uid, project.id),
                },
            ]
        );
    }, [user]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    if (loading && projects.length === 0) {
        return <LoadingState message="Loading projects..." />;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Projects</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ New</Text>
                </TouchableOpacity>
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

            {/* Project List */}
            <FlatList
                data={filteredProjects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ProjectCard
                        project={item}
                        onPress={() => setEditingProject(item)}
                        onArchive={() => handleArchiveProject(item)}
                        onDelete={() => handleDeleteProject(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState icon="folder-open-outline" title="No projects" subtitle="Tap + New to create a project" />
                }
            />

            <AddProjectModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid}
            />

            {editingProject && (
                <EditProjectModal
                    visible={!!editingProject}
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    userId={user?.uid}
                />
            )}
        </View>
    );
}

function ProjectCard({
    project,
    onPress,
    onArchive,
    onDelete,
}: {
    project: Project;
    onPress: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) {
    const progress = project.taskCount > 0
        ? Math.round((project.completedTaskCount / project.taskCount) * 100)
        : 0;

    return (
        <TouchableOpacity style={cardStyles.container} onPress={onPress}>
            <View style={cardStyles.content}>
                <View style={cardStyles.header}>
                    <Text style={cardStyles.name} numberOfLines={1}>{project.name}</Text>
                    <View style={[cardStyles.modeBadge, {
                        backgroundColor: project.mode === 'home' ? colors.modePersonal : colors.modeProfessional
                    }]}>
                        <Ionicons
                            name={project.mode === 'home' ? 'home' : 'briefcase'}
                            size={12}
                            color={colors.textInverse}
                        />
                    </View>
                </View>
                <View style={cardStyles.meta}>
                    <Text style={cardStyles.metaText}>
                        {project.completedTaskCount}/{project.taskCount} tasks
                    </Text>
                    <View style={cardStyles.actions}>
                        <TouchableOpacity onPress={onArchive} style={cardStyles.actionBtn}>
                            <Ionicons name="archive-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete} style={cardStyles.actionBtn}>
                            <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Progress bar */}
                <View style={cardStyles.progressContainer}>
                    <View style={[cardStyles.progressBar, { width: `${progress}%` }]} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

function AddProjectModal({
    visible,
    onClose,
    userId,
}: {
    visible: boolean;
    onClose: () => void;
    userId?: string;
}) {
    const [name, setName] = useState('');
    const [mode, setMode] = useState<ProjectMode>('home');
    const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0]);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [label, setLabel] = useState<TaskLabel>('none');
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userId || !name.trim()) return;

        try {
            setLoading(true);
            await createProject(userId, {
                name: name.trim(),
                mode,
                icon: selectedIcon,
                deadline: deadline || undefined,
                label: label !== 'none' ? label : undefined,
            });
            setName('');
            setDeadline(null);
            setLabel('none');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={modalStyles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={modalStyles.backdrop} onPress={handleClose} />
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <Text style={modalStyles.title}>New Project</Text>

                    <ScrollView showsVerticalScrollIndicator={false} style={modalStyles.scrollContent}>
                        <TextInput
                            style={modalStyles.input}
                            placeholder="Project name"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        <Text style={modalStyles.label}>Mode</Text>
                        <View style={modalStyles.modeRow}>
                            {(['home', 'work'] as const).map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[modalStyles.modeChip, mode === m && modalStyles.modeChipActive]}
                                    onPress={() => setMode(m)}
                                >
                                    <Text style={[modalStyles.modeText, mode === m && modalStyles.modeTextActive]}>
                                        {m === 'home' ? 'Home' : 'Work'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Deadline */}
                        <Text style={modalStyles.label}>Deadline (Optional)</Text>
                        <TouchableOpacity
                            style={modalStyles.dateButton}
                            onPress={() => setShowDatePicker(!showDatePicker)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={deadline ? colors.primary : colors.textSecondary} />
                            <Text style={[modalStyles.dateButtonText, deadline && { color: colors.primary }]}>
                                {deadline ? deadline.toLocaleDateString() : 'Set deadline'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <View style={modalStyles.datePickerContainer}>
                                <DateTimePicker
                                    value={deadline || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowDatePicker(false);
                                        }
                                        if (selectedDate) {
                                            setDeadline(selectedDate);
                                        }
                                    }}
                                    minimumDate={new Date()}
                                />
                                {Platform.OS === 'ios' && (
                                    <View style={modalStyles.datePickerActions}>
                                        <TouchableOpacity onPress={() => { setDeadline(null); setShowDatePicker(false); }}>
                                            <Text style={modalStyles.datePickerClear}>Clear</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text style={modalStyles.datePickerDone}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Label */}
                        <Text style={modalStyles.label}>Label (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.labelPicker}>
                            <TouchableOpacity
                                style={[modalStyles.labelChip, { borderColor: colors.border }, label === 'none' && { backgroundColor: colors.surfaceSecondary }]}
                                onPress={() => setLabel('none')}
                            >
                                <Text style={modalStyles.labelChipText}>None</Text>
                            </TouchableOpacity>
                            {DEFAULT_LABELS.filter(l => l.id !== 'none').map((l) => (
                                <TouchableOpacity
                                    key={l.id}
                                    style={[modalStyles.labelChip, { borderColor: l.color }, label === l.id && { backgroundColor: l.color + '20' }]}
                                    onPress={() => setLabel(l.id)}
                                >
                                    <View style={[modalStyles.labelColorDot, { backgroundColor: l.color }]} />
                                    <Text style={modalStyles.labelChipText}>{l.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </ScrollView>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={modalStyles.cancelButton} onPress={handleClose}>
                            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.submitButton, (!name.trim() || loading) && modalStyles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={!name.trim() || loading}
                        >
                            <Text style={modalStyles.submitButtonText}>{loading ? 'Creating...' : 'Create'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function EditProjectModal({
    visible,
    project,
    onClose,
    userId,
}: {
    visible: boolean;
    project: Project;
    onClose: () => void;
    userId?: string;
}) {
    const [name, setName] = useState(project.name);
    const [mode, setMode] = useState<ProjectMode>(project.mode);
    const [selectedIcon, setSelectedIcon] = useState(project.icon || PROJECT_ICONS[0]);
    const [deadline, setDeadline] = useState<Date | null>((project as any).deadline || null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [label, setLabel] = useState<TaskLabel>((project as any).label || 'none');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!userId || !name.trim()) return;

        try {
            setLoading(true);
            await updateProject(userId, project.id, {
                name: name.trim(),
                mode,
                icon: selectedIcon,
                deadline: deadline || undefined,
                label: label !== 'none' ? label : undefined,
            });
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update project');
        } finally {
            setLoading(false);
        }
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
                    <Text style={modalStyles.title}>Edit Project</Text>

                    <TextInput
                        style={modalStyles.input}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <Text style={modalStyles.label}>Mode</Text>
                    <View style={modalStyles.modeRow}>
                        {(['home', 'work'] as const).map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[modalStyles.modeChip, mode === m && modalStyles.modeChipActive]}
                                onPress={() => setMode(m)}
                            >
                                <Text style={[modalStyles.modeText, mode === m && modalStyles.modeTextActive]}>
                                    {m === 'home' ? 'Home' : 'Work'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Deadline */}
                    <Text style={modalStyles.label}>Deadline (Optional)</Text>
                    <TouchableOpacity
                        style={modalStyles.dateButton}
                        onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                        <Ionicons name="calendar-outline" size={20} color={deadline ? colors.primary : colors.textSecondary} />
                        <Text style={[modalStyles.dateButtonText, deadline && { color: colors.primary }]}>
                            {deadline ? deadline.toLocaleDateString() : 'Set deadline'}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <View style={modalStyles.datePickerContainer}>
                            <DateTimePicker
                                value={deadline || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate) {
                                        setDeadline(selectedDate);
                                    }
                                }}
                                minimumDate={new Date()}
                            />
                            {Platform.OS === 'ios' && (
                                <View style={modalStyles.datePickerActions}>
                                    <TouchableOpacity onPress={() => { setDeadline(null); setShowDatePicker(false); }}>
                                        <Text style={modalStyles.datePickerClear}>Clear</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={modalStyles.datePickerDone}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Label */}
                    <Text style={modalStyles.label}>Label (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.labelPicker}>
                        <TouchableOpacity
                            style={[modalStyles.labelChip, { borderColor: colors.border }, label === 'none' && { backgroundColor: colors.surfaceSecondary }]}
                            onPress={() => setLabel('none')}
                        >
                            <Text style={modalStyles.labelChipText}>None</Text>
                        </TouchableOpacity>
                        {DEFAULT_LABELS.filter((l: any) => l.id !== 'none').map((l: any) => (
                            <TouchableOpacity
                                key={l.id}
                                style={[modalStyles.labelChip, { borderColor: l.color }, label === l.id && { backgroundColor: l.color + '20' }]}
                                onPress={() => setLabel(l.id)}
                            >
                                <View style={[modalStyles.labelColorDot, { backgroundColor: l.color }]} />
                                <Text style={modalStyles.labelChipText}>{l.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.submitButton, loading && modalStyles.buttonDisabled]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={modalStyles.submitButtonText}>Save</Text>
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
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
});

const cardStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    content: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    icon: {
        fontSize: 20,
        marginRight: spacing.sm,
    },
    name: {
        flex: 1,
        fontSize: fontSizes.body,
        fontWeight: '500' as const,
        color: colors.textPrimary,
    },
    modeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    modeText: {
        fontSize: 10,
        fontWeight: '600' as const,
        color: colors.textInverse,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    metaText: {
        fontSize: fontSizes.caption,
        color: colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionBtn: {
        padding: spacing.xs,
    },
    actionIcon: {
        fontSize: 16,
    },
    progressContainer: {
        height: 4,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.success,
        borderRadius: 2,
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
        maxHeight: '80%',
    },
    scrollContent: {
        flexGrow: 0,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.h3,
        fontWeight: '600' as const,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    input: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: fontSizes.body,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    iconRow: {
        marginBottom: spacing.md,
    },
    iconChip: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    iconChipActive: {
        backgroundColor: colors.primaryLight,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    iconText: {
        fontSize: 24,
    },
    modeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    modeChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
    },
    modeChipActive: {
        backgroundColor: colors.primary,
    },
    modeText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    modeTextActive: {
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
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
    submitButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
    },
    submitButtonText: {
        fontSize: fontSizes.body,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    dateButtonText: {
        fontSize: fontSizes.body,
        color: colors.textSecondary,
    },
    datePickerContainer: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    datePickerClear: {
        fontSize: fontSizes.body,
        color: colors.error,
    },
    datePickerDone: {
        fontSize: fontSizes.body,
        color: colors.primary,
        fontWeight: '500' as const,
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
    labelChipText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
    },
});
