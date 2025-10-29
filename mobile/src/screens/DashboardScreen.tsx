import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { taskService } from '../services/taskService';
import { Task } from '../types/Task';

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    completionRate: 0,
  });

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allTasks = await taskService.getUserTasks(user.uid);
      const today = await taskService.getTodayTasks(user.uid);
      const taskStats = taskService.getTaskStats(allTasks);

      setTasks(allTasks);
      setTodayTasks(today);
      setStats(taskStats);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      await taskService.toggleTaskStatus(task);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'User';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Welcome back, {firstName}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* All Tasks */}
        <TouchableOpacity
          style={[styles.statCard, styles.statCardBlue]}
          onPress={() => navigation.navigate('Tasks')}
        >
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>All Tasks</Text>
          <View style={styles.statBreakdown}>
            <Text style={styles.statBreakdownText}>{stats.pending} Pending</Text>
            <Text style={styles.statBreakdownText}>{stats.inProgress} In Progress</Text>
            <Text style={styles.statBreakdownText}>{stats.completed} Completed</Text>
          </View>
          <Text style={styles.viewAllLink}>View all →</Text>
        </TouchableOpacity>

        {/* Task Progress */}
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statNumber}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Task Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${stats.completionRate}%` }]} />
          </View>
          <Text style={styles.statBreakdownText}>
            {stats.completed} of {stats.total} tasks
          </Text>
        </View>

        {/* Today's Tasks */}
        <View style={[styles.statCard, styles.statCardPurple]}>
          <Text style={styles.statNumber}>{todayTasks.length}</Text>
          <Text style={styles.statLabel}>Today's Tasks</Text>
          <Text style={styles.statBreakdownText}>
            {todayTasks.filter((t) => t.status === 'completed').length} completed
          </Text>
        </View>
      </View>

      {/* Today's Tasks List */}
      <View style={styles.todaySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.viewAllLink}>View all tasks →</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks for today</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Text style={styles.addButtonText}>Add a task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayTasks.slice(0, 5).map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => toggleTaskStatus(task)}
            >
              <View style={styles.taskCheckbox}>
                {task.status === 'completed' && (
                  <Text style={styles.taskCheckboxChecked}>✓</Text>
                )}
              </View>
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.status === 'completed' && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <View
                    style={[
                      styles.priorityBadge,
                      styles[`priority${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`],
                    ]}
                  >
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                  {task.description && (
                    <Text
                      style={[
                        styles.taskDescription,
                        task.status === 'completed' && styles.taskDescriptionCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {task.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {todayTasks.length > 5 && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('Tasks')}
          >
            <Text style={styles.viewMoreText}>
              View {todayTasks.length - 5} more tasks →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardBlue: {
    backgroundColor: '#3b82f6',
  },
  statCardGreen: {
    backgroundColor: '#10b981',
  },
  statCardPurple: {
    backgroundColor: '#8b5cf6',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 18,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
  statBreakdown: {
    marginTop: 12,
  },
  statBreakdownText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  todaySection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityLow: {
    backgroundColor: '#d1fae5',
  },
  priorityMedium: {
    backgroundColor: '#fef3c7',
  },
  priorityHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  taskDescriptionCompleted: {
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
