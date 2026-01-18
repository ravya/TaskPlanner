import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTodayTasks, useAuth } from '../hooks';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';
import { toggleTaskComplete, addTask } from '../services/firebase';
import { Task } from '../types';

export function StickiesScreen() {
    const { user } = useAuth();
    const { tasks, refreshing, refresh } = useTodayTasks(user?.uid);
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleToggleComplete = useCallback(async (task: Task) => {
        if (!user) return;
        try {
            await toggleTaskComplete(user.uid, task.id, !task.completed);
            refresh();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }, [user, refresh]);

    const handleAddTask = async () => {
        if (!user || !newTaskTitle.trim()) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await addTask(user.uid, {
                title: newTaskTitle.trim(),
                description: '',
                startDate: today,
                startTime: null,
                status: 'todo',
                priority: 'medium',
                tags: [],
                completed: false,
                isRepeating: false,
                mode: 'home'
            });
            setNewTaskTitle('');
            setIsAdding(false);
            refresh();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
    });

    const renderTask = ({ item }: { item: Task }) => (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
                onPress={() => handleToggleComplete(item)}
            >
                {item.completed && <Ionicons name="checkmark" size={14} color="white" />}
            </TouchableOpacity>
            <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                {item.title}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.stickyNote}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sticky Notes</Text>
                        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
                            <Ionicons name="refresh" size={18} color="#856404" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress */}
                    {tasks.length > 0 && (
                        <View style={styles.progressContainer}>
                            <View style={[
                                styles.progressBar,
                                { width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }
                            ]} />
                        </View>
                    )}

                    {/* Task List */}
                    <FlatList
                        data={sortedTasks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTask}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#856404']} />
                        }
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No tasks for today. Stay free! ☀️</Text>
                        }
                    />

                    {/* Footer / Add Input */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={100}
                    >
                        {isAdding ? (
                            <View style={styles.addInputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Something to do..."
                                    value={newTaskTitle}
                                    onChangeText={setNewTaskTitle}
                                    autoFocus
                                    onSubmitEditing={handleAddTask}
                                />
                                <TouchableOpacity onPress={handleAddTask} style={styles.doneButton}>
                                    <Ionicons name="add-circle" size={28} color="#856404" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsAdding(false)}>
                                    <Ionicons name="close-circle" size={28} color="#856404" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                                <Ionicons name="add" size={20} color="#856404" />
                                <Text style={styles.addButtonText}>Add new note...</Text>
                            </TouchableOpacity>
                        )}
                    </KeyboardAvoidingView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyNote: {
        width: '100%',
        maxWidth: 350,
        height: '80%',
        backgroundColor: '#fef3c7', // Yellow sticky note color
        borderRadius: 2,
        ...shadows.lg,
        borderTopWidth: 20,
        borderTopColor: '#fde68a', // Slightly darker yellow for the "tape" or top bar
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#856404',
        fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    },
    refreshButton: {
        padding: 4,
    },
    progressContainer: {
        height: 2,
        backgroundColor: '#fef3c7',
        borderColor: '#e2d5a3',
        borderWidth: 0.5,
        marginBottom: spacing.md,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#856404',
    },
    listContent: {
        flexGrow: 1,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: '#856404',
        borderRadius: 2,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#856404',
    },
    taskText: {
        fontSize: 16,
        color: '#453505',
        fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    emptyText: {
        textAlign: 'center',
        color: '#856404',
        fontStyle: 'italic',
        marginTop: 50,
        opacity: 0.6,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#fde68a',
        paddingTop: spacing.sm,
    },
    addButtonText: {
        color: '#856404',
        fontSize: 14,
        marginLeft: spacing.xs,
        fontStyle: 'italic',
    },
    addInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#fde68a',
        paddingTop: spacing.sm,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        height: 40,
        color: '#453505',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    },
    doneButton: {
        padding: 2,
    },
});
