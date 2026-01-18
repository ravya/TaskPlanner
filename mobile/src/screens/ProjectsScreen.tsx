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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProjects, useAuth } from '../hooks';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { createProject, deleteProject, updateProject } from '../services/firebase';
import { Project, ProjectMode, PROJECT_ICONS, getProjectIconName, TaskLabel, DEFAULT_LABELS, PROJECT_LIMITS } from '../types';
import { auth } from '../services/firebase/config';

export function ProjectsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { projects, loading, refresh } = useProjects(user?.uid);
    const navigation = useNavigation<any>();
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
                        onPress={() => navigation.navigate('Tasks', { projectId: item.id })}
                        onEdit={() => setEditingProject(item)}
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
                projects={projects}
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
    onEdit,
    onArchive,
    onDelete,
}: {
    project: Project;
    onPress: () => void;
    onEdit: () => void;
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
                        backgroundColor: project.mode === 'home' ? colors.modePersonal + '15' : colors.modeProfessional + '15'
                    }]}>
                        <Ionicons
                            name={project.mode === 'home' ? 'home' : 'briefcase'}
                            size={12}
                            color={project.mode === 'home' ? colors.modePersonal : colors.modeProfessional}
                        />
                        <Text style={[cardStyles.modeBadgeText, {
                            color: project.mode === 'home' ? colors.modePersonal : colors.modeProfessional
                        }]}>
                            {project.mode === 'home' ? 'Home' : 'Work'}
                        </Text>
                    </View>
                </View>
                <View style={cardStyles.meta}>
                    <Text style={cardStyles.metaText}>
                        {project.completedTaskCount}/{project.taskCount} tasks
                    </Text>
                    <View style={cardStyles.actions}>
                        <TouchableOpacity onPress={onEdit} style={cardStyles.actionBtn}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
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

