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
import { useProjects, useAuth } from '../hooks';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { createProject, deleteProject } from '../services/firebase';
import { Project, ProjectMode, PROJECT_COLORS } from '../types';

export function ProjectsScreen() {
    const { user } = useAuth();
    const { projects, loading, refresh } = useProjects(user?.uid);
    const [modeFilter, setModeFilter] = useState<ProjectMode | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const filteredProjects = projects.filter((p) => {
        if (modeFilter !== 'all' && p.mode !== modeFilter) return false;
        return true;
    });

    const handleDeleteProject = useCallback((project: Project) => {
        if (!user) return;
        Alert.alert(
            'Delete Project',
            `Delete "${project.name}"? This will not delete the tasks.`,
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Projects</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.addButtonText}>+ New</Text>
                </TouchableOpacity>
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

            {/* Project List */}
            <FlatList
                data={filteredProjects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ProjectCard project={item} onDelete={() => handleDeleteProject(item)} />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <EmptyState icon="📁" title="No projects" subtitle="Create a project to organize tasks" />
                }
            />

            <AddProjectModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                userId={user?.uid}
            />
        </View>
    );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
    const progress = project.taskCount > 0
        ? Math.round((project.completedTaskCount / project.taskCount) * 100)
        : 0;

    return (
        <View style={cardStyles.container}>
            <View style={[cardStyles.colorBar, { backgroundColor: project.color || colors.primary }]} />
            <View style={cardStyles.content}>
                <View style={cardStyles.header}>
                    <Text style={cardStyles.icon}>{project.icon || '📁'}</Text>
                    <Text style={cardStyles.name} numberOfLines={1}>{project.name}</Text>
                    <TouchableOpacity onPress={onDelete}>
                        <Text style={cardStyles.deleteIcon}>×</Text>
                    </TouchableOpacity>
                </View>
                <View style={cardStyles.meta}>
                    <Text style={cardStyles.metaText}>
                        {project.completedTaskCount}/{project.taskCount} tasks
                    </Text>
                    <View style={[cardStyles.modeBadge, {
                        backgroundColor: project.mode === 'personal' ? colors.modePersonal : colors.modeProfessional
                    }]}>
                        <Text style={cardStyles.modeText}>
                            {project.mode === 'personal' ? 'P' : 'W'}
                        </Text>
                    </View>
                </View>
                {/* Progress bar */}
                <View style={cardStyles.progressContainer}>
                    <View style={[cardStyles.progressBar, { width: `${progress}%` }]} />
                </View>
            </View>
        </View>
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
    const [mode, setMode] = useState<ProjectMode>('personal');
    const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userId || !name.trim()) return;

        try {
            setLoading(true);
            await createProject(userId, { name: name.trim(), mode, color: selectedColor });
            setName('');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>New Project</Text>

                    <TextInput
                        style={modalStyles.input}
                        placeholder="Project name"
                        placeholderTextColor={colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

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

                    <Text style={modalStyles.label}>Color</Text>
                    <View style={modalStyles.colorRow}>
                        {PROJECT_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    modalStyles.colorDot,
                                    { backgroundColor: color },
                                    selectedColor === color && modalStyles.colorDotActive,
                                ]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </View>

                    <View style={modalStyles.actions}>
                        <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
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
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});

const cardStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        overflow: 'hidden',
        ...shadows.sm,
    },
    colorBar: { width: 4 },
    content: { flex: 1, padding: spacing.md },
    header: { flexDirection: 'row', alignItems: 'center' },
    icon: { fontSize: 20, marginRight: spacing.sm },
    name: { ...typography.body, color: colors.textPrimary, flex: 1, fontWeight: '500' },
    deleteIcon: { fontSize: 24, color: colors.textTertiary, paddingHorizontal: spacing.xs },
    meta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    metaText: { ...typography.caption, color: colors.textSecondary },
    modeBadge: {
        marginLeft: spacing.sm,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeText: { ...typography.caption, color: colors.textInverse, fontWeight: '600', fontSize: 10 },
    progressContainer: {
        height: 3,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    progressBar: { height: '100%', backgroundColor: colors.success, borderRadius: 2 },
});

const modalStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
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
    colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotActive: { borderWidth: 3, borderColor: colors.textPrimary },
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
