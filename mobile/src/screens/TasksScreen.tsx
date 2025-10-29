import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { taskService } from '../services/taskService';
import { Task } from '../types/Task';
import { TaskForm } from '../components/tasks/TaskForm';

interface Props {
  navigation: any;
}

export const TasksScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userTasks = await taskService.getUserTasks(user.uid);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [user])
  );

  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await taskService.deleteTask(task.id);
            await loadTasks();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTask(null);
    await loadTasks();
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      await taskService.toggleTaskStatus(task);
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#fee2e2';
      case 'medium':
        return '#fef3c7';
      case 'low':
        return '#d1fae5';
      default:
        return '#f3f4f6';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Tasks ({tasks.length})</Text>
      </View>

      {/* Add Task Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} />}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No tasks yet. Click 'Add New Task' to create one!
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => toggleTaskStatus(task)}
                >
                  {task.status === 'completed' && (
                    <Text style={styles.taskCheckboxChecked}>✓</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.status === 'completed' && styles.taskTitleCompleted,
                    ]}
                  >
                    {task.title}
                  </Text>

                  <View style={styles.taskBadges}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>

                    {task.isRepeating && task.repeatFrequency && (
                      <View style={styles.repeatBadge}>
                        <Text style={styles.repeatText}>🔄 {task.repeatFrequency}</Text>
                      </View>
                    )}
                  </View>

                  {task.description && (
                    <Text
                      style={[
                        styles.taskDescription,
                        task.status === 'completed' && styles.taskDescriptionCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  )}

                  <View style={styles.taskMeta}>
                    <Text style={styles.taskMetaText}>
                      📅 {task.startDate}
                      {task.startTime ? ` ${task.startTime}` : ' All day'}
                    </Text>

                    {task.isRepeating && task.repeatEndDate && (
                      <Text style={styles.taskMetaText}>🔚 Until: {task.repeatEndDate}</Text>
                    )}
                  </View>

                  {task.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {task.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditTask(task)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteTask(task)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Task Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormClose}
      >
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    color: '#3b82f6',
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskBadges: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  repeatBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  repeatText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskDescriptionCompleted: {
    color: '#999',
  },
  taskMeta: {
    marginTop: 4,
  },
  taskMetaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#f3f4f6',
  },
  editButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