export function AddProjectModal({
    visible,
    onClose,
    userId,
    projects,
}: {
    visible: boolean;
    onClose: () => void;
    userId?: string;
    projects: Project[];
}) {
    const [name, setName] = useState('');
    const [mode, setMode] = useState<ProjectMode>('home');
    const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0]);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [label, setLabel] = useState<TaskLabel>('none');

    // Pickers
    const [activeSection, setActiveSection] = useState<'mode' | 'deadline' | 'label' | 'icon' | null>(null);
    const [loading, setLoading] = useState(false);

    const currentUser = auth.currentUser;
    const isGoogleUser = currentUser?.providerData.some((p: any) => p.providerId === 'google.com');
    const isVerified = currentUser?.emailVerified || isGoogleUser;

    const countInCurrentMode = projects.filter(p => !p.isDeleted && p.mode === mode).length;
    const isLimitReached = !isVerified && countInCurrentMode >= PROJECT_LIMITS.MAX_PROJECTS_UNVERIFIED;

    const handleClose = () => {
        setName('');
        setMode('home');
        setSelectedIcon(PROJECT_ICONS[0]);
        setDeadline(null);
        setLabel('none');
        setActiveSection(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!userId || !name.trim()) return;

        try {
            setLoading(true);
            await createProject(userId, {
                name: name.trim(),
                mode,
                icon: selectedIcon,
                deadline: deadline ? deadline.toISOString() : undefined,
                label: label !== 'none' ? label : undefined,
            });
            handleClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create project');
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
                <TouchableOpacity style={modalStyles.backdrop} onPress={handleClose} />
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <ScrollView showsVerticalScrollIndicator={false} style={modalStyles.scrollContent} keyboardShouldPersistTaps="handled">
                        <Text style={modalStyles.title}>New Project</Text>
                        <TextInput
                            style={modalStyles.input}
                            placeholder="Project name"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        {!isVerified && (
                            <View style={[
                                modalStyles.restrictionBanner,
                                isLimitReached ? modalStyles.limitReachedBanner : modalStyles.infoBanner
                            ]}>
                                <Ionicons
                                    name={isLimitReached ? "warning" : "information-circle"}
                                    size={18}
                                    color={isLimitReached ? colors.error : colors.primary}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        modalStyles.restrictionText,
                                        isLimitReached ? modalStyles.limitReachedText : modalStyles.infoText
                                    ]}>
                                        {isLimitReached
                                            ? `${mode === 'home' ? 'Home' : 'Work'} limit reached (${countInCurrentMode}/${PROJECT_LIMITS.MAX_PROJECTS_UNVERIFIED})`
                                            : `Account limit: ${countInCurrentMode}/${PROJECT_LIMITS.MAX_PROJECTS_UNVERIFIED} ${mode === 'home' ? 'Home' : 'Work'} projects`}
                                    </Text>
                                    <Text style={modalStyles.restrictionSubtext}>
                                        {isLimitReached
                                            ? 'Please verify your email to create more.'
                                            : 'Verify your email to remove this limit.'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Icon toolbar */}
                        <View style={modalStyles.toolbar}>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'mode' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'mode' ? null : 'mode')}
                            >
                                <Ionicons name={mode === 'home' ? 'home' : 'briefcase'} size={20} color={activeSection === 'mode' ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'deadline' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'deadline' ? null : 'deadline')}
                            >
                                <Ionicons name={deadline ? "flag" : "flag-outline"} size={20} color={activeSection === 'deadline' || deadline ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'label' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'label' ? null : 'label')}
                            >
                                <Ionicons name={label !== 'none' ? "pricetag" : "pricetag-outline"} size={20} color={activeSection === 'label' || label !== 'none' ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'icon' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'icon' ? null : 'icon')}
                            >
                                <Text style={modalStyles.toolbarIconText}>{selectedIcon}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Picker area */}
                        {activeSection === 'mode' && (
                            <View style={modalStyles.pickerArea}>
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
                            </View>
                        )}

                        {activeSection === 'deadline' && (
                            <View style={modalStyles.pickerArea}>
                                <DateTimePicker
                                    value={deadline || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') setActiveSection(null);
                                        if (selectedDate) setDeadline(selectedDate);
                                    }}
                                    minimumDate={new Date()}
                                    textColor={colors.textPrimary}
                                />
                                {Platform.OS === 'ios' && (
                                    <View style={modalStyles.pickerActions}>
                                        <TouchableOpacity onPress={() => { setDeadline(null); setActiveSection(null); }}>
                                            <Text style={modalStyles.pickerClear}>Clear</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setActiveSection(null)}>
                                            <Text style={modalStyles.pickerDone}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeSection === 'label' && (
                            <View style={modalStyles.pickerArea}>
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
                            </View>
                        )}

                        {activeSection === 'icon' && (
                            <View style={modalStyles.pickerArea}>
                                <View style={modalStyles.iconGrid}>
                                    {PROJECT_ICONS.map((icon) => (
                                        <TouchableOpacity
                                            key={icon}
                                            style={[modalStyles.iconChip, selectedIcon === icon && modalStyles.iconChipActive]}
                                            onPress={() => setSelectedIcon(icon)}
                                        >
                                            <Text style={modalStyles.iconText}>{icon}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={[modalStyles.cancelButton, { backgroundColor: colors.error }]} onPress={handleClose}>
                            <Text style={[modalStyles.cancelButtonText, { color: colors.textInverse, fontWeight: '600' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.submitButton, (!name.trim() || loading || isLimitReached) && modalStyles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={!name.trim() || loading || isLimitReached}
                        >
                            <Text style={modalStyles.submitButtonText}>
                                {loading ? 'Creating...' : isLimitReached ? 'Limit Reached' : 'Create'}
                            </Text>
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
    const [deadline, setDeadline] = useState<Date | null>(project.deadline ? new Date(project.deadline) : null);
    const [label, setLabel] = useState<TaskLabel>((project.label as TaskLabel) || 'none');

    const [activeSection, setActiveSection] = useState<'mode' | 'deadline' | 'label' | 'icon' | null>(null);
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        // Reset states to project's original values on close if not saved
        setName(project.name);
        setMode(project.mode);
        setSelectedIcon(project.icon || PROJECT_ICONS[0]);
        setDeadline(project.deadline ? new Date(project.deadline) : null);
        setLabel((project.label as TaskLabel) || 'none');
        setActiveSection(null);
        onClose();
    };

    const handleSave = async () => {
        if (!userId || !name.trim()) return;

        try {
            setLoading(true);
            await updateProject(userId, project.id, {
                name: name.trim(),
                mode,
                icon: selectedIcon,
                deadline: deadline ? deadline.toISOString() : undefined,
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
                <TouchableOpacity style={modalStyles.backdrop} onPress={handleClose} />
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <ScrollView showsVerticalScrollIndicator={false} style={modalStyles.scrollContent} keyboardShouldPersistTaps="handled">
                        <Text style={modalStyles.title}>Edit Project</Text>
                        <TextInput
                            style={modalStyles.input}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        {/* Icon toolbar */}
                        <View style={modalStyles.toolbar}>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'mode' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'mode' ? null : 'mode')}
                            >
                                <Ionicons name={mode === 'home' ? 'home' : 'briefcase'} size={20} color={activeSection === 'mode' ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'deadline' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'deadline' ? null : 'deadline')}
                            >
                                <Ionicons name={deadline ? "flag" : "flag-outline"} size={20} color={activeSection === 'deadline' || deadline ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'label' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'label' ? null : 'label')}
                            >
                                <Ionicons name={label !== 'none' ? "pricetag" : "pricetag-outline"} size={20} color={activeSection === 'label' || label !== 'none' ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.toolbarItem, activeSection === 'icon' && modalStyles.toolbarItemActive]}
                                onPress={() => setActiveSection(activeSection === 'icon' ? null : 'icon')}
                            >
                                <Text style={modalStyles.toolbarIconText}>{selectedIcon}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Picker area */}
                        {activeSection === 'mode' && (
                            <View style={modalStyles.pickerArea}>
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
                            </View>
                        )}

                        {activeSection === 'deadline' && (
                            <View style={modalStyles.pickerArea}>
                                <DateTimePicker
                                    value={deadline || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') setActiveSection(null);
                                        if (selectedDate) setDeadline(selectedDate);
                                    }}
                                    minimumDate={new Date()}
                                    textColor={colors.textPrimary}
                                />
                                {Platform.OS === 'ios' && (
                                    <View style={modalStyles.pickerActions}>
                                        <TouchableOpacity onPress={() => { setDeadline(null); setActiveSection(null); }}>
                                            <Text style={modalStyles.pickerClear}>Clear</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setActiveSection(null)}>
                                            <Text style={modalStyles.pickerDone}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeSection === 'label' && (
                            <View style={modalStyles.pickerArea}>
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
                            </View>
                        )}

                        {activeSection === 'icon' && (
                            <View style={modalStyles.pickerArea}>
                                <View style={modalStyles.iconGrid}>
                                    {PROJECT_ICONS.map((icon) => (
                                        <TouchableOpacity
                                            key={icon}
                                            style={[modalStyles.iconChip, selectedIcon === icon && modalStyles.iconChipActive]}
                                            onPress={() => setSelectedIcon(icon)}
                                        >
                                            <Text style={modalStyles.iconText}>{icon}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={[modalStyles.cancelButton, { backgroundColor: colors.error }]} onPress={handleClose}>
                            <Text style={[modalStyles.cancelButtonText, { color: colors.textInverse, fontWeight: '600' }]}>Cancel</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        gap: 4,
    },
    modeBadgeText: {
        fontSize: 10,
        fontWeight: '600' as const,
        textTransform: 'capitalize',
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
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xl,
        maxHeight: '85%',
    },
    scrollContent: {
        flexGrow: 1,
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
        marginBottom: spacing.md,
    },
    input: {
        fontSize: fontSizes.h2,
        fontWeight: '500' as const,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        paddingVertical: spacing.xs,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    toolbarItem: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceSecondary,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarItemActive: {
        backgroundColor: colors.primary + '15',
    },
    toolbarIconText: {
        fontSize: 18,
    },
    pickerArea: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    modeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    modeChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
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
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    iconChip: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconChipActive: {
        backgroundColor: colors.primary + '15',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    iconText: {
        fontSize: 24,
    },
    labelPicker: {
        flexDirection: 'row',
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
        backgroundColor: colors.surface,
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
    pickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    pickerClear: {
        fontSize: fontSizes.body,
        color: colors.error,
    },
    pickerDone: {
        fontSize: fontSizes.body,
        color: colors.primary,
        fontWeight: '500' as const,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: 'auto',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    cancelButtonText: {
        fontSize: fontSizes.body,
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
    restrictionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    infoBanner: {
        backgroundColor: colors.primary + '10',
    },
    limitReachedBanner: {
        backgroundColor: colors.error + '10',
    },
    restrictionText: {
        fontSize: fontSizes.bodySmall,
        fontWeight: '600',
    },
    infoText: {
        color: colors.primary,
    },
    limitReachedText: {
        color: colors.error,
    },
    restrictionSubtext: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
