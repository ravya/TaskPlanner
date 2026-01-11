import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { updateTask, deleteTask } from '../services/firebase';
import { Task, TaskMode, TaskLabel, DEFAULT_LABELS, Subtask, Project } from '../types';

interface EditTaskModalProps {
    visible: boolean;
    task: Task;
    onClose: () => void;
    userId: string | null;
    projects: Project[];
}

export function EditTaskModal({
    visible,
    task,
    onClose,
    userId,
    projects,
}: EditTaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [mode, setMode] = useState<TaskMode>(task.mode);
    const [labels, setLabels] = useState<TaskLabel[]>(task.labels || [(task as any).label].filter(Boolean) || []);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(task.projectId || null);
    const [dueDate, setDueDate] = useState<Date | null>(task.dueDate ? new Date(task.dueDate) : null);

    // Pickers visibility
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [showSubtaskSection, setShowSubtaskSection] = useState(false);
    const [showRecurringPicker, setShowRecurringPicker] = useState(false);

    // Subtasks
    const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
    const [newSubtaskText, setNewSubtaskText] = useState('');

    // Recurring
    const [isRepeating, setIsRepeating] = useState(task.isRepeating || false);
    const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | null>(task.repeatFrequency || null);
    const [repeatEndDate, setRepeatEndDate] = useState<Date | null>(task.repeatEndDate ? new Date(task.repeatEndDate) : null);
    const [showRepeatEndDatePicker, setShowRepeatEndDatePicker] = useState(false);

    const [loading, setLoading] = useState(false);

    // Update internal state when task changes (e.g. when opening modal for a different task)
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setMode(task.mode);
            setLabels(task.labels || [(task as any).label].filter(Boolean) || []);
            setSelectedProjectId(task.projectId || null);
            setDueDate(task.dueDate ? new Date(task.dueDate) : null);
            setSubtasks(task.subtasks || []);
            setIsRepeating(task.isRepeating || false);
            setRepeatFrequency(task.repeatFrequency || null);
            setRepeatEndDate(task.repeatEndDate ? new Date(task.repeatEndDate) : null);
        }
    }, [task]);

    const handleSave = async () => {
        if (!userId || !title.trim()) return;

        try {
            setLoading(true);
            await updateTask(userId, task.id, {
                title: title.trim(),
                mode,
                labels,
                label: labels[0] || 'none',
                dueDate: dueDate ? dueDate.toISOString().split('T')[0] : (task as any).dueDate,
                projectId: selectedProjectId || null,
                subtasks,
                isRepeating,
                repeatFrequency: repeatFrequency || null,
                repeatEndDate: repeatEndDate ? repeatEndDate.toISOString() : null,
            } as any);
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
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

    const toggleLabel = (labelId: TaskLabel) => {
        setLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(l => l !== labelId)
                : [...prev, labelId]
        );
    };

    const addSubtask = () => {
        if (!newSubtaskText.trim()) return;
        setSubtasks(prev => [...prev, {
            id: Date.now().toString(),
            title: newSubtaskText.trim(),
            completed: false,
        }]);
        setNewSubtaskText('');
    };

    const removeSubtask = (id: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== id));
    };

    const toggleSubtaskComplete = (id: string) => {
        setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const selectedLabelColors = labels.map(l => DEFAULT_LABELS.find(dl => dl.id === l)?.color).filter(Boolean);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.handle} />
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Task</Text>
                            <TouchableOpacity onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={24} color={colors.error} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                        />

                        {/* Icon toolbar - Order: Subtasks, Label, Time, Recurring, Project */}
                        <View style={styles.iconToolbar}>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showSubtaskSection && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowSubtaskSection(!showSubtaskSection);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={subtasks.length > 0 ? "list" : "list-outline"} size={22} color={showSubtaskSection || subtasks.length > 0 ? colors.primary : colors.textSecondary} />
                                {subtasks.length > 0 && <Text style={styles.badgeText}>{subtasks.length}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showLabelPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowLabelPicker(!showLabelPicker);
                                    setShowSubtaskSection(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={labels.length > 0 ? "pricetag" : "pricetag-outline"} size={22} color={showLabelPicker ? colors.primary : (labels.length > 0 ? selectedLabelColors[0] as string : colors.textSecondary)} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showDatePicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowDatePicker(!showDatePicker);
                                    setShowSubtaskSection(false);
                                    setShowLabelPicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={dueDate ? "calendar" : "calendar-outline"} size={22} color={showDatePicker || dueDate ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showRecurringPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowRecurringPicker(!showRecurringPicker);
                                    setShowSubtaskSection(false);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={isRepeating ? "repeat" : "repeat-outline"} size={22} color={showRecurringPicker || isRepeating ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showProjectPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowProjectPicker(!showProjectPicker);
                                    setShowSubtaskSection(false);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                }}
                            >
                                <Ionicons name={selectedProjectId ? "folder" : "folder-outline"} size={22} color={showProjectPicker || selectedProjectId ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Subtask section */}
                        {showSubtaskSection && (
                            <View style={styles.subtaskSection}>
                                <Text style={styles.sectionLabel}>Subtasks</Text>
                                {subtasks.map((s) => (
                                    <View key={s.id} style={styles.subtaskItem}>
                                        <TouchableOpacity onPress={() => toggleSubtaskComplete(s.id)}>
                                            <Ionicons name={s.completed ? "checkbox" : "square-outline"} size={20} color={s.completed ? colors.success : colors.textSecondary} />
                                        </TouchableOpacity>
                                        <Text style={[styles.subtaskItemText, s.completed && styles.subtaskTextCompleted]}>{s.title}</Text>
                                        <TouchableOpacity onPress={() => removeSubtask(s.id)}>
                                            <Ionicons name="close-circle" size={18} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <View style={styles.subtaskInputRow}>
                                    <TextInput
                                        style={styles.subtaskInput}
                                        placeholder="Add subtask..."
                                        placeholderTextColor={colors.textTertiary}
                                        value={newSubtaskText}
                                        onChangeText={setNewSubtaskText}
                                        onSubmitEditing={addSubtask}
                                    />
                                    <TouchableOpacity onPress={addSubtask} style={styles.addSubtaskBtn}>
                                        <Ionicons name="add-circle" size={28} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Label picker - Multi-select */}
                        {showLabelPicker && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labelPicker}>
                                {DEFAULT_LABELS.filter(l => l.id !== 'none').map((l) => (
                                    <TouchableOpacity
                                        key={l.id}
                                        style={[
                                            styles.labelChip,
                                            { borderColor: l.color },
                                            labels.includes(l.id) && { backgroundColor: l.color + '30' },
                                        ]}
                                        onPress={() => toggleLabel(l.id)}
                                    >
                                        {labels.includes(l.id) && <Ionicons name="checkmark" size={14} color={l.color} />}
                                        <View style={[styles.labelColorDot, { backgroundColor: l.color }]} />
                                        <Text style={styles.labelText}>{l.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Recurring picker */}
                        {showRecurringPicker && (
                            <View style={styles.recurringSection}>
                                <Text style={styles.sectionLabel}>Repeat</Text>
                                <View style={styles.recurringOptions}>
                                    {[
                                        { value: null, label: 'None' },
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                    ].map((opt) => (
                                        <TouchableOpacity
                                            key={opt.label}
                                            style={[
                                                styles.recurringChip,
                                                repeatFrequency === opt.value && styles.recurringChipActive,
                                            ]}
                                            onPress={() => {
                                                setRepeatFrequency(opt.value as any);
                                                setIsRepeating(opt.value !== null);
                                                if (opt.value === null) {
                                                    setRepeatEndDate(null);
                                                    setShowRepeatEndDatePicker(false);
                                                }
                                            }}
                                        >
                                            <Text style={[
                                                styles.recurringChipText,
                                                repeatFrequency === opt.value && styles.recurringChipTextActive,
                                            ]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {isRepeating && (
                                    <View style={styles.endDateRow}>
                                        <TouchableOpacity
                                            style={styles.endDateButton}
                                            onPress={() => setShowRepeatEndDatePicker(!showRepeatEndDatePicker)}
                                        >
                                            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                            <Text style={styles.endDateText}>
                                                {repeatEndDate ? `Until ${repeatEndDate.toLocaleDateString()}` : 'No end date'}
                                            </Text>
                                        </TouchableOpacity>
                                        {repeatEndDate && (
                                            <TouchableOpacity onPress={() => setRepeatEndDate(null)}>
                                                <Ionicons name="close-circle" size={18} color={colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                {showRepeatEndDatePicker && isRepeating && (
                                    <DateTimePicker
                                        value={repeatEndDate || new Date()}
                                        mode="date"
                                        display="compact"
                                        themeVariant="light"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                setRepeatEndDate(selectedDate);
                                            }
                                            setShowRepeatEndDatePicker(false);
                                        }}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>
                        )}

                        {/* Project picker */}
                        {showProjectPicker && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labelPicker}>
                                <TouchableOpacity
                                    style={[
                                        styles.labelChip,
                                        { borderColor: colors.border },
                                        !selectedProjectId && { backgroundColor: colors.surfaceSecondary },
                                    ]}
                                    onPress={() => {
                                        setSelectedProjectId(null);
                                        setShowProjectPicker(false);
                                    }}
                                >
                                    <Text style={styles.labelText}>No Project</Text>
                                </TouchableOpacity>
                                {projects.filter(p => !p.isArchived).map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[
                                            styles.labelChip,
                                            { borderColor: colors.primary },
                                            selectedProjectId === p.id && { backgroundColor: colors.primaryLight + '30' },
                                        ]}
                                        onPress={() => {
                                            setSelectedProjectId(p.id);
                                            setShowProjectPicker(false);
                                        }}
                                    >
                                        <Text style={styles.labelText}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Date picker */}
                        {showDatePicker && (
                            <View style={styles.datePickerContainer}>
                                <Text style={styles.dateLabel}>
                                    Due Date: {dueDate ? dueDate.toLocaleDateString() : 'Not set'}
                                </Text>
                                <View style={{ height: 120, width: '100%', overflow: 'hidden', justifyContent: 'center' }}>
                                    <DateTimePicker
                                        value={dueDate || new Date()}
                                        mode="date"
                                        display="spinner"
                                        themeVariant="light"
                                        style={{ height: 180 }}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === 'android') {
                                                setShowDatePicker(false);
                                            }
                                            if (selectedDate) {
                                                setDueDate(selectedDate);
                                            }
                                        }}
                                        minimumDate={new Date()}
                                        textColor={colors.textPrimary}
                                    />
                                </View>
                                <View style={styles.datePickerActions}>
                                    <TouchableOpacity
                                        style={styles.datePickerClear}
                                        onPress={() => {
                                            setDueDate(null);
                                            setShowDatePicker(false);
                                        }}
                                    >
                                        <Text style={styles.datePickerClearText}>Clear</Text>
                                    </TouchableOpacity>
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity
                                            style={styles.datePickerDone}
                                            onPress={() => setShowDatePicker(false)}
                                        >
                                            <Text style={styles.datePickerDoneText}>Done</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.row}>
                            <View style={styles.modeToggle}>
                                <TouchableOpacity
                                    style={[styles.modeButton, mode === 'home' && styles.modeButtonActive]}
                                    onPress={() => setMode('home')}
                                >
                                    <Text style={[styles.modeText, mode === 'home' && styles.modeTextActive]}>Home</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeButton, mode === 'work' && styles.modeButtonActive]}
                                    onPress={() => setMode('work')}
                                >
                                    <Text style={[styles.modeText, mode === 'work' && styles.modeTextActive]}>Work</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.submitDisabled]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                <Text style={styles.submitText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        paddingBottom: spacing.xl + 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.h3,
        fontWeight: '600' as const,
        color: colors.textPrimary,
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
        padding: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    toolbarItemActive: {
        backgroundColor: colors.primary + '20',
    },
    badgeText: {
        position: 'absolute',
        top: -4,
        right: -4,
        fontSize: 10,
        color: colors.primary,
        fontWeight: '600' as const,
    },
    subtaskSection: {
        marginBottom: spacing.md,
        paddingVertical: spacing.sm,
    },
    subtaskInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    subtaskInput: {
        flex: 1,
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
    },
    addSubtaskBtn: {
        padding: spacing.xs,
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        marginTop: spacing.xs,
    },
    subtaskItemText: {
        flex: 1,
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
    },
    subtaskTextCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textTertiary,
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
        marginBottom: spacing.sm,
    },
    recurringSection: {
        marginBottom: spacing.md,
    },
    recurringOptions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    recurringChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recurringChipActive: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    recurringChipText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    recurringChipTextActive: {
        color: colors.primary,
        fontWeight: '500' as const,
    },
    endDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingHorizontal: spacing.sm,
    },
    endDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    endDateText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    datePickerContainer: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '20',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: fontSizes.bodySmall,
        color: colors.primary,
        fontWeight: '600' as const,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    datePickerDone: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },
    datePickerDoneText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    datePickerClear: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    datePickerClearText: {
        fontSize: fontSizes.bodySmall,
        color: colors.error,
        fontWeight: '500' as const,
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
});
