import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskFormData } from '../types/Task';

class TaskService {
  private collectionName = 'tasks';

  /**
   * Create a new task
   */
  async createTask(userId: string, formData: TaskFormData): Promise<Task> {
    try {
      // Parse tags from comma-separated string
      const tagArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const taskData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        startTime: formData.startTime || null,
        priority: formData.priority,
        tags: tagArray,
        isRepeating: formData.isRepeating,
        repeatFrequency: formData.isRepeating ? formData.repeatFrequency : null,
        repeatEndDate: formData.isRepeating ? formData.repeatEndDate : null,
        status: 'todo',
        userId: userId,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), taskData);

      return {
        id: docRef.id,
        ...taskData,
      } as Task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get all tasks for a user
   */
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() } as Task);
      });

      return tasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(userId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    const allTasks = await this.getUserTasks(userId);

    return allTasks.filter((task) => task.startDate === today);
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, this.collectionName, taskId);
      await updateDoc(taskRef, updates as any);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Toggle task status (complete/incomplete)
   */
  async toggleTaskStatus(task: Task): Promise<void> {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    await this.updateTask(task.id, { status: newStatus });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, this.collectionName, taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Get task statistics
   */
  getTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate,
    };
  }
}

export const taskService = new TaskService();
