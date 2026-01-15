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
import { createTask } from '../services/firebase';
import { TaskMode, TaskLabel, DEFAULT_LABELS, Subtask, Project } from '../types';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string | null;
    projects: Project[];
    defaultMode: 'home' | 'work';
    initialProjectId?: string | null;
}

export function AddTaskModal({
    visible,
    onClose,
    userId,
    projects,
    defaultMode,
    initialProjectId
}: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [mode, setMode] = useState<TaskMode>(defaultMode);
    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'deadline'>('date');
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const [showRecurringPicker, setShowRecurringPicker] = useState(false);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
    const [repeatEndDate, setRepeatEndDate] = useState<Date | null>(null);
    const [showRepeatEndDatePicker, setShowRepeatEndDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setMode(defaultMode);
            setSelectedProjectId(initialProjectId || null);
        }
    }, [visible, defaultMode, initialProjectId]);

    const handleSubmit = async () => {
        if (!userId || !title.trim()) return;

        try {
            setLoading(true);
            await createTask(userId, {
                title: title.trim(),
                mode,
                label: labels[0] || 'none',
                labels,
                dueDate: dueDate ? dueDate.toISOString() : undefined,
                deadlineDate: deadlineDate ? deadlineDate.toISOString() : undefined,
                startTime: startTime ? startTime.toTimeString().split(' ')[0] : undefined,
                projectId: selectedProjectId || undefined,
                subtasks,
                isRepeating,
                repeatFrequency: repeatFrequency || undefined,
                repeatEndDate: repeatEndDate ? repeatEndDate.toISOString() : undefined,
            });
            handleClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setLabels([]);
        setSelectedProjectId(null);
        setDueDate(null);
        setDeadlineDate(null);
        setStartTime(null);
        setSubtasks([]);
        setNewSubtaskText('');
        setIsRepeating(false);
        setRepeatFrequency(null);
        setRepeatEndDate(null);
        setShowDatePicker(false);
        setPickerMode('date');
        setShowLabelPicker(false);
        setShowProjectPicker(false);
        setShowSubtaskInput(false);
        setShowRecurringPicker(false);
        setShowRepeatEndDatePicker(false);
        onClose();
    };

    const selectedLabelColors = labels.map(l => DEFAULT_LABELS.find(dl => dl.id === l)?.color).filter(Boolean);

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

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
                <View style={styles.container}>
                    <View style={styles.handle} />
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <TextInput
                            style={styles.input}
                            placeholder="What needs to be done?"
                            placeholderTextColor={colors.textTertiary}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />

                        {/* Mode selection - Proper Home/Work toggle */}
                        <View style={styles.modeSection}>
                            {(['home', 'work'] as const).map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.modeChip,
                                        mode === m && { backgroundColor: m === 'home' ? colors.modePersonal : colors.modeProfessional }
                                    ]}
                                    onPress={() => setMode(m)}
                                >
                                    <Ionicons
                                        name={m === 'home' ? (mode === m ? 'home' : 'home-outline') : (mode === m ? 'briefcase' : 'briefcase-outline')}
                                        size={16}
                                        color={mode === m ? colors.textInverse : colors.textSecondary}
                                    />
                                    <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                                        {m === 'home' ? 'Home' : 'Work'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Icon toolbar - Order: Calendar, Subtasks, Project, Label, Flag, Recurring, Clock */}
                        <View style={styles.iconToolbar}>
                            <TouchableOpacity
                                style={[styles.toolbarItem, (showDatePicker && pickerMode === 'date') && styles.toolbarItemActive]}
                                onPress={() => {
                                    setPickerMode('date');
                                    setShowDatePicker(!showDatePicker || pickerMode !== 'date');
                                    setShowSubtaskInput(false);
                                    setShowLabelPicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={dueDate ? "calendar" : "calendar-outline"} size={22} color={(showDatePicker && pickerMode === 'date') || dueDate ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showSubtaskInput && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowSubtaskInput(!showSubtaskInput);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={subtasks.length > 0 ? "list" : "list-outline"} size={22} color={showSubtaskInput || subtasks.length > 0 ? colors.primary : colors.textSecondary} />
                                {subtasks.length > 0 && <Text style={styles.badgeText}>{subtasks.length}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showProjectPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowProjectPicker(!showProjectPicker);
                                    setShowSubtaskInput(false);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                }}
                            >
                                <Ionicons name={selectedProjectId ? "folder" : "folder-outline"} size={22} color={showProjectPicker || selectedProjectId ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showLabelPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowLabelPicker(!showLabelPicker);
                                    setShowSubtaskInput(false);
                                    setShowDatePicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons
                                    name={labels.length > 0 && !labels.includes('none') ? "pricetag" : "pricetag-outline"}
                                    size={22}
                                    color={showLabelPicker || (labels.length > 0 && !labels.includes('none')) ? colors.primary : colors.textSecondary}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, (showDatePicker && pickerMode === 'deadline') && styles.toolbarItemActive]}
                                onPress={() => {
                                    setPickerMode('deadline');
                                    setShowDatePicker(!showDatePicker || pickerMode !== 'deadline');
                                    setShowSubtaskInput(false);
                                    setShowLabelPicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={deadlineDate ? "flag" : "flag-outline"} size={22} color={(showDatePicker && pickerMode === 'deadline') || deadlineDate ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, showRecurringPicker && styles.toolbarItemActive]}
                                onPress={() => {
                                    setShowRecurringPicker(!showRecurringPicker);
                                    setShowSubtaskInput(false);
                                    setShowLabelPicker(false);
                                    setShowDatePicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={isRepeating ? "repeat" : "repeat-outline"} size={22} color={showRecurringPicker || isRepeating ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toolbarItem, (showDatePicker && pickerMode === 'time') && styles.toolbarItemActive]}
                                onPress={() => {
                                    setPickerMode('time');
                                    setShowDatePicker(!showDatePicker || pickerMode !== 'time');
                                    setShowSubtaskInput(false);
                                    setShowLabelPicker(false);
                                    setShowRecurringPicker(false);
                                    setShowProjectPicker(false);
                                }}
                            >
                                <Ionicons name={startTime ? "time" : "time-outline"} size={22} color={(showDatePicker && pickerMode === 'time') || startTime ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Subtask input */}
                        {showSubtaskInput && (
                            <View style={styles.subtaskSection}>
                                <Text style={styles.sectionLabel}>Subtasks</Text>
                                {subtasks.map((s) => (
                                    <View key={s.id} style={styles.subtaskItem}>
                                        <Ionicons name="square-outline" size={18} color={colors.textSecondary} />
                                        <Text style={styles.subtaskItemText}>{s.title}</Text>
                                        <TouchableOpacity
                                            onPress={() => removeSubtask(s.id)}
                                            style={styles.subtaskRemoveBtn}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
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
                                            labels.includes(l.id) && { backgroundColor: l.color },
                                        ]}
                                        onPress={() => toggleLabel(l.id)}
                                    >
                                        {labels.includes(l.id) ? (
                                            <>
                                                <Ionicons name="checkmark" size={14} color={(l.id === 'important' || l.id === 'habit') ? colors.textPrimary : colors.textInverse} />
                                                <Text style={[styles.labelText, {
                                                    color: (l.id === 'important' || l.id === 'habit') ? colors.textPrimary : colors.textInverse,
                                                    fontWeight: '600'
                                                }]}>{l.name}</Text>
                                            </>
                                        ) : (
                                            <>
                                                <View style={[styles.labelColorDot, { backgroundColor: l.color }]} />
                                                <Text style={styles.labelText}>{l.name}</Text>
                                            </>
                                        )}
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
                                {/* End date option - only show when repeating is set */}
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

                        {/* Date & Time Section */}
                        {showDatePicker && (
                            <View style={styles.pickerContainer}>
                                <DateTimePicker
                                    value={
                                        pickerMode === 'date' ? (dueDate || new Date()) :
                                            pickerMode === 'deadline' ? (deadlineDate || new Date()) :
                                                (startTime ? new Date(`2000-01-01T${startTime}`) : new Date())
                                    }
                                    mode={pickerMode === 'time' ? 'time' : 'date'}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event: any, selectedDate?: Date) => {
                                        if (Platform.OS === 'android') setShowDatePicker(false);
                                        if (selectedDate) {
                                            if (pickerMode === 'date') setDueDate(selectedDate);
                                            else if (pickerMode === 'deadline') setDeadlineDate(selectedDate);
                                            else setStartTime(selectedDate);
                                        }
                                    }}
                                    textColor={colors.textPrimary}
                                />
                                {Platform.OS === 'ios' && (
                                    <View style={styles.pickerActions}>
                                        <TouchableOpacity onPress={() => {
                                            if (pickerMode === 'date') setDueDate(null);
                                            else if (pickerMode === 'deadline') setDeadlineDate(null);
                                            else setStartTime(null);
                                            setShowDatePicker(false);
                                        }}>
                                            <Text style={styles.pickerClear}>Clear</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text style={styles.pickerDone}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, (!title.trim() || loading) && styles.submitDisabled]}
                                onPress={handleSubmit}
                                disabled={!title.trim() || loading}
                            >
                                <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create'}</Text>
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
    input: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: spacing.md,
    },
    modeSection: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '30',
    },
    modeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceSecondary,
    },
    modeChipText: {
        fontSize: fontSizes.caption,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modeChipTextActive: {
        color: colors.textInverse,
        fontWeight: '600',
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
        marginBottom: spacing.sm,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.error,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: fontSizes.body,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    submitButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: fontSizes.body,
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    datePickerContainer: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    pickerContainer: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
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
        marginTop: spacing.sm,
    },
    subtaskInput: {
        flex: 1,
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    addSubtaskBtn: {
        padding: spacing.xs,
    },
    subtaskRemoveBtn: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '30',
    },
    subtaskItemText: {
        flex: 1,
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
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
});
